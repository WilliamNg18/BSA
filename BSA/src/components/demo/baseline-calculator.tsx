import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BoundaryTag } from "./labels";
import { BaselineAssumptions } from "./baseline-assumptions";
import { MONTH_DETAIL_FIELDS, GATHERING_STEPS, MONTH_FIELDS, monthSummary, formatBaselineNumber as number } from "@/lib/domain/baseline";
import { useMonthModel } from "@/hooks/use-month-model";
import { BaselineFlow } from "./baseline-flow";
import { useAppStore } from "@/lib/store";
import { MonthlyNumber } from "./monthly-number";
import { ReferralProxy } from "./referral-proxy";

export function BaselineCalculator() {
  const draft = useAppStore((s) => s.baselineInputs);
  const todayMinutes = useAppStore((s) => s.todayMinutes);
  const setInput = useAppStore((s) => s.setBaselineInput);
  const setTodayMinutes = useAppStore((s) => s.setTodayMinutes);
  const enabled = useAppStore((s) => s.agentEnabled);
  const { result, errors } = useMonthModel();
  const detailFields = MONTH_DETAIL_FIELDS;
  const renderField = ({ key, label, hint, integer }: typeof MONTH_FIELDS[number] | typeof detailFields[number]) => <div key={key} className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={`baseline-${key}`}>{label}</Label>
      <Tooltip><TooltipTrigger asChild><Badge asChild variant="outline"><button type="button" aria-label={`About assumption: ${label}`}>Assumption</button></Badge></TooltipTrigger><TooltipContent className="max-w-72">{hint}</TooltipContent></Tooltip>
      {key === "volume" && <Tooltip><TooltipTrigger asChild><Badge asChild variant="outline"><button type="button" aria-label="About the public volume default">Public default</button></Badge></TooltipTrigger><TooltipContent className="max-w-72">Approximate public referrals, not measured total queue arrivals. Using this subset as a monthly scenario volume is an assumption.</TooltipContent></Tooltip>}
    </div>
    <Input id={`baseline-${key}`} type="text" inputMode={integer ? "numeric" : "decimal"} autoComplete="off" spellCheck={false}
      value={key === "todayMinutes" ? todayMinutes : draft[key]} onChange={(event) => key === "todayMinutes" ? setTodayMinutes(event.target.value) : setInput(key, event.target.value)}
      aria-invalid={Boolean(errors[key])} aria-describedby={`baseline-${key}-hint${errors[key] ? ` baseline-${key}-error` : ""}`} />
    <span id={`baseline-${key}-hint`} className="block text-xs text-muted-foreground">{hint}</span>
    {errors[key] && <p id={`baseline-${key}-error`} className="text-sm text-destructive">{errors[key]}</p>}
  </div>;
  const mode = enabled ? "With agent" : "Today";
  const perItem = result && (enabled ? result.perItem.withAgent : result.perItem.today);

  return <section aria-label="Monthly workload calculator" className="min-w-0 space-y-5">
    <fieldset className="min-w-0 rounded-xl border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Edit the monthly assumptions</legend>
      <div className="grid gap-5 lg:grid-cols-3">{MONTH_FIELDS.map(renderField)}</div>
    </fieldset>
    <p className="text-sm text-muted-foreground">Estimates from labelled assumptions; type NHSBSA's own figures above.</p>

    {result && perItem ? <>
      <div className="grid items-stretch gap-4 sm:grid-cols-2" data-month-headlines>
        <section aria-label="Hours of operator time a month" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Hours of operator time a month</h2>
          <p className="text-sm font-medium" data-month-mode>{mode}</p>
          <p className="text-4xl font-semibold" data-month-hours><MonthlyNumber value={enabled ? result.withAgent.operatorHours : result.today.operatorHours} /></p>
          <p className="text-xs text-muted-foreground">All scenario items, including manual fallback for abstentions.</p>
        </section>
        <section aria-label="Items one operator can complete a month" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Items one operator can complete a month</h2>
          <p className="text-sm font-medium" data-month-mode>{mode}</p>
          <p className="text-4xl font-semibold" data-month-capacity><MonthlyNumber value={enabled ? result.capacity.withAgent : result.capacity.today} /></p>
          <p className="text-xs text-muted-foreground">Assumption: 6 hours a day, 21 days = {number(result.capacity.workingMinutes)} minutes. Built-case capacity, not a mixed-cohort guarantee.</p>
        </section>
      </div>
      <section aria-label="Operator minutes per item" className="space-y-3 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{mode}: operator minutes per item</h2><BoundaryTag cls="human" /></div>
        <svg viewBox={`0 0 ${result.abstainBeforeDecisionMinutes} 1`} preserveAspectRatio="none" className="h-6 w-full rounded" role="img"
          aria-label={`${mode}: gathering ${number(perItem.gatheringMinutes)} minutes; judging ${number(perItem.judgingMinutes)} minutes`}
          data-per-item-bar>
          <rect width={result.abstainBeforeDecisionMinutes} height="1" className="fill-muted" />
          <rect width={perItem.gatheringMinutes} height="1" className="fill-muted-foreground" data-gathering-bar />
          <rect x={perItem.gatheringMinutes} width={perItem.judgingMinutes} height="1" className="fill-primary" data-judging-bar />
        </svg>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt>Gathering</dt><dd data-per-item-gathering>{number(perItem.gatheringMinutes)} minutes</dd>{enabled && <dd>gathering done by the agent and code in seconds</dd>}</div>
          <div><dt>Judging</dt><dd data-per-item-judging>{number(perItem.judgingMinutes)} minutes</dd></div>
        </dl>
        <p className="text-sm">Abstentions are worked as today: {number(result.abstainBeforeDecisionMinutes)} operator minutes per item, including manual gathering.</p>
      </section>
    </> : <p role="alert" className="rounded-lg border p-4 text-sm">Estimates unavailable. Correct the highlighted inputs, including any inside Show the detail. No previous result is retained.</p>}
    <p className="font-medium">Time is spent only where a person adds something: the judgement.</p>
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-baseline-summary>{result ? monthSummary(result, enabled) : "Calculator estimates unavailable: check the highlighted inputs."}</p>

    <details className="min-w-0 space-y-4 rounded-xl border p-5" data-month-detail>
      <summary className="cursor-pointer font-semibold">Show the detail{Object.keys(errors).some((key) => detailFields.some((field) => field.key === key)) ? " · Check invalid inputs" : ""}</summary>
      <div className="space-y-4 pt-4">
        <section className="space-y-4" data-gathering-breakdown>
          <h2 className="font-semibold">Seven-step gathering breakdown</h2>
          <p className="text-sm">These are proportional weights, not extra minutes. They divide today's gathering-only time; judging is not added again.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{detailFields.filter(({ key }) => GATHERING_STEPS.some((step) => step.key === key)).map(renderField)}</div>
          {result && <><p className="text-sm" data-gathering-total>Manual gathering: {number(result.manualGatheringMinutes)} minutes / item.</p><dl className="grid gap-3 text-sm sm:grid-cols-2">{result.gatheringSteps.map((step) => <div key={step.key}><dt>{step.label.replace(" minutes / item", "")}</dt><dd data-gathering-step={step.key}>{number(step.minutes)} minutes</dd></div>)}</dl></>}
        </section>
        <section className="space-y-4">
          <h2 className="font-semibold">Cohort and referral assumptions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{detailFields.filter(({ key }) => !GATHERING_STEPS.some((step) => step.key === key)).map(renderField)}</div>
          <p className="text-sm">Pharmacy-caught items are assumed corrected before submission. Rule-cleared items need no model call or human touch. Built cases need a human decision; abstentions retain the manual path.</p>
        </section>
        {result && enabled && <><BaselineFlow result={result} /><ReferralProxy result={result} /></>}
        <BaselineAssumptions />
      </div>
    </details>
  </section>;
}
