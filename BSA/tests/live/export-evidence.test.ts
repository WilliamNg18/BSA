import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";
import { exportEvidence } from "./export-evidence.mjs";

it("exports validated relative evidence without altering the original run or overwriting a prior export", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bsa-export-"));
  try {
    const original = join(directory, "original");
    await mkdir(original);
    const image = join(original, "view.png");
    const bytes = Buffer.from("Synthetic test image fixture");
    await writeFile(image, bytes);
    const commit = "a".repeat(40);
    const identity = { commit, dirty: false, builtAt: "2026-09-13T12:00:00.000Z" };
    const report = {
      status: "PASS", selection: "full", runnerStatus: "passed", expectedBuildCommit: commit,
      baseURL: "https://example.test/", expectedChecklist: ["one"],
      checklist: [{
        checklist: "one", status: "PASS", attempts: [{ retry: 0 }],
        artifacts: [{ name: "view", path: image }],
        evidence: [
          { name: "identity-before", value: identity }, { name: "identity-after", value: identity },
          { name: "view-example", value: {
            screenshot: "view", sha256: createHash("sha256").update(bytes).digest("hex"),
            applicationSourceRevision: commit, sourceRevision: commit, sourceDirty: false,
            kind: "live view", agentEnabled: false,
          } },
          { name: "axe-example", value: { agentEnabled: false, violations: [], incomplete: [] } },
        ],
      }],
    };
    const reportPath = join(original, "checklist.json");
    const raw = JSON.stringify(report);
    await writeFile(reportPath, raw);
    const output = join(directory, "export");
    const run = () => execFileSync(process.execPath, [resolve("tests/live/export-evidence.mjs"), reportPath, output], { stdio: "pipe" });
    expect(run().toString()).toContain('"images":1');
    expect(await readFile(join(output, "original-checklist.json"), "utf8")).toBe(raw);
    expect(await readFile(reportPath, "utf8")).toBe(raw);
    expect(await readFile(join(output, "check-01", "01-view.png"))).toEqual(bytes);
    expect(JSON.parse(await readFile(join(output, "manifest.json"), "utf8"))).toMatchObject({
      applicationSourceRevision: commit, visualReview: "pending", counts: { checks: 1, identities: 2, images: 1, audits: 1, violations: 0 },
    });
    expect(run).toThrow();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it.each([
  { status: "FAIL", selection: "partial", runnerStatus: "passed" },
  { status: "PASS", selection: "full", runnerStatus: "passed", expectedBuildCommit: "main", baseURL: "https://example.test/" },
  { status: "PASS", selection: "full", runnerStatus: "passed", expectedBuildCommit: "a".repeat(40), baseURL: "http://localhost:4206/" },
  { kind: "local rehearsal, not hosted acceptance", status: "PASS", selection: "full", runnerStatus: "passed", expectedBuildCommit: "a".repeat(40), baseURL: "http://127.0.0.1:4193/" },
])("rejects partial, unpinned or local evidence: %j", async (report) => {
  const directory = await mkdtemp(join(tmpdir(), "bsa-export-reject-"));
  try {
    const source = join(directory, "checklist.json");
    await writeFile(source, JSON.stringify(report));
    await expect(exportEvidence(source, `${directory}-output`)).rejects.toThrow();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
