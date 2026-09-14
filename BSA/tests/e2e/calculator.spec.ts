import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import type { ManualLoopMonthDraft } from "../../src/lib/domain/baseline";
import { createManualLoopDraft, manualLoopInputMaximum, selectManualLoopMonth } from "../../src/lib/domain/manual-loop-month-model";
import {
  PROCESS_FIELDS, PROCESS_MONTH_DEFAULTS, calculateProcessMonth, chooseProcessChapter,
  expandProcessInputs, expectProcessMetrics, expectSceneMetrics, fillProcessInputs, formatProcessMetric, processMetrics, type ProcessMonthInputs,
} from "./process-model-helpers";

test("two referral headlines separate total operator, gathering, judgement and pharmacy effort", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await expect(page.locator("main input:visible")).toHaveCount(0);
  await expect(page.locator("[data-month-detail]")).not.toHaveAttribute("open", "");
  await expect(page.locator("[data-month-detail] > summary")).toHaveText("Edit the monthly assumptions");
  await expect(page.locator("[data-month-headlines] > section").nth(0)).toHaveAttribute("aria-label", "Items referred back a month");
  await expect(page.locator("[data-month-headlines] > section").nth(1)).toHaveAttribute("aria-label", "Operator hours a month");
  await expectProcessMetrics(page);
  await expect(page.getByText("Assumptions: built cases need no human gathering. With total includes abstention gathering and judgement for every queued item, without double-checks.", { exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic comparison: Today experience only; With rule and reason recorded is assumed for all queue decisions, including documented abstention.", { exact: true })).toBeVisible();
  await expect(page.locator('[data-process-metric="withAgent-operatorHours"]')).toHaveText("297.5estimate");
  await expect(page.locator('[data-process-metric="withAgent-gatheringHours"]')).toHaveText("42.5estimate");
  await expect(page.locator('[data-process-metric="withAgent-judgingHours"]')).toHaveText("255estimate");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, true);
  await expect(page.getByText("This is not a claim about real staff or historical records. A documented abstention does not invent a retrieved rule.", { exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, "whole-process-monthly-comparison");
});

test("every shared process input propagates through calculator, scene and register; reset preserves then restores defaults", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const edited: ProcessMonthInputs = { ...PROCESS_MONTH_DEFAULTS };
  const targets: ProcessMonthInputs = {
    monthlyItems: 200_000_000, epsPercent: 80, type1Percent: 2.3, type2Percent: 2.1,
    staffTouchPercent: 4.1, gatheringMinutesToday: 5, judgingMinutesToday: 4, doubleCheckPercent: 30,
    mysCompletionMinutes: 7, manualLoopItems: 120_000, preventionPercent: 25,
    clearancePercent: 60, abstentionPercent: 30, builtJudgingMinutes: 2, type1KeySeconds: 35, type1ConfirmSeconds: 12,
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
  edited.mysCompletionMinutes = 0.2;
  await page.locator("#process-mysCompletionMinutes").fill("0.2");
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
      const draft: ManualLoopMonthDraft = createManualLoopDraft();
      draft[key] = raw;
      expect(selectManualLoopMonth(draft).result).toBeNull();
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
  await page.locator("#process-gatheringMinutesToday").fill("");
  await chooseProcessChapter(page, 1);
  await expect(page.locator("[data-scene-estimates]")).toContainText("unavailable");
  await expect(page.locator("[data-scene-metric]")).toHaveCount(0);
  await chooseProcessChapter(page, 3);
  await expect(page.locator("[data-pipeline]")).toContainText("Scenario estimates unavailable");
  await expect(page.locator("[data-pipeline-referrals]")).toHaveCount(0);
  await navigatePrimary(page, "Assumptions");
  await expect(page.locator("#process-gatheringMinutesToday")).toHaveValue("");
  await page.locator("#process-gatheringMinutesToday").fill("0.1");
  await chooseProcessChapter(page, 2);
  await expectProcessMetrics(page, { ...PROCESS_MONTH_DEFAULTS, gatheringMinutesToday: 0.1 });
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
  await page.locator("#process-manualLoopItems").fill("2000001");
  await expect(page.locator("#process-manualLoopItems-error")).toContainText("cannot exceed the Type 2 cohort");
  const scenarios: ProcessMonthInputs[] = [
    { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 0, manualLoopItems: 0 },
    { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1, manualLoopItems: 0 },
    { ...PROCESS_MONTH_DEFAULTS, staffTouchPercent: 4.2 },
    { ...PROCESS_MONTH_DEFAULTS, preventionPercent: 100 },
    { ...PROCESS_MONTH_DEFAULTS, preventionPercent: 0, abstentionPercent: 100 },
    { ...PROCESS_MONTH_DEFAULTS, clearancePercent: 100 },
    { ...PROCESS_MONTH_DEFAULTS, preventionPercent: 0, clearancePercent: 0, abstentionPercent: 0 },
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

for (const { key, label } of PROCESS_FIELDS) {
  test(`exact decimal boundary and underflow validation: ${key}`, async ({ page }) => {
    await page.goto("./#month");
    const input: ProcessMonthInputs = {
      ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1_000_000_000, manualLoopItems: 0,
      type1Percent: 100, type2Percent: 100, staffTouchPercent: 100,
    };
    await fillProcessInputs(page, input);
    const integer = key === "monthlyItems" || key === "manualLoopItems";
    const max = manualLoopInputMaximum(key);
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
  for (const width of [1280, 1440]) {
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
  for (const enabled of [true, false]) test(`mode ${enabled ? "On" : "Off"} replays both columns from zero with stable accessible endpoints and live reduced motion`, async ({ page }) => {
    await page.clock.install({ time: new Date("2026-09-12T12:00:00Z") });
    await page.goto("./#month");
    await page.clock.pauseAt(new Date("2026-09-12T12:00:10Z"));
    await page.getByRole("banner").getByRole("switch").setChecked(!enabled);
    await page.clock.fastForward(2016);
    const result = calculateProcessMonth(PROCESS_MONTH_DEFAULTS);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.clock.runFor(1000);
    for (const mode of ["today", "withAgent"] as const) for (const key of processMetrics) {
      const metric = page.locator(`[data-process-metric="${mode}-${key}"]`);
      const value = result[mode][key];
      const visual = Number((await metric.getByRole("img").innerText()).replaceAll(",", ""));
      if (value === 0) expect(visual).toBe(0);
      else {
        expect(visual).toBeGreaterThan(0);
        expect(visual).toBeLessThan(value);
      }
      await expect(metric.getByRole("img", { name: formatProcessMetric(key, value), exact: true })).toBeVisible();
    }
    await page.clock.runFor(1016);
    await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, enabled);
    await page.getByRole("banner").getByRole("switch").setChecked(!enabled);
    await page.clock.runFor(500);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, !enabled);
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
      const input = { ...PROCESS_MONTH_DEFAULTS, manualLoopItems: 60 };
      await page.locator("#process-manualLoopItems").fill("60");
      await page.clock.runFor(2016);
      for (const minutes of [1440, 0.1, 1440, 0.2, 1440, 0.1]) {
        const previous = await page.locator('[data-process-metric="today-gatheringHours"]').innerText();
        await page.locator("#process-gatheringMinutesToday").fill(String(minutes));
        const edited = { ...input, gatheringMinutesToday: minutes };
        const target = calculateProcessMonth(edited).today.gatheringHours;
        if (reducedMotion === "no-preference") {
          await page.clock.runFor(1000);
          const visual = Number((await page.locator('[data-process-metric="today-gatheringHours"]').innerText()).replaceAll(",", ""));
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
