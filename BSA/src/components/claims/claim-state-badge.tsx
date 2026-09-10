import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LifecycleState } from "@/lib/domain/lifecycle";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";

/**
 * Pharmacy-facing lifecycle labels never vary with the assistance toggle
 * (only the NHSBSA side does), so this badge takes no `agentEnabled` prop.
 */
const LIFECYCLE_TONE: Record<LifecycleState, string> = {
  submitted: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  in_review: "bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100",
  information_requested: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
  referred_back: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  resubmitted: "bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100",
  paid: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  escalated: "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100",
};

export function ClaimStateBadge({ state, className }: { state: LifecycleState; className?: string }) {
  return (
    <Badge className={cn("whitespace-normal border-transparent", LIFECYCLE_TONE[state], className)}>
      {LIFECYCLE_LABELS[state].pharmacy}
    </Badge>
  );
}
