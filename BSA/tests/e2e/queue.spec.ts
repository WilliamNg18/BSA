import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";
import { BASELINE_DEFAULTS, calculateBaseline, formatBaselineNumber as n } from "../../src/lib/domain/baseline";
import { QUEUE_ROW_HEIGHT, QUEUE_SEGMENT_SIZE, QUEUE_SEEDS, QUEUE_WINDOW_LIMIT, projectQueueDay } from "../../src/lib/domain/queue-model";

const pinned = (page: Page) => page.getByRole("region", { name: "Exception queue table", exact: true });
const month = (page: Page) => page.getByRole("region", { name: "Virtual month", exact: true });
async function setVolume(page: Page, value: string) {
  await navigatePrimary(page, "Overview");
  await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
  await page.getByLabel("Items reaching the exception queue each month", { exact: true }).fill(value);
  await navigatePrimary(page, "Exception queue");
}

for (const volume of [0, 1, 5, 11, 12, 13, 85_000, 1_000_000_000]) {
  test(`Task5 virtual month volume=${volume} is exact and bounded`, async ({ page }) => {
    await page.goto("queue");
    await setVolume(page, String(volume));
    const rows = pinned(page).locator("tbody > tr");
    await expect(rows).toHaveCount(12);
    for (const [i, seed] of QUEUE_SEEDS.entries()) await expect(rows.nth(i)).toContainText(seed.id);
    const area = month(page), result = calculateBaseline({ ...BASELINE_DEFAULTS, volume });
    const field = (label: string) => area.locator("dl > div").filter({ has: page.locator("dt", { hasText: new RegExp(`^${label} · projection$`) }) }).locator("dd");
    for (const [label, value] of [["Volume", volume], ["Pharmacy-caught", result.pharmacyCaught], ["Code-cleared", result.cleared], ["Abstained", result.abstained], ["Cases built", result.built], ["Awaiting human", result.built + result.abstained]] as const) await expect(field(label)).toHaveText(n(value));
    if (volume < 12) {
      await expect(page.getByRole("status").filter({ hasText: `${12 - volume} examples outside projection` })).toBeVisible();
      await expect(rows.filter({ hasText: "Example outside projection" })).toHaveCount(12 - volume);
    }
    await expect(area.locator("[data-queue-counter]")).toHaveText(`${volume ? 1 : 0} of ${n(volume)} items`);
    expect(await area.locator("[data-month-index]").count()).toBeLessThanOrEqual(QUEUE_WINDOW_LIMIT);
    if (volume) {
      await area.getByRole("button", { name: "Last item", exact: true }).click();
      await expect(area.locator("[data-queue-counter]")).toHaveText(`${n(volume)} of ${n(volume)} items`);
      await expect(area.locator(`[data-month-index="${volume - 1}"]`)).toBeVisible();
      expect(Number(await area.locator("[data-segment-height]").getAttribute("data-segment-height"))).toBeLessThanOrEqual(QUEUE_SEGMENT_SIZE * QUEUE_ROW_HEIGHT);
      expect(await area.locator("[data-month-index]").count()).toBeLessThanOrEqual(QUEUE_WINDOW_LIMIT);
    } else {
      await expect(area.getByRole("button", { name: "Last item", exact: true })).toBeDisabled();
      await expect(area.locator("[data-month-index]")).toHaveCount(0);
    }
  });
}

test("Task5 native scroll, keyboard, segment and direct jumps follow logical position", async ({ page }) => {
  await page.goto("queue"); await setVolume(page, "1000000000");
  const area = month(page), scroll = area.getByRole("region", { name: "Month scroll window", exact: true }), counter = area.locator("[data-queue-counter]");
  await scroll.evaluate((el) => { el.scrollTop = 112 * 123; });
  await expect(counter).toHaveText("124 of 1,000,000,000 items");
  await scroll.focus(); await scroll.press("End");
  await expect(counter).toHaveText("1,000,000,000 of 1,000,000,000 items");
  await scroll.press("Home"); await expect(counter).toHaveText("1 of 1,000,000,000 items");
  await area.getByRole("button", { name: "Next segment", exact: true }).click();
  await expect(counter).toHaveText("1,001 of 1,000,000,000 items");
  await area.getByRole("button", { name: "Previous segment", exact: true }).click();
  await expect(counter).toHaveText("1 of 1,000,000,000 items");
  await area.getByLabel("Jump to item", { exact: true }).fill("500000001");
  await area.getByLabel("Jump to item", { exact: true }).press("Enter");
  await expect(counter).toHaveText("500,000,001 of 1,000,000,000 items");
  await area.getByLabel("Jump to item", { exact: true }).fill("1000000001");
  await expect(area.getByRole("button", { name: "Jump to item", exact: true })).toBeDisabled();
  expect(await area.locator("[data-month-index]").count()).toBeLessThanOrEqual(10);
});

test("Task5 pinned Off work has seven keyboard markers and canonical/filler destinations", async ({ page }) => {
  await page.goto("queue");
  const rows = pinned(page).locator("tbody > tr");
  for (let i = 0; i < 12; i++) {
    const row = rows.nth(i);
    await row.locator("summary").first().click();
    await expect(row.locator('[data-pain-marker="open"]')).toHaveCount(7);
    await expect(row.locator("[data-pain-marker]")).toHaveCount(7);
    await row.locator("summary").first().click();
  }
  await rows.first().locator("summary").first().click();
  const marker = rows.first().locator("[data-pain-marker]").first();
  await marker.focus(); await expect(marker).toBeFocused();
  await expect(page.getByRole("tooltip", { name: "Find the form · 0.5 min", exact: true })).toBeVisible();
  await rows.nth(6).getByRole("button", { name: "Today", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Today · EX-24104", exact: true });
  await expect(dialog).toBeVisible(); await expect(dialog.locator("[data-pain-marker]")).toHaveCount(7);
  await expect(dialog).toContainText("No retrieved rule, citation or agent result");
  await page.keyboard.press("Escape");
  await expect(rows.nth(6).getByRole("button", { name: "Today", exact: true })).toBeFocused();
  await rows.nth(1).getByRole("link", { name: "Case pack", exact: true }).click();
  await expect(page).toHaveURL(/case\/EX-24112$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Operator case pack: Missing or insufficient information");
});

test("Task5 generated Today is generic, citation-free and closes without writes", async ({ page }) => {
  await page.goto("queue");
  const area = month(page); await area.getByRole("button", { name: "Last item", exact: true }).click();
  await area.locator('[data-month-index="84999"]').getByRole("button", { name: "Today", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("SYN-Q-0000085000");
  await expect(dialog).not.toContainText(/Part II|Clause 9|2026-08|validated provision/i);
  await expect(dialog.getByRole("button", { name: /^(Record decision|Continue with submission|Submit|Refer back)$/i })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(area.locator("[data-queue-counter]")).toHaveText("85,000 of 85,000 items");
});

test("Task5 visible-only sweep phases, Off cancellation and canonical states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("queue");
  const states = await pinned(page).locator("tbody > tr td:nth-child(6)").allTextContents();
  await page.getByRole("switch", { name: "Queue assistance: Off", exact: true }).click();
  await expect(page.getByRole("banner").getByRole("switch")).toBeChecked();
  const area = month(page); await area.getByRole("button", { name: "Last item", exact: true }).click();
  await area.getByRole("button", { name: "Run visible month sweep", exact: true }).scrollIntoViewIfNeeded();
  await area.getByRole("button", { name: "Run visible month sweep", exact: true }).click();
  await expect(page.locator("[data-sweep-status]")).toContainText("Plan");
  const swept = area.locator('[data-month-index]').filter({ hasText: "Plan · projection only" });
  expect(await swept.count()).toBeGreaterThan(0);
  expect(await swept.count()).toBeLessThanOrEqual(4);
  for (const phase of ["Gather", "Retrieve", "Reconcile", "Assess", "Hand off"]) {
    await area.getByRole("button", { name: "Step month sweep", exact: true }).click();
    await expect(page.locator("[data-sweep-status]")).toContainText(phase);
  }
  await expect(pinned(page).locator("tbody > tr td:nth-child(6)")).toHaveText(states);
  await expect(pinned(page).locator('[data-queue-seed="EX-24123"] td:nth-child(4)')).toHaveText("Abstained: no recommendation");
  await expect(pinned(page).locator('[data-queue-seed="EX-24101"] td:nth-child(3)')).toHaveText("Pre-checks only");
  await area.getByRole("button", { name: "Run visible month sweep", exact: true }).click();
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await expect(page.locator("[data-sweep-status]")).toHaveText("No sweep");
  await expect(pinned(page).locator("tbody > tr td:nth-child(4)")).toHaveText(Array(12).fill("No recommendation"));
  await expect(pinned(page).locator("tbody > tr td:nth-child(6)")).toHaveText(states);
});

test("Task5 normal-motion sweep is two seconds and Off cancels pending callbacks", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("queue");
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("button", { name: "Run agent on visible rows", exact: true }).click();
  await expect(page.locator("[data-sweep-status]")).toContainText("Plan");
  await page.clock.runFor(1999); await expect(page.locator("[data-sweep-status]")).toContainText("Assess");
  await page.clock.runFor(1); await expect(page.locator("[data-sweep-status]")).toContainText("Hand off");
  await page.getByRole("button", { name: "Run agent on visible rows", exact: true }).click();
  await page.clock.runFor(400);
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await page.clock.runFor(5000); await expect(page.locator("[data-sweep-status]")).toHaveText("No sweep");
});

test("Task5 pinned sweep keeps D manual and E code-only with no recorded-state writes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("queue"); await page.getByRole("banner").getByRole("switch").setChecked(true);
  const rows = pinned(page), d = rows.locator('[data-queue-seed="EX-24123"]'), e = rows.locator('[data-queue-seed="EX-24101"]');
  const states = await rows.locator("tbody > tr td:nth-child(6)").allTextContents();
  await d.locator("summary").first().click();
  await d.getByRole("button", { name: "Sweep visible rows", exact: true }).click();
  for (let i = 0; i < 5; i++) await d.getByRole("button", { name: "Step visible sweep", exact: true }).click();
  await expect(d).toContainText("Hand off · Manual fallback; never ready");
  await expect(d.locator('[data-pain-marker="open"]')).toHaveCount(7);
  await e.getByRole("button", { name: "Sweep visible rows", exact: true }).click();
  for (let i = 0; i < 5; i++) await e.getByRole("button", { name: "Step visible sweep", exact: true }).click();
  await expect(e).toContainText("Hand off · Code only; no agent");
  await expect(e.locator("td:nth-child(3)")).toHaveText("Pre-checks only");
  await expect(rows.locator("tbody > tr td:nth-child(6)")).toHaveText(states);
});

test("Task5 shared day clock pauses, steps, changes motion and never overwrites a human record", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("case/EX-24112"); await page.getByRole("banner").getByRole("switch").setChecked(true);
  await startDemonstrationReview(page);
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  const clock = page.getByLabel("Shared day clock", { exact: true });
  await page.getByRole("button", { name: "Play day", exact: true }).click();
  await page.clock.runFor(500); await expect(clock).toHaveText("08:30");
  await page.getByRole("button", { name: "Pause day", exact: true }).click();
  await page.clock.runFor(1000); await expect(clock).toHaveText("08:30");
  await page.getByRole("button", { name: "Step 15 minutes", exact: true }).click(); await expect(clock).toHaveText("08:45");
  await page.getByRole("button", { name: "Play day", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Play day", exact: true })).toBeDisabled();
  await page.clock.runFor(1000); await expect(clock).toHaveText("08:45");
  await page.getByRole("button", { name: "Jump to 17:00", exact: true }).focus();
  await page.keyboard.press("Enter"); await expect(clock).toHaveText("17:00");
  for (const label of ["Today twelve examples", "Assisted twelve examples"]) {
    const rows = page.getByRole("list", { name: label, exact: true }).locator("li"); await expect(rows).toHaveCount(12);
    await expect(rows.nth(1)).toContainText("Historical record unchanged");
    await expect(rows.nth(3)).toContainText("Manual fallback; never case-ready");
    await expect(rows.nth(4)).toContainText("Existing code; no agent");
  }
  const expected = projectQueueDay(BASELINE_DEFAULTS, 540);
  await expect(page.locator('[data-day-summary="today"] dd').first()).toHaveText(String(expected.today.processed));
  await expect(page.locator('[data-day-summary="assisted"] dd').first()).toHaveText(String(expected.assisted.processed));
  await pinned(page).locator('[data-queue-seed="EX-24112"]').getByRole("link", { name: "Case pack", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views", exact: true }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Record DR-000874", exact: true })).toHaveCount(0);
});

test("Task5 regeneration, invalid inputs and cross-route Reset clear all queue presentation memory", async ({ page }) => {
  await page.goto("queue");
  await page.getByRole("button", { name: "Jump to 17:00", exact: true }).click();
  await month(page).getByRole("button", { name: "Last item", exact: true }).click();
  await setVolume(page, "5");
  await expect(page.getByLabel("Shared day clock", { exact: true })).toHaveText("08:00");
  await expect(month(page).locator("[data-queue-counter]")).toHaveText("1 of 5 items");
  await expect(page.locator("[data-sweep-status]")).toHaveText("No sweep");
  await setVolume(page, "");
  await expect(page.getByRole("alert").filter({ hasText: "Invalid calculator assumptions" })).toBeVisible();
  await expect(month(page)).toHaveCount(0); await expect(pinned(page).locator("tbody > tr")).toHaveCount(12);
  await navigatePrimary(page, "Pharmacy check"); await confirmReset(page); await navigatePrimary(page, "Exception queue");
  await expect(page.getByLabel("Shared day clock", { exact: true })).toHaveText("08:00");
  await expect(month(page).locator("[data-queue-counter]")).toHaveText("1 of 85,000 items");
  await expect(page.getByRole("switch", { name: "Queue assistance: Off", exact: true })).not.toBeChecked();
});

for (const width of [360, 1440]) for (const colorScheme of ["light", "dark"] as const) for (const enabled of [false, true]) {
  test(`Task5 responsive axe and summary ${width} ${colorScheme} On=${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("queue"); await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect(pinned(page).locator("tbody > tr")).toHaveCount(12);
    await page.getByRole("button", { name: "Jump to 17:00", exact: true }).click();
    const columns = await page.locator("[data-day-columns]").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(width >= 1280 ? 2 : 1);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).analyze(); await captureJson(info, "task5-axe", audit); expect(audit.violations).toEqual([]);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`queue-${width}-${colorScheme}-${enabled ? "on" : "off"}.png`), fullPage: true });
  });
}