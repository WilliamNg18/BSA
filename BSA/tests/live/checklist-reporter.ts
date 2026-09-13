import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FullResult, Reporter, TestCase, TestError, TestResult } from "@playwright/test/reporter";
import { isBuildInfo } from "./settings";
import { LIVE_CHECKLIST } from "./inventory";

interface Options { outputFile: string; baseURL: string; expectedCommit: string }
type ReportTest = Pick<TestCase, "title" | "results">;
interface ReportSuite { allTests(): ReportTest[] }

export default class ChecklistReporter implements Reporter {
  private suite?: ReportSuite;
  private startedAt = "";
  private errors: string[] = [];
  constructor(private options: Options) {}
  onBegin(_config: unknown, suite: ReportSuite) {
    this.suite = suite;
    this.startedAt = new Date().toISOString();
  }
  onError(error: TestError) {
    this.errors.push(error.message ?? error.value ?? "Unspecified runner error");
  }
  private async result(test: ReportTest, result?: TestResult) {
    const evidence: { name: string; value: unknown }[] = [];
    for (const attachment of result?.attachments ?? []) {
      if (attachment.contentType !== "application/json") continue;
      const text = attachment.body?.toString() ?? (attachment.path ? await readFile(attachment.path, "utf8") : undefined);
      if (text) evidence.push({ name: attachment.name, value: JSON.parse(text) as unknown });
    }
    return {
      checklist: test.title,
      retry: result?.retry ?? null,
      status: result?.status === "passed" ? "PASS" : result?.status === "skipped" || !result ? "NOT_RUN" : "FAIL",
      runnerStatus: result?.status ?? "not_run",
      startedAt: result?.startTime.toISOString() ?? null,
      durationMs: result?.duration ?? null,
      symptoms: result?.errors.map((error) => error.message ?? error.value ?? "Unspecified runner error") ?? [],
      evidence,
      artifacts: result?.attachments.filter((a) => a.path).map((a) => ({ name: a.name, path: a.path })) ?? [],
    };
  }
  async onEnd(result: FullResult) {
    const checklist = await Promise.all((this.suite?.allTests() ?? []).map(async (test) => ({
      ...await this.result(test, test.results.at(-1)),
      attempts: await Promise.all(test.results.map((attempt) => this.result(test, attempt))),
    })));
    const selected = checklist.map((row) => row.checklist);
    const expected = new Set<string>(LIVE_CHECKLIST);
    const missing = LIVE_CHECKLIST.filter((title) => !selected.includes(title));
    const unexpected = selected.filter((title) => !expected.has(title));
    const duplicate = selected.filter((title, index) => selected.indexOf(title) !== index);
    const fullSelection = selected.length > 0 && !missing.length && !unexpected.length && !duplicate.length;
    const cleanPasses = checklist.every((row) => row.status === "PASS" && row.attempts.length === 1 && row.attempts[0].retry === 0);
    const identities = checklist.flatMap((row) => row.evidence.map((entry) => entry.value)).filter(isBuildInfo);
    await mkdir(dirname(this.options.outputFile), { recursive: true });
    await writeFile(this.options.outputFile, JSON.stringify({
      kind: new URL(this.options.baseURL).protocol === "https:" ? "hosted functional checklist" : "local rehearsal, not hosted acceptance",
      baseURL: this.options.baseURL,
      expectedBuildCommit: this.options.expectedCommit,
      actualBuildCommits: [...new Set(identities.map((identity) => identity.commit))],
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      runnerStatus: result.status,
      symptoms: this.errors,
      selection: selected.length === 0 ? "empty" : fullSelection ? "full" : "partial",
      expectedChecklist: LIVE_CHECKLIST,
      missingChecks: missing, unexpectedChecks: unexpected, duplicateChecks: duplicate,
      status: result.status === "passed" && fullSelection && cleanPasses && !this.errors.length ? "PASS" : "FAIL",
      checklist,
    }, null, 2));
  }
}
