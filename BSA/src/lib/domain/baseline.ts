/** Pure scenario arithmetic. No case mutations, decisions, pricing or measured savings. */
import { BASELINE_PROVENANCE as provenance } from "./baseline-defaults";

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
export const formatBaselineNumber = (value: number, maximumFractionDigits = 4) => value.toLocaleString("en-GB", { maximumFractionDigits });

// All numeric scenario defaults live here. The companion module derives only
// fixture provenance; neither module imports the private research register.
export const BASELINE_VOLUME_REFERENCE = Object.freeze({ monthly: 85_000, annual: 1_000_000, monthsPerYear: 12 });
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
  firstTimeEndorsementAccuracyPercent: number | null;
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
    // Referral-free scenario proxy, NOT observed endorsement correctness.
    firstTimeEndorsementAccuracyPercent: volume === 0 ? null : (volume - referrals) / volume * 100,
  };
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
    volumeNote: `Volume default: ${n(defaults.volume)} items/month. O23's approximately ${n(reference.monthly)} referred-back items/month is a scale proxy, not total exceptions. Rates are synthetic scenario assumptions, not measured effectiveness.`,
    volumeSource: `Volume: O23 attributes approximately ${n(reference.monthly)} referred-back items/month to Community Pharmacy England through the supplied pack. Used only as a scenario scale proxy, not total exceptions. O24: the total operator queue is unknown. N01: ${n(reference.annual)} / ${n(reference.monthsPerYear)} = approximately ${n(reference.annual / reference.monthsPerYear, 2)}, not exactly ${n(reference.monthly)}. No external verification.`,
    manualAssumptions: `Gathering ${n(manualGatheringMinutes(defaults))} minutes across seven steps, built review ${n(defaults.builtReviewMinutes)} minutes and judging ${n(defaults.judgingMinutes)} minutes: editable synthetic assumptions, not document measurements. A03/A10 motivate workflow validation, not these durations.`,
  };
}