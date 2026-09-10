import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoundaryTag } from "./labels";
import { BaselineAssumptions } from "./baseline-assumptions";
import { BASELINE_FIELDS, GATHERING_STEPS, baselineSummary, formatBaselineNumber, BASELINE_DEFAULTS, baselineDefaultCopy } from "@/lib/domain/baseline";
import { useBaselineScenario } from "@/hooks/use-baseline-scenario";
import { BaselineFlow } from "./baseline-flow";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { PainMarker } from "./pain-marker";

const number = (value: number) => formatBaselineNumber(value, 1);

export function BaselineCalculator() {
  const draft = useAppStore((s) => s.baselineInputs);
  const setInput = useAppStore((s) => s.setBaselineInput);
  const enabled = useAppStore((s) => s.agentEnabled);
  const { result, errors } = useBaselineScenario();
  const isGatheringStep = (key: string) => GATHERING_STEPS.some((step) => step.key === key);
  const renderField = ({ key, label, hint, integer }: typeof BASELINE_FIELDS[number]) => <div key={key} className="min-w-0 space-y-2">
    <Label htmlFor={`baseline-${key}`}>{label}</Label>
    <Input id={`baseline-${key}`} type="text" inputMode={integer ? "numeric" : "decimal"} autoComplete="off" spellCheck={false}
      value={draft[key]} onChange={(event) => setInput(key, event.target.value)} aria-invalid={Boolean(errors[key])}
      aria-describedby={`baseline-${key}-hint${errors[key] ? ` baseline-${key}-error` : ""}`} />
    <span id={`baseline-${key}-hint`} className="block text-xs text-muted-foreground">{hint}</span>
    {errors[key] && <p id={`baseline-${key}-error`} className="text-sm text-destructive">{errors[key]}</p>}
  </div>;

  return <section aria-label="Monthly workload calculator" className="min-w-0 space-y-5">
    <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm font-medium">Estimates only. Replace these assumptions with validated NHSBSA figures.</p>
    <fieldset data-prose="scenario inputs" className="min-w-0 rounded-xl border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Edit the scenario</legend>
      <div className="mb-4 flex flex-wrap items-center gap-2"><BoundaryTag cls="deterministic" /><span className="text-xs text-muted-foreground">Local arithmetic · No operational forecast</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BASELINE_FIELDS.filter(({ key }) => !isGatheringStep(key)).map(renderField)}
      </div>
      <details className="mt-5 min-w-0 rounded-lg border p-4" data-gathering-breakdown>
        <summary className="cursor-pointer font-semibold">Seven-step gathering breakdown · Synthetic minutes{GATHERING_STEPS.some(({ key }) => errors[key]) ? " · Check invalid inputs" : ""}</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{BASELINE_FIELDS.filter(({ key }) => isGatheringStep(key)).map(renderField)}</div>
      </details>
      {result && <div className="mt-3 text-sm" data-gathering-total>Manual gathering: {number(result.manualGatheringMinutes)} minutes / item, sum of seven synthetic assumptions.</div>}
      <p className="mt-4 text-xs text-muted-foreground">{baselineDefaultCopy(BASELINE_DEFAULTS).volumeNote}</p>
    </fieldset>

    {result ? <>
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <section aria-label="Today manual scenario" data-baseline-today className={cn("space-y-4 rounded-xl border bg-card p-5", !enabled && "ring-2 ring-primary")}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Today</h2><BoundaryTag cls="human" /></div>
          <p className="text-sm text-muted-foreground">Manual scenario assumption · Not real today</p>
          <p className="text-3xl font-semibold tabular-nums"><AnimatedNumber value={result.today.operatorHours} /> <span className="text-sm font-normal">reference operator hours / month</span></p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Gathering</dt><dd>{number(result.today.gatheringMinutes / 60)} hours</dd></div>
            <div className="flex justify-between gap-3"><dt>Judging</dt><dd>{number(result.today.judgingMinutes / 60)} hours</dd></div>
            <div className="flex justify-between gap-3"><dt>Referrals · Scenario proxy</dt><dd data-referrals-today>{number(result.referrals.today)}</dd></div>
            <div className="flex justify-between gap-3 border-t pt-3"><dt>Manual review</dt><dd>{number(result.volume)} items</dd></div>
            <div><dt>Expected time before decision</dt><dd className="mt-1 font-medium">{number(result.abstainBeforeDecisionMinutes)} minutes / item</dd></div>
          </dl>
        </section>
        <section aria-label="With agent scenario" data-baseline-with className="space-y-4 rounded-xl border bg-muted/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">With agent</h2><BoundaryTag cls="agent" /></div>
          {enabled ? <>
            <p className="text-sm text-muted-foreground">Synthetic scenario · Human decisions retained</p>
            <p className="text-3xl font-semibold tabular-nums"><AnimatedNumber value={result.withAgent.operatorHours} /> <span className="text-sm font-normal">reference operator hours / month</span></p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt>Gathering</dt><dd>{number(result.withAgent.gatheringMinutes / 60)} hours</dd></div>
              <div className="flex justify-between gap-3"><dt>Judging</dt><dd>{number(result.withAgent.judgingMinutes / 60)} hours</dd></div>
              <div className="flex justify-between gap-3"><dt>Referrals · Assumed</dt><dd data-referrals-with>{number(result.referrals.withAgent)}</dd></div>
              <div className="flex justify-between gap-3 border-t pt-3"><dt>Pharmacy-caught (assumed)</dt><dd data-cohort="pharmacy">{number(result.pharmacyCaught)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Rule-cleared · No human</dt><dd data-cohort="cleared">{number(result.cleared)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Abstained · Manual fallback</dt><dd data-cohort="abstained">{number(result.abstained)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Built · Human review</dt><dd data-cohort="built">{number(result.built)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">Pharmacy avoidance is count-only. Pharmacy effort excluded; no causal savings claim.</p>
          </> : <p className="text-sm" data-baseline-off>Agent Off. Today is highlighted; assisted estimates hidden. Enable assistance in the header to compare. Inputs are retained.</p>}
          <PainMarker resolved={enabled} pain="Manual gathering assumed" resolution="Assisted review assumed; judging unchanged" />
        </section>
      </div>
      <section data-prose="comparison boundary"><h2 className="font-semibold">Comparison boundary</h2><p>Judging remains V × j / 60 hours on both sides. Pharmacy avoidance creates no assumed judgement savings.</p></section>
      <section data-prose="referral boundary"><h2 className="font-semibold">Referral boundary</h2><p>Today referrals equal scenario volume, not total exceptions. Assisted referrals use editable deficiency assumptions.</p></section>
      {enabled && <BaselineFlow result={result} />}
      {enabled && <section aria-label="Assembly latency, not operator effort" className="rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Assembly latency, not operator effort</h2>
        <dl className="mt-2 space-y-2"><div><dt>Synthetic engine latency</dt><dd><AnimatedNumber value={result.assemblySeconds} /> seconds / built item</dd></div><div><dt>Expected time before decision</dt><dd>Built: {number(result.builtBeforeDecisionMinutes)} minutes; abstained: {number(result.abstainBeforeDecisionMinutes)} minutes</dd></div></dl>
        <p className="mt-1">Per-item assumptions apply even to empty cohorts. Queue delay excluded; machine latency is not operator effort.</p>
      </section>}
    </> : <p className="rounded-lg border p-4 text-sm">Enter valid assumptions in every field to show estimates. No previous result is retained.</p>}
    <section data-prose="scenario summary" className="rounded-lg border p-4"><h2 className="mb-2 font-semibold">Scenario summary</h2><p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground" data-baseline-summary>{result ? baselineSummary(result, enabled) : "Calculator estimates unavailable: check the highlighted inputs."}</p></section>
    <section aria-label="Scenario cohort definitions" className="rounded-xl border p-4 text-sm">
      <h2 className="font-semibold">What the cohorts mean</h2>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><dt className="font-medium">Pharmacy-caught</dt><dd>Assumed caught and corrected before submission, so never enters the NHSBSA queue. Avoidance count only.</dd></div>
        <div><dt className="font-medium">Rule-cleared</dt><dd>Code establishes certainty without a person touching the case. Existing pricing is unchanged; no AI or model call.</dd></div>
        <div><dt className="font-medium">Abstained</dt><dd>Cannot safely interpret or find a provision. Reasons accompany the hand-off; the existing manual path remains unchanged.</dd></div>
        <div><dt className="font-medium">Case built</dt><dd>Evidence and recommendation pass through the deterministic compliance gate. A human reviews and decides; the agent never approves or prices.</dd></div>
      </dl>
    </section>
    <BaselineAssumptions />
  </section>;
}