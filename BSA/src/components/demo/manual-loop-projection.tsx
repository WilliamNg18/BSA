import { Link } from "react-router-dom";
import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { useAppStore } from "@/lib/store";
import { formatProcessItems } from "@/lib/domain/baseline";
import { MANUAL_LOOP_METRICS, manualLoopRatio } from "@/lib/domain/manual-loop-presentation";
import { MonthlyNumber } from "./monthly-number";

export function AutomaticPricingCount() {
  const { result } = useManualLoopMonth();
  const enabled = useAppStore((s) => s.agentEnabled);
  return <section aria-label="Automatic pricing monthly aggregate" className="rounded-xl border bg-muted/30 p-4">
    <p className="font-semibold" data-auto-priced-count>Priced automatically this month, no person involved: {result ? formatProcessItems(result.counts.autoPricedItems) : "Unavailable"}{enabled ? " (estimate)" : ""}</p>
    <p className="text-sm text-muted-foreground">Whole-service context, not session completions or a projection of this pharmacy&apos;s activity.</p>
  </section>;
}

export function ManualLoopProjection() {
  const { result } = useManualLoopMonth();
  return <section aria-label="Shared monthly model" className="space-y-3 rounded-xl border p-4">
    <h2 className="font-semibold">Referral-loop estimate: Today / With the agent</h2>
    {result ? <>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {MANUAL_LOOP_METRICS.map(({ key, label, format }) => <div key={key}><dt>{label}</dt>
          <dd data-projection-metric={key}>{format(result.today[key])} / {format(result.withAgent[key])} (estimate)</dd>
        </div>)}
      </dl>
      <p className="text-sm">{manualLoopRatio(result)}</p>
      <p className="text-sm">Rule-record coverage is a synthetic assumption, not evidence of staff records or a retrieved clause.</p>
    </> : <p role="alert">Estimates unavailable. Correct the monthly inputs.</p>}
    <p className="text-sm text-muted-foreground">Estimates from labelled assumptions. <Link to="/#month" className="underline underline-offset-4">Edit monthly assumptions</Link>.</p>
  </section>;
}

export function PharmacyModelStrip() {
  const { result } = useManualLoopMonth();
  const enabled = useAppStore((s) => s.agentEnabled);
  const column = result?.[enabled ? "withAgent" : "today"];
  return <section aria-label="Shared monthly process projection" className="space-y-3 rounded-xl border p-4">
    <h3 className="font-semibold">{enabled ? "With the agent (estimate)" : "Today"}: referral-loop projection</h3>
    <p className="text-sm">Referral subset across the service, not this pharmacy&apos;s recorded items or all NHSBSA staff work.</p>
    {result && column ? <>
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {MANUAL_LOOP_METRICS.filter(({ key }) => ["referredBackItems", "operatorHours", "pharmacyCompletionHours"].includes(key)).map(({ key, label, format }) =>
          <div key={key}><dt>{label}</dt><dd data-pharmacy-model={key}><MonthlyNumber value={column[key]} format={format} />{enabled ? " (estimate)" : ""}</dd></div>)}
        <div><dt>Prevented before submission</dt><dd data-pharmacy-model="prevented">{enabled ? `${formatProcessItems(result.cohorts.prevented)} (estimate)` : "0"}</dd></div>
      </dl>
    </> : <p role="alert">Shared monthly scenario unavailable. Correct the monthly assumptions.</p>}
    <p className="text-sm text-muted-foreground">Estimates from labelled assumptions. <Link to="/#month" className="underline underline-offset-4">Edit monthly assumptions</Link>.</p>
  </section>;
}
