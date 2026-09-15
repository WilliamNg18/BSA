import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMismatchEstimate } from "@/hooks/use-mismatch-estimate";
import { formatBaselineNumber, formatProcessItems } from "@/lib/domain/baseline";
import { EPS_MISMATCH_ESTIMATE } from "@/lib/domain/eps-error-evidence";
import { useAppStore } from "@/lib/store";
import { MonthlyNumber } from "./monthly-number";

const formatEstimate = (value: number) => formatBaselineNumber(value, 4);

export function MismatchEstimatePanel() {
  const id = useId();
  const draft = useAppStore((state) => state.mismatchSharePercent);
  const setDraft = useAppStore((state) => state.setMismatchSharePercent);
  const enabled = useAppStore((state) => state.agentEnabled);
  const { result, errors } = useMismatchEstimate();
  return <details className="space-y-4 rounded-xl border p-5" data-mismatch-estimate>
    <summary className="cursor-pointer font-semibold">Optional pack or strength mismatch estimate</summary>
    <div className="space-y-4 pt-3">
      <div className="space-y-2">
        <Label htmlFor={id}>{EPS_MISMATCH_ESTIMATE.inputLabel} (%)</Label>
        <Input id={id} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={draft}
          onChange={(event) => setDraft(event.target.value)} aria-invalid={Boolean(errors.sharePercent)}
          aria-describedby={`${id}-definition${errors.sharePercent ? ` ${id}-error` : ""}`} />
        <p id={`${id}-definition`} className="text-sm text-muted-foreground">Assumption: percentage of all submitted claims containing either mismatch. Default {formatBaselineNumber(EPS_MISMATCH_ESTIMATE.defaultShare * 100)}%; independent of the dispensing-error study.</p>
        {errors.sharePercent && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{errors.sharePercent}</p>}
      </div>
      {result ? <>
        <p className="text-sm" data-mismatch-volume>Total submitted claims: {formatProcessItems(result.submittedClaimVolume)}. Uses the shared monthly volume, not the referral-loop subset.</p>
        <section aria-label={EPS_MISMATCH_ESTIMATE.rowLabel} className="space-y-3">
          <h2 className="font-semibold">{EPS_MISMATCH_ESTIMATE.rowLabel}</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-sm font-medium">Today (synthetic comparison)</dt><dd data-mismatch-today>{EPS_MISMATCH_ESTIMATE.todayLabel}</dd></div>
            <div><dt className="text-sm font-medium">With the agent (estimate)</dt><dd data-mismatch-with>
              <MonthlyNumber value={result.withAgent} format={formatEstimate} replayKey={enabled ? "on" : "off"} /> (estimate)
            </dd></div>
          </dl>
        </section>
      </> : <p role="alert" className="text-sm">Mismatch estimate unavailable. {errors.submittedClaimVolume ?? "Correct the percentage above."}</p>}
      <p className="text-sm text-muted-foreground">{EPS_MISMATCH_ESTIMATE.todayBasis}</p>
      <p className="text-sm text-muted-foreground">Assumes all modelled mismatches are caught before pricing. Separate, non-additive estimate; overlap with referrals is undefined. Existing cohort and hour totals stay unchanged.</p>
    </div>
  </details>;
}
