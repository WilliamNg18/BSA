import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { MONTH_FIELDS, MONTH_MODEL_DEFAULTS, monthModel, formatBaselineNumber, type MonthModelResult } from "../../src/lib/domain/baseline";

const defaults = monthModel(MONTH_MODEL_DEFAULTS);
function estimates(result: MonthModelResult, enabled = true) {
  return [
    ["volume", result.volume, 0],
    ["hours", enabled ? result.withAgent.operatorHours : result.today.operatorHours, 1],
    ["capacity", enabled ? result.capacity.withAgent : result.capacity.today, 1],
  ] as const;
}

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

async function expectFinal(page: Page, result = defaults, enabled = true) {
  for (const [key, value, digits] of estimates(result, enabled)) {
    const number = page.locator(`[data-scene-${key}]`);
    const text = formatBaselineNumber(value, digits);
    await expect(number).toHaveText(text);
    if (enabled) await expect(number.getByRole("img", { name: text, exact: true })).toBeVisible();
  }
}

test.describe("scene estimate count-in with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Agent On visibly interpolates all derived estimates then reaches exact final UK values", async ({ page }, testInfo) => {
    await freezeScene(page);
    await expectFinal(page, defaults, false);
    const facts = page.getByRole("list", { name: "Public context figures" });
    const beforeFacts = await facts.textContent();
    const sources = page.locator('footer[aria-label="Sources"]');
    const beforeSources = await sources.textContent();
    await toggle(page);
    await page.clock.runFor(1000);
    for (const [key, value, digits] of estimates(defaults)) {
      const number = page.locator(`[data-scene-${key}]`);
      const intermediate = Number((await number.innerText()).replaceAll(",", ""));
      expect(intermediate, key).toBeGreaterThan(0);
      expect(intermediate, key).toBeLessThan(value);
      const finalText = formatBaselineNumber(value, digits);
      await expect(number.getByRole("img", { name: finalText, exact: true })).toBeVisible();
      expect(await number.ariaSnapshot()).toBe(`- definition:\n  - img "${finalText}"`);
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
    await expectFinal(page, defaults, false);
    await toggle(page);
    await page.clock.runFor(500);
    const value = Number((await page.locator("[data-scene-volume]").innerText()).replaceAll(",", ""));
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(defaults.volume / 2);
    await toggle(page);
    await expectFinal(page, defaults, false);
    await page.clock.runFor(3000);
    await expectFinal(page, defaults, false);
  });

  test("Reset during count-in cancels animation and restores healthy immediate Off", async ({ page }) => {
    await freezeScene(page);
    await toggle(page);
    await page.clock.runFor(500);
    await confirmReset(page);
    await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
    await expectFinal(page, defaults, false);
    await page.clock.runFor(3000);
    await expectFinal(page, defaults, false);
  });

  test("navigation cancels detached frames and edited shared inputs replace the old target", async ({ page }) => {
    await freezeScene(page);
    await toggle(page);
    await page.clock.runFor(500);
    const oldNumber = await page.locator("[data-scene-volume] > span > span").elementHandle();
    expect(oldNumber).not.toBeNull();
    const oldText = await oldNumber!.textContent();
    await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
    await expect(page.locator("[data-scene-estimates]")).toHaveCount(0);
    await page.getByLabel(MONTH_FIELDS[0].label, { exact: true }).fill("120");
    await page.clock.runFor(3000);
    expect(await oldNumber!.textContent()).toBe(oldText);
    await navigatePrimary(page, "Overview");
    await page.clock.runFor(1000);
    const intermediate = Number(await page.locator("[data-scene-volume]").innerText());
    expect(intermediate).toBeGreaterThan(0);
    expect(intermediate).toBeLessThan(120);
    await page.clock.runFor(1016);
    await expectFinal(page, monthModel({ ...MONTH_MODEL_DEFAULTS, volume: 120 }));
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
  test.use({ reducedMotion: "reduce", viewport: { width: 360, height: 900 } });

  test("On is immediately exact without clock progress, including zero and billion-item inputs", async ({ page }, testInfo) => {
    await freezeScene(page);
    await toggle(page);
    await expectFinal(page);
    for (const volume of [0, 1, 1_000_000_000]) {
      await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
      await page.getByLabel(MONTH_FIELDS[0].label, { exact: true }).fill(String(volume));
      // The scene link is the first chapter; avoid introducing navigation ownership.
      await page.getByRole("navigation", { name: "Guided tour" }).getByRole("button", { name: "Back", exact: true }).click();
      await expectFinal(page, monthModel({ ...MONTH_MODEL_DEFAULTS, volume }));
    }
    await page.clock.resume();
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(testInfo, "scene-count-in-reduced-axe", audit);
    expect(audit.violations).toEqual([]);
  });
});
