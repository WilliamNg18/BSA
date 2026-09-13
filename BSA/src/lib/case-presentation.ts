import type { CasePack, CaseState, HumanDecision } from "./domain/types";
import type { ItemProcess } from "./domain/lifecycle";

export function caseViewState(pack: CasePack | null, process: ItemProcess | undefined, hasCurrentRecord: boolean): CaseState {
  if (hasCurrentRecord) return "human_decision_recorded";
  if (process?.routing.outcome === "auto_priced") return "cleared_by_rules";
  return pack?.agentInvoked ? pack.state : "operator_review_required";
}

/** Read-only presentation policy. Never modifies engine results or records. */
export function permitsProposal(pack: CasePack): boolean {
  return pack.agentInvoked && pack.gate.result === "PASS" && !["NONE", "ABSTAIN"].includes(pack.recommendation);
}

export function manualChoice(decision: HumanDecision | null): HumanDecision {
  return decision === "AMEND" ? "ESCALATE" : decision ?? "ESCALATE";
}

export const ASSISTED_SLOTS = ["Clause", "Requirements", "Alternative", "Confidence"] as const;

export function traceSlotReady(pack: CasePack, revealed: number, slot: typeof ASSISTED_SLOTS[number]): boolean {
  if (!permitsProposal(pack)) return false;
  const phase = slot === "Clause" ? "RETRIEVE" : slot === "Requirements" || slot === "Confidence" ? "ASSESS" : "CHECK";
  return pack.trace.slice(0, revealed).some((step) => step.phase === phase);
}