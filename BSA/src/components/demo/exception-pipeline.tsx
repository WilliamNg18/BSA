import { ArrowDown, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useBaselineScenario } from "@/hooks/use-baseline-scenario";
import { ASSISTANCE_PHASES, useAssistancePresentation } from "@/hooks/use-assistance-presentation";
import { GATHERING_STEPS, formatBaselineNumber } from "@/lib/domain/baseline";
import { runAgent } from "@/lib/domain/agent";
import { CASES } from "@/lib/domain/cases";
import { useAppStore } from "@/lib/store";
import { BoundaryTag } from "./labels";
import { PainMarker } from "./pain-marker";
import { ReferralProxy } from "./referral-proxy";

const earlyStages = [
  { title: "Scanning and capture", text: "Capture the form and retain its image.", cls: "existing" },
  { title: "ICR and extraction", text: "Printed fields work; uncertain handwriting still needs review.", cls: "existing" },
  { title: "Deterministic pricing", text: "Price certain items through existing code. Route uncertain exceptions onwards; no agent prices or approves payments.", cls: "deterministic" },
] as const;

// Each manual input keeps its own marker; only its completed presentation
// phase can assist the built cohort. This mapping never changes case state.
const gatheringPhase = {
  findFormMinutes: 0,
  readEndorsementMinutes: 1,
  productPackMinutes: 1,
  claimRecordsMinutes: 1,
  tariffVersionClauseMinutes: 2,
  compareSourcesMinutes: 3,
  recordReasonMinutes: 4,
} as const satisfies Record<(typeof GATHERING_STEPS)[number]["key"], number>;

/** Presentation only. The shared selector supplies every scenario count. */
export function ExceptionPipeline() {
  const enabled = useAppStore((s) => s.agentEnabled);
  const { result, input } = useBaselineScenario();
  const { preparing, phase } = useAssistancePresentation();
  const builtReady = enabled && !preparing && !!result && result.built > 0;
  const n = (value: number) => formatBaselineNumber(value, 1);
  const correction = runAgent(CASES[1], { agentEnabled: true });
  const draftReady = builtReady && correction.gate.result === "PASS" && !!correction.draftToPharmacy;
  return <section aria-label="Six-stage exception pipeline" className="space-y-4" data-pipeline>
    <section aria-label="Earlier pharmacy exit" className="space-y-3 rounded-xl border border-dashed bg-muted/30 p-4" data-pharmacy-exit>
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Before stage 1 · Pharmacy pre-check</h2><BoundaryTag cls="deterministic" /></div>
      <p className="text-sm">Assumption: catch and correct missing information before submission. These items never enter the NHSBSA pipeline.</p>
      {enabled && result && <dl className="text-sm"><div><dt>Earlier exits · Estimate</dt><dd data-pipeline-pharmacy>{n(result.pharmacyCaught)}</dd></div></dl>}
      <Link className="inline-block text-sm underline underline-offset-4" to="/pharmacy">Try the pharmacy check</Link>
    </section>
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowDown className="size-4" aria-hidden="true" />Remaining submissions enter capture</div>
    <ol aria-label="Processing stages" className="grid items-start gap-4 md:grid-cols-3">
      {earlyStages.map((stage, index) => <li key={stage.title} data-pipeline-stage={index + 1} className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{index + 1}. {stage.title}</h2>
        <BoundaryTag cls={stage.cls} />
        <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />Works today · Unchanged</div>
        <p className="text-sm text-muted-foreground">{stage.text}</p>
        {index === 1 && <PainMarker resolved={false} pain="Handwriting uncertainty" resolution="" />}
      </li>)}
      <li data-pipeline-stage="4" className="space-y-4 rounded-xl border-2 border-primary/40 bg-card p-5 md:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">4. Uncertain exceptions · Evidence gathering</h2><BoundaryTag cls={enabled ? "agent" : "human"} /></div>
        <section data-prose="gathering assumption"><p className="text-sm text-muted-foreground">Assumption: operators gather evidence across systems. Durations are editable synthetic inputs, not measured working practice.</p></section>
        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-label="Seven gathering steps" className="space-y-3">
            <h3 className="font-medium">Manual baseline · Seven steps</h3>
            <ol className="space-y-2 text-sm">{GATHERING_STEPS.map(({ key, label }, index) => {
              const step = label.replace(" minutes / item", "");
              const completed = enabled && !!result && result.built > 0 && phase > gatheringPhase[key];
              return <li key={key} data-gathering-step={key} data-gathering-phase={gatheringPhase[key]} className="space-y-2 rounded-md bg-muted/40 p-2">
                <div className="flex justify-between gap-3"><span>{index + 1}. {step}</span><span className="shrink-0 tabular-nums">{input ? `${n(input[key])} min` : "Unavailable"}</span></div>
                <PainMarker resolved={completed} pain={step} resolution={`${step} · Built only; human review remains`} />
              </li>;
            })}</ol>
            {result && <dl className="text-sm"><div><dt>Gathering · Assumed minutes / item</dt><dd data-pipeline-gathering>{n(result.manualGatheringMinutes)}</dd></div></dl>}
          </section>
          <section aria-label="Conditional evidence kernel" className="space-y-3 rounded-lg border bg-muted/20 p-4" data-kernel>
            <h3 className="font-medium">Only uncertain items reach the kernel</h3>
            {enabled && result ? <>
              <div className="text-sm" role="status" aria-live="polite" aria-atomic="true" data-kernel-status>{preparing ? `Preparing assistance · ${ASSISTANCE_PHASES[phase] ?? "Complete"}` : "Evidence presentation ready · Simulated, not a model call"}</div>
              <ol aria-label="Kernel phases" className="space-y-2 text-sm">{ASSISTANCE_PHASES.map((label, index) => <li key={label} data-kernel-phase={preparing ? index < phase ? "complete" : index === phase ? "active" : "pending" : "complete"} className="flex flex-wrap justify-between gap-2 rounded-md border p-2"><span>{label}</span><span>{preparing ? index < phase ? "Shown" : index === phase ? "Preparing" : "Next" : "Shown"}</span>{index === 3 && <BoundaryTag cls="deterministic" />}</li>)}</ol>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt>Built · Human review</dt><dd data-pipeline-built>{n(result.built)}</dd></div>
                <div><dt>Abstained · Manual fallback</dt><dd data-pipeline-abstained>{n(result.abstained)}</dd></div>
              </dl>
              <PainMarker resolved={false} pain="Case D stays manual; no safe interpretation" resolution="" />
            </> : <p className="text-sm">{enabled ? "Estimates unavailable. Correct the calculator inputs." : "Agent Off. Gather evidence manually; no recommendation or proposed record."}</p>}
          </section>
        </div>
        <Link className="inline-block text-sm underline underline-offset-4" to="/#month">Edit shared gathering assumptions</Link>
      </li>
      <li data-pipeline-stage="5" className="space-y-4 rounded-xl border bg-card p-5 md:col-span-2">
        <h2 className="font-semibold">5. Operator judgement and reason</h2>
        <BoundaryTag cls="human" />
        <section data-prose="operator assumption"><h3 className="text-sm font-medium">Assumption · Validate current practice</h3><p className="mt-2 text-sm text-muted-foreground">Free-text reasons may omit the governing rule. This is not an established description of NHSBSA operators.</p></section>
        {enabled && result && <section aria-label="Built-only proposal" className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">Built exceptions only · Proposed record</h3><BoundaryTag cls="agent" /></div>
          <dl className="text-sm"><div><dt>Rule and reason proposals · Estimate</dt><dd data-pipeline-proposals>{n(result.built)}</dd></div></dl>
          <p className="text-sm">Retrieved rule, checked evidence and proposed reason. A human accepts, amends or escalates; nothing is recorded automatically.</p>
        </section>}
        <PainMarker resolved={builtReady} pain="Reason and rule require manual review" resolution="Built-only proposal; operator still decides" />
        <section data-prose="manual residual"><p className="text-sm">Case D has no proposed rule or recommendation. Abstained items retain manual gathering and judgement.</p></section>
        <Link className="inline-block text-sm underline underline-offset-4" to="/queue">Review the exception queue</Link>
      </li>
      <li data-pipeline-stage="6" className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">6. Referral and correction</h2>
        <BoundaryTag cls="human" />
        <section data-prose="referral assumption"><h3 className="text-sm font-medium">Assumption · Validate cycle time</h3><p className="mt-2 text-sm text-muted-foreground">A reason-code referral cycle may take weeks. Neither that duration nor current correction detail is established here.</p></section>
        {enabled && result && <>
          <section aria-label="Exact-fix draft" className="space-y-2 rounded-lg border p-3"><h3 className="text-sm font-medium">Case B · Synthetic draft, not sent</h3><BoundaryTag cls="agent" />{draftReady ? <p className="text-sm" data-pipeline-correction>{correction.draftToPharmacy}</p> : <p className="text-sm">Draft unavailable until built evidence is ready and the compliance gate passes.</p>}</section>
          <dl className="space-y-3 text-sm"><div><dt>Assumed referrals · Same shared model</dt><dd data-pipeline-referrals>{n(result.referrals.withAgent)}</dd></div><div><dt>Residual risk · Abstained + deficient built</dt><dd data-pipeline-risk>{n(result.referralRiskResidual)}</dd></div></dl>
        </>}
        <div data-exact-fix-marker><PainMarker resolved={draftReady} pain="Exact correction needs manual drafting" resolution="Exact-fix draft ready · Built only, not sent" /></div>
        <PainMarker resolved={false} pain="Referral risk remains; no perfect outcome claim" resolution="" />
        <Link className="inline-block text-sm underline underline-offset-4" to="/case/EX-24112">Review case B and decide</Link>
      </li>
    </ol>
    {enabled && result && <ReferralProxy result={result} />}
    {!result && <p role="status" className="text-sm">Scenario estimates unavailable: correct the calculator inputs. The illustrative workflow is not a live execution.</p>}
  </section>;
}