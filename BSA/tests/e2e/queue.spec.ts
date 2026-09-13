import AxeBuilder from "@axe-core/playwright";
import { automaticCaseIds, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { formatBaselineNumber as n } from "../../src/lib/domain/baseline";
import { QUEUE_SEEDS } from "../../src/lib/domain/queue-model";

const staffSeeds = QUEUE_SEEDS.filter((seed) => !automaticCaseIds.includes(seed.id) && seed.state !== "cleared_by_rules");
const total = staffSeeds.length;

for (const volume of [0, 5, 1_000_000_000]) {
  test(`Task19 shared volume ${volume} cannot fabricate operator rows or queue automatic items`, async ({ page }) => {
    await page.goto("./#month");
    await page.locator("#baseline-volume").fill(String(volume));
    await navigatePrimary(page, "Exception queue");
    const table = page.getByRole("region", { name: "Exception queue table", exact: true });
    await expect(table.locator("tbody tr")).toHaveCount(total);
    await expect(page.locator("[data-queue-counter]")).toHaveText(`showing 1 to ${n(total)} of ${n(total)} this month`);
    await expect(table.locator("[data-month-row]")).toHaveCount(0);
    for (const id of [...automaticCaseIds, "EX-24098"]) await expect(table.locator(`[data-queue-seed="${id}"]`)).toHaveCount(0);
    for (const seed of staffSeeds) await expect(table.locator(`[data-queue-seed="${seed.id}"]`)).toBeVisible();
    await expect(page.getByText("Actual synthetic staff items only. Monthly projections are not operator rows.", { exact: true })).toBeVisible();
  });
}

test("Task15 invalid shared assumptions keep evidence readable and do not display stale estimates", async ({ page }) => {
  await page.goto("./#month");
  await page.locator("#baseline-volume").fill("");
  await navigatePrimary(page, "Exception queue");
  await expect(page.getByRole("alert").filter({ hasText: "Invalid calculator assumptions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toBeDisabled();
  await expect(page.locator("[data-queue-seed]")).toHaveCount(total);
  await expect(page.locator("[data-month-row]")).toHaveCount(0);
  await expect(page.locator("[data-queue-month-summary]")).toHaveCount(0);
});

test("Task15 exact guides, one bounded six-column table, counted filters and same seeds in both modes", async ({ page }) => {
  await page.goto("queue");
  const table = page.getByRole("region", { name: "Exception queue table", exact: true });
  await expect(table.locator("thead th")).toHaveCount(6);
  await expect(table.locator("tbody tr")).toHaveCount(total);
  await expect(page.locator("[data-queue-counter]")).toHaveText(`showing 1 to ${n(total)} of ${n(total)} this month`);
  expect(await table.evaluate((el) => el.clientHeight)).toBe(510);
  const off = "Today: a list of items that failed a rule. The operator sees a reference and a reason, then gathers everything else by hand.";
  const on = "With the agent: the same list. Each item arrives with its case built, its rule cited and a recommendation; the operator only decides.";
  await expect(page.locator("[data-queue-guide]")).toHaveText(off);
  const ids = await table.locator("tbody th").allTextContents();
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-queue-guide]")).toHaveText(on);
  await expect(table.locator("tbody th")).toHaveText(ids);
  await expect(table.locator("[data-queue-seed]")).toHaveCount(total);
  for (const [i, seed] of staffSeeds.entries()) await expect(table.locator("tbody tr").nth(i)).toContainText(seed.id);
  for (const label of ["Case built ready to decide", "Needs more evidence", "Abstained worked as today", "Cleared by rules no model call", "Decided"]) {
    const tile = page.getByRole("button", { name: new RegExp(label) }).first();
    const count = Number((await tile.locator("span").first().innerText()).replaceAll(",", ""));
    await tile.click();
    await expect(tile).toHaveAttribute("aria-pressed", "true");
    await expect(table.locator("tbody tr")).toHaveCount(count);
    await expect(page.locator("[data-queue-counter]")).toContainText(`of ${n(count)} this month`);
  }
  await page.getByRole("button", { name: /All items/ }).click();
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  for (const label of ["Awaiting an operator", "In progress", "Decided"]) await expect(page.getByRole("button", { name: new RegExp(label) }).first()).toBeVisible();
  await expect(table.locator('[data-queue-seed="EX-24123"]')).toContainText("nothing yet, operator to gather");
  await expect(table.locator('[data-queue-seed="EX-24123"]')).toContainText("Known abstention; manual work");
  for (const id of automaticCaseIds) await expect(table.locator(`[data-queue-seed="${id}"]`)).toHaveCount(0);
  await expect(table.locator('[data-queue-seed="EX-24088"]')).toContainText("Human record unchanged");
});

test("Task19 window controls operate only on actual staff rows and reject invented ranges", async ({ page }) => {
  await page.goto("queue");
  const table = page.getByRole("region", { name: "Exception queue table", exact: true });
  const counter = page.locator("[data-queue-counter]");
  await expect(page.getByRole("button", { name: "Next 50", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Last items", exact: true })).toBeDisabled();
  await expect(table.locator("tbody tr")).toHaveCount(total);
  await page.getByLabel("Jump to item", { exact: true }).fill(String(total));
  await page.getByRole("button", { name: "Jump", exact: true }).click();
  await expect(counter).toHaveText(`showing ${n(total)} to ${n(total)} of ${n(total)} this month`);
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table.locator("[data-month-row]")).toHaveCount(0);
  await page.getByRole("button", { name: "First items", exact: true }).click();
  await table.focus(); await page.keyboard.press("PageDown");
  await expect(counter).toHaveText(`showing ${n(total)} to ${n(total)} of ${n(total)} this month`);
  await page.getByLabel("Jump to item", { exact: true }).fill("1000000001");
  await expect(page.getByRole("button", { name: "Jump", exact: true })).toBeDisabled();
  await confirmReset(page);
  await expect(counter).toHaveText(`showing 1 to ${n(total)} of ${n(total)} this month`);
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

test("Task15 revised unreadable B reviewed Off abstains On without changing history or stored state", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("textbox", { name: "Endorsement entered by the pharmacy", exact: true }).fill("unreadable endorsement");
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("link", { name: "Open shared queue", exact: true }).click();
  await page.locator('[data-shared-case="EX-24112"]').getByRole("button", { name: "Open for review", exact: true }).click();
  const history = page.getByRole("region", { name: "Shared case history", exact: true });
  await history.locator("summary").first().click();
  const before = await history.getByRole("list", { name: "Lifecycle events", exact: true }).innerText();
  const attempts = await history.getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).innerText();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  const row = page.locator('[data-shared-case="EX-24112"]');
  await expect(row.locator("[data-recorded-state]")).toHaveAttribute("data-recorded-state", "operator_review_required");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(row.locator("[data-queue-state]")).toHaveText("Abstained worked as today");
  await expect(row).toContainText("Abstained: no recommendation. Operator gathers evidence.");
  await expect(row.locator('[aria-label="Agent work phases"]')).toHaveCount(0);
  await expect(row.locator("[data-recorded-state]")).toHaveAttribute("data-recorded-state", "operator_review_required");
  await page.getByRole("button", { name: /Case built ready to decide/ }).first().click();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: /Abstained worked as today/ }).first().click();
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: "Open", exact: true }).click();
  // Compare history in the same presentation mode; audience labels change On.
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await history.locator("summary").first().click();
  await expect(history.getByRole("list", { name: "Lifecycle events", exact: true })).toHaveText(before, { useInnerText: true });
  await expect(history.getByRole("list", { name: "Immutable pharmacy attempts", exact: true })).toHaveText(attempts, { useInnerText: true });
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
    await page.mouse.move(0, 0);
    const help = page.getByRole("button", { name: "Queue evidence and assumptions" });
    await help.scrollIntoViewIfNeeded();
    await help.focus();
    await expect(help).toBeFocused();
    await expect(page.getByRole("tooltip").filter({ hasText: "plausible assumptions, not established facts" })).toBeVisible();
  });
}
