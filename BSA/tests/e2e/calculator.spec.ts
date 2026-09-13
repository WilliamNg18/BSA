import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import type { ProcessMonthDraft } from "../../src/lib/domain/baseline";
import { selectProcessMonth } from "../../src/lib/domain/process-month-model";
import {
  PROCESS_FIELDS, PROCESS_MONTH_DEFAULTS, calculateProcessMonth, chooseProcessChapter,
  expandProcessInputs, expectProcessMetrics, expectSceneMetrics, fillProcessInputs, formatProcessMetric, processMetrics, type ProcessMonthInputs,
} from "./process-model-helpers";

test("two referral headlines keep both comparisons visible and separate operator, pharmacy and Type 2 effort", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await expect(page.locator("main input:visible")).toHaveCount(0);
  await expect(page.locator("[data-month-detail]")).not.toHaveAttribute("open", "");
  await expect(page.locator("[data-month-detail] > summary")).toHaveText("Edit the monthly assumptions");
  await expect(page.locator("[data-month-headlines] > section").nth(0)).toHaveAttribute("aria-label", "Items referred back a month");
  await expect(page.locator("[data-month-headlines] > section").nth(1)).toHaveAttribute("aria-label", "Hours on the referred-back loop");
  await expectProcessMetrics(page);
  await expect(page.getByRole("region", { name: "Type 2 stream hours", exact: true })).toContainText("these hours must not be added together");
  await expect(page.getByRole("region", { name: "Monthly rule change assurance", exact: true })).toContainText("Experience only");
  await expect(page.getByRole("region", { name: "Monthly rule change assurance", exact: true })).toContainText("Clause and version cited on every built-case judgement");
  const context = page.locator('[data-process-metric="today-pharmacyCompletionHours"]').getByRole("button");
  await context.focus();
  await expect(page.getByRole("tooltip")).toContainText("Not NHSBSA operator labour");
  await page.keyboard.press("Escape");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, true);
  await expect(page.getByRole("region", { name: "Rule and reason recorded", exact: true })).toContainText("not a statement that real staff never record rules or reasons");
  await captureCheckpoint(page, testInfo, "whole-process-monthly-comparison");
});

test("every shared process input propagates through calculator, scene and register; reset preserves then restores defaults", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const edited: ProcessMonthInputs = { ...PROCESS_MONTH_DEFAULTS };
  const targets: ProcessMonthInputs = {
    monthlyItems: 200_000_000, epsPercent: 80, type1Percent: 2.3, type2Percent: 2.1,
    staffTouchPercent: 4.1, type2SecondsToday: 14, investigationMinutesToday: 5,
    pharmacyCompletionMinutes: 7, monthlyReferrals: 120_000, pharmacyCatchPercent: 25,
    abstainPercent: 30, builtJudgingSeconds: 50, type1KeySeconds: 35, type1ConfirmSeconds: 12,
  };
  for (const { key, label } of PROCESS_FIELDS) {
    await expandProcessInputs(page);
    edited[key] = targets[key];
    await page.getByRole("textbox", { name: label, exact: true }).fill(String(edited[key]));
    await expectProcessMetrics(page, edited, true);
    await chooseProcessChapter(page, 1);
    await expectSceneMetrics(page, edited);
    await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
  }
  await navigatePrimary(page, "Assumptions");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The assumptions that decide whether an agent is needed");
  await expect(page.locator("[data-legacy-assumptions]")).not.toHaveAttribute("open", "");
  await expandProcessInputs(page);
  for (const { key, label } of PROCESS_FIELDS) await expect(page.getByRole("textbox", { name: label, exact: true })).toHaveValue(String(edited[key]));
  edited.pharmacyCompletionMinutes = 0.2;
  await page.locator("#process-pharmacyCompletionMinutes").fill("0.2");
  await chooseProcessChapter(page, 2);
  await expectProcessMetrics(page, edited, true);
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Keep working", exact: true }).click();
  await expectProcessMetrics(page, edited, true);
  await captureJson(testInfo, "shared-process-inputs", { input: edited, result: calculateProcessMonth(edited) });
  await confirmReset(page);
  await expectProcessMetrics(page);
  await expandProcessInputs(page);
  for (const { key, label } of PROCESS_FIELDS) await expect(page.getByRole("textbox", { name: label, exact: true })).toHaveValue(String(PROCESS_MONTH_DEFAULTS[key]));
});

test("invalid drafts remove stale estimates across routes and recover using the shared selector", async ({ page }) => {
  await page.goto("./#month");
  await expandProcessInputs(page);
  for (const { key, label } of PROCESS_FIELDS) {
    await expandProcessInputs(page);
    const field = page.getByRole("textbox", { name: label, exact: true });
    for (const raw of ["", "-1", "NaN", "Infinity", "1e309", "9".repeat(400)]) {
      const draft = Object.fromEntries(Object.entries(PROCESS_MONTH_DEFAULTS).map(([name, value]) => [name, String(value)])) as ProcessMonthDraft;
      draft[key] = raw;
      expect(selectProcessMonth(draft).result).toBeNull();
      await field.fill(raw);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator(`#process-${key}-error`)).toBeVisible();
      await expect(page.locator("[data-process-metric], [data-month-headlines]")).toHaveCount(0);
      await expect(page.locator("[data-baseline-summary]")).toContainText("unavailable");
    }
    await field.fill(String(PROCESS_MONTH_DEFAULTS[key]));
    await expect(field).toHaveAttribute("aria-invalid", "false");
    await expectProcessMetrics(page);
  }
  await expandProcessInputs(page);
  await page.locator("#process-investigationMinutesToday").fill("");
  await chooseProcessChapter(page, 1);
  await expect(page.locator("[data-scene-estimates]")).toContainText("unavailable");
  await expect(page.locator("[data-scene-metric]")).toHaveCount(0);
  await chooseProcessChapter(page, 3);
  await expect(page.locator("[data-pipeline]")).toContainText("Scenario estimates unavailable");
  await expect(page.locator("[data-pipeline-referrals]")).toHaveCount(0);
  await navigatePrimary(page, "Assumptions");
  await expect(page.locator("#process-investigationMinutesToday")).toHaveValue("");
  await page.locator("#process-investigationMinutesToday").fill("0.1");
  await chooseProcessChapter(page, 2);
  await expectProcessMetrics(page, { ...PROCESS_MONTH_DEFAULTS, investigationMinutesToday: 0.1 });
  await page.reload();
  await expectProcessMetrics(page);
});

test("overlap constraints, referral subset, zero totals and full abstention remain explicit", async ({ page }) => {
  await page.goto("./#month");
  await expandProcessInputs(page);
  for (const share of ["1", "5"]) {
    await page.locator("#process-staffTouchPercent").fill(share);
    await expect(page.locator("#process-staffTouchPercent-error")).toContainText("lanes may overlap");
    await expect(page.locator("[data-month-headlines]")).toHaveCount(0);
  }
  await page.locator("#process-staffTouchPercent").fill("4");
  await expandProcessInputs(page);
  await page.locator("#process-monthlyReferrals").fill("2000001");
  await expect(page.locator("#process-monthlyReferrals-error")).toContainText("cannot exceed the Type 2 cohort");
  const scenarios: ProcessMonthInputs[] = [
    { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 0, monthlyReferrals: 0 },
    { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1, monthlyReferrals: 0 },
    { ...PROCESS_MONTH_DEFAULTS, staffTouchPercent: 4.2 },
    { ...PROCESS_MONTH_DEFAULTS, pharmacyCatchPercent: 100 },
    { ...PROCESS_MONTH_DEFAULTS, pharmacyCatchPercent: 0, abstainPercent: 100 },
  ];
  for (const input of scenarios) {
    await fillProcessInputs(page, input);
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await expectProcessMetrics(page, input, true);
    await chooseProcessChapter(page, 1);
    await expectSceneMetrics(page, input);
    await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
  }
});

for (const { key, label, integer } of PROCESS_FIELDS) {
  test(`exact decimal boundary and underflow validation: ${key}`, async ({ page }) => {
    await page.goto("./#month");
    const input: ProcessMonthInputs = {
      ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1_000_000_000, monthlyReferrals: 0,
      type1Percent: 100, type2Percent: 100, staffTouchPercent: 100,
    };
    await fillProcessInputs(page, input);
    const max = integer ? 1_000_000_000 : key.endsWith("Percent") ? 100 : key.endsWith("Minutes") || key === "investigationMinutesToday" ? 1440 : 86400;
    const field = page.getByRole("textbox", { name: label, exact: true });
    for (const raw of [`${max}.00000000000000001`, `000${max}.${"0".repeat(400)}1`, `0.${"0".repeat(400)}1`]) {
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator(`#process-${key}-error`)).toBeVisible();
      await expect(page.locator("[data-month-headlines]")).toHaveCount(0);
    }
    for (const raw of [String(max), ...(integer ? [] : [`${max}.00000000000000000`])]) {
      await expandProcessInputs(page);
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await expect(field).toHaveAttribute("aria-invalid", "false");
      await expectProcessMetrics(page, { ...input, [key]: max });
    }
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 360, 768, 1024, 1440]) {
    test.describe(`monthly reflow ${colorScheme} ${width}`, () => {
      test.use({ colorScheme, viewport: { width, height: 1000 } });
      test("both comparisons and all expanded valid and invalid inputs pass axe without overflow", async ({ page }, testInfo) => {
        await page.goto("./#month");
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        await expandProcessInputs(page);
        await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, true);
        for (const invalid of [false, true]) {
          if (invalid) for (const { key, label } of PROCESS_FIELDS) {
            await page.getByRole("textbox", { name: label, exact: true }).fill("9".repeat(400));
            await expect(page.locator(`#process-${key}-error`)).toBeVisible();
          }
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          const audit = await new AxeBuilder({ page }).analyze();
          await captureJson(testInfo, `axe-month-invalid-${invalid}`, audit);
          expect(audit.violations).toEqual([]);
        }
        await navigatePrimary(page, "Assumptions");
        await expect(page.locator("[data-legacy-assumptions]")).not.toHaveAttribute("open", "");
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        const audit = await new AxeBuilder({ page }).analyze();
        await captureJson(testInfo, "axe-register-invalid", audit);
        expect(audit.violations).toEqual([]);
        for (const { label } of PROCESS_FIELDS) await expect(page.getByRole("textbox", { name: label, exact: true })).toHaveValue("9".repeat(400));
        await captureCheckpoint(page, testInfo, "process-assumptions-invalid");
        await confirmReset(page);
        await chooseProcessChapter(page, 2);
        await expectProcessMetrics(page);
      });
    });
  }
}

test.describe("monthly comparison replay", () => {
  test.use({ reducedMotion: "no-preference" });
  test("mode flips replay both columns from zero with stable accessible endpoints and live reduced motion", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-09-12T12:00:00Z") });
    await page.goto("./#month");
    await page.clock.pauseAt(new Date("2026-09-12T12:00:10Z"));
    const result = calculateProcessMonth(PROCESS_MONTH_DEFAULTS);
    for (const enabled of [true, false]) {
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await page.clock.runFor(1000);
      for (const mode of ["today", "withAgent"] as const) for (const key of processMetrics) {
        const metric = page.locator(`[data-process-metric="${mode}-${key}"]`);
        const value = result[mode][key];
        const visual = Number((await metric.innerText()).replaceAll(",", ""));
        if (value === 0) expect(visual).toBe(0);
        else {
          expect(visual).toBeGreaterThan(0);
          expect(visual).toBeLessThan(value);
        }
        await expect(metric.getByRole("img", { name: formatProcessMetric(key, value), exact: true })).toBeVisible();
      }
      await page.clock.runFor(1016);
      await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, enabled);
    }
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await page.clock.runFor(500);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, true);
    await confirmReset(page);
    await expectProcessMetrics(page);
  });
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test.describe(`monthly exact endpoints ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    test("input edits interpolate between large and tiny 0.1 and 0.2 hour targets without losing the exact endpoint", async ({ page }) => {
      await page.clock.install({ time: new Date("2026-09-12T12:00:00Z") });
      await page.goto("./#month");
      await page.clock.pauseAt(new Date("2026-09-12T12:00:10Z"));
      await expandProcessInputs(page);
      const input = { ...PROCESS_MONTH_DEFAULTS, monthlyReferrals: 60 };
      await page.locator("#process-monthlyReferrals").fill("60");
      await page.clock.runFor(2016);
      for (const minutes of [1440, 0.1, 1440, 0.2, 1440, 0.1]) {
        const previous = await page.locator('[data-process-metric="today-referralOperatorHours"]').innerText();
        await page.locator("#process-investigationMinutesToday").fill(String(minutes));
        const edited = { ...input, investigationMinutesToday: minutes };
        const target = calculateProcessMonth(edited).today.referralOperatorHours;
        if (reducedMotion === "no-preference") {
          await page.clock.runFor(1000);
          const visual = Number((await page.locator('[data-process-metric="today-referralOperatorHours"]').innerText()).replaceAll(",", ""));
          const from = Number(previous.replaceAll(",", ""));
          expect(visual).toBeGreaterThan(Math.min(from, target));
          expect(visual).toBeLessThan(Math.max(from, target));
          await page.clock.runFor(1016);
        }
        await expectProcessMetrics(page, edited);
      }
    });
  });
}
