import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../..", import.meta.url));
export const instrumentedDirectory = join(app, "test-results", "one-state-site");

export function artifactDigest(directory) {
  const digest = createHash("sha256");
  const visit = (relative) => {
    for (const entry of readdirSync(join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = join(relative, entry.name);
      if (entry.isDirectory()) visit(name);
      else if (entry.isFile()) {
        digest.update(JSON.stringify(name));
        digest.update(readFileSync(join(directory, name)));
      } else throw new Error(`Unexpected non-file in build artifact: ${name}`);
    }
  };
  visit("");
  return digest.digest("hex");
}

export function buildOneStateArtifact(run = spawnSync, directory = app) {
  const ordinary = join(directory, "dist");
  const before = artifactDigest(ordinary);
  const output = join(directory, "test-results", "one-state-site");
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Run the one-state build through npm so the npm CLI is available.");
  const result = run(process.execPath, [npmCli, "run", "build", "--", "--outDir", output], {
    cwd: directory,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, VITE_E2E_STATE_OBSERVER: "true" },
  });
  if (artifactDigest(ordinary) !== before) throw new Error("The instrumented build changed the ordinary deployment artifact.");
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`One-state build terminated by ${result.signal}.`);
  if (result.status !== 0) throw new Error(`One-state build failed with exit status ${result.status}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildOneStateArtifact();
}
