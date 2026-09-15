import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import {
  captureRuntimeSource, PROFILE_LIMITS, RUNTIME_PROFILE_KIND, runtimeProfileEnabled, RuntimeProfileSetupError,
  startRuntimeProfile, type ProfileTransport,
} from "../support/chromium-runtime-profile";
import { extendedRequirementTitle, LIVE_CHECKLIST } from "../live/inventory";

const roots: string[] = [];
const commit = "a".repeat(40);
const source = () => Promise.resolve({
  buildInfo: { commit, builtAt: "2026-09-15T00:00:00.000Z", dirty: false },
  entryAssets: [{ url: "http://localhost:4336/assets/app.js", bytes: 1, sha256: "a".repeat(64) }],
  sourceMapping: "Raw minified frames only",
});

async function destination() {
  const root = await mkdtemp(join(tmpdir(), "bsa-runtime-profile-"));
  roots.push(root);
  return join(root, "new-profile");
}

function mockTransport() {
  let complete!: (value: { stream?: string; dataLossOccurred?: boolean }) => void;
  const tracingComplete = new Promise<{ stream?: string; dataLossOccurred?: boolean }>((resolve) => { complete = resolve; });
  const transport = {
    enablePerformance: vi.fn(async () => {}),
    enableProfiler: vi.fn(async () => {}),
    setSamplingInterval: vi.fn(async (_interval: number) => { void _interval; }),
    metrics: vi.fn(async () => [{ name: "Timestamp", value: 10 }]),
    startTrace: vi.fn(async () => {}),
    startCpu: vi.fn(async () => {}),
    stopCpu: vi.fn<ProfileTransport["stopCpu"]>(async () => ({ nodes: [], samples: [], timeDeltas: [] })),
    endTrace: vi.fn(async () => { complete({ stream: "stream-1", dataLossOccurred: false }); }),
    tracingComplete,
    readStream: vi.fn<ProfileTransport["readStream"]>(async () => ({ data: '{"traceEvents":[]}', eof: true })),
    closeStream: vi.fn(async (_handle: string) => { void _handle; }),
    detach: vi.fn(async () => {}),
  } satisfies ProfileTransport;
  return { transport, complete };
}

afterEach(async () => {
  vi.useRealTimers();
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

it("starts once and idempotently collects complete CPU and trace files with actual hashes", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  expect(transport.setSamplingInterval).toHaveBeenCalledWith(2000);
  expect(transport.stopCpu).not.toHaveBeenCalled();
  const first = profile.collect();
  expect(profile.collect()).toBe(first);
  const manifest = await first;
  expect(manifest.complete).toBe(true);
  expect(manifest.stopReason).toBe("original-test-outcome");
  expect(manifest.anchors.map((anchor) => anchor.label)).toEqual(["start", "stop"]);
  expect(transport.stopCpu).toHaveBeenCalledTimes(1);
  expect(transport.endTrace).toHaveBeenCalledTimes(1);
  expect(transport.closeStream).toHaveBeenCalledWith("stream-1");
  expect(transport.detach).toHaveBeenCalledTimes(1);
  for (const file of [manifest.cpu, manifest.trace]) {
    if (!file?.path) throw new Error("A complete profile must retain both files.");
    const bytes = await readFile(file.path);
    expect(file.bytes).toBe(bytes.length);
    expect(file.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
  }
  expect(JSON.parse(await readFile(profile.manifestPath, "utf8")).complete).toBe(true);
});

it("rejects reuse of a profile directory before creating a CDP session or overwriting evidence", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  await profile.collect();
  const before = await readFile(profile.manifestPath);
  const create = vi.fn(async () => transport);
  await expect(startRuntimeProfile(create, directory, "about:blank", commit, source)).rejects.toThrow();
  expect(create).not.toHaveBeenCalled();
  expect(await readFile(profile.manifestPath)).toEqual(before);
});

it("preserves setup failure and cleans up an already-started trace without running a test", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  const failure = new Error("CPU start failed");
  transport.startCpu.mockRejectedValue(failure);
  const result = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source)
    .catch((error: unknown) => error);
  expect(result).toBeInstanceOf(RuntimeProfileSetupError);
  if (!(result instanceof RuntimeProfileSetupError)) throw new Error("Setup failures must expose retained capture metadata.");
  expect(result.cause).toBe(failure);
  expect(result.manifest.complete).toBe(false);
  expect(transport.endTrace).toHaveBeenCalledOnce();
  expect(transport.detach).toHaveBeenCalledOnce();
  const manifest = JSON.parse(await readFile(join(directory, "profile-manifest.json"), "utf8"));
  expect(manifest.complete).toBe(false);
  expect(manifest.stopReason).toBe("start-failure");
  expect(manifest.errors).toEqual(expect.arrayContaining([expect.objectContaining({ stage: "start" })]));
});

it("stops at the time cap and keeps later collection incomplete without restarting", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const directory = await destination();
  const { transport } = mockTransport();
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  await vi.advanceTimersByTimeAsync(PROFILE_LIMITS.durationMs);
  const manifest = await profile.collect();
  expect(manifest.stopReason).toBe("180-second-cap");
  expect(manifest.complete).toBe(false);
  expect(transport.startTrace).toHaveBeenCalledOnce();
  expect(transport.startCpu).toHaveBeenCalledOnce();
});

it("records stream failure and still closes its handle, detaches and saves the CPU profile", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  transport.readStream.mockRejectedValue(new Error("Stream read failed"));
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  const manifest = await profile.collect();
  expect(manifest.complete).toBe(false);
  expect(manifest.cpu?.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(manifest.errors).toEqual([expect.objectContaining({ stage: "trace" })]);
  expect(transport.closeStream).toHaveBeenCalledOnce();
  expect(transport.detach).toHaveBeenCalledOnce();
});

it("marks trace data loss as incomplete even when files were collected", async () => {
  const directory = await destination();
  const { transport, complete } = mockTransport();
  transport.endTrace.mockImplementation(async () => { complete({ stream: "stream-1", dataLossOccurred: true }); });
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  const manifest = await profile.collect();
  expect(manifest.complete).toBe(false);
  expect(manifest.trace.dataLossOccurred).toBe(true);
  expect(manifest.trace.sha256).toMatch(/^[a-f0-9]{64}$/);
});

it("caps trace output and hashes only the exact retained prefix", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  transport.readStream.mockResolvedValue({ data: "x".repeat(262144), eof: false });
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  const manifest = await profile.collect();
  expect(manifest.complete).toBe(false);
  expect(manifest.trace.capped).toBe(true);
  expect(manifest.trace.bytes).toBe(PROFILE_LIMITS.traceBytes);
  expect(transport.readStream).toHaveBeenCalledTimes(PROFILE_LIMITS.traceBytes / 262144 + 1);
  const bytes = await readFile(join(directory, "chromium-trace.json"));
  expect(bytes.length).toBe(PROFILE_LIMITS.traceBytes);
  expect(manifest.trace.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
});

it("caps oversized CPU output without claiming a complete diagnostic", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  transport.stopCpu.mockResolvedValue({ nodes: [{ name: "x".repeat(PROFILE_LIMITS.cpuBytes) }] });
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, source);
  const manifest = await profile.collect();
  expect(manifest.cpuCapped).toBe(true);
  expect(manifest.cpu).toBeUndefined();
  expect(manifest.complete).toBe(false);
  expect(manifest.errors).toEqual([expect.objectContaining({ stage: "cpu-profile" })]);
});

it("rejects a source identity mismatch while retaining collected files and an explicit error", async () => {
  const directory = await destination();
  const { transport } = mockTransport();
  const profile = await startRuntimeProfile(async () => transport, directory, "about:blank", commit, async () => ({
    ...await source(), buildInfo: { ...((await source()).buildInfo), dirty: true },
  }));
  const manifest = await profile.collect();
  expect(manifest.complete).toBe(false);
  expect(manifest.errors).toEqual([expect.objectContaining({ stage: "source-provenance" })]);
});

it("captures exact clean build and entry asset bytes without requesting alternative maps", async () => {
  const bytes = Buffer.from("export const synthetic = true;");
  const urls: string[] = [];
  const result = await captureRuntimeSource({
    get: async (url) => {
      urls.push(url);
      return {
        status: () => 200,
        json: async () => (await source()).buildInfo,
        text: async () => '<script type="module" crossorigin src="/assets/current.js"></script>',
        body: async () => bytes,
      };
    },
  }, "http://localhost:4336/", commit);
  expect(urls).toEqual([
    "http://localhost:4336/build-info.json", "http://localhost:4336/", "http://localhost:4336/assets/current.js",
  ]);
  expect(result.entryAssets).toEqual([{
    url: urls[2], bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
  }]);
});

it("leaves default runs inert and forbids mixed, hosted or unlabelled profiling", () => {
  expect(runtimeProfileEnabled({}, undefined)).toBe(false);
  expect(runtimeProfileEnabled({ runtimeProfile: "true" }, "https://example.test")).toBe(false);
  expect(runtimeProfileEnabled({ runtimeProfile: true, kind: RUNTIME_PROFILE_KIND }, "http://localhost:4336/")).toBe(true);
  for (const metadata of [{ runtimeProfile: true }, { runtimeProfile: true, kind: RUNTIME_PROFILE_KIND, routeDiagnostics: true }]) {
    expect(() => runtimeProfileEnabled(metadata, "http://localhost:4336/")).toThrow();
  }
  expect(() => runtimeProfileEnabled({ runtimeProfile: true, kind: RUNTIME_PROFILE_KIND }, "https://example.test/")).toThrow();
});

it("selects only the existing complete 1280 On matrix", () => {
  const config = readFileSync(new URL("../live/runtime-profile.config.ts", import.meta.url), "utf8");
  const selection = config.match(/grep:\s*\/([^/\n]+)\//);
  if (!selection) throw new Error("Runtime profiling must declare its bounded selection.");
  const pattern = new RegExp(selection[1]);
  expect(LIVE_CHECKLIST.filter((name) => pattern.test(name))).toEqual([extendedRequirementTitle("transition", 1280, true)]);
  expect(config).toContain("routeDiagnostics: false");
});
