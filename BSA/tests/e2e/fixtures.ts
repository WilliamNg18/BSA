import { test as base, expect, type Page, type TestInfo } from "@playwright/test";

export async function captureCheckpoint(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

export async function navigatePrimary(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  const mobile = nav.getByRole("button", { name: "Open navigation", exact: true });
  if (await mobile.isVisible()) {
    await mobile.click();
    await page.getByRole("dialog", { name: "Navigation", exact: true }).getByRole("link", { name: label, exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toHaveCount(0);
  } else if (label === "Overview") {
    await nav.getByRole("link", { name: label, exact: true }).click();
  } else {
    const group = ["Pharmacy check", "Exception queue"].includes(label) ? "Operations" : "How it works";
    await nav.getByRole("button", { name: group, exact: true }).click();
    await page.getByRole("menuitem", { name: label, exact: true }).click();
  }
}

export async function confirmReset(page: Page) {
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Reset demonstration?", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reset demonstration", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

export const test = base.extend<{ browserErrors: string[] }>({
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
});

export { expect };

export const cases = [
  { id: "EX-24107", title: "Valid and complete" },
  { id: "EX-24112", title: "Missing or insufficient information" },
  { id: "EX-24119", title: "Evidence conflict" },
  { id: "EX-24123", title: "Deliberate failure and abstention" },
  { id: "EX-24101", title: "Cleared by rules (no model call)" },
  { id: "EX-24088", title: "Human decision recorded" },
];

export const staticRoutes = [
  { path: "", title: "The referred-back subset" },
  { path: "pharmacy", title: "Pharmacy pre-submission check" },
  { path: "queue", title: "NHSBSA exception queue" },
  { path: "evaluation", title: "Evaluation and guardrails" },
  { path: "boundary", title: "Agent, deterministic code, human decision" },
  { path: "assumptions", title: "The assumptions that decide whether an agent is needed" },
  { path: "architecture", title: "Technical architecture and the path to production" },
];