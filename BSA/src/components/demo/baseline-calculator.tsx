import { useProcessMonth } from "@/hooks/use-process-month";
import { formatProcessHours, formatProcessItems, type ProcessMonthColumn } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";
import { MonthlyNumber } from "./monthly-number";
import { ProcessFigure } from "./process-figure";
import { ProcessAssumptions } from "./process-assumptions";

const METRICS = {
  referredBackItems: { label: "Items referred back a month", context: "Shared monthly scenario. Today uses the supplied referral default; With the agent applies only the assumed pre-submission catch." },
  referralOperatorHours: { label: "Operator hours", context: "Referral investigation only, using the assumed minutes per referred-back item. Do not add to overlapping Type 2 stream hours." },
  pharmacyCompletionHours: { label: "Pharmacy hours", context: "Pharmacy endorsement completion on the referral loop, using assumed minutes per item. Not NHSBSA operator labour." },
  type2OperatorHours: { label: "Type 2 stream hours", context: "All modelled Type 2 items: average seconds Today; built-case judging or manual abstention With the agent. Not additive with referral investigation." },
  caughtBeforeSubmission: { label: "Items caught before submission", context: "Modelled corrections from the assumed catch share of would-be referrals. Not observed catches or additional referral reductions." },
  decisionsWithRuleAndReason: { label: "Decisions with rule and reason recorded", context: "Synthetic comparison assumption: Today zero; With the agent all built cases after human judgement. Not a claim about all real staff." },
} as const;

export function BaselineCalculator() {
  const enabled = useAppStore((s) => s.agentEnabled);
  const { result } = useProcessMonth();
  const modes = [
    { key: "today", label: "Today", active: !enabled },
    { key: "withAgent", label: "With the agent", active: enabled },
  ] as const;
  const metric = (key: keyof typeof METRICS) => result && <div className="grid grid-cols-2 gap-4">
    {modes.map((mode) => <div key={mode.key} className="min-w-0 space-y-2" data-process-column={mode.key} data-active={mode.active}>
      <p className={mode.active ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>{mode.label}</p>
      <div className="break-words text-2xl font-semibold sm:text-3xl" data-process-metric={`${mode.key}-${key}`}>
        <ProcessFigure source="Assumption" label={`${mode.label} ${METRICS[key].label}`} explanation={METRICS[key].context}>
          <MonthlyNumber value={result[mode.key][key]} replayKey={enabled ? "on" : "off"}
            format={key === "referralOperatorHours" || key === "pharmacyCompletionHours" || key === "type2OperatorHours" ? formatProcessHours : formatProcessItems} />
        </ProcessFigure>
      </div>
    </div>)}
  </div>;
  const assurance = (column: ProcessMonthColumn) => column.monthlyRuleAssurance === "experience_only"
    ? "Experience only"
    : "Clause and version cited on every built-case judgement";

  return <section aria-label="Monthly workload calculator" className="min-w-0 space-y-5">
    {result ? <>
      <div className="grid items-stretch gap-4 lg:grid-cols-2" data-month-headlines>
        <section aria-label="Items referred back a month" className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Items referred back a month</h2>
          {metric("referredBackItems")}
        </section>
        <section aria-label="Hours on the referred-back loop" className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Hours on the referred-back loop</h2>
          <h3 className="text-sm font-medium">Operator hours</h3>{metric("referralOperatorHours")}
          <h3 className="text-sm font-medium">Pharmacy hours</h3>{metric("pharmacyCompletionHours")}
        </section>
      </div>
      <section aria-label="Type 2 stream hours" className="space-y-4 rounded-xl border p-5">
        <h2 className="font-semibold">Type 2 stream hours</h2>
        {metric("type2OperatorHours")}
        <p className="text-sm text-muted-foreground">Built-case judging can take longer than today&apos;s average. Referral investigation overlaps this stream; these hours must not be added together.</p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-xl border p-5" aria-label="Items caught before submission">
          <h2 className="font-semibold">Items caught before submission</h2>{metric("caughtBeforeSubmission")}
        </section>
        <section className="min-w-0 space-y-4 rounded-xl border p-5" aria-label="Rule and reason recorded">
          <h2 className="font-semibold">Decisions with rule and reason recorded</h2>{metric("decisionsWithRuleAndReason")}
          <p className="text-sm text-muted-foreground">Synthetic comparison only, not a statement that real staff never record rules or reasons.</p>
        </section>
      </div>
      <section className="space-y-3 rounded-xl border p-5" aria-label="Monthly rule change assurance">
        <h2 className="font-semibold">Monthly rule change assurance</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">{modes.map((mode) => <div key={mode.key}>
          <dt className="font-medium">{mode.label}</dt><dd>{assurance(result[mode.key])}</dd>
        </div>)}</dl>
        <p className="text-sm text-muted-foreground">Synthetic comparison, not measured accuracy. Abstentions retain the manual path; historical human records remain unchanged.</p>
      </section>
    </> : <p role="alert" className="rounded-lg border p-4 text-sm">Estimates unavailable. Correct the highlighted monthly inputs. No previous result is retained.</p>}
    <p className="font-medium">Fewer items come back, and every judgement carries its rule and reason; the agent verifies and advises, it does not pay.</p>
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-baseline-summary>
      {result ? `${enabled ? "With the agent" : "Today"}: ${formatProcessItems(result[enabled ? "withAgent" : "today"].referredBackItems)} items referred back. Shared monthly estimates updated.` : "Calculator estimates unavailable: check the highlighted inputs."}
    </p>
    <ProcessAssumptions />
  </section>;
}
