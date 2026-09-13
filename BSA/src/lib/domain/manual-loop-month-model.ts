import { MANUAL_LOOP_MONTH_DEFAULTS } from "./baseline";
import type { ManualLoopMonthDraft, ManualLoopMonthInputs, ManualLoopMonthResult, ManualLoopMonthSelection } from "./baseline";

const integerFields = new Set<keyof ManualLoopMonthInputs>(["monthlyItems", "manualLoopItems"]);
const keys = () => Object.keys(MANUAL_LOOP_MONTH_DEFAULTS) as (keyof ManualLoopMonthInputs)[];

export function manualLoopInputMaximum(key: keyof ManualLoopMonthInputs): number {
  return integerFields.has(key) ? 1_000_000_000 : key.endsWith("Percent") ? 100 : key.endsWith("Seconds") ? 86_400 : 1_440;
}

export function createManualLoopDraft(): ManualLoopMonthDraft {
  return Object.fromEntries(keys().map((key) => [key, String(MANUAL_LOOP_MONTH_DEFAULTS[key])])) as ManualLoopMonthDraft;
}

export function manualLoopMonthErrors(input: ManualLoopMonthInputs): ManualLoopMonthSelection["errors"] {
  const errors: ManualLoopMonthSelection["errors"] = {};
  for (const key of keys()) {
    const value = input[key];
    if (!Number.isFinite(value) || value < 0 || value > manualLoopInputMaximum(key) || integerFields.has(key) && !Number.isSafeInteger(value)) {
      errors[key] = `Enter ${integerFields.has(key) ? "a whole number" : "a number"} from 0 to ${manualLoopInputMaximum(key).toLocaleString("en-GB")}.`;
    }
  }
  if (Object.keys(errors).length) return errors;
  const count = (percent: number) => Math.round(input.monthlyItems * percent / 100);
  const type1 = count(input.type1Percent);
  const type2 = count(input.type2Percent);
  const staff = count(input.staffTouchPercent);
  if (staff < Math.max(type1, type2) || staff > Math.min(input.monthlyItems, type1 + type2)) {
    errors.staffTouchPercent = "Staff-touched items must cover each lane and not exceed their combined count; lanes may overlap.";
  }
  if (input.manualLoopItems > type2) errors.manualLoopItems = "The referral-loop subset cannot exceed the Type 2 cohort.";
  return errors;
}

/** Round each departing cohort once; subtraction conserves every parent cohort. */
export function calculateManualLoopMonth(input: ManualLoopMonthInputs): ManualLoopMonthResult {
  if (Object.keys(manualLoopMonthErrors(input)).length) throw new RangeError("Invalid manual-loop monthly assumptions.");
  const count = (percent: number) => Math.round(input.monthlyItems * percent / 100);
  const share = (items: number, percent: number) => Math.round(items * percent / 100);
  const total = input.manualLoopItems;
  const prevented = share(total, input.preventionPercent);
  const afterPrevention = total - prevented;
  const clearedBeforeQueue = share(afterPrevention, input.clearancePercent);
  const queued = afterPrevention - clearedBeforeQueue;
  const abstained = share(queued, input.abstentionPercent);
  const built = queued - abstained;
  const doubleChecks = share(total, input.doubleCheckPercent);
  const gatheringHours = total * input.gatheringMinutesToday / 60;
  const judgingHours = total * input.judgingMinutesToday / 60;
  const doubleCheckHours = doubleChecks * input.judgingMinutesToday / 60;
  const assistedGathering = abstained * input.gatheringMinutesToday / 60;
  const assistedJudging = queued * input.builtJudgingMinutes / 60;
  const todayHours = gatheringHours + judgingHours + doubleCheckHours;
  const assistedHours = assistedGathering + assistedJudging;
  const ratio = assistedHours === 0 ? null : todayHours / assistedHours;
  const epsItems = count(input.epsPercent);
  const staffTouchedItems = count(input.staffTouchPercent);
  return {
    counts: { monthlyItems: input.monthlyItems, epsItems, paperItems: input.monthlyItems - epsItems,
      type1Items: count(input.type1Percent), type2Items: count(input.type2Percent), staffTouchedItems,
      autoPricedItems: input.monthlyItems - staffTouchedItems },
    cohorts: { manualLoopItems: total, prevented, afterPrevention, clearedBeforeQueue, queued, abstained, built },
    today: { itemsGathered: total, itemsJudged: total + doubleChecks, doubleChecks, referredBackItems: total,
      gatheringHours, judgingHours, doubleCheckHours, operatorHours: todayHours,
      pharmacyCompletionHours: total * input.mysCompletionMinutes / 60, decisionsWithRuleAndReason: 0 },
    withAgent: { itemsGathered: abstained, itemsJudged: queued, doubleChecks: 0, referredBackItems: queued,
      gatheringHours: assistedGathering, judgingHours: assistedJudging, doubleCheckHours: 0, operatorHours: assistedHours,
      pharmacyCompletionHours: queued * input.mysCompletionMinutes / 60, decisionsWithRuleAndReason: queued },
    operatorHoursRatio: ratio !== null && Number.isFinite(ratio) ? ratio : null,
    type1: { keySeconds: input.type1KeySeconds, confirmSeconds: input.type1ConfirmSeconds },
  };
}

/** Check decimal text before conversion so rounding cannot admit out-of-bound drafts. */
export function selectManualLoopMonth(draft: ManualLoopMonthDraft): ManualLoopMonthSelection {
  const input = { ...MANUAL_LOOP_MONTH_DEFAULTS };
  for (const key of keys()) {
    const text = typeof draft[key] === "string" ? draft[key].trim() : "";
    const valid = (integerFields.has(key) ? /^\d+$/ : /^(?:\d+(?:\.\d*)?|\.\d+)$/).test(text);
    const [wholeText, fraction = ""] = text.split(".");
    const whole = wholeText.replace(/^0+/, "") || "0";
    const bound = String(manualLoopInputMaximum(key));
    const exceeds = whole.length > bound.length || whole.length === bound.length &&
      (whole > bound || whole === bound && /[1-9]/.test(fraction));
    const value = Number(text);
    input[key] = valid && !exceeds && !(value === 0 && /[1-9]/.test(text)) ? value : NaN;
  }
  const errors = manualLoopMonthErrors(input);
  return Object.keys(errors).length ? { input: null, result: null, errors } : { input, result: calculateManualLoopMonth(input), errors };
}
