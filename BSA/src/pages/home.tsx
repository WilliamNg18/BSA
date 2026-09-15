import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { FollowItem } from "../components/demo/case-links";
import { pharmacyCaseLink } from "@/lib/case-links";
import { PainMarker } from "@/components/demo/pain-marker";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { ExceptionPipeline } from "@/components/demo/exception-pipeline";
import { SceneDiagram, TwoPlacesDiagram } from "@/components/demo/tour-diagrams";
import { ProcessFigure } from "@/components/demo/process-figure";
import { PROCESS_PUBLIC_FACTS, formatProcessItems } from "@/lib/domain/baseline";
import { runAgent } from "@/lib/domain/agent";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { PLAYABLE_CASE_IDS } from "@/lib/domain/cases";
import { SOURCES_FOOTER, TOUR_CONTENT } from "@/lib/domain/public-facts";
import { TOUR_CHAPTERS, TOUR_STOPS, tourStopIndex } from "@/lib/tour-navigation";
import { useAppStore } from "@/lib/store";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { REC_META } from "@/components/demo/label-meta";

function TourProcessCase({ id }: { id: string }) {
  const item = useLifecycleCase(id);
  const process = useAppStore((s) => s.itemProcesses[id]);
  const revision = useAppStore((s) => s.caseRevisions[id]?.at(-1));
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const perspective = useAppStore((s) => s.perspective);
  if (!item || !process) return <li role="alert">Case evidence unavailable for {id}.</li>;
  const automatic = process.routing.outcome === "auto_priced";
  const capture = process.routing.outcome === "type1_capture" && process.routing.requiresHuman;
  const captureComplete = process.routing.outcome === "type1_capture" && !process.routing.requiresHuman;
  const poorPaper = item.imageQuality < QUALITY_THRESHOLD || item.imageStyle === "handwritten_poor";
  const hasDeclaration = Boolean(revision?.declaration || revision?.paperDeclaration);
  const captureGuidance = agentEnabled && hasDeclaration
    ? poorPaper
      ? "Proposed: declared by the pharmacy, not read from the form. Humans confirm compatible evidence; image certainty stays unknown. Unreconciled evidence still abstains."
      : "Proposed: declared by the pharmacy, not read from the form. Humans confirm against the paper; unreconciled evidence still abstains."
    : agentEnabled
      ? "No pharmacy declaration is available. Key fields from the paper; code routes confirmed evidence. Type 2 judgement follows only when required."
      : "Key product, quantity and endorsement from the image. Code routes confirmed evidence; Type 2 judgement follows only when required.";
  const pack = runAgent(item, { agentEnabled });
  return <li className="space-y-4 rounded-xl border bg-card p-5" data-case={item.scenario} data-case-routing={process.routing.outcome}
    data-case-capture={captureComplete ? "complete" : capture ? "pending" : undefined}>
    <div><p className="text-xs text-muted-foreground">Case {item.scenario} · {item.id}</p><h2 className="mt-1 font-semibold">{item.title}</h2></div>
    {automatic ? <section className="space-y-3 text-sm" aria-label="Automatically priced case">
      <BoundaryTag cls="existing" />
      <h3 className="font-medium">Automated pricing</h3>
      <p>Priced by NHSBSA&apos;s existing rules engine, no person involved. Normal payment schedule; no operator queue row.</p>
    </section> : captureComplete ? <section className="space-y-3 text-sm" aria-label="Completed Type 1 capture">
      <BoundaryTag cls="human" />
      <p className="font-medium">Capture complete · Existing pricing</p>
      <p>A person confirmed the captured fields. Existing pricing followed without Type 2 judgement; human work remains recorded, not untouched automatic pricing.</p>
      <BoundaryTag cls="existing" />
    </section> : capture ? <section className="space-y-3 text-sm" aria-label="Awaiting Type 1 capture">
      <BoundaryTag cls="human" />
      <h3 className="font-medium">{poorPaper ? "Unreadable paper" : "Paper"} · Type 1 capture</h3>
      <p>{captureGuidance}</p>
      {agentEnabled && hasDeclaration && <BoundaryTag cls="agent" />}
    </section> : <>
      <PainMarker resolved={agentEnabled && pack.gate.result === "PASS"} pain="Evidence needs review" resolution="Evidence assembled; human decides" />
      {agentEnabled ? <>
        <div className="space-y-2" aria-live="polite"><BoundaryTag cls="agent" /><p className="text-sm font-semibold" data-outcome>{REC_META[pack.recommendation].label}</p></div>
        <p className="text-sm">Gate: {pack.gate.result.replaceAll("_", " ")}</p>
        {pack.recommendation === "REFER_BACK" && pack.requirementResults.filter((result) => result.met !== true).map(({ requirement, met }) =>
          <p key={requirement.id} className="text-sm" data-correction>Review requirement: {requirement.label} ({met === false ? "not met" : "unknown"}).</p>)}
        {pack.conflicts.map((conflict) => <dl key={conflict.field} className="text-sm"><dt className="font-medium">{conflict.field} · Unresolved</dt>{conflict.values.map((value) => <dd key={value.origin}>{value.origin}: {value.value}</dd>)}</dl>)}
        {pack.abstainReasons.length > 0 && <ul aria-label="Abstention signals" className="space-y-2 text-sm"><li>Provision: {pack.signals.provisionFound ? "Found" : "Not found"}</li><li>Image quality: {pack.signals.imageQuality.toFixed(2)} / threshold {QUALITY_THRESHOLD.toFixed(2)}</li><li>Readings agree: {pack.signals.sampleAgreement.agree} of {pack.signals.sampleAgreement.total}</li></ul>}
        <details className="text-sm"><summary className="cursor-pointer font-medium">Outcome evidence and exact correction</summary><div className="mt-3 space-y-3 text-muted-foreground"><ul aria-label="Requirement checks" className="space-y-2">{pack.requirementResults.map((r) => <li key={r.requirement.id}>{r.requirement.label}: {r.met === true ? "met" : r.met === false ? "not met" : "unknown"}</li>)}</ul>{pack.abstainReasons.length > 0 && <ul aria-label="Abstention reasons" className="list-disc pl-4">{pack.abstainReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}{perspective !== "pharmacy" && <Link className="underline" to={`/case/${item.id}`}>Review full evidence and human decision</Link>}</div></details>
      </> : <div className="space-y-3 text-sm" data-manual-tasks><BoundaryTag cls="human" /><p className="font-medium">Manual review · No recommendation</p><ul className="list-disc space-y-2 pl-4"><li>{process.channel === "eps" ? "Read EPS claim message" : "Locate paper image and claim"}</li><li>Check product and governing rule</li><li>Review evidence and record a decision</li></ul></div>}
    </>}
    {!automatic && !captureComplete && perspective !== "pharmacy" && <Button asChild variant="outline" size="sm"><Link to={`/case/${item.id}`}>Open case {item.scenario}</Link></Button>}
    {automatic && perspective !== "nhsbsa" && <Link className="inline-block text-sm underline underline-offset-4" to={pharmacyCaseLink(item.id)}>View automatically priced claim</Link>}
    {captureComplete && perspective !== "nhsbsa" && <Link className="inline-block text-sm underline underline-offset-4" to={pharmacyCaseLink(item.id)}>View priced claim</Link>}
    <FollowItem id={item.id} />
  </li>;
}

export function HomePage() {
  const { pathname, hash } = useLocation();
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const perspective = useAppStore((s) => s.perspective);
  const chapterNumber = TOUR_STOPS[tourStopIndex(pathname, hash)].chapter;
  const { input } = useManualLoopMonth();
  const chapter = TOUR_CONTENT.chapters.find((item) => item.chapter === chapterNumber);
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" data-tour-chapter={chapterNumber}>
      <nav aria-label="Overview sections" className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
        {TOUR_CHAPTERS.map((section) => <Link key={section.to} to={section.to}
          aria-current={section.chapter === chapterNumber ? "page" : undefined}
          className="rounded-md px-3 py-2 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 aria-[current=page]:bg-muted">
          {section.label}
        </Link>)}
      </nav>
      <div className="max-w-3xl space-y-3" data-tour-prose data-prose="chapter narrative">
        <h1 tabIndex={-1} data-tour-heading className="rounded-sm font-semibold tracking-tight focus-visible:outline-2 text-4xl">{chapter?.title ?? "A month of work"}</h1>
        <p className="text-muted-foreground">{chapter?.prose ?? "Compare manual and assisted workload using editable synthetic assumptions. The referral-subset volume is a scale proxy, not measured NHSBSA performance."}</p>
      </div>
      {chapterNumber === 1 && <>
        <ul aria-label="Public context figures" className="grid gap-4 lg:grid-cols-3">
          {TOUR_CONTENT.keyFigures.map((figure) => <li key={figure.id} className="space-y-3 rounded-xl border bg-card p-5" data-key-figure={figure.id}>
            <p className="font-semibold tracking-tight text-4xl"><ProcessFigure source="Public" label={figure.label} explanation={figure.qualifier}>{figure.value}</ProcessFigure></p>
            <p className="text-sm font-medium">{figure.label}</p>
          </li>)}
        </ul>
        <BaselineScene />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <SceneDiagram />
          <section className="space-y-4 rounded-xl border bg-muted/30 p-5" aria-label="Public process context">
            <h2 className="font-semibold">Whole-process context</h2>
            <dl className="space-y-4 text-sm">{([
              ["Monthly items", `Over ${formatProcessItems(PROCESS_PUBLIC_FACTS.monthlyItemsLowerBound)}`],
              ["EPS messages", `${PROCESS_PUBLIC_FACTS.epsPercent}%`],
              ["Scanned paper", `${PROCESS_PUBLIC_FACTS.paperPercent}%`],
              ["Type 1 items a month", formatProcessItems(PROCESS_PUBLIC_FACTS.type1MonthlyItems)],
              ["Type 2 items a month", formatProcessItems(PROCESS_PUBLIC_FACTS.type2MonthlyItems)],
            ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="font-semibold">
              <ProcessFigure source="Public" label={label} explanation="Approximate owner-supplied process context, not independently verified. Type 1 and Type 2 may overlap.">{value}</ProcessFigure>
            </dd></div>)}</dl>
          </section>
        </div>
      </>}
      {chapterNumber === 2 && <BaselineCalculator />}
      {chapterNumber === 3 && <ExceptionPipeline />}
      {chapterNumber === 4 && <>
        <h2 className="text-2xl font-semibold">Processing cases · Follow each path</h2>
        <p className="text-sm font-medium">Synthetic cases · Human confirmation and judgement where required</p>
        <ul aria-label="Four canonical synthetic cases" className="grid items-start gap-4 grid-cols-2 xl:grid-cols-4">
          {PLAYABLE_CASE_IDS.map((id) => <TourProcessCase key={id} id={id} />)}
        </ul>
        <Button asChild variant="outline"><Link to="/boundary">Inspect the proposed evidence boundary</Link></Button>
      </>}
      {chapterNumber === 5 && <>
        <TwoPlacesDiagram enabled={agentEnabled} />
        <section aria-label="Referral and resubmission loop" className="space-y-3 rounded-xl border p-5">
          <h2 className="font-semibold">One item, both sides</h2>
          <ol className="grid gap-3 text-sm grid-cols-3">
            <li>{perspective === "pharmacy" ? "NHSBSA: human referral decision" : <Link className="underline" to="/case/EX-24112">NHSBSA: human referral decision</Link>}</li>
            <li>{perspective === "nhsbsa" ? "Pharmacy: correction and resubmission" : <Link className="underline" to={pharmacyCaseLink("EX-24112")}>Pharmacy: correction and resubmission</Link>}</li>
            <li>{perspective === "pharmacy" ? "NHSBSA: human re-check" : <Link className="underline" to="/queue">NHSBSA: human re-check</Link>}</li>
          </ol>
          <p className="text-sm text-muted-foreground">Workflow and delays are assumptions to validate. Shared session history is implemented locally; a shared operational service remains proposed.</p>
          <FollowItem id="EX-24112" />
        </section>
        {perspective !== "nhsbsa" && <Button asChild variant="outline"><Link to="/pharmacy">Open pharmacy precheck example</Link></Button>}
      </>}
      {chapterNumber === 6 && <>
        <section aria-label="Central prevention assumption" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">What would kill this estimate?</h2>
          {input ? <p className="text-sm" data-central-bet>Central bet: pharmacy checks prevent {input.preventionPercent}% of would-be referrals (assumption). If measured prevention is substantially lower, the estimate fails.</p>
            : <p role="alert">Central bet unavailable. Correct the monthly assumptions before presenting an estimate.</p>}
          <Link className="inline-block text-sm underline" to="/#month">Inspect the editable prevention assumption</Link>
        </section>
        <section aria-label="Proposed outcomes" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Fewer items back. A judgement you can reconstruct.</h2>
          <p className="text-sm">Rule and reason recorded; the agent verifies and advises; a person decides. Existing pricing stays unchanged. Fewer referrals are estimates, not measured savings.</p>
        </section>
        <dl className="grid gap-4 rounded-xl border bg-card p-5 grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">First test</dt><dd className="mt-1 font-medium">Concentration of referral reasons</dd></div>
          <div><dt className="text-xs text-muted-foreground">Requested history</dt><dd className="mt-1 font-medium">Two years · Item-level reasons</dd></div>
          <div><dt className="text-xs text-muted-foreground">Decision</dt><dd className="mt-1 font-medium">Proceed, reshape or stop</dd></div>
        </dl>
        <details className="rounded-xl border p-5">
          <summary className="cursor-pointer font-semibold">{TOUR_CONTENT.assumptionsDisclosure.title}</summary>
          <p className="my-3 text-sm text-muted-foreground">{TOUR_CONTENT.assumptionsDisclosure.text}</p>
          <ol className="list-decimal space-y-5 pl-5">{TOUR_CONTENT.assumptionsDisclosure.assumptions.map((assumption) => <li key={assumption.text} className="space-y-2 text-sm" data-prose="assumption"><h2 className="font-medium">{assumption.text}</h2><p>Validate: {assumption.validation}</p><p>If wrong: {assumption.ifWrong}</p></li>)}</ol>
        </details>
        <details className="rounded-xl border p-5">
          <summary className="cursor-pointer font-semibold">{TOUR_CONTENT.questionsDisclosure.title}</summary>
          <p className="my-3 text-sm text-muted-foreground">{TOUR_CONTENT.questionsDisclosure.text}</p>
          <ol aria-label="Seven discovery questions" className="list-decimal space-y-5 pl-5">{TOUR_CONTENT.questionsDisclosure.questions.map((question) => <li key={question.id} className="space-y-2 text-sm" data-prose="discovery question"><p>{question.text}</p></li>)}</ol>
        </details>
      </>}
      {chapterNumber === 1 && <footer className="border-t pt-4 text-xs text-muted-foreground" aria-label="Sources"><span className="font-medium">Sources: </span>{SOURCES_FOOTER}</footer>}
    </div>
  );
}
