import { PROCESS_MONTH_DEFAULTS } from "./baseline";
import type { ProcessMonthDraft, ProcessMonthInputs, ProcessMonthResult, ProcessMonthSelection } from "./baseline";

const integerFields = new Set<keyof ProcessMonthInputs>(["monthlyItems", "monthlyReferrals"]);
const percentFields = new Set<keyof ProcessMonthInputs>(["epsPercent", "type1Percent", "type2Percent", "staffTouchPercent", "pharmacyCatchPercent", "abstainPercent"]);

function maximum(key: keyof ProcessMonthInputs): number {
  return integerFields.has(key) ? 1_000_000_000 : percentFields.has(key) ? 100 : key.endsWith("Minutes") || key === "investigationMinutesToday" ? 1440 : 86400;
}

export function processMonthErrors(input: ProcessMonthInputs): ProcessMonthSelection["errors"] {
  const errors: ProcessMonthSelection["errors"] = {};
  for (const key of Object.keys(PROCESS_MONTH_DEFAULTS) as (keyof ProcessMonthInputs)[]) {
    const value = input[key];
    if (!Number.isFinite(value) || value < 0 || value > maximum(key) || integerFields.has(key) && !Number.isSafeInteger(value)) {
      errors[key] = `Enter ${integerFields.has(key) ? "a whole number" : "a number"} from 0 to ${maximum(key).toLocaleString("en-GB")}.`;
    }
  }
  if (Object.keys(errors).length) return errors;
  const type1 = Math.round(input.monthlyItems * input.type1Percent / 100);
  const type2 = Math.round(input.monthlyItems * input.type2Percent / 100);
  const staff = Math.round(input.monthlyItems * input.staffTouchPercent / 100);
  if (staff < Math.max(type1, type2) || staff > Math.min(input.monthlyItems, type1 + type2)) {
    errors.staffTouchPercent = "Staff-touched items must cover each lane and not exceed their combined count; lanes may overlap.";
  }
  if (input.monthlyReferrals > type2) errors.monthlyReferrals = "Referred-back items cannot exceed the Type 2 cohort.";
  return errors;
}

/** Separate scenario metrics, not additive operator phases or measured savings. */
export function calculateProcessMonth(input: ProcessMonthInputs): ProcessMonthResult {
  if (Object.keys(processMonthErrors(input)).length) throw new RangeError("Invalid process monthly assumptions.");
  const count = (percent: number) => Math.round(input.monthlyItems * percent / 100);
  const epsItems = count(input.epsPercent);
  const type2Items = count(input.type2Percent);
  const staffTouchedItems = count(input.staffTouchPercent);
  const caught = Math.round(input.monthlyReferrals * input.pharmacyCatchPercent / 100);
  const remainingType2 = type2Items - caught;
  const abstained = Math.round(remainingType2 * input.abstainPercent / 100);
  const built = remainingType2 - abstained;
  const remainingReferrals = input.monthlyReferrals - caught;
  return {
    counts: { monthlyItems: input.monthlyItems, epsItems, paperItems: input.monthlyItems - epsItems,
      type1Items: count(input.type1Percent), type2Items, staffTouchedItems, autoPricedItems: input.monthlyItems - staffTouchedItems },
    today: {
      type2OperatorHours: type2Items * input.type2SecondsToday / 3600,
      referralOperatorHours: input.monthlyReferrals * input.investigationMinutesToday / 60,
      pharmacyCompletionHours: input.monthlyReferrals * input.pharmacyCompletionMinutes / 60,
      referredBackItems: input.monthlyReferrals, caughtBeforeSubmission: 0, builtCases: 0, abstainedItems: 0,
      decisionsWithRuleAndReason: 0, monthlyRuleAssurance: "experience_only",
    },
    withAgent: {
      type2OperatorHours: (built * input.builtJudgingSeconds + abstained * input.type2SecondsToday) / 3600,
      referralOperatorHours: remainingReferrals * input.investigationMinutesToday / 60,
      pharmacyCompletionHours: remainingReferrals * input.pharmacyCompletionMinutes / 60,
      referredBackItems: remainingReferrals, caughtBeforeSubmission: caught, builtCases: built, abstainedItems: abstained,
      decisionsWithRuleAndReason: built, monthlyRuleAssurance: "clause_and_version_cited",
    },
    type1: { keySeconds: input.type1KeySeconds, confirmSeconds: input.type1ConfirmSeconds },
  };
}

export function selectProcessMonth(draft: ProcessMonthDraft): ProcessMonthSelection {
  const input = { ...PROCESS_MONTH_DEFAULTS };
  for (const key of Object.keys(input) as (keyof ProcessMonthInputs)[]) {
    const raw = draft[key];
    const text = typeof raw === "string" ? raw.trim() : "";
    const valid = (integerFields.has(key) ? /^\d+$/ : /^(?:\d+(?:\.\d*)?|\.\d+)$/).test(text);
    const [wholeText, fraction = ""] = text.split(".");
    const whole = wholeText.replace(/^0+/, "") || "0";
    const bound = String(maximum(key));
    const exceeds = whole.length > bound.length || whole.length === bound.length &&
      (whole > bound || whole === bound && /[1-9]/.test(fraction));
    const value = Number(text);
    input[key] = valid && !exceeds && !(value === 0 && /[1-9]/.test(text)) ? value : NaN;
  }
  const errors = processMonthErrors(input);
  return Object.keys(errors).length ? { input: null, result: null, errors } : { input, result: calculateProcessMonth(input), errors };
}
