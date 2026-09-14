import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import ChecklistReporter from "./checklist-reporter";
import type { FullResult, TestCase, TestResult } from "@playwright/test/reporter";
import { LIVE_CHECKLIST } from "./inventory";
import { liveSettings } from "./settings";

const build = { commit: "a".repeat(40), actualBuildCommit: "a".repeat(40), builtAt: "2026-09-13T11:00:00.000Z", dirty: false };

function attempt(status: TestResult["status"] = "passed", retry = 0): TestResult {
  return {
    status, retry, duration: 1, startTime: new Date("2026-09-13T12:00:00.000Z"),
    errors: status === "failed" ? [{ message: "Original failure retained" }] : [],
    stdout: [], stderr: [], steps: [], annotations: [], parallelIndex: 0, workerIndex: 0,
    attachments: ["before", "after"].map((phase) => ({
      name: `identity-${phase}`, contentType: "application/json",
      body: Buffer.from(JSON.stringify(build)),
    })),
  };
}

function inventory(): Pick<TestCase, "title" | "results">[] {
  return LIVE_CHECKLIST.map((title) => ({ title, results: [attempt()] }));
}

async function report(tests: ReturnType<typeof inventory>, status: FullResult["status"] = "passed", error?: string, baseURL = "https://example.test/"): Promise<unknown> {
  const directory = await mkdtemp(join(process.cwd(), ".bsa-live-selection-"));
  try {
    const outputFile = join(directory, "checklist.json");
    const reporter = new ChecklistReporter({ outputFile, baseURL, expectedCommit: "a".repeat(40) });
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
    kind: "hosted functional checklist", status: "PASS", selection: "full", expectedChecklist: LIVE_CHECKLIST,
    missingChecks: [], unexpectedChecks: [], duplicateChecks: [], actualBuildCommits: ["a".repeat(40)],
    checklist: LIVE_CHECKLIST.map((checklist) => ({ checklist, status: "PASS", attempts: [{ status: "PASS", retry: 0 }] })),
  });

});

it("labels even a complete passing loopback run as rehearsal, never hosted acceptance", async () => {
  expect(await report(inventory(), "passed", undefined, "http://127.0.0.1:4193/")).toMatchObject({
    kind: "local rehearsal, not hosted acceptance", status: "PASS", selection: "full", baseURL: "http://127.0.0.1:4193/",
  });
});

it.each(["http://localhost:4193/", "http://127.0.0.1:4193/"])("keeps %s outside the HTTPS live configuration", (baseURL) => {
  expect(() => liveSettings({
    LIVE_BASE_URL: baseURL, EXPECTED_BUILD_COMMIT: build.commit,
    LIVE_OUTPUT_DIR: join(process.cwd(), "external-evidence"),
  }, join(process.cwd(), "repository"))).toThrow("LIVE_BASE_URL must be an HTTPS root URL");
});

it("requires exact clean identities for local rehearsal too", async () => {
  const tests = inventory();
  tests[0].results[0].attachments = [];
  expect(await report(tests, "passed", undefined, "http://localhost:4193/")).toMatchObject({
    kind: "local rehearsal, not hosted acceptance", status: "FAIL", selection: "full",
    checklist: expect.arrayContaining([expect.objectContaining({
      identityChecks: [
        { name: "identity-before", status: "FAIL", issues: ["Missing build identity"] },
        { name: "identity-after", status: "FAIL", issues: ["Missing build identity"] },
      ],
    })]),
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
      checklist: tests[0].title, status: "FAIL", runnerStatus: "passed", retry: 1,
      attempts: [
        expect.objectContaining({ status: "FAIL", retry: 0, symptoms: ["Original failure retained"] }),
        expect.objectContaining({ status: "FAIL", runnerStatus: "passed", retry: 1 }),
      ],
    })]),
  });
});

it("rejects a lone retried pass even when the earlier attempt is absent", async () => {
  const tests = inventory();
  tests[0].results = [attempt("passed", 1)];
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      status: "FAIL", runnerStatus: "passed",
      symptoms: ["Retried attempts cannot establish a clean PASS"],
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

it.each(["duplicate", "unexpected"] as const)("rejects an added %s check even when every required name is present", async (kind) => {
  const tests = inventory();
  tests.push({ title: kind === "duplicate" ? LIVE_CHECKLIST[0] : "Unexpected extra check", results: [attempt()] });
  expect(await report(tests)).toMatchObject({
    status: "FAIL", selection: "partial", missingChecks: [],
    duplicateChecks: kind === "duplicate" ? [LIVE_CHECKLIST[0]] : [],
    unexpectedChecks: kind === "unexpected" ? ["Unexpected extra check"] : [],
  });
});

it.each(["before", "after", "both"])("rejects missing %s identities without dropping other evidence", async (phase) => {
  const tests = inventory();
  const result = tests[0].results[0];
  result.attachments = result.attachments.filter((attachment) => phase !== "both" && attachment.name !== `identity-${phase}`);
  result.attachments.push({ name: "build-before", contentType: "application/json", body: Buffer.from(JSON.stringify(build)) });
  const missingNames = phase === "both" ? ["identity-before", "identity-after"] : [`identity-${phase}`];
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      status: "FAIL", runnerStatus: "passed",
      identityChecks: expect.arrayContaining(missingNames.map((name) => ({ name, status: "FAIL", issues: ["Missing build identity"] }))),
      evidence: expect.arrayContaining([{ name: "build-before", value: build }]),
    })]),
  });
});

it.each(["before", "after"])("rejects a wrong or dirty %s identity", async (phase) => {
  for (const identity of [{ ...build, commit: "b".repeat(40), actualBuildCommit: "b".repeat(40) }, { ...build, dirty: true }]) {
    const tests = inventory();
    const attachment = tests[0].results[0].attachments.find((entry) => entry.name === `identity-${phase}`)!;
    attachment.body = Buffer.from(JSON.stringify(identity));
    expect(await report(tests)).toMatchObject({
      status: "FAIL", actualBuildCommits: expect.arrayContaining([identity.commit]),
      checklist: expect.arrayContaining([expect.objectContaining({
        status: "FAIL", identityChecks: expect.arrayContaining([{
          name: `identity-${phase}`, status: "FAIL",
          issues: [identity.dirty ? "Dirty build identity: expected dirty=false" : `Build commit mismatch: expected ${build.commit}, received ${identity.commit}`],
        }]),
        evidence: expect.arrayContaining([{ name: `identity-${phase}`, value: identity }]),
      })]),
    });
  }
});

it.each([null, {}, { ...build, dirty: "false" }, { ...build, builtAt: "today" }, { ...build, commit: "main" }])("rejects invalid identity %j", async (identity) => {
  const tests = inventory();
  tests[0].results[0].attachments[0].body = Buffer.from(JSON.stringify(identity));
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      identityChecks: expect.arrayContaining([{
        name: "identity-before", status: "FAIL", issues: ["Invalid build identity: expected commit, UTC builtAt and boolean dirty"],
      }]),
      evidence: expect.arrayContaining([{ name: "identity-before", value: identity }]),
    })]),
  });
});

it("rejects contradictory actualBuildCommit rather than trusting the expected commit field", async () => {
  const tests = inventory();
  tests[0].results[0].attachments[0].body = Buffer.from(JSON.stringify({ ...build, actualBuildCommit: "b".repeat(40) }));
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      identityChecks: expect.arrayContaining([{
        name: "identity-before", status: "FAIL", issues: ["Build identity actualBuildCommit does not match commit"],
      }]),
    })]),
  });
});

it("rejects duplicate identities, retaining both copies", async () => {
  const tests = inventory();
  tests[0].results[0].attachments.push({ ...tests[0].results[0].attachments[0] });
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      identityChecks: expect.arrayContaining([{ name: "identity-before", status: "FAIL", issues: ["Duplicate build identities (2)"] }]),
      evidence: [
        { name: "identity-before", value: build }, { name: "identity-after", value: build }, { name: "identity-before", value: build },
      ],
    })]),
  });
});

it("preserves identities from failed attempts as well as the final attempt", async () => {
  const tests = inventory();
  const failed = attempt("failed");
  failed.attachments[0].body = Buffer.from(JSON.stringify({ ...build, commit: "b".repeat(40), actualBuildCommit: "b".repeat(40) }));
  tests[0].results = [failed, attempt("passed", 1)];
  expect(await report(tests)).toMatchObject({
    status: "FAIL", actualBuildCommits: ["b".repeat(40), build.commit],
    checklist: expect.arrayContaining([expect.objectContaining({
      attempts: [
        expect.objectContaining({ runnerStatus: "failed", evidence: expect.arrayContaining([expect.objectContaining({ value: expect.objectContaining({ commit: "b".repeat(40) }) })]) }),
        expect.objectContaining({ runnerStatus: "passed", retry: 1 }),
      ],
    })]),
  });
});

it.each(["identity-before", "axe-check"])("reports malformed %s JSON without losing subsequent evidence", async (name) => {
  const tests = inventory();
  const attachment = { name, contentType: "application/json", body: Buffer.from("{bad") };
  if (name === "identity-before") tests[0].results[0].attachments[0] = attachment;
  else tests[0].results[0].attachments.unshift(attachment);
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      status: "FAIL", symptoms: expect.arrayContaining([expect.stringContaining(`${name}: Cannot parse JSON attachment`)]),
      evidence: expect.arrayContaining([
        { name, raw: "{bad", error: expect.stringContaining("Cannot parse JSON attachment") },
        { name: "identity-after", value: build },
      ]),
    })]),
  });
});

it.each(["empty", "absent", "unreadable", "wrong content type"])("reports %s identity attachments explicitly", async (kind) => {
  const tests = inventory();
  const attachment = tests[0].results[0].attachments[0];
  delete attachment.body;
  if (kind === "empty") attachment.body = Buffer.from("");
  if (kind === "unreadable") attachment.path = join(process.cwd(), ".missing-build-identity.json");
  if (kind === "wrong content type") attachment.contentType = "text/plain";
  const error = kind === "empty" ? "Cannot parse JSON attachment" : kind === "wrong content type" ? "Expected application/json" : "Cannot read JSON attachment";
  expect(await report(tests)).toMatchObject({
    status: "FAIL",
    checklist: expect.arrayContaining([expect.objectContaining({
      evidence: expect.arrayContaining([expect.objectContaining({ name: "identity-before", error: expect.stringContaining(error) })]),
      identityChecks: expect.arrayContaining([expect.objectContaining({ name: "identity-before", status: "FAIL" })]),
      ...(attachment.path ? { artifacts: [{ name: "identity-before", path: attachment.path }] } : {}),
    })]),
  });
});

it("reads the path-backed identity attachments produced by the fixture", async () => {
  const directory = await mkdtemp(join(process.cwd(), ".bsa-live-identities-"));
  try {
    const path = join(directory, "identity.json");
    await writeFile(path, JSON.stringify(build));
    const tests = inventory();
    for (const test of tests) {
      for (const attachment of test.results[0].attachments) {
        delete attachment.body;
        attachment.path = path;
      }
    }
    expect(await report(tests)).toMatchObject({ status: "PASS", actualBuildCommits: [build.commit] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("writes an interrupted run as FAIL without inventing executed checks", async () => {
  const directory = await mkdtemp(join(process.cwd(), ".bsa-live-reporter-"));
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
