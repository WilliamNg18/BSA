import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import ChecklistReporter from "./checklist-reporter";

it("writes an interrupted run as FAIL without inventing executed checks", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bsa-live-reporter-"));
  try {
    const outputFile = join(directory, "checklist.json");
    const reporter = new ChecklistReporter({
      outputFile, baseURL: "https://example.test/", expectedCommit: "a".repeat(40),
    });
    await reporter.onEnd({ status: "interrupted", startTime: new Date(), duration: 0 });
    const result: unknown = JSON.parse(await readFile(outputFile, "utf8"));
    expect(result).toMatchObject({
      baseURL: "https://example.test/",
      expectedBuildCommit: "a".repeat(40),
      runnerStatus: "interrupted",
      status: "FAIL",
      checklist: [],
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
