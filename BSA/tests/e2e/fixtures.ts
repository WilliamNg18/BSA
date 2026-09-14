import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

export async function captureJson(testInfo: TestInfo, name: string, value: unknown) {
  const path = testInfo.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(value, null, 2));
  await testInfo.attach(name, { path, contentType: "application/json" });
}

export async function captureCheckpoint(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

export async function navigatePrimary(page: Page, label: string) {
  // Older workload tests use the original name; activate the current UI label.
  if (label === "Exception queue") label = "NHSBSA queue";
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

export const automaticCaseIds = ["EX-24107", "EX-24101", "SYN-FQ123-READABLE"];

export async function openCaseFromQueueOrClaim(page: Page, id: string) {
  if (!automaticCaseIds.includes(id)) {
    await page.locator(`a[href='/case/${id}']`).first().click();
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
  { path: "", title: "Most items need no person" },
  { path: "pharmacy", title: "Pharmacy pre-submission check" },
  { path: "queue", title: "NHSBSA exception queue" },
  { path: "evaluation", title: "Evaluation and guardrails" },
  { path: "boundary", title: "Agent, deterministic code, human decision" },
  { path: "assumptions", title: "The assumptions that decide whether an agent is needed" },
  { path: "architecture", title: "Technical architecture and the path to production" },
];