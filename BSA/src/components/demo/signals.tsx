import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import type { Composite, Signals } from "@/lib/domain/types";

// Confidence is shown as its five structural signals, never as a bare
// percentage. The composite label is derived in code from the signals.

export function CompositeBadge({ composite, className }: { composite: Composite; className?: string }) {
  const meta = {
    high: { label: "High confidence", cls: "bg-emerald-700 text-white" },
    medium: { label: "Medium confidence", cls: "bg-amber-700 text-white" },
    low: { label: "Low confidence", cls: "bg-orange-700 text-white" },
    abstain: { label: "Abstained", cls: "bg-rose-700 text-white" },
  }[composite.level];
  return <Badge className={cn("whitespace-normal border-transparent", meta.cls, className)}>{meta.label}</Badge>;
}

export function SignalList({ signals, compact = false }: { signals: Signals; compact?: boolean }) {
  const rows: { label: string; value: string; ok: boolean | null; status?: string }[] = [
    { label: "Provision found", value: signals.provisionFound ? "Yes" : "No", ok: signals.provisionFound },
    { label: "Readings agree", value: signals.sampleAgreement.total ? `${signals.sampleAgreement.agree} of ${signals.sampleAgreement.total}` : "n/a", ok: signals.sampleAgreement.total ? signals.sampleAgreement.agree >= 2 : null },
    { label: "Sources reconcile", value: signals.reconciliation === "agree" ? "Comparable fields agree" : signals.reconciliation === "conflict" ? "Conflict" : signals.reconciliation === "not_established" ? "Not established" : "n/a", ok: signals.reconciliation === "agree" ? true : signals.reconciliation === "conflict" ? false : null, status: signals.reconciliation === "not_established" ? ", not established" : undefined },
    { label: "Image quality", value: `${signals.imageQuality.toFixed(2)} (threshold ${QUALITY_THRESHOLD.toFixed(2)})`, ok: signals.imageQuality >= QUALITY_THRESHOLD },
    { label: "In validated coverage", value: signals.inCoverage ? "Yes" : "No", ok: signals.inCoverage },
  ];
  return (
    <ul className={cn("grid gap-1.5", compact ? "grid-cols-1" : "sm:grid-cols-2")} aria-label="Confidence signals">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 text-sm">
          <span className="flex items-center gap-2">
            <span
              className={cn("size-2.5 shrink-0 rounded-full", r.ok === null ? "bg-slate-400" : r.ok ? "bg-emerald-600" : "bg-rose-600")}
              aria-hidden="true"
            />
            {r.label}
          </span>
          <span className="text-right font-medium">
            {r.value}
            <span className="sr-only">{r.status ?? (r.ok === null ? ", not applicable" : r.ok ? ", satisfied" : ", failed")}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
