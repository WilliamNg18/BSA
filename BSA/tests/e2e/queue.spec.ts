import AxeBuilder from "@axe-core/playwright";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { MONTH_MODEL_DEFAULTS, monthModel, formatBaselineNumber as n } from "../../src/lib/domain/baseline";
import { QUEUE_SEEDS } from "../../src/lib/domain/queue-model";

const result = monthModel(MONTH_MODEL_DEFAULTS);
const total = result.volume - result.pharmacyCaught;

for (const volume of [0, 5, 1_000_000_000]) {
  test(`Task15 shared volume ${volume} keeps seed examples and bounds the logical window`, async ({ page }) => {
    await page.goto("./#month");
    await page.locator("#baseline-volume").fill(String(volume));
    await navigatePrimary(page, "Exception queue");
    const model = monthModel({ ...MONTH_MODEL_DEFAULTS, volume });
    const count = Math.max(12, volume - model.pharmacyCaught);
    const table = page.getByRole("region", { name: "Exception queue table", exact: true });
    await expect(table.locator("tbody tr")).toHaveCount(Math.min(50, count));
    await expect(page.locator("[data-queue-counter]")).toHaveText(`showing 1 to ${n(Math.min(50, count))} of ${n(count)} this month`);
    if (volume < 12) await expect(page.getByText("The twelve examples remain available outside the smaller monthly projection. They do not increase its volume.", { exact: true })).toBeVisible();
    else {
      await page.getByLabel("Jump to item", { exact: true }).fill(String(count));
      await page.getByRole("button", { name: "Jump", exact: true }).click();
      await expect(table.locator("tbody tr")).toHaveCount(1);
      await expect(page.locator("[data-queue-counter]")).toHaveText(`showing ${n(count)} to ${n(count)} of ${n(count)} this month`);
    }
  });
}

test("Task15 invalid shared assumptions keep evidence readable and do not display stale estimates", async ({ page }) => {
  await page.goto("./#month");
  await page.locator("#baseline-volume").fill("");
  await navigatePrimary(page, "Exception queue");
  await expect(page.getByRole("alert").filter({ hasText: "Invalid calculator assumptions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toBeDisabled();
  await expect(page.locator("[data-queue-seed]")).toHaveCount(12);
  await expect(page.locator("[data-month-row]")).toHaveCount(0);
  await expect(page.locator("[data-queue-month-summary]")).toHaveCount(0);
});

test("Task15 exact guides, one bounded six-column table, counted filters and same seeds in both modes", async ({ page }) => {
  await page.goto("queue");
  const table = page.getByRole("region", { name: "Exception queue table", exact: true });
  await expect(table.locator("thead th")).toHaveCount(6);
  await expect(table.locator("tbody tr")).toHaveCount(50);
  await expect(page.locator("[data-queue-counter]")).toHaveText(`showing 1 to 50 of ${n(total)} this month`);
  expect(await table.evaluate((el) => el.clientHeight)).toBe(510);
  const off = "Today: a list of items that failed a rule. The operator sees a reference and a reason, then gathers everything else by hand.";
  const on = "With the agent: the same list. Each item arrives with its case built, its rule cited and a recommendation; the operator only decides.";
  await expect(page.locator("[data-queue-guide]")).toHaveText(off);
  const ids = await table.locator("tbody th").allTextContents();
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-queue-guide]")).toHaveText(on);
  await expect(table.locator("tbody th")).toHaveText(ids);
  await expect(table.locator("[data-queue-seed]")).toHaveCount(12);
  for (const [i, seed] of QUEUE_SEEDS.entries()) await expect(table.locator("tbody tr").nth(i)).toContainText(seed.id);
  for (const label of ["Case built ready to decide", "Needs more evidence", "Abstained worked as today", "Cleared by rules no model call", "Decided"]) {
    const tile = page.getByRole("button", { name: new RegExp(label) }).first();
    const count = Number((await tile.locator("span").first().innerText()).replaceAll(",", ""));
    await tile.click();
    await expect(tile).toHaveAttribute("aria-pressed", "true");
    await expect(table.locator("tbody tr")).toHaveCount(Math.min(50, count));
    await expect(page.locator("[data-queue-counter]")).toContainText(`of ${n(count)} this month`);
  }
  await page.getByRole("button", { name: /All items/ }).click();
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  for (const label of ["Awaiting an operator", "In progress", "Decided"]) await expect(page.getByRole("button", { name: new RegExp(label) }).first()).toBeVisible();
  await expect(table.locator('[data-queue-seed="EX-24123"]')).toContainText("nothing yet, operator to gather");
  await expect(table.locator('[data-queue-seed="EX-24123"]')).toContainText("Known abstention; manual work");
  await expect(table.locator('[data-queue-seed="EX-24101"]')).toContainText("Cleared by rules; no model call");
  await expect(table.locator('[data-queue-seed="EX-24088"]')).toContainText("Human record unchanged");
});

test("Task15 logical window controls reflect the rendered range and generated details are citation-free", async ({ page }) => {
  await page.goto("queue");
  const table = page.getByRole("region", { name: "Exception queue table", exact: true });
  const counter = page.locator("[data-queue-counter]");
  await page.getByRole("button", { name: "Next 50", exact: true }).click();
  await expect(counter).toHaveText(`showing 51 to 100 of ${n(total)} this month`);
  await expect(table.locator("tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: "Last items", exact: true }).click();
  await expect(counter).toHaveText(`showing ${n(total - 49)} to ${n(total)} of ${n(total)} this month`);
  await page.getByLabel("Jump to item", { exact: true }).fill(String(total));
  await page.getByRole("button", { name: "Jump", exact: true }).click();
  await expect(counter).toHaveText(`showing ${n(total)} to ${n(total)} of ${n(total)} this month`);
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await table.getByRole("button", { name: "Open", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("No retrieved rule, citation or agent result");
  await expect(dialog.locator("[data-pain-marker]")).toHaveCount(7);
  await expect(dialog).not.toContainText(/Part II|Clause 9|2026-08/);
  await page.keyboard.press("Escape");
  await expect(table.getByRole("button", { name: "Open", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "First items", exact: true }).click();
  await table.focus(); await page.keyboard.press("PageDown");
  await expect(counter).toContainText("showing 51 to 100");
  await page.getByLabel("Jump to item", { exact: true }).fill("1000000001");
  await expect(page.getByRole("button", { name: "Jump", exact: true })).toBeDisabled();
  await confirmReset(page);
  await expect(counter).toContainText("showing 1 to 50");
});

test("Task15 pharmacy submission is first and New without reloading, then opens explicit review", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("link", { name: "Open shared queue", exact: true }).click();
  const row = page.locator('[data-shared-case="EX-24112"]');
  await expect(page.locator("[data-queue-seed]").first()).toHaveAttribute("data-queue-seed", "EX-24112");
  await expect(row).toContainText("New");
  await expect(row).toContainText("Needs more evidence");
  await expect(row).toContainText("Awaiting review; no case built yet");
  await page.getByRole("button", { name: /Needs more evidence/ }).first().click();
  await expect(row).toBeVisible();
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await expect(row).toContainText("Awaiting an operator");
  await row.getByRole("button", { name: "Open for review", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112$/);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toBeVisible();
});

for (const width of [360, 1440]) for (const colorScheme of ["light", "dark"] as const) for (const enabled of [false, true]) {
  test(`Task15 queue axe ${width} ${colorScheme} agent=${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "queue-axe", audit);
    expect(audit.violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`queue-${width}-${colorScheme}-${enabled}.png`), fullPage: true });
    await page.getByRole("button", { name: "Queue evidence and assumptions" }).focus();
    await expect(page.getByRole("tooltip")).toContainText("plausible assumptions, not established facts");
  });
}
