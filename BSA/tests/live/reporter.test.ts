import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import ChecklistReporter from "./checklist-reporter";
import type { FullResult, TestCase, TestResult } from "@playwright/test/reporter";
import { LIVE_CHECKLIST } from "./inventory";

function attempt(status: TestResult["status"] = "passed", retry = 0): TestResult {
  return {
    status, retry, duration: 1, startTime: new Date("2026-09-13T12:00:00.000Z"),
    errors: status === "failed" ? [{ message: "Original failure retained" }] : [],
    stdout: [], stderr: [], steps: [], annotations: [], parallelIndex: 0, workerIndex: 0,
    attachments: ["before", "after"].map((phase) => ({
      name: `identity-${phase}`, contentType: "application/json",
      body: Buffer.from(JSON.stringify({ commit: "a".repeat(40), builtAt: "2026-09-13T11:00:00.000Z", dirty: false })),
    })),
  };
}

function inventory(): Pick<TestCase, "title" | "results">[] {
  return LIVE_CHECKLIST.map((title) => ({ title, results: [attempt()] }));
}

async function report(tests: ReturnType<typeof inventory>, status: FullResult["status"] = "passed", error?: string): Promise<unknown> {
  const directory = await mkdtemp(join(tmpdir(), "bsa-live-selection-"));
  try {
    const outputFile = join(directory, "checklist.json");
    const reporter = new ChecklistReporter({ outputFile, baseURL: "https://example.test/", expectedCommit: "a".repeat(40) });
    reporter.onBegin({}, { allTests: () => tests });
    if (error) reporter.onError({ message: error });
    await reporter.onEnd({ status, startTime: new Date(), duration: 1 });
    return JSON.parse(await readFile(outputFile, "utf8")) as unknown;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

it("accepts every named live check exactly once, not a hardcoded count", async () => {
  expect(new Set(LIVE_CHECKLIST).size).toBe(LIVE_CHECKLIST.length);
  expect(await report(inventory())).toMatchObject({
    status: "PASS", selection: "full", expectedChecklist: LIVE_CHECKLIST,
    missingChecks: [], unexpectedChecks: [], duplicateChecks: [], actualBuildCommits: ["a".repeat(40)],
    checklist: LIVE_CHECKLIST.map((checklist) => ({ checklist, status: "PASS", attempts: [{ status: "PASS", retry: 0 }] })),
  });
});

it("retains passing partial selection without claiming full acceptance", async () => {
  expect(await report(inventory().slice(0, 2))).toMatchObject({
    runnerStatus: "passed", status: "FAIL", selection: "partial", missingChecks: LIVE_CHECKLIST.slice(2),
    checklist: LIVE_CHECKLIST.slice(0, 2).map((checklist) => ({ checklist, status: "PASS" })),
  });
});

it.each(["skipped", "not_run"] as const)("rejects a full selection with a %s check", async (status) => {
  const tests = inventory();
  tests[0].results = status === "not_run" ? [] : [attempt("skipped")];
  expect(await report(tests)).toMatchObject({
    status: "FAIL", selection: "full",
    checklist: expect.arrayContaining([expect.objectContaining({ checklist: tests[0].title, status: "NOT_RUN", runnerStatus: status })]),
  });
});

it("retains a failed attempt even when a retry passed and rejects clean acceptance", async () => {
  const tests = inventory();
  tests[0].results = [attempt("failed"), attempt("passed", 1)];
  expect(await report(tests)).toMatchObject({
    status: "FAIL", selection: "full",
    checklist: expect.arrayContaining([expect.objectContaining({
      checklist: tests[0].title, status: "PASS", retry: 1,
      attempts: [
        expect.objectContaining({ status: "FAIL", retry: 0, symptoms: ["Original failure retained"] }),
        expect.objectContaining({ status: "PASS", retry: 1 }),
      ],
    })]),
  });
});

it("rejects an empty inventory even if the runner says passed", async () => {
  expect(await report([])).toMatchObject({ status: "FAIL", selection: "empty", checklist: [], missingChecks: LIVE_CHECKLIST });
});

it("retains an explicit no-tests runner error", async () => {
  expect(await report([], "failed", "No tests found")).toMatchObject({ status: "FAIL", selection: "empty", symptoms: ["No tests found"] });
});

it("does not accept duplicate or unexpected tests in place of a required check", async () => {
  const tests = inventory();
  tests[0].title = tests[1].title;
  tests[2].title = "Unexpected extra check";
  expect(await report(tests)).toMatchObject({
    status: "FAIL", selection: "partial", missingChecks: [LIVE_CHECKLIST[0], LIVE_CHECKLIST[2]],
    unexpectedChecks: ["Unexpected extra check"], duplicateChecks: [LIVE_CHECKLIST[1]],
  });
});

it("writes an interrupted run as FAIL without inventing executed checks", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bsa-live-reporter-"));
  try {
    const outputFile = join(directory, "checklist.json");
    const reporter = new ChecklistReporter({
      outputFile, baseURL: "https://example.test/", expectedCommit: "a".repeat(40),
    });
    reporter.onError({ message: "Run interrupted before browser execution" });
    await reporter.onEnd({ status: "interrupted", startTime: new Date(), duration: 0 });
    const result: unknown = JSON.parse(await readFile(outputFile, "utf8"));
    expect(result).toMatchObject({
      baseURL: "https://example.test/",
      expectedBuildCommit: "a".repeat(40),
      runnerStatus: "interrupted",
      status: "FAIL",
      actualBuildCommits: [],
      symptoms: ["Run interrupted before browser execution"],
      checklist: [],
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
