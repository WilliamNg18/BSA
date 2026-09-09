import type { BoundaryClass, CaseState, Recommendation } from "@/lib/domain/types";

export const BOUNDARY_META: Record<BoundaryClass, { label: string; className: string; dot: string }> = {
  existing: { label: "Existing NHSBSA capability", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100", dot: "bg-slate-500" },
  deterministic: { label: "Deterministic code", className: "bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100", dot: "bg-sky-600" },
  agent: { label: "Agentic action", className: "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100", dot: "bg-teal-600" },
  human: { label: "Human decision", className: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100", dot: "bg-orange-600" },
};

export const STATE_META: Record<CaseState, { label: string; className: string }> = {
  cleared_by_rules: { label: "Cleared by rules", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" },
  agent_review_complete: { label: "Agent review complete", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" },
  operator_review_required: { label: "Operator review required", className: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100" },
  additional_evidence_required: { label: "Additional evidence required", className: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100" },
  agent_abstained: { label: "Agent abstained", className: "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100" },
  human_decision_recorded: { label: "Human decision recorded", className: "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100" },
};

export const REC_META: Record<Recommendation, { label: string; className: string }> = {
  SUFFICIENT: { label: "Sufficient: release to pricing once confirmed", className: "bg-emerald-700 text-white" },
  REFER_BACK: { label: "Refer back with the exact fix", className: "bg-amber-700 text-white" },
  REQUEST_INFORMATION: { label: "Request information from the pharmacy", className: "bg-orange-700 text-white" },
  ABSTAIN: { label: "Abstained: no recommendation", className: "bg-rose-700 text-white" },
  NONE: { label: "No recommendation (agent not run)", className: "bg-slate-600 text-white" },
};