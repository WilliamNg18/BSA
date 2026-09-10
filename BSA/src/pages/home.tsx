import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { PainMarker } from "@/components/demo/pain-marker";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { ExceptionPipeline } from "@/components/demo/exception-pipeline";
import { SceneDiagram, TwoPlacesDiagram } from "@/components/demo/tour-diagrams";
import { runAgent } from "@/lib/domain/agent";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { CASES } from "@/lib/domain/cases";
import { SOURCES_FOOTER, TOUR_CONTENT } from "@/lib/domain/public-facts";
import { TOUR_STOPS, tourStopIndex } from "@/lib/tour-navigation";
import { useAppStore } from "@/lib/store";

export function HomePage() {
  const { pathname, hash } = useLocation();
  const agentEnabled = useAppStore((s) => s.agentEnabled);
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
            <p className="text-xs font-medium text-muted-foreground">Public context · Approximate, not independently verified</p>
            <p className="text-3xl font-semibold tracking-tight md:text-4xl">{figure.value}</p>
            <p className="text-sm font-medium">{figure.label}</p>
            <details className="text-sm"><summary className="cursor-pointer">Figure qualification</summary><p className="mt-2 text-muted-foreground">{figure.qualifier}</p></details>
          </li>)}
        </ul>
        <BaselineScene />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <SceneDiagram />
          <section className="space-y-4 rounded-xl border bg-muted/30 p-5" aria-label="Rulebook context">
            <h2 className="font-semibold">Drug Tariff · Monthly publication</h2>
            <p className="text-sm text-muted-foreground">Endorsement-rule change frequency: unvalidated</p>
          </section>
        </div>
      </>}
      {chapterNumber === 2 && <BaselineCalculator />}
      {chapterNumber === 3 && <>
        <ExceptionPipeline />
        <h2 className="text-2xl font-semibold">Operator cases · Test the evidence</h2>
        <p className="text-sm font-medium">Synthetic cases · Scripted interpretation · Human decision throughout</p>
        <ul aria-label="Four canonical synthetic cases" className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CASES.filter((item) => ["A", "B", "C", "D"].includes(item.scenario)).map((item) => {
            const pack = runAgent(item, { agentEnabled });
            return <li key={item.id} className="space-y-4 rounded-xl border bg-card p-5" data-case={item.scenario}>
              <div><p className="text-xs text-muted-foreground">Case {item.scenario} · {item.id}</p><h2 className="mt-1 font-semibold">{item.title}</h2></div>
              <PainMarker resolved={agentEnabled && pack.gate.result === "PASS"} pain="Evidence needs review" resolution="Evidence assembled; human decides" />
              {agentEnabled ? <>
                <div className="space-y-2" aria-live="polite"><BoundaryTag cls="agent" /><p className="font-mono text-sm font-semibold" data-outcome>{pack.recommendation}</p></div>
                <p className="text-sm">Gate: {pack.gate.result.replaceAll("_", " ")}</p>
                {item.scenario === "B" && pack.recommendation === "REFER_BACK" && <p className="text-sm" data-correction>Fix: add the date beside the initials.</p>}
                {pack.conflicts.map((conflict) => <dl key={conflict.field} className="text-sm"><dt className="font-medium">{conflict.field} · Unresolved</dt>{conflict.values.map((value) => <dd key={value.origin}>{value.origin}: {value.value}</dd>)}</dl>)}
                {pack.abstainReasons.length > 0 && <ul aria-label="Abstention signals" className="space-y-2 text-sm"><li>Provision: {pack.signals.provisionFound ? "Found" : "Not found"}</li><li>Image quality: {pack.signals.imageQuality.toFixed(2)} / threshold {QUALITY_THRESHOLD.toFixed(2)}</li><li>Readings agree: {pack.signals.sampleAgreement.agree} of {pack.signals.sampleAgreement.total}</li></ul>}
                <details className="text-sm"><summary className="cursor-pointer font-medium">Outcome evidence and exact correction</summary><div className="mt-3 space-y-3 text-muted-foreground"><ul aria-label="Requirement checks" className="space-y-2">{pack.requirementResults.map((r) => <li key={r.requirement.id}>{r.requirement.label}: {r.met === true ? "met" : r.met === false ? "not met" : "unknown"}</li>)}</ul>{pack.abstainReasons.length > 0 && <ul aria-label="Abstention reasons" className="list-disc pl-4">{pack.abstainReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}<Link className="underline" to={`/case/${item.id}`}>Review full evidence and human decision</Link></div></details>
              </> : <div className="space-y-3 text-sm" data-manual-tasks><BoundaryTag cls="human" /><p className="font-medium">Manual review · No recommendation</p><ul className="list-disc space-y-2 pl-4"><li>Locate image and claim</li><li>Check product and governing rule</li><li>Review evidence and record a decision</li></ul></div>}
              <Button asChild variant="outline" size="sm"><Link to={`/case/${item.id}`}>Open case {item.scenario}</Link></Button>
            </li>;
          })}
        </ul>
      </>}
      {chapterNumber === 4 && <>
        <TwoPlacesDiagram enabled={agentEnabled} />
        <Button asChild variant="outline"><Link to="/pharmacy">Open existing pharmacy example</Link></Button>
      </>}
      {chapterNumber === 6 && <>
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
