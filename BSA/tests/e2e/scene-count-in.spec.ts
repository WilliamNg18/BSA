import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import {
  PROCESS_MONTH_DEFAULTS, calculateProcessMonth, expectSceneMetrics,
  fillProcessInputs, formatProcessMetric, sceneMetrics, chooseProcessChapter,
} from "./process-model-helpers";

const defaults = calculateProcessMonth(PROCESS_MONTH_DEFAULTS);

async function freezeScene(page: Page) {
  await page.clock.install({ time: new Date("2026-09-11T12:00:00Z") });
  await page.goto("./#scene");
  await page.clock.pauseAt(new Date("2026-09-11T12:00:10Z"));
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
}

async function toggle(page: Page) {
  const control = page.getByRole("banner").getByRole("switch");
  await control.focus();
  await control.press("Space");
}

const expectFinal = expectSceneMetrics;

test.describe("scene estimate count-in with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Agent On visibly interpolates all derived estimates then reaches exact final UK values", async ({ page }, testInfo) => {
    await freezeScene(page);
    await expectFinal(page, PROCESS_MONTH_DEFAULTS, false);
    const facts = page.getByRole("list", { name: "Public context figures" });
    const beforeFacts = await facts.textContent();
    const sources = page.locator('footer[aria-label="Sources"]');
    const beforeSources = await sources.textContent();
    await toggle(page);
    await page.clock.runFor(1000);
    await expect(page.locator("[data-scene-metric]")).toHaveCount(6);
    for (const [key, value] of sceneMetrics(defaults)) {
      const number = page.locator(`[data-scene-metric="${key}"]`);
      const intermediate = Number((await number.innerText()).replaceAll(",", ""));
      expect(intermediate, key).toBeGreaterThan(0);
      expect(intermediate, key).toBeLessThan(value);
      const finalText = formatProcessMetric(key, value);
      await expect(number.getByRole("img", { name: finalText, exact: true })).toBeVisible();
      expect(await number.getByRole("img").ariaSnapshot()).toBe(`- img "${finalText}"`);
      expect(await number.evaluate((element) => element.closest("[aria-live], [role=status], [role=alert]"))).toBeNull();
    }
    await expect(facts).toHaveText(beforeFacts!);
    await expect(sources).toHaveCount(1);
    await expect(sources).toHaveText(beforeSources!);
    await page.clock.runFor(1016);
    await expectFinal(page);
    await page.clock.resume();
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(testInfo, "scene-count-in-axe", audit);
    expect(audit.violations).toEqual([]);
  });

  test("Off cancels mid-count immediately and a rapid On restarts cleanly", async ({ page }) => {
    await freezeScene(page);
    await toggle(page);
    await page.clock.runFor(500);
    await toggle(page);
    await expectFinal(page, PROCESS_MONTH_DEFAULTS, false);
    await toggle(page);
    await page.clock.runFor(500);
    const value = Number((await page.locator('[data-scene-metric="monthlyItems"]').innerText()).replaceAll(",", ""));
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(defaults.counts.monthlyItems / 2);
    await toggle(page);
    await expectFinal(page, PROCESS_MONTH_DEFAULTS, false);
    await page.clock.runFor(3000);
    await expectFinal(page, PROCESS_MONTH_DEFAULTS, false);
  });

  test("Reset during count-in cancels animation and restores healthy immediate Off", async ({ page }) => {
    await freezeScene(page);
    await toggle(page);
    await page.clock.runFor(500);
    await confirmReset(page);
    await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
    await expectFinal(page, PROCESS_MONTH_DEFAULTS, false);
    await page.clock.runFor(3000);
    await expectFinal(page, PROCESS_MONTH_DEFAULTS, false);
  });

  test("navigation cancels detached frames and edited shared inputs replace the old target", async ({ page }) => {
    await freezeScene(page);
    await toggle(page);
    await page.clock.runFor(500);
    const oldNumber = await page.locator('[data-scene-metric="monthlyItems"] [aria-hidden="true"]').elementHandle();
    expect(oldNumber).not.toBeNull();
    const oldText = await oldNumber!.textContent();
    await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
    await expect(page.locator("[data-scene-estimates]")).toHaveCount(0);
    const input = { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 120, manualLoopItems: 2 };
    await fillProcessInputs(page, input);
    await page.clock.runFor(3000);
    expect(await oldNumber!.textContent()).toBe(oldText);
    await navigatePrimary(page, "Overview");
    await page.clock.runFor(1000);
    const intermediate = Number(await page.locator('[data-scene-metric="monthlyItems"]').innerText());
    expect(intermediate).toBeGreaterThan(0);
    expect(intermediate).toBeLessThan(120);
    await page.clock.runFor(1016);
    await expectFinal(page, input);
    expect(await oldNumber!.textContent()).toBe(oldText);
    await oldNumber!.dispose();
  });

  test("live reduced motion settles a running count immediately and never resumes it", async ({ page }) => {
    await freezeScene(page);
    await toggle(page);
    await page.clock.runFor(500);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectFinal(page);
    await page.clock.runFor(3000);
    await expectFinal(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.runFor(1000);
    await expectFinal(page);
  });
});

test.describe("scene estimate reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });

  test("On is immediately exact without clock progress, including zero and billion-item inputs", async ({ page }, testInfo) => {
    await freezeScene(page);
    await toggle(page);
    await expectFinal(page);
    for (const monthlyItems of [0, 1, 1_000_000_000]) {
      await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
      const input = { ...PROCESS_MONTH_DEFAULTS, monthlyItems, manualLoopItems: 0 };
      await fillProcessInputs(page, input);
      await chooseProcessChapter(page, 1);
      await expectFinal(page, input);
    }
    await page.clock.resume();
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(testInfo, "scene-count-in-reduced-axe", audit);
    expect(audit.violations).toEqual([]);
  });
});
