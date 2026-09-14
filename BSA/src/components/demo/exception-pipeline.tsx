import { ArrowDown, CornerDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { useAppStore } from "@/lib/store";
import { formatProcessItems } from "@/lib/domain/baseline";
import { BoundaryTag } from "./labels";
import { MonthlyNumber } from "./monthly-number";
import { ProcessFigure } from "./process-figure";

export function ExceptionPipeline() {
  const enabled = useAppStore((s) => s.agentEnabled);
  const perspective = useAppStore((s) => s.perspective);
  const { result } = useManualLoopMonth();
  const column = result && (enabled ? result.withAgent : result.today);
  return <section aria-label="Prescription processing paths" className="space-y-4" data-pipeline>
    <section aria-label="Pharmacy check before submission" className="space-y-3 rounded-xl border border-dashed bg-muted/30 p-5" data-pharmacy-exit>
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Pharmacy check before submission</h2><BoundaryTag cls={enabled ? "agent" : "human"} /></div>
      <p className="text-sm">{enabled ? "Check the declaration against the dated rule; show the exact gap. The pharmacist corrects or submits." : "The pharmacist checks the endorsement and submits. Incomplete information can return later as a referral."}</p>
      {enabled && <p className="text-sm font-medium" data-agent-kernel="pharmacy">Agent kernel: verify and advise, never submit or pay.</p>}
      {enabled && result && <p className="text-sm">Items caught before submission (estimate): <ProcessFigure source="Assumption" label="Items caught before submission" explanation="Shared model prevention assumption, applied only to would-be referrals. Corrected items still enter normal processing.">
        <span data-pipeline-pharmacy><MonthlyNumber value={result.cohorts.prevented} format={formatProcessItems} /></span>
      </ProcessFigure></p>}
      {perspective !== "nhsbsa" && <Link className="inline-block text-sm underline underline-offset-4" to="/pharmacy">Try the pharmacy check</Link>}
    </section>
    <ArrowDown className="mx-auto size-5" aria-hidden="true" />
    <section aria-label="Submission channels" className="space-y-3 rounded-xl border bg-card p-5" data-pipeline-stage="channels">
      <h2 className="font-semibold">EPS message or paper scan</h2><BoundaryTag cls="existing" />
      <ul className="grid gap-3 text-sm grid-cols-2">
        <li className="rounded-lg border p-3">EPS: dm+d codes and typed endorsements in the claim message.</li>
        <li className="rounded-lg border p-3">Paper: scanned form and character recognition; uncertain handwriting needs human capture.</li>
      </ul>
    </section>
    <ArrowDown className="mx-auto size-5" aria-hidden="true" />
    <section aria-label="Rules-engine routing" className="space-y-4 rounded-xl border bg-card p-5" data-pipeline-stage="rules">
      <h2 className="font-semibold">Rules engine</h2><BoundaryTag cls="deterministic" />
      <p className="text-sm">Code routes from readable facts. Complete items bypass staff; uncertain capture and endorsement interpretation take different paths.</p>
      <section className="space-y-2 rounded-lg border bg-muted/30 p-4" aria-label="Automatic pricing bypass" data-auto-bypass>
        <h3 className="flex items-center gap-2 font-medium"><CornerDownRight className="size-4" aria-hidden="true" />Complete and readable: automated pricing</h3>
        <BoundaryTag cls="existing" />
        <p className="text-sm">Priced by NHSBSA&apos;s existing rules engine; no person involved. Normal payment schedule, outside this prototype.</p>
        <p className="text-sm font-medium">No Type 1 or Type 2 queue row.</p>
      </section>
    </section>
    <div className="grid items-start gap-4 grid-cols-2" aria-label="Conditional staff paths">
      <section aria-label="Type 1 capture path" className="space-y-3 rounded-xl border bg-card p-5" data-pipeline-stage="type1">
        <h2 className="font-semibold">If handwritten or uncertain: Type 1 capture</h2><BoundaryTag cls="human" />
        <p className="text-sm">A person confirms product, quantity and endorsement. Code routes again: automated pricing if complete, Type 2 if interpretation is needed.</p>
        {enabled ? <section className="space-y-2 rounded-lg border p-3" data-agent-kernel="type1">
          <h3 className="font-medium">Proposed: declaration pre-fill</h3><BoundaryTag cls="agent" />
          <p className="text-sm">Fields are declared by the pharmacy, not read from the form. A person confirms or corrects; unreconciled evidence follows today&apos;s path.</p>
        </section> : <p className="text-sm">Poor paper: key manually from the image. No guidance, experience only in this synthetic comparison.</p>}
        <Link className="inline-block text-sm underline underline-offset-4" to="/boundary">Read the proposed paper boundary</Link>
      </section>
      <section aria-label="Type 2 judgement path" className="space-y-3 rounded-xl border bg-card p-5" data-pipeline-stage="type2">
        <h2 className="font-semibold">If interpretation is needed: Type 2 judgement</h2><BoundaryTag cls="human" />
        <p className="text-sm">Typed EPS endorsements can arrive directly. Captured paper can follow Type 1. People judge endorsements, extra fees and finalisation.</p>
        {enabled ? <section className="space-y-2 rounded-lg border p-3" data-agent-kernel="type2">
          <h3 className="font-medium">Case built for human judgement</h3><BoundaryTag cls="agent" />
          <p className="text-sm">Retrieve the dated clause, check requirements and propose a reason. Code validates; a person decides. Insufficient evidence means abstention.</p>
        </section> : <p className="text-sm">Find the governing rule and write a reason. Experience only, no rule recorded in this synthetic comparison, not all real practice.</p>}
        <p className="text-sm">Sufficient evidence returns to existing pricing. Still insufficient: a person refers back with an RB code and reason.</p>
        {perspective !== "pharmacy" && <Link className="inline-block text-sm underline underline-offset-4" to="/queue">Review the Type 2 queue</Link>}
      </section>
    </div>
    <ArrowDown className="mx-auto size-5" aria-hidden="true" />
    <ol aria-label="Referral and resubmission stages" className="grid items-start gap-4 grid-cols-3">
      <li className="space-y-3 rounded-xl border bg-card p-5" data-pipeline-stage="referred-back">
        <h2 className="font-semibold">Referred back</h2><BoundaryTag cls="human" />
        <p className="text-sm">An RB code explains the missing endorsement. Only that item&apos;s payment is delayed.</p>
        {enabled && <p className="text-sm">The operator approves the exact-fix note with its clause and version. The agent does not send or approve it.</p>}
        {column && <p className="text-sm">Monthly items{enabled && " (estimate)"}: <ProcessFigure source="Assumption" label="Monthly referrals" explanation="Shared referral-loop scenario after sequential pharmacy prevention and code clearance; all remaining queued items are assumed referred back.">
          <span data-pipeline-referrals><MonthlyNumber value={column.referredBackItems} format={formatProcessItems} /></span>
        </ProcessFigure></p>}
      </li>
      <li className="space-y-3 rounded-xl border bg-card p-5" data-pipeline-stage="mys">
        <h2 className="font-semibold">MYS Unpaid items</h2><BoundaryTag cls="existing" />
        <p className="text-sm">The pharmacy receives an NHSmail email, opens Unpaid items and reads the RB code and NHSBSA&apos;s reason.</p>
        {perspective !== "nhsbsa" && <Link className="inline-block text-sm underline underline-offset-4" to="/pharmacy/claims">Open pharmacy claims</Link>}
      </li>
      <li className="space-y-3 rounded-xl border bg-card p-5" data-pipeline-stage="resubmit">
        <h2 className="font-semibold">Correct and resubmit</h2><BoundaryTag cls="human" />
        <p className="text-sm">The pharmacy completes the endorsement and resubmits. Code routes the revised facts again; existing pricing keeps its normal schedule.</p>
        {enabled && <p className="text-sm">The pharmacy pre-check runs again, without replacing submission or human judgement.</p>}
      </li>
    </ol>
    <p className="text-sm font-medium">The agent verifies the submission and advises; a person decides.</p>
    {!result && <p role="status" className="text-sm">Scenario estimates unavailable: correct the calculator inputs. These paths illustrate the process, not a live execution.</p>}
  </section>;
}
