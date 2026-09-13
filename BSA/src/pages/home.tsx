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
import { CASES } from "@/lib/domain/cases";
import { SOURCES_FOOTER, TOUR_CONTENT } from "@/lib/domain/public-facts";
import { TOUR_STOPS, tourStopIndex } from "@/lib/tour-navigation";
import { useAppStore } from "@/lib/store";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";

function TourProcessCase({ id }: { id: string }) {
  const item = useLifecycleCase(id);
  const process = useAppStore((s) => s.itemProcesses[id]);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const perspective = useAppStore((s) => s.perspective);
  if (!item || !process) return <li role="alert">Case evidence unavailable for {id}.</li>;
  const automatic = process.routing.outcome === "auto_priced";
  const capture = process.routing.outcome === "type1_capture" && process.routing.requiresHuman;
  const captureComplete = process.routing.outcome === "type1_capture" && !process.routing.requiresHuman;
  const pack = runAgent(item, { agentEnabled });
  return <li className="space-y-4 rounded-xl border bg-card p-5" data-case={item.scenario} data-case-routing={process.routing.outcome}
    data-case-capture={captureComplete ? "complete" : capture ? "pending" : undefined}>
    <div><p className="text-xs text-muted-foreground">Case {item.scenario} · {item.id}</p><h2 className="mt-1 font-semibold">{item.title}</h2></div>
    {automatic ? <section className="space-y-3 text-sm" aria-label="Automatically priced case">
      <BoundaryTag cls="existing" />
      <p className="font-medium">Automated pricing</p>
      <p>{process.routing.reason}</p>
      <p>Counted in the monthly automatic total, never an operator queue row. Normal payment schedule, not an agent payment.</p>
    </section> : captureComplete ? <section className="space-y-3 text-sm" aria-label="Completed Type 1 capture">
      <BoundaryTag cls="human" />
      <p className="font-medium">Capture complete · Existing pricing</p>
      <p>A person confirmed the captured fields. Existing NHSBSA pricing followed; no Type 2 judgement was needed.</p>
      <BoundaryTag cls="existing" />
      <p>Human capture remains in the item history. The agent did not approve or pay.</p>
    </section> : capture ? <section className="space-y-3 text-sm" aria-label="Awaiting Type 1 capture">
      <BoundaryTag cls="human" />
      <p className="font-medium">Unreadable paper · Type 1 capture</p>
      <p>{agentEnabled ? "Proposed: confirm a pharmacy declaration beside the unreadable image. Fields are declared by the pharmacy, not read from the form." : "Key product, quantity and endorsement manually from the image. Type 2 judgement follows; unresolved presentation returns RB2B."}</p>
      {agentEnabled && <><BoundaryTag cls="agent" /><p>Unreconciled evidence still abstains. Human-confirmed compatible declarations can support a built case, never invented image certainty.</p></>}
    </section> : <>
      <PainMarker resolved={agentEnabled && pack.gate.result === "PASS"} pain="Evidence needs review" resolution="Evidence assembled; human decides" />
      {agentEnabled ? <>
        <div className="space-y-2" aria-live="polite"><BoundaryTag cls="agent" /><p className="font-mono text-sm font-semibold" data-outcome>{pack.recommendation}</p></div>
        <p className="text-sm">Gate: {pack.gate.result.replaceAll("_", " ")}</p>
        {item.scenario === "B" && pack.recommendation === "REFER_BACK" && <p className="text-sm" data-correction>Fix: add the date beside the initials.</p>}
        {pack.conflicts.map((conflict) => <dl key={conflict.field} className="text-sm"><dt className="font-medium">{conflict.field} · Unresolved</dt>{conflict.values.map((value) => <dd key={value.origin}>{value.origin}: {value.value}</dd>)}</dl>)}
        {pack.abstainReasons.length > 0 && <ul aria-label="Abstention signals" className="space-y-2 text-sm"><li>Provision: {pack.signals.provisionFound ? "Found" : "Not found"}</li><li>Image quality: {pack.signals.imageQuality.toFixed(2)} / threshold {QUALITY_THRESHOLD.toFixed(2)}</li><li>Readings agree: {pack.signals.sampleAgreement.agree} of {pack.signals.sampleAgreement.total}</li></ul>}
        <details className="text-sm"><summary className="cursor-pointer font-medium">Outcome evidence and exact correction</summary><div className="mt-3 space-y-3 text-muted-foreground"><ul aria-label="Requirement checks" className="space-y-2">{pack.requirementResults.map((r) => <li key={r.requirement.id}>{r.requirement.label}: {r.met === true ? "met" : r.met === false ? "not met" : "unknown"}</li>)}</ul>{pack.abstainReasons.length > 0 && <ul aria-label="Abstention reasons" className="list-disc pl-4">{pack.abstainReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}{perspective !== "pharmacy" && <Link className="underline" to={`/case/${item.id}`}>Review full evidence and human decision</Link>}</div></details>
      </> : <div className="space-y-3 text-sm" data-manual-tasks><BoundaryTag cls="human" /><p className="font-medium">Manual review · No recommendation</p><ul className="list-disc space-y-2 pl-4"><li>Locate image and claim</li><li>Check product and governing rule</li><li>Review evidence and record a decision</li></ul></div>}
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
  const chapter = TOUR_CONTENT.chapters.find((item) => item.chapter === chapterNumber);
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" data-tour-chapter={chapterNumber}>
      <div className="max-w-3xl space-y-3" data-tour-prose data-prose="chapter narrative">
        <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-3xl font-semibold tracking-tight focus-visible:outline-2 md:text-4xl">{chapter?.title ?? "A month of work"}</h1>
        <p className="text-muted-foreground">{chapter?.prose ?? "Compare manual and assisted workload using editable synthetic assumptions. The referral-subset volume is a scale proxy, not measured NHSBSA performance."}</p>
      </div>
      {chapterNumber === 1 && <>
        <ul aria-label="Public context figures" className="grid gap-4 lg:grid-cols-3">
          {TOUR_CONTENT.keyFigures.map((figure) => <li key={figure.id} className="space-y-3 rounded-xl border bg-card p-5" data-key-figure={figure.id}>
            <p className="text-3xl font-semibold tracking-tight md:text-4xl"><ProcessFigure source="Public" label={figure.label} explanation={figure.qualifier}>{figure.value}</ProcessFigure></p>
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
        <ul aria-label="Four canonical synthetic cases" className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CASES.filter((item) => ["A", "B", "C", "D"].includes(item.scenario)).map((item) => <TourProcessCase key={item.id} id={item.id} />)}
        </ul>
      </>}
      {chapterNumber === 5 && <>
        <TwoPlacesDiagram enabled={agentEnabled} />
        <section aria-label="Referral and resubmission loop" className="space-y-3 rounded-xl border p-5">
          <h2 className="font-semibold">One item, both sides</h2>
          <ol className="grid gap-3 text-sm sm:grid-cols-3">
            <li>{perspective === "pharmacy" ? "NHSBSA: human referral decision" : <Link className="underline" to="/case/EX-24112">NHSBSA: human referral decision</Link>}</li>
            <li>{perspective === "nhsbsa" ? "Pharmacy: correction and resubmission" : <Link className="underline" to={pharmacyCaseLink("EX-24112")}>Pharmacy: correction and resubmission</Link>}</li>
            <li>{perspective === "pharmacy" ? "NHSBSA: human re-check" : <Link className="underline" to="/queue">NHSBSA: human re-check</Link>}</li>
          </ol>
          <p className="text-sm text-muted-foreground">Workflow and delays are assumptions to validate. Shared session history is implemented locally; a shared operational service remains proposed.</p>
          <FollowItem id="EX-24112" />
        </section>
        {perspective !== "nhsbsa" && <Button asChild variant="outline"><Link to="/pharmacy">Open pharmacy precheck example</Link></Button>}
      </>}
      {chapterNumber === 8 && <>
        <section aria-label="Proposed outcomes" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Fewer items back. A judgement you can reconstruct.</h2>
          <p className="text-sm">Rule and reason recorded for built cases. People confirm evidence and decide; existing pricing remains unchanged.</p>
          <p className="text-sm font-medium">The agent verifies the submission and advises; a person decides.</p>
          <p className="text-sm text-muted-foreground">No agent payments. Referral reduction depends on the assumed pharmacy catch, not a universal Type 2 speed-up.</p>
        </section>
        <dl className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-3">
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
