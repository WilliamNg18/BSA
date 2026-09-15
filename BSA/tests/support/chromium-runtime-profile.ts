import { createHash } from "node:crypto";
import { mkdir, open, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import type { Page } from "@playwright/test";
import { isBuildInfo } from "../live/settings";

export const RUNTIME_PROFILE_KIND = "chromium runtime profile, not acceptance";
export const PROFILE_LIMITS = { durationMs: 180_000, traceBytes: 64 * 1024 * 1024, cpuBytes: 32 * 1024 * 1024 } as const;
const categories = [
  "devtools.timeline", "v8", "blink.user_timing", "toplevel", "renderer.scheduler",
  "disabled-by-default-devtools.timeline.frame",
];
type StopReason = "original-test-outcome" | "180-second-cap" | "start-failure";
type Metrics = { name: string; value: number }[];

export interface ProfileTransport {
  enablePerformance(): Promise<void>;
  enableProfiler(): Promise<void>;
  setSamplingInterval(interval: number): Promise<void>;
  metrics(): Promise<Metrics>;
  startTrace(): Promise<void>;
  startCpu(): Promise<void>;
  stopCpu(): Promise<unknown>;
  endTrace(): Promise<void>;
  tracingComplete: Promise<{ stream?: string; dataLossOccurred?: boolean }>;
  readStream(handle: string): Promise<{ data: string; base64Encoded?: boolean; eof: boolean }>;
  closeStream(handle: string): Promise<void>;
  detach(): Promise<void>;
}

interface ProfileSource {
  buildInfo: { commit: string; builtAt: string; dirty: boolean };
  entryAssets: { url: string; bytes: number; sha256: string }[];
  sourceMapping: string;
}

interface SourceRequest {
  get(url: string): Promise<{
    status(): number;
    json(): Promise<unknown>;
    text(): Promise<string>;
    body(): Promise<Buffer>;
  }>;
}

export interface RuntimeProfileManifest {
  schema: number;
  diagnosticOnly: true;
  expectedCommit: string;
  categories: string[];
  samplingIntervalUs: number;
  maxDurationMs: number;
  traceByteLimit: number;
  cpuByteLimit: number;
  cpuCapped: boolean;
  initialUrl: string;
  startedEpochMs: number;
  endedEpochMs?: number;
  anchors: { label: string; startEpochMs: number; endEpochMs: number; metrics: Metrics }[];
  errors: { stage: string; message: string }[];
  trace: { path?: string; bytes: number; capped: boolean; dataLossOccurred?: boolean; sha256?: string };
  cpu?: { path: string; bytes: number; sha256: string };
  source?: ProfileSource;
  stopReason: StopReason | null;
  complete: boolean;
  scope: string;
  interpretation: string;
}

export class RuntimeProfileSetupError extends Error {
  constructor(cause: unknown, readonly manifest: RuntimeProfileManifest) {
    super("Runtime profiling setup failed; the test body was not run.", { cause });
    this.name = "RuntimeProfileSetupError";
  }
}

export function runtimeProfileEnabled(metadata: Record<string, unknown>, baseURL: string | undefined) {
  if (metadata.runtimeProfile !== true) return false;
  if (metadata.kind !== RUNTIME_PROFILE_KIND) throw new Error("Runtime profiling requires an explicitly labelled profiling configuration.");
  if (metadata.routeDiagnostics === true) throw new Error("Runtime profiling must not run with DOM route diagnostics.");
  if (!baseURL) throw new Error("Runtime profiling requires a local base URL.");
  const url = new URL(baseURL);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Runtime profiling is restricted to HTTP loopback.");
  }
  return true;
}

export async function captureRuntimeSource(request: SourceRequest, baseURL: string, expectedCommit: string): Promise<ProfileSource> {
  const buildResponse = await request.get(new URL("/build-info.json", baseURL).href);
  const build: unknown = await buildResponse.json();
  if (buildResponse.status() !== 200 || !isBuildInfo(build) || build.dirty || build.commit !== expectedCommit) {
    throw new Error("Runtime profile source must match the exact clean expected build.");
  }
  const response = await request.get(baseURL);
  if (response.status() !== 200) throw new Error("Runtime profile entry document is unavailable.");
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].flatMap(([tag]) => {
    if (!/\btype=["']module["']/i.test(tag)) return [];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i);
    return src ? [new URL(src[1], baseURL)] : [];
  });
  if (!scripts.length) throw new Error("Runtime profile entry document declares no module asset.");
  const entryAssets = [];
  for (const url of scripts) {
    if (url.origin !== new URL(baseURL).origin) throw new Error("Runtime profile assets must remain on the same local origin.");
    const asset = await request.get(url.href);
    if (asset.status() !== 200) throw new Error(`Runtime profile entry asset is unavailable: ${url.href}`);
    const bytes = await asset.body();
    entryAssets.push({ url: url.href, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
  return {
    buildInfo: build, entryAssets,
    sourceMapping: "No map-only build or guessed mapping. Preserve raw minified URL/line/column; use a map later only if it matches these exact asset bytes.",
  };
}

export async function startRuntimeProfile(
  createTransport: () => Promise<ProfileTransport>,
  outputDirectory: string,
  initialUrl: string,
  expectedCommit: string,
  captureSource: () => Promise<ProfileSource>,
) {
  await mkdir(outputDirectory);
  const epoch = () => performance.timeOrigin + performance.now();
  const manifest: RuntimeProfileManifest = {
    schema: 1, diagnosticOnly: true, expectedCommit, categories: [...categories], samplingIntervalUs: 2000,
    maxDurationMs: PROFILE_LIMITS.durationMs, traceByteLimit: PROFILE_LIMITS.traceBytes,
    cpuByteLimit: PROFILE_LIMITS.cpuBytes, cpuCapped: false,
    initialUrl, startedEpochMs: epoch(), anchors: [], errors: [], trace: { bytes: 0, capped: false },
    stopReason: null, complete: false,
    scope: "One page target; CPU samples may omit other processes, workers or replacement targets. Inspect trace process/thread metadata and navigation coverage.",
    interpretation: "Profiling adds overhead, never subtracted from the original deadline verdict. Caps, data loss and errors mean incomplete diagnostics, not acceptance. Source provenance is fetched after collection.",
  };
  let transport: ProfileTransport | undefined;
  let stopPromise: Promise<RuntimeProfileManifest> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let activeProfiler = false;
  let activeTracing = false;
  let streamHandle: string | undefined;
  const captureError = (stage: string, error: unknown) => {
    manifest.errors.push({ stage, message: error instanceof Error ? error.stack ?? error.message : String(error) });
  };
  const anchor = async (session: ProfileTransport, label: string) => {
    const startEpochMs = epoch();
    const metrics = await session.metrics();
    manifest.anchors.push({ label, startEpochMs, endEpochMs: epoch(), metrics });
  };
  const stop = (reason: StopReason = "original-test-outcome"): Promise<RuntimeProfileManifest> => {
    if (stopPromise) return stopPromise;
    stopPromise = (async () => {
      clearTimeout(timer);
      manifest.stopReason = reason;
      const session = transport;
      if (session) {
        try { await anchor(session, "stop"); } catch (error) { captureError("stop-metrics", error); }
        if (activeProfiler) {
          try {
            const profile = await session.stopCpu();
            if (!profile || typeof profile !== "object" || !("nodes" in profile) || !Array.isArray(profile.nodes)) {
              throw new Error("Profiler returned no CPU nodes.");
            }
            const bytes = Buffer.from(JSON.stringify(profile));
            if (bytes.length > PROFILE_LIMITS.cpuBytes) {
              manifest.cpuCapped = true;
              throw new Error("CPU profile exceeded 32 MiB; no oversized profile was written.");
            }
            const path = join(outputDirectory, "cpu.cpuprofile");
            await writeFile(path, bytes, { flag: "wx" });
            manifest.cpu = { path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
          } catch (error) { captureError("cpu-profile", error); }
        }
        if (activeTracing) {
          try {
            await session.endTrace();
            let completionTimer: ReturnType<typeof setTimeout> | undefined;
            const finished = await Promise.race([
              session.tracingComplete,
              new Promise<never>((_, reject) => {
                completionTimer = setTimeout(() => reject(new Error("Tracing completion exceeded 15 seconds.")), 15_000);
              }),
            ]).finally(() => clearTimeout(completionTimer));
            streamHandle = finished.stream;
            if (!streamHandle) throw new Error("Tracing completed without a stream.");
            manifest.trace.dataLossOccurred = Boolean(finished.dataLossOccurred);
            const path = join(outputDirectory, "chromium-trace.json");
            const file = await open(path, "wx");
            manifest.trace.path = path;
            const hash = createHash("sha256");
            try {
              for (;;) {
                const chunk = await session.readStream(streamHandle);
                const bytes = Buffer.from(chunk.data, chunk.base64Encoded ? "base64" : "utf8");
                if (!bytes.length && !chunk.eof) throw new Error("Trace stream made no progress.");
                if (manifest.trace.bytes + bytes.length > PROFILE_LIMITS.traceBytes) {
                  manifest.trace.capped = true;
                  throw new Error("Trace exceeded 64 MiB; the retained prefix is incomplete, not a complete profile.");
                }
                let offset = 0;
                while (offset < bytes.length) {
                  const { bytesWritten } = await file.write(bytes, offset, bytes.length - offset);
                  if (bytesWritten <= 0) throw new Error("Trace write made no progress.");
                  hash.update(bytes.subarray(offset, offset + bytesWritten));
                  manifest.trace.bytes += bytesWritten;
                  offset += bytesWritten;
                }
                if (chunk.eof) break;
              }
            } finally {
              await file.close();
              manifest.trace.sha256 = hash.digest("hex");
            }
          } catch (error) { captureError("trace", error); }
        }
        if (streamHandle) {
          try { await session.closeStream(streamHandle); } catch (error) { captureError("close-stream", error); }
        }
        try { await session.detach(); } catch (error) { captureError("detach", error); }
      }
      try {
        manifest.source = await captureSource();
        if (manifest.source.buildInfo.dirty || manifest.source.buildInfo.commit !== expectedCommit || !manifest.source.entryAssets.length) {
          throw new Error("Profile source provenance does not match the expected clean executable.");
        }
      } catch (error) { captureError("source-provenance", error); }
      manifest.endedEpochMs = epoch();
      manifest.complete = manifest.errors.length === 0 && Boolean(manifest.cpu && manifest.trace.sha256)
        && !manifest.cpuCapped && !manifest.trace.capped && !manifest.trace.dataLossOccurred && reason === "original-test-outcome";
      await writeFile(join(outputDirectory, "profile-manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx" });
      return manifest;
    })();
    return stopPromise;
  };
  try {
    transport = await createTransport();
    await transport.enablePerformance();
    await transport.enableProfiler();
    await transport.setSamplingInterval(2000);
    await anchor(transport, "start");
    await transport.startTrace();
    activeTracing = true;
    await transport.startCpu();
    activeProfiler = true;
    timer = setTimeout(() => {
      stop("180-second-cap").catch((error: unknown) => { console.error("Runtime profile cap cleanup failed:", error); });
    }, PROFILE_LIMITS.durationMs);
    timer.unref();
  } catch (error) {
    captureError("start", error);
    try { await stop("start-failure"); } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Runtime profiling setup and cleanup failed.");
    }
    throw new RuntimeProfileSetupError(error, manifest);
  }
  return { collect: () => stop(), manifestPath: join(outputDirectory, "profile-manifest.json") };
}

export async function startChromiumRuntimeProfile(page: Page, outputDirectory: string, baseURL: string, expectedCommit: string) {
  return startRuntimeProfile(async () => {
    const cdp = await page.context().newCDPSession(page);
    const tracingComplete = new Promise<{ stream?: string; dataLossOccurred?: boolean }>((resolve) => {
      cdp.once("Tracing.tracingComplete", resolve);
    });
    return {
      enablePerformance: async () => { await cdp.send("Performance.enable", { timeDomain: "timeTicks" }); },
      enableProfiler: async () => { await cdp.send("Profiler.enable"); },
      setSamplingInterval: async (interval: number) => { await cdp.send("Profiler.setSamplingInterval", { interval }); },
      metrics: async () => (await cdp.send("Performance.getMetrics")).metrics,
      startTrace: async () => {
        await cdp.send("Tracing.start", {
          transferMode: "ReturnAsStream", streamFormat: "json", streamCompression: "none",
          traceConfig: { recordMode: "recordUntilFull", traceBufferSizeInKb: 32768, includedCategories: [...categories] },
        });
      },
      startCpu: async () => { await cdp.send("Profiler.start"); },
      stopCpu: async () => (await cdp.send("Profiler.stop")).profile,
      endTrace: async () => { await cdp.send("Tracing.end"); },
      tracingComplete,
      readStream: async (handle: string) => cdp.send("IO.read", { handle, size: 262144 }),
      closeStream: async (handle: string) => { await cdp.send("IO.close", { handle }); },
      detach: async () => { await cdp.detach(); },
    };
  }, outputDirectory, page.url(), expectedCommit, () => captureRuntimeSource(page.request, baseURL, expectedCommit));
}
