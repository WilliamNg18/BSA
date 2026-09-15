import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FullResult, Reporter, TestCase, TestError, TestResult } from "@playwright/test/reporter";
import { isBuildInfo } from "./settings";
import { LIVE_CHECKLIST } from "./inventory";

interface Options { outputFile: string; baseURL: string; expectedCommit: string }
type ReportTest = Pick<TestCase, "title" | "results">;
interface ReportSuite { allTests(): ReportTest[] }
interface Evidence { name: string; value?: unknown; error?: string; raw?: string }
const identityNames = ["identity-before", "identity-after"] as const;

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
    const evidence: Evidence[] = [];
    for (const attachment of result?.attachments ?? []) {
      if (attachment.contentType !== "application/json") {
        if (identityNames.some((name) => name === attachment.name)) {
          evidence.push({ name: attachment.name, error: `Expected application/json, received ${attachment.contentType}` });
        }
        continue;
      }
      let text: string | undefined;
      try {
        text = attachment.body?.toString() ?? (attachment.path ? await readFile(attachment.path, "utf8") : undefined);
        if (text === undefined) throw new Error("Attachment has neither body nor path");
        evidence.push({ name: attachment.name, value: JSON.parse(text) as unknown });
      } catch (error) {
        evidence.push({
          name: attachment.name, raw: text,
          error: `${text === undefined ? "Cannot read" : "Cannot parse"} JSON attachment: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
    const identityChecks = identityNames.map((name) => {
      const entries = evidence.filter((entry) => entry.name === name);
      const issues: string[] = [];
      if (!entries.length) issues.push("Missing build identity");
      if (entries.length > 1) issues.push(`Duplicate build identities (${entries.length})`);
      for (const entry of entries) {
        if (entry.error) issues.push(entry.error);
        else if (!isBuildInfo(entry.value)) issues.push("Invalid build identity: expected commit, UTC builtAt and boolean dirty");
        else {
          if (entry.value.commit !== this.options.expectedCommit) issues.push(`Build commit mismatch: expected ${this.options.expectedCommit}, received ${entry.value.commit}`);
          if (entry.value.dirty) issues.push("Dirty build identity: expected dirty=false");
          if ("actualBuildCommit" in entry.value && entry.value.actualBuildCommit !== entry.value.commit) {
            issues.push("Build identity actualBuildCommit does not match commit");
          }
        }
      }
      return { name, status: issues.length ? "FAIL" : "PASS", issues };
    });
    const evidenceErrors = evidence.filter((entry) => entry.error).map((entry) => `${entry.name}: ${entry.error}`);
    const identityErrors = identityChecks.flatMap((check) => check.issues.map((issue) => `${check.name}: ${issue}`));
    const symptoms = [
      ...(result?.errors.map((error) => error.message ?? error.value ?? "Unspecified runner error") ?? []),
      ...new Set([...evidenceErrors, ...identityErrors]),
      ...(result && result.retry !== 0 ? ["Retried attempts cannot establish a clean PASS"] : []),
    ];
    const cleanPass = result?.status === "passed" && result.retry === 0 && !symptoms.length;
    return {
      checklist: test.title,
      retry: result?.retry ?? null,
      status: cleanPass ? "PASS" : result?.status === "skipped" || !result ? "NOT_RUN" : "FAIL",
      runnerStatus: result?.status ?? "not_run",
      startedAt: result?.startTime.toISOString() ?? null,
      durationMs: result?.duration ?? null,
      symptoms,
      identityChecks,
      evidence,
      artifacts: result?.attachments.filter((a) => a.path).map((a) => ({ name: a.name, path: a.path })) ?? [],
    };
  }
  async onEnd(result: FullResult) {
    const checklist = await Promise.all((this.suite?.allTests() ?? []).map(async (test) => {
      const attempts = await Promise.all(test.results.map((attempt) => this.result(test, attempt)));
      const latest = attempts.at(-1) ?? await this.result(test);
      return {
        ...latest,
        status: attempts.length > 1 ? "FAIL" : latest.status,
        symptoms: [...latest.symptoms, ...(attempts.length > 1 ? ["Multiple attempts cannot establish a clean PASS"] : [])],
        attempts,
      };
    }));
    const selected = checklist.map((row) => row.checklist);
    const expected = new Set<string>(LIVE_CHECKLIST);
    const missing = LIVE_CHECKLIST.filter((title) => !selected.includes(title));
    const unexpected = selected.filter((title) => !expected.has(title));
    const duplicate = selected.filter((title, index) => selected.indexOf(title) !== index);
    const fullSelection = selected.length > 0 && !missing.length && !unexpected.length && !duplicate.length;
    const cleanPasses = checklist.every((row) => row.status === "PASS" && row.attempts.length === 1 && row.attempts[0].retry === 0);
    const identities = checklist.flatMap((row) => row.attempts.flatMap((attempt) => attempt.evidence
      .filter((entry) => identityNames.some((name) => name === entry.name))
      .map((entry) => entry.value))).filter(isBuildInfo);
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
