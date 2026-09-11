import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { BASELINE_DEFAULTS, calculateBaseline, formatBaselineNumber as n } from "../../src/lib/domain/baseline";
import { projectQueueDay } from "../../src/lib/domain/queue-model";

const comparison = (page: Page) => page.getByRole("region", { name: "Today versus With agent", exact: true });
const compare = (page: Page) => page.getByRole("button", { name: "Compare", exact: true });

async function queueSnapshot(page: Page) {
  return {
    pinned: await page.getByRole("region", { name: "Exception queue table", exact: true }).innerText(),
    lifecycle: await page.getByRole("region", { name: "Shared session queue", exact: true }).innerText(),
    clock: await page.getByLabel("Shared day clock", { exact: true }).innerText(),
    position: await page.locator("[data-queue-counter]").innerText(),
    sweep: await page.locator("[data-sweep-status]").innerText(),
    counts: await page.locator("[data-sweep-counts]").innerText(),
    summaries: await page.locator("[data-day-summary]").allTextContents(),
    agent: await page.getByRole("banner").getByRole("switch").isChecked(),
  };
}

for (const enabled of [false, true]) {
  test(`Compare keyboard open close focus and no queue or decision writes, Agent ${enabled}`, async ({ page }) => {
    await page.goto("./#month");
    const input = { ...BASELINE_DEFAULTS, volume: 1234, builtReviewMinutes: 0.75, judgingMinutes: 3 };
    await page.getByLabel("Monthly volume proxy", { exact: true }).fill(String(input.volume));
    await page.getByLabel("Built case review minutes / item", { exact: true }).fill(String(input.builtReviewMinutes));
    await page.getByLabel("Judging minutes / item", { exact: true }).fill(String(input.judgingMinutes));
    await navigatePrimary(page, "Exception queue");
    await page.getByRole("switch", { name: "Queue assistance: Off", exact: true }).setChecked(enabled);
    await page.getByRole("button", { name: "Step 15 minutes", exact: true }).click();
    const month = page.getByRole("region", { name: "Virtual month", exact: true });
    await month.getByRole("button", { name: "Last item", exact: true }).click();
    if (enabled) {
      await month.getByRole("button", { name: "Run visible month sweep", exact: true }).click();
      await month.getByRole("button", { name: "Step month sweep", exact: true }).click();
    }
    const before = await queueSnapshot(page);
    await expect(compare(page)).toHaveAttribute("aria-expanded", "false");
    await compare(page).focus(); await page.keyboard.press("Enter");
    await expect(compare(page)).toHaveAttribute("aria-expanded", "true");
    const region = comparison(page);
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { name: "Today versus With agent", exact: true })).toBeFocused();
    await expect(region).toHaveAttribute("id", await compare(page).getAttribute("aria-controls") as string);
    await expect(region).toContainText("Same scenario at 08:15");
    const result = calculateBaseline(input), day = projectQueueDay(input, 15);
    await expect(region).toContainText("1,234 items; pinned examples add no volume.");
    await expect(region).toContainText(`With agent: ${n(result.built)} built + ${n(result.abstained)} abstained.`);
    for (const [label, today, assisted] of [
      ["Projected operator actions", day.today.processed, day.assisted.processed],
      ["Gathering minutes", day.today.gathering, day.assisted.gathering],
      ["Judging minutes", day.today.judging, day.assisted.judging],
    ] as const) {
      const row = region.getByRole("row").filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
      await expect(row.getByRole("cell")).toHaveText([n(today), n(assisted)]);
    }
    await expect(region).toContainText("no additional savings");
    await expect(region.getByRole("button")).toHaveText(["Close comparison"]);
    expect(await queueSnapshot(page)).toEqual(before);
    await page.keyboard.press("Tab");
    await expect(region.getByRole("button", { name: "Close comparison", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(region).toHaveCount(0); await expect(compare(page)).toBeFocused();
    await page.keyboard.press("Space");
    await expect(region).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(region).toHaveCount(0); await expect(compare(page)).toBeFocused();
    expect(await queueSnapshot(page)).toEqual(before);
  });
}

test("Compare follows the running shared clock without starting pausing or restarting the day", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("queue");
  await page.clock.install({ time: new Date("2026-09-11T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-11T12:00:10Z"));
  await page.getByRole("button", { name: "Play day", exact: true }).click();
  await page.clock.runFor(500);
  await compare(page).click();
  await expect(comparison(page)).toContainText("Same scenario at 08:30");
  await expect(page.getByRole("button", { name: "Pause day", exact: true })).toBeEnabled();
  await page.clock.runFor(250);
  await expect(comparison(page)).toContainText("Same scenario at 08:45");
  await comparison(page).getByRole("button", { name: "Close comparison", exact: true }).click();
  await page.clock.runFor(250);
  await expect(page.getByLabel("Shared day clock", { exact: true })).toHaveText("09:00");
  await page.getByRole("button", { name: "Jump to 17:00", exact: true }).click();
  await compare(page).click();
  await expect(comparison(page)).toContainText("Same scenario at 17:00");
  const day = projectQueueDay(BASELINE_DEFAULTS, 540);
  await expect(comparison(page).getByRole("row").filter({ has: page.getByRole("rowheader", { name: "Projected operator actions", exact: true }) }).getByRole("cell")).toHaveText([n(day.today.processed), n(day.assisted.processed)]);
  await expect(page.locator('[data-day-summary="today"] dd').first()).toHaveText(n(day.today.processed));
  await expect(page.locator('[data-day-summary="assisted"] dd').first()).toHaveText(n(day.assisted.processed));
});

test("Compare Reset closes the surface and invalid assumptions disable stale comparisons", async ({ page }) => {
  await page.goto("queue");
  await page.getByRole("switch", { name: "Queue assistance: Off", exact: true }).click();
  await page.getByRole("button", { name: "Jump to 17:00", exact: true }).click();
  await compare(page).click();
  await confirmReset(page);
  await expect(comparison(page)).toHaveCount(0);
  await expect(compare(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("switch", { name: "Queue assistance: Off", exact: true })).not.toBeChecked();
  await compare(page).click();
  await expect(comparison(page)).toContainText("Same scenario at 08:00");
  await navigatePrimary(page, "Overview");
  await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
  await page.getByLabel("Monthly volume proxy", { exact: true }).fill("");
  await navigatePrimary(page, "Exception queue");
  await expect(compare(page)).toBeDisabled();
  await expect(comparison(page)).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: "Invalid calculator assumptions" })).toBeVisible();
});

for (const { width, colorScheme, enabled } of [
  { width: 360, colorScheme: "dark", enabled: false },
  { width: 360, colorScheme: "light", enabled: true },
  { width: 1440, colorScheme: "light", enabled: false },
  { width: 1440, colorScheme: "dark", enabled: true },
] as const) {
  test(`Compare reduced-motion keyboard and zero-violation axe ${width} ${colorScheme} Agent ${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.getByRole("button", { name: "Jump to 17:00", exact: true }).click();
    await compare(page).focus(); await page.keyboard.press("Enter");
    const region = comparison(page);
    await expect(region.getByRole("heading")).toBeFocused();
    await expect(region).toContainText("Same scenario at 17:00");
    expect(await region.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "queue-compare-axe", audit);
    expect(audit.violations).toEqual([]);
    await region.screenshot({ path: info.outputPath(`queue-compare-${width}-${colorScheme}-${enabled}.png`) });
    await page.keyboard.press("Tab");
    await expect(region.getByRole("button", { name: "Close comparison", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(compare(page)).toBeFocused();
  });
}
