import { calculateBaseline, manualGatheringMinutes, type BaselineInputs, type BaselineResult, type MonthModelResult } from "./baseline";
import { CASES, QUEUE_FILLER } from "./cases";
import type { CaseState } from "./types";
import type { CaseLifecycle } from "./lifecycle";

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

export const QUEUE_PAGE_SIZE = 50;
export type QueueStatus = "awaiting" | "progress" | "built" | "evidence" | "abstained" | "cleared" | "decided";
export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  awaiting: "Awaiting an operator", progress: "In progress", built: "Case built ready to decide",
  evidence: "Needs more evidence", abstained: "Abstained worked as today",
  cleared: "Cleared by rules no model call", decided: "Decided",
};
export const queueFilters = (enabled: boolean): QueueStatus[] => enabled
  ? ["built", "evidence", "abstained", "cleared", "decided"] : ["awaiting", "progress", "decided"];

/** Audience labels do not rewrite recorded states or imply an agent ran on a submission. */
export function queueStatus(state: CaseState, enabled: boolean, lifecycle?: CaseLifecycle): QueueStatus {
  if (state === "human_decision_recorded") return "decided";
  const pending = lifecycle?.state === "submitted" || lifecycle?.state === "resubmitted";
  if (!enabled) return state === "cleared_by_rules" ? "decided"
    : pending || state === "operator_review_required" ? "awaiting" : "progress";
  if (pending) return "evidence";
  if (state === "cleared_by_rules") return "cleared";
  if (state === "agent_abstained") return "abstained";
  if (state === "additional_evidence_required") return "evidence";
  return "built";
}

export interface QueuePreviewRow {
  id: string;
  pharmacy: string;
  reason: string;
  state: CaseState;
  status: QueueStatus;
  fresh: boolean;
  canonical: boolean;
  reviewable: boolean;
  pending: boolean;
  projected: boolean;
  blocked?: boolean;
}

/** Bounded logical ranges. Pharmacy-caught items never enter the operator queue.
 * Seed examples occupy the first slots, not extra monthly work. Their mix is illustrative.
 */
export function queueTableWindow(result: MonthModelResult | null, seeds: readonly QueuePreviewRow[], enabled: boolean, filter: QueueStatus | "all", position: number) {
  const cohorts = result ? [
    { state: "agent_review_complete" as const, size: result.built },
    { state: "agent_abstained" as const, size: result.abstained },
    { state: "cleared_by_rules" as const, size: result.cleared },
  ] : [];
  let replaced = Math.min(12, cohorts.reduce((sum, group) => sum + group.size, 0));
  const groups = cohorts.map((group) => {
    const remove = Math.min(replaced, group.size);
    replaced -= remove;
    return { ...group, size: group.size - remove, status: queueStatus(group.state, enabled) };
  });
  const counts = Object.fromEntries(queueFilters(enabled).map((status) => [status, 0])) as Record<QueueStatus, number>;
  for (const seed of seeds) counts[seed.status] = (counts[seed.status] ?? 0) + 1;
  for (const group of groups) counts[group.status] = (counts[group.status] ?? 0) + group.size;
  const prefix = seeds.filter((seed) => filter === "all" || seed.status === filter);
  const selected = groups.filter((group) => filter === "all" || group.status === filter);
  const total = prefix.length + selected.reduce((sum, group) => sum + group.size, 0);
  const start = total ? Math.max(0, Math.min(total - 1, Number.isFinite(position) ? Math.floor(position) : 0)) : 0;
  const end = Math.min(total, start + QUEUE_PAGE_SIZE);
  const rows: QueuePreviewRow[] = [];
  for (let index = start; index < end; index++) {
    if (index < prefix.length) { rows.push(prefix[index]); continue; }
    let offset = index - prefix.length;
    for (const group of selected) {
      if (offset >= group.size) { offset -= group.size; continue; }
      rows.push({
        id: `SYN-Q-${group.state}-${String(offset + 1).padStart(10, "0")}`,
        pharmacy: "Model pharmacy (synthetic)", reason: "Synthetic failed-rule referral",
        state: group.state, status: group.status, fresh: false, canonical: false,
        reviewable: false, pending: false, projected: true,
      });
      break;
    }
  }
  return { rows, start, end, total, counts };
}

/** New comparison deliberately replaces legacy 5 + 2 minute costs with shared perItem.
 * Only the twelve examples are simulated; canonical validated citations are supplied by
 * the caller, never invented for filler rows or assumed for manual work.
 */
export function projectQueueComparison(result: MonthModelResult, minutes: number, assisted: boolean, recordedIds: readonly string[] = [], citedIds: readonly string[] = []) {
  const elapsed = Math.max(0, Math.min(360, Number.isFinite(minutes) ? minutes : 0));
  let spent = 0;
  const rows = QUEUE_SEEDS.map((seed) => {
    const recorded = seed.kind === "recorded" || recordedIds.includes(seed.id);
    const cleared = seed.kind === "cleared";
    const cost = assisted && seed.kind === "built" ? result.perItem.withAgent : result.perItem.today;
    const gathering = recorded || cleared ? 0 : cost.gatheringMinutes;
    const judging = recorded || cleared ? 0 : cost.judgingMinutes;
    const start = spent;
    spent += gathering + judging;
    const done = !recorded && !cleared && elapsed > 0 && elapsed >= spent;
    const phase = recorded ? "Historical record unchanged" : cleared ? "Cleared by rules; no model call"
      : done ? "Human decision projected" : elapsed === 0 || elapsed < start ? "Awaiting an operator"
      : elapsed < start + gathering ? "Operator gathering evidence" : "Operator judging evidence";
    return { ...seed, start, finish: spent, gathering, judging, done, phase,
      cited: done && assisted && seed.kind === "built" && seed.canonical && citedIds.includes(seed.id) };
  });
  return { rows, operatorMinutes: Math.min(elapsed, spent), decided: rows.filter((row) => row.done).length,
    cited: rows.filter((row) => row.cited).length };
}