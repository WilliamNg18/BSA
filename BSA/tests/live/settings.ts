import { isAbsolute, relative, resolve, sep } from "node:path";

export function liveSettings(env: NodeJS.ProcessEnv, repositoryRoot: string) {
  if (!env.LIVE_BASE_URL) throw new Error("LIVE_BASE_URL is required.");
  const url = new URL(env.LIVE_BASE_URL);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("LIVE_BASE_URL must be an HTTPS root URL without credentials, query or fragment.");
  }
  return { baseURL: url.href, ...evidenceSettings(env, repositoryRoot) };
}

export function evidenceSettings(env: NodeJS.ProcessEnv, repositoryRoot: string, outputKey: "LIVE_OUTPUT_DIR" | "REHEARSAL_OUTPUT_DIR" = "LIVE_OUTPUT_DIR") {
  if (!/^[a-f0-9]{40}$/i.test(env.EXPECTED_BUILD_COMMIT ?? "")) {
    throw new Error("EXPECTED_BUILD_COMMIT must be the user-provided full 40-character commit.");
  }
  const requestedOutput = env[outputKey];
  if (!requestedOutput || !isAbsolute(requestedOutput)) {
    throw new Error(`${outputKey} must be an absolute external artifact directory.`);
  }
  const output = resolve(requestedOutput);
  const fromRepo = relative(resolve(repositoryRoot), output);
  if (!fromRepo || (!fromRepo.startsWith(`..${sep}`) && fromRepo !== ".." && !isAbsolute(fromRepo))) {
    throw new Error(`${outputKey} must be outside the repository.`);
  }
  return { expectedCommit: env.EXPECTED_BUILD_COMMIT!.toLowerCase(), output };
}

export interface BuildInfo {
  commit: string;
  builtAt: string;
  dirty: boolean;
}

export function isBuildInfo(value: unknown): value is BuildInfo {
  if (!value || typeof value !== "object") return false;
  return "commit" in value && typeof value.commit === "string" && /^[a-f0-9]{40}$/i.test(value.commit) &&
    "builtAt" in value && typeof value.builtAt === "string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value.builtAt) &&
    Number.isFinite(Date.parse(value.builtAt)) && "dirty" in value && typeof value.dirty === "boolean";
}
