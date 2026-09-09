import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BoundaryClass, CaseState, Recommendation } from "@/lib/domain/types";

export const BOUNDARY_META: Record<BoundaryClass, { label: string; className: string; dot: string }> = {
  existing: { label: "Existing NHSBSA capability", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100", dot: "bg-slate-500" },
  deterministic: { label: "Deterministic code", className: "bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100", dot: "bg-sky-600" },
  agent: { label: "Agentic action", className: "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100", dot: "bg-teal-600" },
  human: { label: "Human decision", className: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100", dot: "bg-orange-600" },
};

export function BoundaryTag({ cls, short = false, className }: { cls: BoundaryClass; short?: boolean; className?: string }) {
  const meta = BOUNDARY_META[cls];
  const text = short ? meta.label.split(" ")[0] : meta.label;
  return (
    <Badge className={cn("whitespace-normal border-transparent font-medium", meta.className, className)}>
      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden="true" />
      {text}
    </Badge>
  );
}

export const STATE_META: Record<CaseState, { label: string; className: string }> = {
  cleared_by_rules: { label: "Cleared by rules", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" },
  agent_review_complete: { label: "Agent review complete", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" },
  operator_review_required: { label: "Operator review required", className: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100" },
  additional_evidence_required: { label: "Additional evidence required", className: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100" },
  agent_abstained: { label: "Agent abstained", className: "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100" },
  human_decision_recorded: { label: "Human decision recorded", className: "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100" },
};

export function StateBadge({ state, className }: { state: CaseState; className?: string }) {
  const meta = STATE_META[state];
  return <Badge className={cn("whitespace-normal border-transparent", meta.className, className)}>{meta.label}</Badge>;
}

export const REC_META: Record<Recommendation, { label: string; className: string }> = {
  SUFFICIENT: { label: "Sufficient: release to pricing once confirmed", className: "bg-emerald-700 text-white" },
  REFER_BACK: { label: "Refer back with the exact fix", className: "bg-amber-600 text-white" },
  REQUEST_INFORMATION: { label: "Request information from the pharmacy", className: "bg-orange-600 text-white" },
  ABSTAIN: { label: "Abstained: no recommendation", className: "bg-rose-700 text-white" },
  NONE: { label: "No recommendation (agent not run)", className: "bg-slate-600 text-white" },
};

export function RecommendationBadge({ rec, className }: { rec: Recommendation; className?: string }) {
  const meta = REC_META[rec];
  return <Badge className={cn("whitespace-normal border-transparent px-2.5 py-1 text-sm", meta.className, className)}>{meta.label}</Badge>;
}

export function StatusDot({ status, label }: { status: "ok" | "warn" | "fail" | "skipped"; label?: string }) {
  const map = {
    ok: { c: "bg-emerald-600", t: "OK" },
    warn: { c: "bg-amber-500", t: "Attention" },
    fail: { c: "bg-rose-600", t: "Failed" },
    skipped: { c: "bg-slate-400", t: "Skipped" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={cn("size-2.5 rounded-full", map.c)} aria-hidden="true" />
      {label ?? map.t}
    </span>
  );
}

export function SyntheticTag({ children = "Synthetic demonstration data" }: { children?: ReactNode }) {
  return (
    <Badge variant="outline" className="whitespace-normal border-dashed border-amber-600 text-amber-800 dark:text-amber-300">
      {children}
    </Badge>
  );
}

export function EvidenceClassTag({ kind }: { kind: "Publicly supported" | "Reasoned assumption" | "Synthetic demonstration" | "Proposed design decision" | "Requires customer validation" }) {
  const cls = {
    "Publicly supported": "border-emerald-600 text-emerald-800 dark:text-emerald-300",
    "Reasoned assumption": "border-sky-600 text-sky-800 dark:text-sky-300",
    "Synthetic demonstration": "border-amber-600 text-amber-800 dark:text-amber-300",
    "Proposed design decision": "border-teal-600 text-teal-800 dark:text-teal-300",
    "Requires customer validation": "border-rose-600 text-rose-800 dark:text-rose-300",
  }[kind];
  return <Badge variant="outline" className={cn("whitespace-normal", cls)}>{kind}</Badge>;
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted/50 p-2.5">
      <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
      <dd className="text-sm">{v}</dd>
    </div>
  );
}
