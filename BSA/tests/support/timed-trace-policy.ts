import { settleIndependentChecks } from "./independent-checks";

export const THIN_TIMED_TRACE = Object.freeze({
  mode: "retain-on-failure", snapshots: false, screenshots: false, sources: true, attachments: true,
} as const);

export const TIMED_TRACE_LOSSES = [
  "Continuous DOM snapshots",
  "Trace screencast frames",
  "HAR resource and network payload collection",
] as const;

interface ResolvedTracePolicy {
  mode: string;
  snapshots: boolean;
  screenshots: boolean;
  sources: boolean;
  attachments: boolean;
}

export function verifyResolvedTracePolicy(value: unknown, expected: "thin-timed" | "full-diagnostic"): ResolvedTracePolicy {
  const options: Record<string, unknown> = typeof value === "string" ? { mode: value }
    : value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
  if (Object.keys(options).some((key) => !["mode", "snapshots", "screenshots", "sources", "attachments"].includes(key))) {
    throw new Error("The resolved trace option contains an unreviewed setting.");
  }
  const { mode, snapshots = true, screenshots = true, sources = true, attachments = true } = options;
  if (typeof mode !== "string" || typeof snapshots !== "boolean" || typeof screenshots !== "boolean"
    || typeof sources !== "boolean" || typeof attachments !== "boolean") {
    throw new Error("The resolved trace option must use the supported literal policy.");
  }
  const resolved = { mode, snapshots, screenshots, sources, attachments };
  const required = expected === "thin-timed" ? THIN_TIMED_TRACE
    : { mode: "on", snapshots: true, screenshots: true, sources: true, attachments: true };
  if (resolved.mode !== required.mode || resolved.snapshots !== required.snapshots
    || resolved.screenshots !== required.screenshots || !resolved.sources || !resolved.attachments) {
    throw new Error(`Resolved trace policy does not match ${expected}: ${JSON.stringify(resolved)}`);
  }
  return resolved;
}

export async function collectTimedFailureArtifacts(
  read: { html(): Promise<string>; aria(): Promise<string> },
  attach: (name: string, body: string, contentType: string) => Promise<void>,
) {
  await settleIndependentChecks([
    async () => { await attach("timed-failure-html", await read.html(), "text/html"); },
    async () => { await attach("timed-failure-aria", await read.aria(), "text/plain"); },
  ]);
}
