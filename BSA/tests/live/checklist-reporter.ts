import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";

interface Options { outputFile: string; baseURL: string; expectedCommit: string }

export default class ChecklistReporter implements Reporter {
  private suite?: Suite;
  private startedAt = "";
  constructor(private options: Options) {}
  onBegin(_config: FullConfig, suite: Suite) {
    this.suite = suite;
    this.startedAt = new Date().toISOString();
  }
  private async result(test: TestCase, result?: TestResult) {
    const evidence: { name: string; value: unknown }[] = [];
    for (const attachment of result?.attachments ?? []) {
      if (attachment.contentType !== "application/json") continue;
      const text = attachment.body?.toString() ?? (attachment.path ? await readFile(attachment.path, "utf8") : undefined);
      if (text) evidence.push({ name: attachment.name, value: JSON.parse(text) as unknown });
    }
    return {
      checklist: test.title,
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
    const checklist = await Promise.all((this.suite?.allTests() ?? []).map((test) => this.result(test, test.results.at(-1))));
    await mkdir(dirname(this.options.outputFile), { recursive: true });
    await writeFile(this.options.outputFile, JSON.stringify({
      baseURL: this.options.baseURL,
      expectedBuildCommit: this.options.expectedCommit,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      runnerStatus: result.status,
      status: result.status === "passed" && checklist.length === 13 && checklist.every((row) => row.status === "PASS") ? "PASS" : "FAIL",
      checklist,
    }, null, 2));
  }
}
