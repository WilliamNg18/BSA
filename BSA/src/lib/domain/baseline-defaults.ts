import { runAgent } from "./agent";
import { CASES, QUEUE_FILLER } from "./cases";
import { formatBaselineNumber as n, type BaselineInputs } from "./baseline";

// O23/N01 reference arithmetic, not editable synthetic assumptions. Pinned to
// the research registry in tests without importing that registry into the UI.
export const BASELINE_VOLUME_REFERENCE = Object.freeze({ monthly: 85_000, annual: 1_000_000, monthsPerYear: 12 });

/** Seed snapshot, not mutable queue history. Fillers supply metadata only. */
const canonical = CASES.map((item) => ({
  id: item.id,
  state: item.initialState,
  pack: item.initialState === "human_decision_recorded" ? null : runAgent(item, { agentEnabled: true }),
}));
const missingCanonical = canonical.filter(({ pack }) => pack?.recommendation === "REFER_BACK"
  && pack.gate.result === "PASS" && pack.requirementResults.some((requirement) => !requirement.met));
// Only this explicit missing-information reason qualifies; "request information"
// or a historical decision alone is not evidence of a preventable endorsement gap.
const missingFillers = QUEUE_FILLER.filter((row) => row.state === "operator_review_required"
  && row.routingReason === "Specials: invoice price not stated");
const pharmacyIds = [...missingCanonical.map((row) => row.id), ...missingFillers.map((row) => row.id)];
const rows = [...canonical, ...QUEUE_FILLER];
const remaining = rows.filter((row) => !pharmacyIds.includes(row.id));
const clearedIds = remaining.filter((row) => row.state === "cleared_by_rules").map((row) => row.id);
const uncleared = remaining.filter((row) => !clearedIds.includes(row.id));
const abstainIds = uncleared.filter((row) => row.state === "agent_abstained").map((row) => row.id);
// A/B/C are the active, recommended canonical packs. D abstains, E never
// invokes the agent, F is historical. No timing or citations invented for fillers.
const proposed = canonical.flatMap(({ id, pack }) => pack?.agentInvoked && pack.gate.result === "PASS"
  && pack.recommendation !== "NONE" && pack.recommendation !== "ABSTAIN" ? [{ id, pack }] : []);
const assemblyTotal = proposed.reduce((sum, { pack }) => sum + pack.assemblySeconds, 0);
if (!proposed.length) throw new Error("Missing baseline synthetic assembly sample");

export const BASELINE_PROVENANCE = {
  queueSize: rows.length,
  canonicalCount: canonical.length,
  fillerCount: QUEUE_FILLER.length,
  pharmacy: { ids: pharmacyIds, numerator: pharmacyIds.length, denominator: rows.length },
  cleared: { ids: clearedIds, numerator: clearedIds.length, denominator: remaining.length },
  abstain: { ids: abstainIds, numerator: abstainIds.length, denominator: uncleared.length },
  assembly: { ids: proposed.map(({ id }) => id), totalSeconds: assemblyTotal, denominator: proposed.length },
  citations: { numerator: proposed.filter(({ pack }) => pack.citationValid === true && pack.clause !== null).length, denominator: proposed.length },
  sourceIds: ["O23", "O24", "N01", "A03", "A10", "S-ALL"],
} as const;

export const BASELINE_DEFAULTS: Readonly<BaselineInputs> = Object.freeze({
  // O23's approximate monthly subset, pinned against the canonical registry in
  // tests. Do not import the full research register into the browser bundle.
  volume: BASELINE_VOLUME_REFERENCE.monthly,
  gatheringMinutes: 5,
  judgingMinutes: 2,
  precheckPercent: pharmacyIds.length / rows.length * 100,
  clearedPercent: clearedIds.length / remaining.length * 100,
  abstainPercent: abstainIds.length / uncleared.length * 100,
  assemblySeconds: assemblyTotal / proposed.length,
});

/** Generate editable default labels from the same inputs used by the model. */
export function baselineDefaultCopy(defaults: Readonly<BaselineInputs>) {
  const reference = BASELINE_VOLUME_REFERENCE;
  return {
    volumeNote: `Volume default: ${n(defaults.volume)} items/month. O23's approximately ${n(reference.monthly)} referred-back items/month is a scale proxy, not total exceptions. Rates are synthetic scenario assumptions, not measured effectiveness.`,
    volumeSource: `Volume: O23 attributes approximately ${n(reference.monthly)} referred-back items/month to Community Pharmacy England through the supplied pack. Used only as a scenario scale proxy, not total exceptions. O24: the total operator queue is unknown. N01: ${n(reference.annual)} / ${n(reference.monthsPerYear)} = approximately ${n(reference.annual / reference.monthsPerYear, 2)}, not exactly ${n(reference.monthly)}. No external verification.`,
    manualAssumptions: `Gathering ${n(defaults.gatheringMinutes)} minutes and judging ${n(defaults.judgingMinutes)} minutes: editable design assumptions, not numbers from the documents. A03/A10 motivate validating the workflow, not these durations. No claim that a model is better than deterministic prefetching.`,
  };
}