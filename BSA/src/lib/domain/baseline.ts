/** Pure scenario arithmetic. No case mutations, decisions, pricing or measured savings. */
import { BASELINE_PROVENANCE as provenance } from "./baseline-defaults";
import { PUBLIC_FACTS } from "./public-facts";
import { calculateProcessMonth } from "./process-month-model";

export interface BaselineInputs {
  volume: number;
  findFormMinutes: number;
  readEndorsementMinutes: number;
  productPackMinutes: number;
  claimRecordsMinutes: number;
  tariffVersionClauseMinutes: number;
  compareSourcesMinutes: number;
  recordReasonMinutes: number;
  builtReviewMinutes: number;
  judgingMinutes: number;
  precheckPercent: number;
  clearedPercent: number;
  abstainPercent: number;
  deficientBuiltPercent: number;
  deficientAbstainPercent: number;
  assemblySeconds: number;
}

export type BaselineField = Exclude<keyof BaselineInputs, "assemblySeconds">;
export type BaselineDraft = Record<BaselineField, string>;

export const BASELINE_LIMITS = { volume: 1_000_000_000, minutes: 1440, percent: 100, assemblySeconds: 3600 } as const;
/** Pharmacy-only illustrative durations; excluded from all calculator arithmetic. */
export const PHARMACY_ASSUMPTION_DEFAULTS = Object.freeze({
  monthEndDays: 14,
  exceptionDays: 3,
  referBackDays: 7,
  correctionDays: 5,
  paymentCycleDays: 14,
});
export type PharmacyAssumptions = { [K in keyof typeof PHARMACY_ASSUMPTION_DEFAULTS]: number };
export const PHARMACY_ASSUMPTION_FIELDS = [
  { key: "monthEndDays", label: "Month end days" },
  { key: "exceptionDays", label: "Exception days" },
  { key: "referBackDays", label: "Refer back days" },
  { key: "correctionDays", label: "Correction days" },
  { key: "paymentCycleDays", label: "Payment cycle days" },
] as const;
export function validPharmacyDays(value: string): number | null {
  return /^\d{1,3}$/.test(value) && Number(value) <= 365 ? Number(value) : null;
}
// Reuse locale setup for field hints and rendered values, not scenario results.
const numberFormats: Intl.NumberFormat[] = [];
export const formatBaselineNumber = (value: number, maximumFractionDigits = 4) =>
  (numberFormats[maximumFractionDigits] ??= new Intl.NumberFormat("en-GB", { maximumFractionDigits })).format(value);
export const formatProcessHours = (value: number): string => formatBaselineNumber(value, 1);
export const formatProcessItems = (value: number): string => formatBaselineNumber(value, 0);

// All numeric scenario defaults live here. The companion module derives only
// fixture provenance; neither module imports the private research register.
export const BASELINE_VOLUME_REFERENCE = Object.freeze({ monthly: PUBLIC_FACTS.monthlyReferrals, annual: PUBLIC_FACTS.annualReferrals, monthsPerYear: 12 });
export const BASELINE_DEFAULTS: Readonly<BaselineInputs> = Object.freeze({
  volume: BASELINE_VOLUME_REFERENCE.monthly,
  findFormMinutes: 0.5,
  readEndorsementMinutes: 0.75,
  productPackMinutes: 0.5,
  claimRecordsMinutes: 0.5,
  tariffVersionClauseMinutes: 1,
  compareSourcesMinutes: 0.75,
  recordReasonMinutes: 1,
  builtReviewMinutes: 1,
  judgingMinutes: 2,
  precheckPercent: provenance.pharmacy.numerator / provenance.pharmacy.denominator * 100,
  clearedPercent: provenance.cleared.numerator / provenance.cleared.denominator * 100,
  abstainPercent: provenance.abstain.numerator / provenance.abstain.denominator * 100,
  deficientBuiltPercent: 25,
  deficientAbstainPercent: 50,
  assemblySeconds: provenance.assembly.totalSeconds / provenance.assembly.denominator,
});

export const GATHERING_STEPS = [
  { key: "findFormMinutes", label: "Find form minutes / item" },
  { key: "readEndorsementMinutes", label: "Read endorsement minutes / item" },
  { key: "productPackMinutes", label: "Product and pack minutes / item" },
  { key: "claimRecordsMinutes", label: "Claim records minutes / item" },
  { key: "tariffVersionClauseMinutes", label: "Tariff version and clause minutes / item" },
  { key: "compareSourcesMinutes", label: "Compare sources minutes / item" },
  { key: "recordReasonMinutes", label: "Record reason minutes / item" },
] as const satisfies readonly { key: keyof BaselineInputs; label: string }[];

export function manualGatheringMinutes(input: BaselineInputs): number {
  return GATHERING_STEPS.reduce((sum, { key }) => sum + input[key], 0);
}

export const BASELINE_FIELDS = ([
  { key: "volume", label: "Monthly volume proxy", max: BASELINE_LIMITS.volume, integer: true, hint: "Items · Whole number" },
  ...GATHERING_STEPS.map((step) => ({ ...step, max: BASELINE_LIMITS.minutes, integer: false, hint: "Synthetic assumption · Minutes" })),
  { key: "builtReviewMinutes", label: "Built case review minutes / item", max: BASELINE_LIMITS.minutes, integer: false, hint: "Synthetic assumption · Evidence review, separate from judging" },
  { key: "judgingMinutes", label: "Judging minutes / item", max: BASELINE_LIMITS.minutes, integer: false, hint: "Synthetic assumption · Same reference cohort on both sides" },
  { key: "precheckPercent", label: "Pharmacy pre-check %", max: BASELINE_LIMITS.percent, integer: false, hint: "Share of incoming volume" },
  { key: "clearedPercent", label: "Rule-cleared %", max: BASELINE_LIMITS.percent, integer: false, hint: "Share remaining after pharmacy pre-check" },
  { key: "abstainPercent", label: "Abstention %", max: BASELINE_LIMITS.percent, integer: false, hint: "Share of the uncleared remainder" },
  { key: "deficientBuiltPercent", label: "Deficient built share %", max: BASELINE_LIMITS.percent, integer: false, hint: "Synthetic assumption · Share of built items referred back" },
  { key: "deficientAbstainPercent", label: "Deficient abstained share %", max: BASELINE_LIMITS.percent, integer: false, hint: "Synthetic assumption · Share of abstained items referred back" },
] as const satisfies readonly { key: BaselineField; label: string; max: number; integer: boolean; hint: string }[]).map((field) => ({
  ...field, hint: `${field.hint} · 0 to ${formatBaselineNumber(field.max)}`,
}));

export function baselineErrors(input: BaselineInputs): Partial<Record<keyof BaselineInputs, string>> {
  const errors: Partial<Record<keyof BaselineInputs, string>> = {};
  for (const field of [...BASELINE_FIELDS, { key: "assemblySeconds", max: BASELINE_LIMITS.assemblySeconds, integer: false }] as const) {
    const value = input[field.key];
    if (!Number.isFinite(value) || value < 0 || value > field.max || (field.integer && !Number.isSafeInteger(value))) {
      errors[field.key] = `Enter ${field.integer ? "a whole number" : "a number"} from 0 to ${field.max.toLocaleString("en-GB")}.`;
    }
  }
  return errors;
}

export function parseBaselineDraft(draft: BaselineDraft, assemblySeconds: number) {
  const input = { ...BASELINE_DEFAULTS, assemblySeconds };
  // Plain decimals only: blank strings never become zero; no exponent/hex coercion.
  for (const { key, integer, max } of BASELINE_FIELDS) {
    const text = draft[key].trim();
    const syntax = integer ? /^\d+$/ : /^(?:\d+(?:\.\d*)?|\.\d+)$/;
    // All field maxima are safe integers. Compare decimal digits before Number
    // can round a value just above the bound down to it. No clamping or draft edits.
    const [wholeText, fraction = ""] = text.split(".");
    const whole = wholeText.replace(/^0+/, "") || "0";
    const limit = String(max);
    const exceedsMax = whole.length > limit.length || (whole.length === limit.length
      && (whole > limit || (whole === limit && /[1-9]/.test(fraction))));
    input[key] = syntax.test(text) && !exceedsMax ? Number(text) : NaN;
  }
  const errors = baselineErrors(input);
  return { input: Object.keys(errors).length ? null : input, errors };
}

export function baselineDraft(input: BaselineInputs): BaselineDraft {
  return Object.fromEntries(BASELINE_FIELDS.map(({ key }) => [key, String(input[key])])) as BaselineDraft;
}

export interface BaselineResult {
  volume: number;
  manualGatheringMinutes: number;
  pharmacyCaught: number;
  cleared: number;
  abstained: number;
  built: number;
  today: { gatheringMinutes: number; judgingMinutes: number; operatorHours: number };
  withAgent: { gatheringMinutes: number; judgingMinutes: number; operatorHours: number };
  builtBeforeDecisionMinutes: number;
  abstainBeforeDecisionMinutes: number;
  assemblySeconds: number;
  referrals: { today: number; withAgent: number; built: number; abstained: number };
  referralRiskResidual: number;
  referralFreeProxyPercent: number | null;
}

export function calculateBaseline(input: BaselineInputs): BaselineResult {
  if (Object.keys(baselineErrors(input)).length) throw new RangeError("Invalid baseline assumptions");
  const { volume, judgingMinutes: j, builtReviewMinutes: review, assemblySeconds } = input;
  const g = manualGatheringMinutes(input);
  // Each rounded cohort is removed before calculating the next denominator.
  const pharmacyCaught = Math.round(volume * (input.precheckPercent / 100));
  const remaining = volume - pharmacyCaught;
  const cleared = Math.round(remaining * (input.clearedPercent / 100));
  const uncleared = remaining - cleared;
  const abstained = Math.round(uncleared * (input.abstainPercent / 100));
  const built = uncleared - abstained;
  const todayGathering = volume * g;
  const todayJudging = volume * j;
  const withGathering = abstained * g + built * review;
  // Fixed reference cohort, not a claim of avoided judgement or net savings.
  const withJudging = todayJudging;
  const builtReferrals = Math.round(built * (input.deficientBuiltPercent / 100));
  const abstainReferrals = Math.round(abstained * (input.deficientAbstainPercent / 100));
  const referrals = builtReferrals + abstainReferrals;
  // Uncertainty is not correctness: retain ALL abstentions in the risk proxy.
  // Deficient abstentions are already included, so never count them twice.
  const referralRiskResidual = abstained + builtReferrals;
  if (![pharmacyCaught, cleared, abstained, built, builtReferrals, abstainReferrals, referrals]
    .every((count) => Number.isSafeInteger(count) && count >= 0 && count <= volume)
    || builtReferrals > built || abstainReferrals > abstained || referrals > built + abstained
    || pharmacyCaught + cleared + abstained + built !== volume
    || ![todayGathering, todayJudging, withGathering, todayGathering + todayJudging, withGathering + withJudging]
      .every((minutes) => Number.isFinite(minutes) && minutes <= Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Baseline arithmetic overflow");
  }
  return {
    volume, manualGatheringMinutes: g, pharmacyCaught, cleared, abstained, built,
    today: { gatheringMinutes: todayGathering, judgingMinutes: todayJudging, operatorHours: (todayGathering + todayJudging) / 60 },
    withAgent: { gatheringMinutes: withGathering, judgingMinutes: withJudging, operatorHours: (withGathering + withJudging) / 60 },
    builtBeforeDecisionMinutes: review + j + assemblySeconds / 60,
    abstainBeforeDecisionMinutes: g + j,
    assemblySeconds,
    referrals: { today: volume, withAgent: referrals, built: builtReferrals, abstained: abstainReferrals },
    referralRiskResidual,
    // Zero residual does not establish perfect endorsement correctness.
    referralFreeProxyPercent: volume === 0 || referralRiskResidual === 0 ? null : (volume - referralRiskResidual) / volume * 100,
  };
}

/** Round down, not to nearest: a positive residual must never display 100%. */
export function referralFreeProxyDisplay(result: BaselineResult): string {
  return result.referralFreeProxyPercent === null ? "Not established" : `${formatBaselineNumber(Math.floor(result.referralFreeProxyPercent * 10) / 10, 1)}%`;
}

export function baselineSummary(result: BaselineResult, enabled: boolean): string {
  const n = (value: number) => formatBaselineNumber(value, 1);
  if (!enabled) return `Synthetic scenario: ${n(result.volume)} items; ${n(result.today.operatorHours)} reference hours. Assisted estimates hidden. No measured savings.`;
  return `Synthetic scenario: ${n(result.pharmacyCaught)} pharmacy-caught, ${n(result.cleared)} cleared, ${n(result.abstained)} abstained, ${n(result.built)} built; ${n(result.referrals.withAgent)} referrals. Judging unchanged. Not measured savings or decisions.`;
}

/** Shared construction for calculator and chapter 1; invalid drafts fail closed. */
export function selectBaselineScenario(draft: BaselineDraft) {
  const parsed = parseBaselineDraft(draft, BASELINE_DEFAULTS.assemblySeconds);
  return { ...parsed, result: parsed.input ? calculateBaseline(parsed.input) : null };
}

/** Generate editable default labels from the same inputs used by the model. */
export function baselineDefaultCopy(defaults: Readonly<BaselineInputs>) {
  const n = formatBaselineNumber;
  const reference = BASELINE_VOLUME_REFERENCE;
  return {
    volumeNote: `Volume default: ${n(defaults.volume)} items/month. Approximate referral-subset scale proxy, not total exceptions. Rates are synthetic assumptions, not measured effectiveness.`,
    volumeContext: `${n(reference.annual)} annual referrals / ${n(reference.monthsPerYear)} = approximately ${n(reference.annual / reference.monthsPerYear, 2)} monthly, not exactly ${n(reference.monthly)}. Approximate figures; total operator volume unknown.`,
    manualAssumptions: `Gathering ${n(manualGatheringMinutes(defaults))}, built review ${n(defaults.builtReviewMinutes)}, judging ${n(defaults.judgingMinutes)} minutes: editable synthetic assumptions, not measurements.`,
  };
}

/** Task 14 assumptions, not measured handling times or a staffing forecast. */
export const MONTH_TIME_ASSUMPTIONS = Object.freeze({
  todayMinutes: 12,
  judgingMinutes: 2,
  workingMinutes: 6 * 60 * 21,
});
export const MONTH_TODAY_RANGE = Object.freeze({ min: 10, max: 15 });
export const MONTH_FIELDS = [
  { key: "volume", label: "Items reaching the exception queue each month", integer: true, hint: `Public default: approximately ${formatBaselineNumber(BASELINE_VOLUME_REFERENCE.monthly)} monthly referrals. Referral-subset proxy, not the real total exception queue. Replace with your own volume.` },
  { key: "todayMinutes", label: "Minutes an operator spends per item today", integer: false, hint: `gathering the evidence and judging, with no guidance · Assumption: ${MONTH_TIME_ASSUMPTIONS.todayMinutes} minutes, range ${MONTH_TODAY_RANGE.min} to ${MONTH_TODAY_RANGE.max}.` },
  { key: "judgingMinutes", label: "Minutes an operator spends judging a case the agent has built", integer: false, hint: `reading the built case and deciding · Assumption: ${MONTH_TIME_ASSUMPTIONS.judgingMinutes} minutes.` },
] as const;
export const MONTH_DETAIL_FIELDS = BASELINE_FIELDS.filter(({ key }) => !["volume", "judgingMinutes", "builtReviewMinutes"].includes(key)).map((field) =>
  GATHERING_STEPS.some(({ key }) => key === field.key)
    ? { ...field, label: field.label.replace(" minutes / item", " weight"), hint: "Assumption · Relative gathering weight, 0 to 1,440" }
    : field);
export interface MonthModelInputs extends BaselineInputs {
  todayMinutes: number;
}
export const MONTH_MODEL_DEFAULTS: Readonly<MonthModelInputs> = Object.freeze({
  ...BASELINE_DEFAULTS,
  todayMinutes: MONTH_TIME_ASSUMPTIONS.todayMinutes,
  judgingMinutes: MONTH_TIME_ASSUMPTIONS.judgingMinutes,
});
export interface MonthModelResult extends BaselineResult {
  perItem: {
    today: { gatheringMinutes: number; judgingMinutes: number };
    withAgent: { gatheringMinutes: number; judgingMinutes: number };
    abstained: { gatheringMinutes: number; judgingMinutes: number };
  };
  capacity: { workingMinutes: number; today: number; withAgent: number };
  gatheringSteps: { key: typeof GATHERING_STEPS[number]["key"]; label: string; minutes: number }[];
}

export function monthSummary(result: MonthModelResult, enabled: boolean): string {
  const hours = enabled ? result.withAgent.operatorHours : result.today.operatorHours;
  const capacity = enabled ? result.capacity.withAgent : result.capacity.today;
  return `${enabled ? "With agent" : "Today"}: ${formatBaselineNumber(hours, 1)} operator hours a month; ${formatBaselineNumber(capacity, 1)} items per operator. ${enabled ? "Built-case capacity is not mixed-cohort throughput." : "Manual-case capacity under these assumptions."} Estimates, not measured savings.`;
}

function monthErrors(input: MonthModelInputs): Partial<Record<keyof MonthModelInputs, string>> {
  const errors: Partial<Record<keyof MonthModelInputs, string>> = baselineErrors(input);
  if (!Number.isFinite(input.todayMinutes) || input.todayMinutes < MONTH_TODAY_RANGE.min || input.todayMinutes > MONTH_TODAY_RANGE.max) {
    errors.todayMinutes = "Enter a number from 10 to 15 minutes.";
  }
  if (input.judgingMinutes <= 0 || input.judgingMinutes > input.todayMinutes || !Number.isFinite(MONTH_TIME_ASSUMPTIONS.workingMinutes / input.judgingMinutes)) {
    errors.judgingMinutes = "Enter judging minutes greater than zero and no more than today's total.";
  }
  if (manualGatheringMinutes(input) === 0 && input.todayMinutes > input.judgingMinutes) {
    errors.findFormMinutes = "Enter at least one positive gathering weight in Show the detail.";
  }
  return errors;
}

/** One monthly projection. Cohorts are disjoint; abstentions retain full manual effort. */
export function monthModel(input: ProcessMonthInputs): ProcessMonthResult;
export function monthModel(input: MonthModelInputs): MonthModelResult;
export function monthModel(input: MonthModelInputs | ProcessMonthInputs): MonthModelResult | ProcessMonthResult {
  if ("monthlyItems" in input) return calculateProcessMonth(input);
  if (Object.keys(monthErrors(input)).length) throw new RangeError("Invalid monthly assumptions");
  const base = calculateBaseline(input);
  const gathering = input.todayMinutes - input.judgingMinutes;
  const todayGathering = input.volume * gathering;
  const todayJudging = input.volume * input.judgingMinutes;
  const assistedGathering = base.abstained * gathering;
  const assistedJudging = (base.built + base.abstained) * input.judgingMinutes;
  const weights = manualGatheringMinutes(input);
  return {
    ...base,
    manualGatheringMinutes: gathering,
    today: { gatheringMinutes: todayGathering, judgingMinutes: todayJudging, operatorHours: input.volume * input.todayMinutes / 60 },
    withAgent: { gatheringMinutes: assistedGathering, judgingMinutes: assistedJudging,
      operatorHours: (base.built * input.judgingMinutes + base.abstained * input.todayMinutes) / 60 },
    builtBeforeDecisionMinutes: input.judgingMinutes + input.assemblySeconds / 60,
    abstainBeforeDecisionMinutes: input.todayMinutes,
    perItem: {
      today: { gatheringMinutes: gathering, judgingMinutes: input.judgingMinutes },
      withAgent: { gatheringMinutes: 0, judgingMinutes: input.judgingMinutes },
      abstained: { gatheringMinutes: gathering, judgingMinutes: input.judgingMinutes },
    },
    capacity: { workingMinutes: MONTH_TIME_ASSUMPTIONS.workingMinutes,
      today: MONTH_TIME_ASSUMPTIONS.workingMinutes / input.todayMinutes,
      withAgent: MONTH_TIME_ASSUMPTIONS.workingMinutes / input.judgingMinutes },
    gatheringSteps: GATHERING_STEPS.map(({ key, label }) => ({
      key, label, minutes: weights === 0 ? 0 : gathering * (input[key] / weights),
    })),
  };
}

/** Retains invalid drafts and returns explicit errors, never a stale estimate. */
export function selectMonthScenario(draft: BaselineDraft, todayMinutes: string) {
  const parsed = parseBaselineDraft(draft, BASELINE_DEFAULTS.assemblySeconds);
  const text = todayMinutes.trim().replace(/^0+(?=\d)/, "");
  const validToday = /^(?:1[0-4](?:\.\d*)?|15(?:\.0*)?)$/.test(text);
  const candidate: MonthModelInputs = { ...(parsed.input ?? BASELINE_DEFAULTS), todayMinutes: validToday ? Number(text) : NaN };
  const errors = { ...monthErrors(candidate), ...parsed.errors };
  if (parsed.input && validToday) {
    // Compare raw decimal fractions before floating-point rounding can hide
    // judging time just above today's total.
    const [judgingWhole, judgingFraction = ""] = draft.judgingMinutes.trim().split(".");
    const [todayWhole, todayFraction = ""] = text.split(".");
    const digits = Math.max(judgingFraction.length, todayFraction.length);
    if (Number(judgingWhole || "0") > Number(todayWhole)
      || (Number(judgingWhole || "0") === Number(todayWhole)
        && judgingFraction.padEnd(digits, "0") > todayFraction.padEnd(digits, "0"))) {
      errors.judgingMinutes = "Enter judging minutes greater than zero and no more than today's total.";
    }
  }
  const input = Object.keys(errors).length ? null : candidate;
  return { input, errors, result: input ? monthModel(input) : null };
}

/** Owner-supplied public process figures; no claim of fresh external verification. */
export const PROCESS_PUBLIC_FACTS = Object.freeze({
  monthlyItemsLowerBound: 100_000_000,
  epsPercent: 91,
  paperPercent: 9,
  type1MonthlyItems: 2_200_000,
  type1ItemsPerHour: 880,
  type2MonthlyItems: 2_000_000,
  type2ItemsPerHourMin: 260,
  type2ItemsPerHourMax: 300,
  type2SecondsMin: 12,
  type2SecondsMax: 14,
  staffTouchPercentApprox: 4,
  monthlyReferrals: 85_000,
  unpaidItemsJuly2026: 194_000,
  unpaidValueJuly2026: 1_550_000,
  unpaidValuePerPharmacyApprox: 150,
  unpaidExpiryMonths: 18,
  advancePercent: 80,
});

export interface ProcessMonthInputs {
  monthlyItems: number;
  epsPercent: number;
  type1Percent: number;
  type2Percent: number;
  staffTouchPercent: number;
  type2SecondsToday: number;
  investigationMinutesToday: number;
  pharmacyCompletionMinutes: number;
  monthlyReferrals: number;
  pharmacyCatchPercent: number;
  abstainPercent: number;
  builtJudgingSeconds: number;
  type1KeySeconds: number;
  type1ConfirmSeconds: number;
}

export const PROCESS_MONTH_DEFAULTS: Readonly<ProcessMonthInputs> = Object.freeze({
  monthlyItems: PROCESS_PUBLIC_FACTS.monthlyItemsLowerBound,
  epsPercent: PROCESS_PUBLIC_FACTS.epsPercent,
  type1Percent: PROCESS_PUBLIC_FACTS.type1MonthlyItems / (PROCESS_PUBLIC_FACTS.monthlyItemsLowerBound / 100),
  type2Percent: PROCESS_PUBLIC_FACTS.type2MonthlyItems / (PROCESS_PUBLIC_FACTS.monthlyItemsLowerBound / 100),
  staffTouchPercent: PROCESS_PUBLIC_FACTS.staffTouchPercentApprox,
  type2SecondsToday: 13,
  investigationMinutesToday: 4,
  pharmacyCompletionMinutes: 6,
  monthlyReferrals: PROCESS_PUBLIC_FACTS.monthlyReferrals,
  pharmacyCatchPercent: 20,
  abstainPercent: 100 / 6,
  builtJudgingSeconds: 45,
  type1KeySeconds: 30,
  type1ConfirmSeconds: 10,
});

export const PROCESS_INPUT_PROVENANCE: Readonly<Record<keyof ProcessMonthInputs, "public" | "public-derived" | "assumption" | "synthetic-set">> = Object.freeze({
  monthlyItems: "public-derived",
  epsPercent: "public",
  type1Percent: "public-derived",
  type2Percent: "public-derived",
  staffTouchPercent: "public",
  type2SecondsToday: "public",
  investigationMinutesToday: "assumption",
  pharmacyCompletionMinutes: "assumption",
  monthlyReferrals: "public",
  pharmacyCatchPercent: "assumption",
  abstainPercent: "synthetic-set",
  builtJudgingSeconds: "assumption",
  type1KeySeconds: "assumption",
  type1ConfirmSeconds: "assumption",
});

export interface ProcessMonthColumn {
  type2OperatorHours: number;
  referralOperatorHours: number;
  pharmacyCompletionHours: number;
  referredBackItems: number;
  caughtBeforeSubmission: number;
  builtCases: number;
  abstainedItems: number;
  decisionsWithRuleAndReason: number;
  monthlyRuleAssurance: "experience_only" | "clause_and_version_cited";
}

export interface ProcessMonthResult {
  counts: {
    monthlyItems: number;
    epsItems: number;
    paperItems: number;
    type1Items: number;
    type2Items: number;
    staffTouchedItems: number;
    autoPricedItems: number;
  };
  today: ProcessMonthColumn;
  withAgent: ProcessMonthColumn;
  type1: { keySeconds: number; confirmSeconds: number };
}

export type ProcessMonthModel = (input: ProcessMonthInputs) => ProcessMonthResult;
export type ProcessMonthDraft = Record<keyof ProcessMonthInputs, string>;
export interface ProcessMonthSelection {
  input: ProcessMonthInputs | null;
  result: ProcessMonthResult | null;
  errors: Partial<Record<keyof ProcessMonthInputs, string>>;
}
export interface ProcessModelSlice {
  processInputs: ProcessMonthDraft;
  setProcessInput: (field: keyof ProcessMonthInputs, value: string) => void;
}