import AxeBuilder from "@axe-core/playwright";
import { captureJson, confirmReset, expect, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

test("Task15 one hour plays sixty synthetic minutes in ten seconds and stops, without changing the queue", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("queue");
  await page.clock.install({ time: new Date("2026-09-12T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-12T12:00:10Z"));
  const table = page.getByRole("region", { name: "Exception queue table", exact: true });
  const before = await table.innerText();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "Run one hour", exact: true }).click();
  await page.clock.runFor(5000);
  await expect(page.locator("[data-comparison-clock]")).toHaveText("30 synthetic minutes · Running");
  await expect(page.getByRole("region", { name: "Today comparison", exact: true })).toContainText("Operator gathering evidence");
  await page.clock.runFor(4999);
  await expect(page.locator("[data-comparison-clock]")).toHaveText("57 synthetic minutes · Running");
  await page.clock.runFor(1);
  await expect(page.locator("[data-comparison-clock]")).toHaveText("60 synthetic minutes · Stopped");
  await page.clock.runFor(5000);
  await expect(page.locator("[data-comparison-clock]")).toHaveText("60 synthetic minutes · Stopped");
  const today = page.locator('[data-comparison-summary="today"] dd');
  const assisted = page.locator('[data-comparison-summary="assisted"] dd');
  expect(Number(await assisted.nth(1).innerText())).toBeGreaterThan(Number(await today.nth(1).innerText()));
  await expect(today.nth(2)).toHaveText("2");
  await expect(assisted.nth(2)).toHaveText("2");
  await expect(page.locator("[data-compare-seed]")).toHaveCount(24);
  await expect(page.getByRole("region", { name: "Today comparison", exact: true })).toContainText("Operator gathering evidence");
  await page.getByRole("button", { name: "Close comparison", exact: true }).click();
  expect(await table.innerText()).toBe(before);
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toBeFocused();
});

test("Task15 reduced motion jumps immediately, end of day and reset remain read-only", async ({ page }) => {
  await page.goto("case/EX-24112");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await startDemonstrationReview(page);
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "Run one hour", exact: true }).click();
  await expect(page.locator("[data-comparison-clock]")).toHaveText("60 synthetic minutes · Stopped");
  for (const side of ["Today comparison", "With agent comparison"]) {
    const region = page.getByRole("region", { name: side, exact: true });
    await expect(region.locator('[data-compare-seed="EX-24112"]')).toContainText("Historical record unchanged");
    await expect(region.locator('[data-compare-seed="EX-24123"]')).toContainText("Manual fallback; never case-ready");
    await expect(region.locator('[data-compare-seed="EX-24101"]')).toContainText("Cleared by rules; no model call");
  }
  await page.getByRole("button", { name: "Run to end of day", exact: true }).click();
  await expect(page.locator("[data-comparison-clock]")).toHaveText("360 synthetic minutes · Stopped");
  await page.keyboard.press("Escape");
  await page.locator('[data-shared-case="EX-24112"]').getByRole("link", { name: "Open", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Record DR-000874", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await confirmReset(page);
  await expect(page.getByRole("region", { name: "Today versus With agent", exact: true })).toHaveCount(0);
});

for (const width of [360, 1440]) for (const enabled of [false, true]) {
  test(`Task15 Compare keyboard and axe ${width} agent=${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: enabled ? "dark" : "light", reducedMotion: "reduce" });
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const button = page.getByRole("button", { name: "Compare", exact: true });
    await button.focus(); await page.keyboard.press("Enter");
    const region = page.getByRole("region", { name: "Today versus With agent", exact: true });
    await expect(region.getByRole("heading", { name: "Today versus With agent", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Run one hour", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-comparison-clock]")).toHaveText("60 synthetic minutes · Stopped");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "queue-compare-axe", audit);
    expect(audit.violations).toEqual([]);
    await region.screenshot({ path: info.outputPath(`queue-compare-${width}-${enabled}.png`) });
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
  });
}
