import { calculateBaseline, manualGatheringMinutes, type BaselineInputs, type BaselineResult } from "./baseline";
import { CASES, QUEUE_FILLER } from "./cases";

export const QUEUE_SEGMENT_SIZE = 1000;
export const QUEUE_ROW_HEIGHT = 112;
export const QUEUE_VIEW_HEIGHT = 448;
export const QUEUE_WINDOW_LIMIT = 10;
export const DAY_MINUTES = 540;
export const SWEEP_PHASES = ["Plan", "Gather", "Retrieve", "Reconcile", "Assess", "Hand off"] as const;
export type QueueCohort = "pharmacy" | "cleared" | "abstained" | "built";
export type SeedKind = "built" | "abstained" | "cleared" | "recorded";
export const COHORT_LABELS: Record<QueueCohort, string> = {
  pharmacy: "Pharmacy-caught projection", cleared: "Code-cleared projection",
  abstained: "Abstention projection", built: "Case-built projection",
};
export const QUEUE_SEEDS = [
  ...CASES.map((c) => ({ id: c.id, label: `Case ${c.scenario}`, canonical: true, state: c.initialState })),
  ...QUEUE_FILLER.map((c, index) => ({ id: c.id, label: `Example ${index + 7}`, canonical: false, state: c.state })),
].map((c) => ({ ...c, kind: (c.state === "cleared_by_rules" ? "cleared" : c.state === "agent_abstained" ? "abstained" : c.state === "human_decision_recorded" ? "recorded" : "built") as SeedKind }));

/** A rotated bijection gives exact baseline cohort counts without allocating a month. */
export function queueCohort(index: number, result: BaselineResult): QueueCohort {
  if (!Number.isSafeInteger(index) || index < 0 || index >= result.volume) throw new RangeError("Invalid queue position");
  const rank = (index + Math.floor(result.volume / 2)) % result.volume;
  if (rank < result.pharmacyCaught) return "pharmacy";
  if (rank < result.pharmacyCaught + result.cleared) return "cleared";
  if (rank < result.pharmacyCaught + result.cleared + result.abstained) return "abstained";
  return "built";
}

export function queueWindow(volume: number, position: number) {
  if (!Number.isSafeInteger(volume) || volume < 0 || volume > 1e9) throw new RangeError("Invalid volume");
  const current = volume === 0 ? 0 : Math.max(0, Math.min(volume - 1, Number.isFinite(position) ? Math.floor(position) : 0));
  const segmentStart = Math.floor(current / QUEUE_SEGMENT_SIZE) * QUEUE_SEGMENT_SIZE;
  const segmentLength = Math.min(QUEUE_SEGMENT_SIZE, volume - segmentStart);
  const first = Math.max(segmentStart, current - 2);
  const last = Math.min(segmentStart + segmentLength, first + QUEUE_WINDOW_LIMIT);
  return { current, segmentStart, segmentLength, height: segmentLength * QUEUE_ROW_HEIGHT,
    indices: Array.from({ length: Math.max(0, last - first) }, (_, i) => first + i) };
}

export function clampDay(minutes: number) {
  return Math.max(0, Math.min(DAY_MINUTES, Number.isFinite(minutes) ? Math.floor(minutes) : 0));
}
export function dayClock(minutes: number) {
  const time = 8 * 60 + clampDay(minutes);
  return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}

/** Single-operator capacity, not the calculator's fixed-cohort judging comparison.
 * B and D share ONE time budget. P/C have no operator review or judging.
 * Free cohorts arrive linearly across the day; assembly latency is not human work.
 */
export function projectQueueDay(input: BaselineInputs, minutes: number) {
  const result = calculateBaseline(input);
  const elapsed = clampDay(minutes);
  const g = manualGatheringMinutes(input), j = input.judgingMinutes, review = input.builtReviewMinutes;
  const todayProcessed = elapsed === 0 ? 0 : Math.min(input.volume, g + j === 0 ? input.volume : Math.floor(elapsed / (g + j)));
  const cost = result.built * (review + j) + result.abstained * (g + j);
  const fraction = elapsed === 0 ? 0 : cost === 0 ? 1 : Math.min(1, elapsed / cost);
  const built = Math.floor(result.built * fraction), abstained = Math.floor(result.abstained * fraction);
  const cleared = Math.floor(result.cleared * elapsed / DAY_MINUTES);
  const pharmacy = Math.floor(result.pharmacyCaught * elapsed / DAY_MINUTES);
  return {
    today: { processed: todayProcessed, gathering: todayProcessed * g, judging: todayProcessed * j },
    assisted: { built, abstained, cleared, pharmacy, processed: built + abstained,
      review: built * review, gathering: abstained * g, judging: (built + abstained) * j,
      awaiting: result.built + result.abstained - built - abstained },
  };
}

/** The same twelve examples, in the same order, independently of monthly quotas. */
export function projectSeedDay(input: BaselineInputs, minutes: number, assisted: boolean, recordedIds: readonly string[] = []) {
  let spent = 0;
  const elapsed = clampDay(minutes), g = manualGatheringMinutes(input);
  return QUEUE_SEEDS.map((seed) => {
    const recorded = seed.kind === "recorded" || recordedIds.includes(seed.id);
    const cleared = seed.kind === "cleared";
    const gather = recorded || cleared ? 0 : assisted && seed.kind === "built" ? input.builtReviewMinutes : g;
    const judge = recorded || cleared ? 0 : input.judgingMinutes;
    const start = spent;
    spent += gather + judge;
    const done = !recorded && !cleared && elapsed > 0 && elapsed >= spent;
    const phase = recorded ? "Historical record unchanged" : cleared ? "Existing code; no agent" : elapsed >= spent && elapsed > 0 ? "Operator action projected" : elapsed > start + gather ? "Judging projection" : elapsed > start ? assisted && seed.kind === "built" ? "Evidence review projection" : "Gathering projection" : "Awaiting operator";
    return { ...seed, recorded, cleared, gather, judge, start, finish: spent, done, phase };
  });
}

export function sweepCounts(kinds: readonly (QueueCohort | "recorded")[]) {
  return { built: kinds.filter((k) => k === "built").length, cleared: kinds.filter((k) => k === "cleared").length,
    abstained: kinds.filter((k) => k === "abstained").length,
    awaiting: kinds.filter((k) => k === "built" || k === "abstained").length };
}