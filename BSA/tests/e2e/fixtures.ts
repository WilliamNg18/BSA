import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { collectTimedFailureArtifacts, THIN_TIMED_TRACE, TIMED_TRACE_LOSSES, verifyResolvedTracePolicy } from "../support/timed-trace-policy";
import { writeFile } from "node:fs/promises";

export async function captureJson(testInfo: TestInfo, name: string, value: unknown) {
  const path = testInfo.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(value, null, 2));
  await testInfo.attach(name, { path, contentType: "application/json" });
}

export async function captureCheckpoint(page: Page, testInfo: TestInfo, name: string) {
  if (page.viewportSize()?.width !== 1440) {
    await captureJson(testInfo, `${name}-capture-scope`, {
      captured: false, reason: "New PNG evidence is 1440 px only; functional assertions still run at 1280 px.",
      viewport: page.viewportSize(),
    });
    return;
  }
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

export async function navigatePrimary(page: Page, label: string) {
  // Older workload tests use the original name; activate the current UI label.
  if (label === "Exception queue") label = "NHSBSA queue";
  if (label === "Architecture") label = "System design";
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  await expect(nav).toBeVisible();
  let destination: string;
  if (label === "Overview") {
    const link = nav.getByRole("link", { name: label, exact: true });
    destination = await link.getAttribute("href") as string;
    await link.click();
  } else {
    const group = ["Pharmacy check", "Pharmacy claims", "NHSBSA queue"].includes(label) ? "Operations" : "How it works";
    const trigger = nav.getByRole("button", { name: group, exact: true });
    await trigger.click();
    // The modal menu hides the navigation from the accessibility tree while
    // open; await the exposed menu, not its now aria-hidden trigger.
    await expect(page.getByRole("menu")).toBeVisible();
    const item = page.getByRole("menuitem", { name: label, exact: true });
    await expect(item).toBeVisible();
    destination = await item.getAttribute("href") as string;
    // Radix focuses the menu during opening. Await item focus and activate by
    // keyboard rather than racing the opening menu's pointer/position changes.
    await item.focus();
    await expect(item).toBeFocused();
    await item.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  expect(destination).toBeTruthy();
  await expect(page).toHaveURL(new URL(destination, page.url()).href);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
}

export async function confirmReset(page: Page) {
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Reset demonstration?", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reset demonstration", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

export const automaticCaseIds = ["EX-24107"];

export async function openCaseFromQueueOrClaim(page: Page, id: string) {
  if (!automaticCaseIds.includes(id)) {
    await page.getByRole("button", { name: /^All staff items \(/ }).click();
    if (id === "EX-24123") {
      const capture = page.locator(`[data-type1-case="${id}"]`);
      if (await capture.getAttribute("open") === null) await capture.locator(":scope > summary").click();
      await capture.getByRole("link", { name: `Open ${id}`, exact: true }).click();
    } else await page.locator(`[data-case-id="${id}"]`).getByRole("link", { name: `Open ${id}`, exact: true }).click();
    return;
  }
  await navigatePrimary(page, "Pharmacy claims");
  await expect(page.locator("[data-pharmacy-identity]")).toContainText("Hillcrest Pharmacy (FQ123)");
  await page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / }).click();
  await page.getByRole("table", { name: "Pharmacy claims", exact: true })
    .getByRole("row").filter({ hasText: id }).getByRole("button").click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
}

export const test = base.extend<{ browserErrors: string[]; timedArtifactsExpected: boolean; traceArtifactPolicy: void }>({
  timedArtifactsExpected: [false, { option: true }],
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => errors.push(`request: ${request.url()} ${request.failure()?.errorText}`));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await use(errors);
    expect(errors, "Production browser errors must not be swallowed by an error boundary").toEqual([]);
  }, { auto: true }],
  traceArtifactPolicy: [async ({ page, trace, timedArtifactsExpected }, use, info) => {
    const diagnostic = info.config.metadata.routeDiagnostics === true || info.config.metadata.runtimeProfile === true;
    if (!timedArtifactsExpected && !diagnostic) {
      await use();
      return;
    }
    const expected = timedArtifactsExpected ? "thin-timed" : "full-diagnostic";
    let resolved: ReturnType<typeof verifyResolvedTracePolicy>;
    try {
      if (timedArtifactsExpected && diagnostic) throw new Error("Diagnostics must use the full-trace base test, not timedTest.");
      resolved = verifyResolvedTracePolicy(trace, expected);
    } catch (error) {
      await captureJson(info, "trace-artifact-policy-error", {
        originalStatus: "not-run", expected, resolvedOption: trace,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    const collect = async () => {
      const originalStatus = info.status ?? "not-reported";
      await captureJson(info, "trace-artifact-policy", {
        originalStatus, expected, resolvedOption: trace, resolved,
        losses: timedArtifactsExpected ? TIMED_TRACE_LOSSES : [],
        boundary: "Artifact policy only; required assertions and the original deadline are unchanged.",
      });
      if (timedArtifactsExpected && ["failed", "timedOut", "interrupted"].includes(originalStatus)) {
        try {
          await collectTimedFailureArtifacts({
            html: () => page.content(),
            aria: () => page.locator("body").ariaSnapshot(),
          }, (name, body, contentType) => info.attach(name, { body, contentType }));
        } catch (error) {
          await captureJson(info, "timed-failure-artifact-error", {
            originalStatus, message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }
    };
    try { await use(); } finally { await collect(); }
  }, { auto: true }],
});

export const timedTest = test.extend({ trace: THIN_TIMED_TRACE, timedArtifactsExpected: true });

export { expect };

export const cases = [
  { id: "EX-24107", title: "Valid and complete" },
  { id: "EX-24112", title: "Missing or insufficient information" },
  { id: "SYN-FQ123-MISMATCH", title: "Complete format, wrong pack" },
  { id: "EX-24123", title: "Deliberate failure and abstention" },
];

export const staticRoutes = [
  { path: "", title: "Most items need no person" },
  { path: "pharmacy", title: "Pharmacy pre-submission check" },
  { path: "queue", title: "NHSBSA exception queue" },
  { path: "evaluation", title: "Evaluation and guardrails" },
  { path: "boundary", title: "Agent, deterministic code, human decision" },
  { path: "assumptions", title: "The assumptions that decide whether an agent is needed" },
  { path: "architecture", title: "How it works and how it would scale" },
];