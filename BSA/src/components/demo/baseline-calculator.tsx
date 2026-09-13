import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { formatProcessItems } from "@/lib/domain/baseline";
import { MANUAL_LOOP_ASSUMPTIONS_LINE, MANUAL_LOOP_METRICS, manualLoopRatio, manualLoopSummary } from "@/lib/domain/manual-loop-presentation";
import { useAppStore } from "@/lib/store";
import { MonthlyNumber } from "./monthly-number";
import { ProcessAssumptions } from "./process-assumptions";

export function BaselineCalculator() {
  const enabled = useAppStore((s) => s.agentEnabled);
  const { result } = useManualLoopMonth();
  const metric = ({ key, label, format }: typeof MANUAL_LOOP_METRICS[number]) => result && <section key={key} aria-label={label} className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
    <h2 className="font-semibold">{label}</h2>
    <dl className="grid grid-cols-2 gap-4">
      {(["today", "withAgent"] as const).map((mode) => <div key={mode} className="min-w-0 space-y-2" data-process-column={mode} data-active={(mode === "withAgent") === enabled}>
        <dt className="text-sm font-medium">{mode === "today" ? "Today" : "With the agent (estimate)"}</dt>
        <dd className="break-words text-2xl font-semibold sm:text-3xl" data-process-metric={`${mode}-${key}`}>
          <MonthlyNumber value={result[mode][key]} replayKey={enabled ? "on" : "off"} format={format} />
          {mode === "withAgent" && <span className="block text-xs font-normal">estimate</span>}
        </dd>
      </div>)}
    </dl>
  </section>;
  return <section aria-label="Monthly workload calculator" className="min-w-0 space-y-5">
    <p className="text-sm">The public referral count defines this manual loop, not all NHSBSA staff work. Edited figures are assumptions.</p>
    <ProcessAssumptions />
    {result ? <>
      <div className="grid gap-4 lg:grid-cols-2" data-month-headlines>{MANUAL_LOOP_METRICS.slice(0, 2).map(metric)}</div>
      <p className="font-medium" data-hours-ratio>{manualLoopRatio(result)}</p>
      <div className="grid gap-4 lg:grid-cols-3">{MANUAL_LOOP_METRICS.slice(2, 5).map(metric)}</div>
      <p className="text-sm">Assumptions: built cases need no human gathering. With total includes abstention gathering and judgement for every queued item, without double-checks.</p>
      <section aria-label="Sequential referral cohorts" className="space-y-3 rounded-xl border p-5">
        <h2 className="font-semibold">How the smaller queue is estimated</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["manualLoopItems", "Referral-loop denominator"],
            ["prevented", "Prevented at pharmacy"],
            ["afterPrevention", "Remaining after prevention"],
            ["clearedBeforeQueue", "Cleared by code"],
            ["queued", "Queued and assumed referred back"],
            ["abstained", "Abstained: manual gathering"],
            ["built", "Built for judgement"],
          ] as const).map(([key, label]) => <div key={key}><dt>{label}{key !== "manualLoopItems" && " (estimate)"}</dt>
            <dd data-cohort={key}><MonthlyNumber value={result.cohorts[key]} format={formatProcessItems} replayKey={enabled ? "on" : "off"} /></dd></div>)}
        </dl>
        <p className="text-sm">Clearance models code, not uncounted human confirmation. All post-clearance items are assumed referred back; abstention changes gathering, not referrals.</p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">{MANUAL_LOOP_METRICS.slice(5).map(metric)}</div>
      <p className="text-sm">Synthetic comparison: Today experience only; With rule and reason recorded is assumed for all queue decisions, including documented abstention.</p>
      <p className="text-sm text-muted-foreground">This is not a claim about real staff or historical records. A documented abstention does not invent a retrieved rule.</p>
    </> : <p role="alert" className="rounded-lg border p-4 text-sm">Estimates unavailable. Correct the highlighted monthly inputs. No previous result is retained.</p>}
    <p role="status" aria-live="polite" aria-atomic="true" data-baseline-summary>
      {result ? manualLoopSummary(result) : "Calculator estimates unavailable: check the highlighted inputs."}
    </p>
    <p className="text-sm font-medium">{MANUAL_LOOP_ASSUMPTIONS_LINE}</p>
  </section>;
}
