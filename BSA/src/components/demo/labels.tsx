import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BoundaryClass, CaseState, Recommendation } from "@/lib/domain/types";

import { BOUNDARY_META, REC_META, STATE_META } from "./label-meta";

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

export function StateBadge({ state, className }: { state: CaseState; className?: string }) {
  const meta = STATE_META[state];
  return <Badge className={cn("whitespace-normal border-transparent", meta.className, className)}>{meta.label}</Badge>;
}

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
