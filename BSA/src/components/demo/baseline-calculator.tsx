import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoundaryTag } from "./labels";
import { BaselineAssumptions } from "./baseline-assumptions";
import { BASELINE_FIELDS, baselineSummary, calculateBaseline, formatBaselineNumber, parseBaselineDraft } from "@/lib/domain/baseline";
import { BASELINE_DEFAULTS, baselineDefaultCopy } from "@/lib/domain/baseline-defaults";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const number = (value: number) => formatBaselineNumber(value, 1);

export function BaselineCalculator() {
  const draft = useAppStore((s) => s.baselineInputs);
  const setInput = useAppStore((s) => s.setBaselineInput);
  const enabled = useAppStore((s) => s.agentEnabled);
  const { input, errors } = parseBaselineDraft(draft, BASELINE_DEFAULTS.assemblySeconds);
  const result = input ? calculateBaseline(input) : null;

  return <section aria-label="Monthly workload calculator" className="min-w-0 space-y-5">
    <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm font-medium">Estimates only. Replace these assumptions with validated NHSBSA figures.</p>
    <fieldset className="min-w-0 rounded-xl border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Edit the scenario</legend>
      <div className="mb-4 flex flex-wrap items-center gap-2"><BoundaryTag cls="deterministic" /><span className="text-xs text-muted-foreground">Local arithmetic · No operational forecast</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BASELINE_FIELDS.map(({ key, label, hint, integer }) => <div key={key} className="min-w-0 space-y-2">
          <Label htmlFor={`baseline-${key}`}>{label}</Label>
          <Input id={`baseline-${key}`} type="text" inputMode={integer ? "numeric" : "decimal"} autoComplete="off" spellCheck={false}
            value={draft[key]} onChange={(event) => setInput(key, event.target.value)} aria-invalid={Boolean(errors[key])}
            aria-describedby={`baseline-${key}-hint${errors[key] ? ` baseline-${key}-error` : ""}`} />
          <p id={`baseline-${key}-hint`} className="text-xs text-muted-foreground">{hint}</p>
          {errors[key] && <p id={`baseline-${key}-error`} className="text-sm text-destructive">{errors[key]}</p>}
        </div>)}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{baselineDefaultCopy(BASELINE_DEFAULTS).volumeNote}</p>
    </fieldset>

    {result ? <>
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <section aria-label="Today manual scenario" data-baseline-today className={cn("space-y-4 rounded-xl border bg-card p-5", !enabled && "ring-2 ring-primary")}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Today</h2><BoundaryTag cls="human" /></div>
          <p className="text-sm text-muted-foreground">Manual scenario assumption · Not real today</p>
          <p className="text-3xl font-semibold tabular-nums">{number(result.today.operatorHours)} <span className="text-sm font-normal">operator hours / month</span></p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Gathering</dt><dd>{number(result.today.gatheringMinutes / 60)} hours</dd></div>
            <div className="flex justify-between gap-3"><dt>Judging</dt><dd>{number(result.today.judgingMinutes / 60)} hours</dd></div>
            <div className="flex justify-between gap-3 border-t pt-3"><dt>Manual review</dt><dd>{number(result.volume)} items</dd></div>
            <div><dt>Expected time before decision</dt><dd className="mt-1 font-medium">{number(result.abstainBeforeDecisionMinutes)} minutes / item</dd></div>
          </dl>
        </section>
        <section aria-label="With agent scenario" data-baseline-with className="space-y-4 rounded-xl border bg-muted/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">With agent</h2><BoundaryTag cls="agent" /></div>
          {enabled ? <>
            <p className="text-sm text-muted-foreground">Synthetic scenario · Human decisions retained</p>
            <p className="text-3xl font-semibold tabular-nums">{number(result.withAgent.operatorHours)} <span className="text-sm font-normal">operator hours / month</span></p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt>Gathering</dt><dd>{number(result.withAgent.gatheringMinutes / 60)} hours</dd></div>
              <div className="flex justify-between gap-3"><dt>Judging</dt><dd>{number(result.withAgent.judgingMinutes / 60)} hours</dd></div>
              <div className="flex justify-between gap-3 border-t pt-3"><dt>Pharmacy-caught (assumed)</dt><dd data-cohort="pharmacy">{number(result.pharmacyCaught)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Rule-cleared · No human</dt><dd data-cohort="cleared">{number(result.cleared)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Abstained · Manual fallback</dt><dd data-cohort="abstained">{number(result.abstained)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Built · Human review</dt><dd data-cohort="built">{number(result.built)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">No NHSBSA human touch assumed for pharmacy-caught or rule-cleared items. Pharmacy effort excluded.</p>
          </> : <p className="text-sm" data-baseline-off>Agent Off. Today is highlighted; With agent estimates are hidden. Use Agent: Off in the header to restore the comparison. Inputs are retained.</p>}
        </section>
      </div>
      {enabled && <section aria-label="Assembly latency, not operator effort" className="rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Assembly latency, not operator effort</h2>
        <p className="mt-2">{number(result.assemblySeconds)} seconds / built item, derived from the synthetic engine. Not added to operator hours.</p>
        <p className="mt-1">Expected time before decision: built {number(result.builtBeforeDecisionMinutes)} minutes (judging + assembly); abstained {number(result.abstainBeforeDecisionMinutes)} minutes (gathering + judging). Per-item assumptions, even when a cohort is empty; queue delay excluded.</p>
      </section>}
    </> : <p className="rounded-lg border p-4 text-sm">Enter valid assumptions in every field to show estimates. No previous result is retained.</p>}
    <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground" data-baseline-summary>{result ? baselineSummary(result, enabled) : "Calculator estimates unavailable: check the highlighted inputs."}</p>
    <BaselineAssumptions />
  </section>;
}