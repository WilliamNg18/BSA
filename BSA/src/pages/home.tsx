import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { SourceDisclosure } from "@/components/demo/source-disclosure";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { SceneDiagram, TwoPlacesDiagram } from "@/components/demo/tour-diagrams";
import { runAgent } from "@/lib/domain/agent";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { CASES } from "@/lib/domain/cases";
import { TOUR_CONTENT } from "@/lib/domain/source-claims";
import { TOUR_STOPS, tourStopIndex } from "@/lib/tour-navigation";
import { useAppStore } from "@/lib/store";

export function HomePage() {
  const { pathname, hash } = useLocation();
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const chapterNumber = TOUR_STOPS[tourStopIndex(pathname, hash)].chapter;
  const chapter = TOUR_CONTENT.chapters.find((item) => item.chapter === chapterNumber);
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" data-tour-chapter={chapterNumber}>
      <div className="max-w-3xl space-y-3" data-tour-prose>
        <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-3xl font-semibold tracking-tight focus-visible:outline-2 md:text-4xl">{chapter?.title ?? "A month of work"}</h1>
        <p className="text-muted-foreground">{chapter?.prose ?? "Change the assumptions to compare manual effort with a proposed assisted month. These estimates use a referred-back volume proxy and synthetic cohorts, not measured NHSBSA performance."}</p>
      </div>
      {chapterNumber === 1 && <>
        <ul aria-label="Document-attributed key figures" className="grid gap-4 lg:grid-cols-3">
          {TOUR_CONTENT.keyFigures.map((figure) => <li key={figure.id} className="space-y-3 rounded-xl border bg-card p-5" data-key-figure={figure.id}>
            <p className="text-xs font-medium text-muted-foreground">Document-attributed · Not independently verified</p>
            <p className="text-2xl font-semibold tracking-tight">{figure.value}</p>
            <p className="text-sm font-medium">{figure.label}</p>
            <details className="text-sm"><summary className="cursor-pointer">Figure qualification</summary><p className="mt-2 text-muted-foreground">{figure.qualifier}</p></details>
            <SourceDisclosure claimIds={figure.claimIds} label={`Sources: ${figure.label}`} />
          </li>)}
        </ul>
        <BaselineScene />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <SceneDiagram />
          <section className="space-y-4 rounded-xl border bg-muted/30 p-5" aria-label="Rulebook context">
            <h2 className="font-semibold">Drug Tariff · Monthly publication</h2>
            <p className="text-sm text-muted-foreground">Endorsement-rule change frequency: unvalidated</p>
            <SourceDisclosure claimIds={["O11", "A07", "O18", "O19", "O20", "O21"]} label="Sources: existing process and rulebook" />
          </section>
        </div>
      </>}
      {chapterNumber === 2 && <BaselineCalculator />}
      {chapterNumber === 3 && <>
        <p className="text-sm font-medium">Synthetic cases · Scripted interpretation · Human decision throughout</p>
        <ul aria-label="Four canonical synthetic cases" className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CASES.filter((item) => ["A", "B", "C", "D"].includes(item.scenario)).map((item) => {
            const pack = runAgent(item, { agentEnabled });
            return <li key={item.id} className="space-y-4 rounded-xl border bg-card p-5" data-case={item.scenario}>
              <div><p className="text-xs text-muted-foreground">Case {item.scenario} · {item.id}</p><h2 className="mt-1 font-semibold">{item.title}</h2></div>
              {agentEnabled ? <>
                <div className="space-y-2" aria-live="polite"><BoundaryTag cls="agent" /><p className="font-mono text-sm font-semibold" data-outcome>{pack.recommendation}</p></div>
                <p className="text-sm">Gate: {pack.gate.result.replaceAll("_", " ")}</p>
                {item.scenario === "B" && pack.recommendation === "REFER_BACK" && <p className="text-sm" data-correction>Fix: add the date beside the initials.</p>}
                {pack.conflicts.map((conflict) => <dl key={conflict.field} className="text-sm"><dt className="font-medium">{conflict.field} · Unresolved</dt>{conflict.values.map((value) => <dd key={value.source}>{value.source}: {value.value}</dd>)}</dl>)}
                {pack.abstainReasons.length > 0 && <ul aria-label="Abstention signals" className="space-y-2 text-sm"><li>Provision: {pack.signals.provisionFound ? "Found" : "Not found"}</li><li>Image quality: {pack.signals.imageQuality.toFixed(2)} / threshold {QUALITY_THRESHOLD.toFixed(2)}</li><li>Readings agree: {pack.signals.sampleAgreement.agree} of {pack.signals.sampleAgreement.total}</li></ul>}
                <details className="text-sm"><summary className="cursor-pointer font-medium">Outcome evidence and exact correction</summary><div className="mt-3 space-y-3 text-muted-foreground">{pack.reasons.map((reason) => <p key={reason}>{reason}</p>)}{pack.abstainReasons.length > 0 && <ul aria-label="Abstention reasons" className="list-disc pl-4">{pack.abstainReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}{pack.draftToPharmacy && <p>{pack.draftToPharmacy}</p>}<p>Source: current synthetic case engine. Not an operational result.</p></div></details>
              </> : <div className="space-y-3 text-sm" data-manual-tasks><BoundaryTag cls="human" /><p className="font-medium">Manual review · No recommendation</p><ul className="list-disc space-y-2 pl-4"><li>Locate image and claim</li><li>Check product and governing rule</li><li>Review evidence and record a decision</li></ul></div>}
              <Button asChild variant="outline" size="sm"><Link to={`/case/${item.id}`}>Open case {item.scenario}</Link></Button>
            </li>;
          })}
        </ul>
        <SourceDisclosure claimIds={["S-ALL", "A10", "A03", "A04", "A05"]} label="Sources: cases and manual assumptions" />
      </>}
      {chapterNumber === 4 && <>
        <TwoPlacesDiagram enabled={agentEnabled} />
        <Button asChild variant="outline"><Link to="/pharmacy">Open existing pharmacy example</Link></Button>
        <SourceDisclosure claimIds={["D-PHASES", "D-ADVISORY", "D-PLUMBING", "A13"]} label="Sources: two proposed surfaces" />
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
          <ol className="list-decimal space-y-5 pl-5">{TOUR_CONTENT.assumptionsDisclosure.assumptions.map((assumption) => <li key={assumption.text} className="space-y-2 text-sm"><p>{assumption.text}</p><p>Validate: {assumption.validation}</p><p>If wrong: {assumption.ifWrong}</p><SourceDisclosure claimIds={assumption.claimIds} label="Assumption source" /></li>)}</ol>
        </details>
        <details className="rounded-xl border p-5">
          <summary className="cursor-pointer font-semibold">{TOUR_CONTENT.questionsDisclosure.title}</summary>
          <p className="my-3 text-sm text-muted-foreground">{TOUR_CONTENT.questionsDisclosure.text}</p>
          <ol aria-label="Seven PDF discovery questions" className="list-decimal space-y-5 pl-5">{TOUR_CONTENT.questionsDisclosure.questions.map((question) => <li key={question.id} className="space-y-2 text-sm"><p>{question.text}</p><SourceDisclosure claimIds={question.claimIds} label={`Source for ${question.id}`} /></li>)}</ol>
        </details>
        <SourceDisclosure claimIds={["PDF-A01", "D-STOP"]} label="Sources: first test and stop criteria" />
      </>}
      {chapter && <SourceDisclosure claimIds={chapter.claimIds} label={`Chapter ${chapterNumber} sources`} />}
    </div>
  );
}
