import { runAgent } from "./agent";
import { CASES, QUEUE_FILLER } from "./cases";

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

