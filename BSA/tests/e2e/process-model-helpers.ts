import type { Page } from "@playwright/test";
import { expect } from "./fixtures";
import { PROCESS_FIELDS } from "../../src/components/demo/process-fields";
import { MANUAL_LOOP_MONTH_DEFAULTS as PROCESS_MONTH_DEFAULTS, formatProcessHours, formatProcessItems, type ManualLoopMonthInputs as ProcessMonthInputs, type ManualLoopMonthResult as ProcessMonthResult } from "../../src/lib/domain/baseline";
import { calculateManualLoopMonth as calculateProcessMonth } from "../../src/lib/domain/manual-loop-month-model";
import { manualLoopSummary } from "../../src/lib/domain/manual-loop-presentation";

export { PROCESS_FIELDS, PROCESS_MONTH_DEFAULTS, calculateProcessMonth };
export type { ProcessMonthInputs };

export const processMetrics = [
  "referredBackItems", "operatorHours", "gatheringHours", "judgingHours", "doubleCheckHours",
  "itemsGathered", "itemsJudged", "doubleChecks", "pharmacyCompletionHours", "decisionsWithRuleAndReason",
] as const;

export function formatProcessMetric(key: string, value: number) {
  return key.endsWith("Hours") ? formatProcessHours(value) : formatProcessItems(value);
}

export async function expandProcessInputs(page: Page) {
  const detail = page.locator("[data-month-detail]");
  if (await detail.getAttribute("open") === null) await detail.locator(":scope > summary").click();
  await expect(detail.getByRole("group", { name: "Shared referral-loop and process inputs", exact: true })).toBeVisible();
}

export async function fillProcessInputs(page: Page, input: ProcessMonthInputs) {
  for (const { key } of PROCESS_FIELDS) {
    await expandProcessInputs(page);
    await page.locator(`#process-${key}`).fill(String(input[key]));
  }
  await expandProcessInputs(page);
}

export async function expectProcessMetrics(page: Page, input = PROCESS_MONTH_DEFAULTS, enabled = false) {
  const result = calculateProcessMonth(input);
  await expect(page.locator("[data-month-headlines] > section")).toHaveCount(2);
  for (const mode of ["today", "withAgent"] as const) {
    for (const key of processMetrics) {
      const metric = page.locator(`[data-process-metric="${mode}-${key}"]`);
      const text = formatProcessMetric(key, result[mode][key]);
      await expect(metric).toBeVisible();
      await expect(metric).toHaveText(`${text}${mode === "withAgent" ? "estimate" : ""}`);
      await expect(metric.getByRole("img", { name: text, exact: true })).toBeVisible();
    }
    await expect(page.locator(`[data-process-column="${mode}"]`)).toHaveCount(10);
    await expect(page.locator(`[data-process-column="${mode}"][data-active="${mode === (enabled ? "withAgent" : "today")}"]`)).toHaveCount(10);
  }
  await expect(page.locator("[data-baseline-summary]")).toHaveText(
    manualLoopSummary(result),
  );
}

export function sceneMetrics(result: ProcessMonthResult, enabled = true) {
  const column = enabled ? result.withAgent : result.today;
  return [
    ["monthlyItems", result.counts.monthlyItems],
    ["autoPricedItems", result.counts.autoPricedItems],
    ["type1Items", result.counts.type1Items],
    ["type2Items", result.counts.type2Items],
    ["referredBackItems", column.referredBackItems],
    ["operatorHours", column.operatorHours],
  ] as const;
}

export async function expectSceneMetrics(page: Page, input = PROCESS_MONTH_DEFAULTS, enabled = true) {
  await expect(page.locator("[data-scene-metric]")).toHaveCount(6);
  for (const [key, value] of sceneMetrics(calculateProcessMonth(input), enabled)) {
    const metric = page.locator(`[data-scene-metric="${key}"]`);
    const text = formatProcessMetric(key, value);
    await expect(metric).toHaveText(text);
    if (enabled) await expect(metric.getByRole("img", { name: text, exact: true })).toBeVisible();
  }
}

export async function chooseProcessChapter(page: Page, chapter: 1 | 2 | 3 | 4) {
  const label = {
    1: "1. Real process", 2: "2. A month in numbers",
    3: "3. Evidence to a decision", 4: "4. Cases and boundaries",
  }[chapter];
  await page.getByRole("button", { name: "Choose tour chapter", exact: true }).click();
  const item = page.getByRole("menuitem", { name: label, exact: true });
  await item.focus();
  await expect(item).toBeFocused();
  await item.press("Enter");
  await expect(page).toHaveURL(new RegExp(`#${{ 1: "scene", 2: "month", 3: "pipeline", 4: "cases" }[chapter]}$`));
}
