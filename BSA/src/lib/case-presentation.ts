import type { CasePack, HumanDecision } from "./domain/types";

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