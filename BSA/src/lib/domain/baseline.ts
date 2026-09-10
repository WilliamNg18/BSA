/** Pure scenario arithmetic. No case mutations, decisions, pricing or measured savings. */
export interface BaselineInputs {
  volume: number;
  gatheringMinutes: number;
  judgingMinutes: number;
  precheckPercent: number;
  clearedPercent: number;
  abstainPercent: number;
  assemblySeconds: number;
}

export type BaselineField = Exclude<keyof BaselineInputs, "assemblySeconds">;
export type BaselineDraft = Record<BaselineField, string>;

export const BASELINE_LIMITS = { volume: 1_000_000_000, minutes: 1440, percent: 100, assemblySeconds: 3600 } as const;
export const formatBaselineNumber = (value: number, maximumFractionDigits = 4) => value.toLocaleString("en-GB", { maximumFractionDigits });

export const BASELINE_FIELDS = ([
  { key: "volume", label: "Monthly volume proxy", max: BASELINE_LIMITS.volume, integer: true, hint: "Items · Whole number" },
  { key: "gatheringMinutes", label: "Gathering minutes / item", max: BASELINE_LIMITS.minutes, integer: false, hint: "Manual assumption · Minutes" },
  { key: "judgingMinutes", label: "Judging minutes / item", max: BASELINE_LIMITS.minutes, integer: false, hint: "Manual assumption · Minutes" },
  { key: "precheckPercent", label: "Pharmacy pre-check %", max: BASELINE_LIMITS.percent, integer: false, hint: "Share of incoming volume" },
  { key: "clearedPercent", label: "Rule-cleared %", max: BASELINE_LIMITS.percent, integer: false, hint: "Share remaining after pharmacy pre-check" },
  { key: "abstainPercent", label: "Abstention %", max: BASELINE_LIMITS.percent, integer: false, hint: "Share of the uncleared remainder" },
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
  const input: BaselineInputs = {
    volume: NaN, gatheringMinutes: NaN, judgingMinutes: NaN,
    precheckPercent: NaN, clearedPercent: NaN, abstainPercent: NaN, assemblySeconds,
  };
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
  pharmacyCaught: number;
  cleared: number;
  abstained: number;
  built: number;
  today: { gatheringMinutes: number; judgingMinutes: number; operatorHours: number };
  withAgent: { gatheringMinutes: number; judgingMinutes: number; operatorHours: number };
  builtBeforeDecisionMinutes: number;
  abstainBeforeDecisionMinutes: number;
  assemblySeconds: number;
}

export function calculateBaseline(input: BaselineInputs): BaselineResult {
  if (Object.keys(baselineErrors(input)).length) throw new RangeError("Invalid baseline assumptions");
  const { volume, gatheringMinutes: g, judgingMinutes: j, assemblySeconds } = input;
  // Each rounded cohort is removed before calculating the next denominator.
  const pharmacyCaught = Math.round(volume * (input.precheckPercent / 100));
  const remaining = volume - pharmacyCaught;
  const cleared = Math.round(remaining * (input.clearedPercent / 100));
  const uncleared = remaining - cleared;
  const abstained = Math.round(uncleared * (input.abstainPercent / 100));
  const built = uncleared - abstained;
  const todayGathering = volume * g;
  const todayJudging = volume * j;
  const withGathering = abstained * g;
  const withJudging = (abstained + built) * j;
  return {
    volume, pharmacyCaught, cleared, abstained, built,
    today: { gatheringMinutes: todayGathering, judgingMinutes: todayJudging, operatorHours: (todayGathering + todayJudging) / 60 },
    withAgent: { gatheringMinutes: withGathering, judgingMinutes: withJudging, operatorHours: (withGathering + withJudging) / 60 },
    builtBeforeDecisionMinutes: j + assemblySeconds / 60,
    abstainBeforeDecisionMinutes: g + j,
    assemblySeconds,
  };
}

export function baselineSummary(result: BaselineResult, enabled: boolean): string {
  const n = (value: number) => formatBaselineNumber(value, 1);
  const today = `Manual scenario: ${n(result.volume)} items, ${n(result.today.operatorHours)} operator hours.`;
  if (!enabled) return `${today} Agent Off: With agent estimates hidden; no measured saving is claimed.`;
  return `${today} With agent scenario: ${n(result.pharmacyCaught)} pharmacy-caught, ${n(result.cleared)} rule-cleared, ${n(result.abstained)} abstained and ${n(result.built)} built for human review; ${n(result.withAgent.operatorHours)} operator hours. Estimates, not measured savings or actual decisions.`;
}