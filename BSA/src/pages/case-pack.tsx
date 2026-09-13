import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Check, FileText, Scale } from "lucide-react";
import { useNotification } from "@/hooks/use-notification";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeRadioGroup as RadioGroup, NativeRadioItem as RadioGroupItem } from "@/components/ui/native-radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PageSection } from "@/components/page-section";
import { ErrorState } from "@/components/states";
import { CaseHeader } from "@/components/demo/case-header";
import { BoundaryTag, KeyValue, RecommendationBadge, StatusDot } from "@/components/demo/labels";
import { REC_META } from "@/components/demo/label-meta";
import { CompositeBadge, SignalList } from "@/components/demo/signals";
import { runAgent } from "@/lib/domain/agent";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { LifecycleHistory } from "@/components/demo/lifecycle-history";
import type { HumanDecision } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";
import { caseViewState, manualChoice, permitsProposal } from "@/lib/case-presentation";
import { CasePlayback, CaseSourceEvidence, MissingAssistedSlots, OriginalPaperDeclaration, RawCaseFields } from "@/components/demo/case-presentation";
import { useCasePresentation } from "@/hooks/use-case-presentation";
import { Type1Capture } from "@/components/demo/type1-capture";
import { ManualTariffLookup } from "@/components/demo/case-presentation";
import { RB_CODE_CATALOG } from "@/lib/domain/routing";
import { paperImageEvidence } from "@/lib/domain/capture-evidence";

const DECISIONS: { value: HumanDecision; label: string; help: string }[] = [
  { value: "ACCEPT", label: "Accept the recommendation", help: "Proceed as the agent recommends." },
  { value: "AMEND", label: "Amend", help: "Release to existing pricing with a human amendment." },
  { value: "REQUEST_INFORMATION", label: "Request information", help: "Ask the pharmacy to confirm a fact before any outcome." },
  { value: "REFER_BACK", label: "Refer back", help: "Return the item with the exact fix; payment waits." },
  { value: "ESCALATE", label: "Escalate", help: "Send to a senior operator, as today." },
];

function suggestedFor(rec: string): HumanDecision {
  if (rec === "SUFFICIENT") return "ACCEPT";
  if (rec === "REFER_BACK") return "REFER_BACK";
  if (rec === "REQUEST_INFORMATION") return "REQUEST_INFORMATION";
  return "ESCALATE";
}

export function CasePackPage() {
  const { id } = useParams();
  const revision = useAppStore((s) => id ? s.caseRevisions[id]?.at(-1)?.number : undefined);
  const resetRevision = useAppStore((s) => s.queue.revision);
  return <CasePackContent key={`${id}-${revision}-${resetRevision}`} />;
}

function CasePackContent() {
  const { id } = useParams();
  const notification = useNotification();
  const navigate = useNavigate();
  const c = useLifecycleCase(id);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const perspective = useAppStore((s) => s.perspective);
  const lifecycle = useAppStore((s) => id ? s.lifecycles[id] : undefined);
  const arrive = useAppStore((s) => s.arriveInQueue);
  const recordDecision = useAppStore((s) => s.recordType2Decision);
  const process = useAppStore((s) => id ? s.itemProcesses[id] : undefined);
  const currentRevision = useAppStore((s) => id ? s.caseRevisions[id]?.at(-1) : undefined);
  const revision = currentRevision?.number;
  const records = useAppStore((s) => s.records);
  const existing = useMemo(() => records.filter((r) => r.caseId === id), [records, id]);
  const pack = useMemo(() => (c ? runAgent(c, { agentEnabled }) : null), [c, agentEnabled]);
  const state = caseViewState(pack, process?.revision === revision ? process : undefined,
    existing.some((record) => (record.revision ?? 1) === revision));
  const [decision, setDecision] = useState<HumanDecision | null>(null);
  const [reason, setReason] = useState("");
  const [rbCode, setRbCode] = useState("");
  const [compare, setCompare] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const clock = useCasePresentation(6, agentEnabled, pack);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (!c || !pack || !state) {
    return <ErrorState title="Case not found" description="Choose a case from the exception queue." action={<Button asChild variant="outline"><Link to="/queue">Go to the queue</Link></Button>} />;
  }

  const showRecommendation = permitsProposal(pack);
  const suggested = showRecommendation ? suggestedFor(pack.recommendation) : "ESCALATE";
  const chosen = !agentEnabled ? manualChoice(decision) : !showRecommendation && (decision === "ACCEPT" || decision === "AMEND") ? "ESCALATE" : decision ?? suggested;
  const isOverride = showRecommendation && (chosen === "AMEND" || chosen !== suggested && chosen !== "ACCEPT");
  const disposition = chosen === "ACCEPT" && showRecommendation ? suggested : chosen;
  const currentProcess = process?.revision === revision ? process : undefined;
  const awaitingCapture = currentProcess?.routing.outcome === "type1_capture" && currentProcess.routing.requiresHuman;
  const captureCompleted = currentProcess?.routing.outcome === "type1_capture" && !currentProcess.routing.requiresHuman;
  const automatic = currentProcess?.routing.outcome === "auto_priced";
  const decided = !currentProcess || awaitingCapture || captureCompleted || automatic || lifecycle?.state !== "in_review" && lifecycle?.state !== "escalated";
  const canApprove = agentEnabled && showRecommendation && !!pack.draftToPharmacy && (disposition === "REFER_BACK" || disposition === "REQUEST_INFORMATION");
  const originalCapture = paperImageEvidence(c, currentRevision?.templateCaseId).extracted;

  function submit() {
    if (!c || !pack || decided || (agentEnabled && clock.revealed < 6)) return;
    if (reason.trim().length < 8) {
      setError("A reason of at least eight characters is required for this decision.");
      return;
    }
    if (disposition === "REFER_BACK" && !rbCode) {
      setError("Choose an RB code for the referral.");
      return;
    }
    try {
    recordDecision({
      caseId: c.id,
      decision: disposition,
      reason: reason.trim(),
      rbCode: disposition === "REFER_BACK" ? rbCode : undefined,
      approvedDraft: canApprove && approved ? pack.draftToPharmacy! : undefined,
    });
    notification.show("success", "Human decision recorded");
    navigate(`/case/${c.id}/record`);
    } catch (err) { setError(err instanceof Error ? err.message : "Decision unavailable. Review the current case state."); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CaseHeader
        c={c}
        state={state}
        title={`Operator case pack: ${c.title}`}
        intro="Review the evidence, monthly rule and checks. The agent verifies and advises; a person decides."
      />
      <LifecycleHistory id={c.id} />
      {c.paperDeclaration && (agentEnabled || currentProcess?.capture?.declarationReconciled) && <OriginalPaperDeclaration declaration={c.paperDeclaration} />}
      {currentProcess?.capture?.provenance === "pharmacy_declaration" && <p className="rounded-xl border p-4 text-sm">
        Human-confirmed fields: declared by the pharmacy, not read from the form. Original machine capture stays separate; proposed path.
      </p>}
      {!currentProcess && <p role="alert">Current routing metadata is unavailable. Decisions are disabled until the shared state is consistent.</p>}
      {(awaitingCapture || currentProcess?.capture) && <Type1Capture caseId={c.id} />}
      {automatic && <section className="space-y-2 rounded-xl border p-4" data-automatic-case>
        <BoundaryTag cls="deterministic" />
        <p>priced by NHSBSA's existing rules engine, no person involved</p>
        <p className="text-sm text-muted-foreground">No operator action is needed. Any earlier human decisions remain in the history.</p>
      </section>}
      {!awaitingCapture && !captureCompleted && !automatic && currentProcess && (lifecycle?.state === "submitted" || lifecycle?.state === "resubmitted") && <section className="space-y-2 rounded-xl border p-4">
        <BoundaryTag cls="human" /><p>Start review explicitly before recording a decision.</p>
        <Button onClick={() => { try { arrive(c.id); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Review unavailable."); } }}>Start review</Button>
      </section>}
      {decided && !automatic && !awaitingCapture && lifecycle?.state !== "submitted" && lifecycle?.state !== "resubmitted" && <section className="space-y-2 rounded-xl border p-4">
        <p>Historical case view. Submit another demonstration attempt at the pharmacy before starting a new review.</p>
        {perspective !== "nhsbsa" && <Button asChild variant="outline" className="h-auto max-w-full whitespace-normal"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(c.id)}`}>Open pharmacy claim for another attempt</Link></Button>}
      </section>}
      {error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-md border border-destructive p-3 focus-visible:outline-2 focus-visible:outline-ring">{error}</p>}

      {!pack.agentInvoked && (
        <Alert>
          <FileText aria-hidden="true" />
          <AlertTitle>{pack.state === "cleared_by_rules" ? "Cleared by deterministic rules; the agent was not called" : "Agent recommendations are switched off"}</AlertTitle>
          <AlertDescription>{pack.state === "cleared_by_rules" ? "Deterministic pre-checks still apply. No model called; manual comparison does not undo clearance." : "Synthetic manual comparison: inspect captured fields and record your own reason. Real NHSBSA workflow requires validation."}</AlertDescription>
        </Alert>
      )}
      {pack.recommendation === "ABSTAIN" && (
        <Alert className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950">
          <AlertTriangle className="text-rose-700" aria-hidden="true" />
          <AlertTitle>The agent abstained</AlertTitle>
          <AlertDescription className="text-foreground">
            <p>No recommendation is shown because the evidence does not support one. The item follows today's process; nothing about it has been changed.</p>
            <ul className="mt-1 list-disc pl-5">{pack.abstainReasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </AlertDescription>
        </Alert>
      )}
      {pack.agentInvoked && pack.gate.result === "FAIL" && (
        <Alert className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950">
          <AlertTriangle className="text-rose-700" aria-hidden="true" />
          <AlertTitle>Recommendation withheld by the compliance gate</AlertTitle>
          <AlertDescription className="text-foreground">The agent proposed an outcome the rules do not permit. The operator sees the evidence only.</AlertDescription>
        </Alert>
      )}

      {!agentEnabled && <>
        <div className="flex flex-wrap items-center gap-2"><RecommendationBadge rec="NONE" /><StatusDot status="skipped" label="NOT RUN" /><BoundaryTag cls="human" /></div>
        <RawCaseFields c={c} />
        {!awaitingCapture && !automatic && <>
          <ManualTariffLookup />
          <section aria-label="RB code list" className="space-y-2 rounded-xl border p-4">
            <h2 className="font-semibold">RB code list</h2>
            <p className="text-sm text-muted-foreground">Choose a code only when your human judgement requires referral.</p>
            <dl className="grid gap-2 text-sm">{RB_CODE_CATALOG.map((entry) => <KeyValue key={entry.code} k={entry.code} v={entry.reason} />)}</dl>
          </section>
        </>}
        <MissingAssistedSlots markers />
      </>}
      {agentEnabled && !pack.agentInvoked && <RawCaseFields c={c} />}
      {agentEnabled && pack.agentInvoked && <>
        <CasePlayback clock={clock} total={6} />
        <Button variant="outline" type="button" aria-pressed={compare} onClick={() => setCompare((value) => !value)}>Compare manual view</Button>
        <div className={compare ? "grid gap-6 xl:grid-cols-2" : ""}>
          {compare && <aside className="space-y-4 rounded-xl border p-4" aria-label="Read-only manual comparison">
            <h2 className="font-semibold">Manual comparison · Read-only</h2>
            <p className="text-sm text-muted-foreground">Synthetic assumptions. Shared decision controls remain below; this comparison writes nothing.</p>
            <RawCaseFields c={c} /><MissingAssistedSlots markers />
          </aside>}
      <div className={compare ? "space-y-6" : "grid gap-6 xl:grid-cols-5"} data-pack-assembly={clock.revealed}>
        <div className="space-y-6 xl:col-span-3">
          {clock.revealed >= 5 && <>
          <PageSection title="Recommendation" description={showRecommendation ? "Prepared by the agent, permitted by the gate, decided by a person." : "No recommendation to show."}>
            <Card className="border-teal-600">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <RecommendationBadge rec={pack.recommendation} />
                  {pack.agentInvoked && <CompositeBadge composite={pack.composite} />}
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                    <Scale className="size-3.5" aria-hidden="true" /> Gate: <StatusDot status={pack.gate.result === "PASS" ? "ok" : pack.gate.result === "FAIL" ? "fail" : "skipped"} label={pack.gate.result.replace("_", " ")} />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showRecommendation && (
                  <>
                    <section data-prose="recommendation reasons" className="rounded-md border p-3">
                      <h3 className="mb-1 text-sm font-semibold">Reasons</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm">{pack.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                    </section>
                    {pack.alternative && (
                      <section data-prose="alternative" className="rounded-md bg-muted/50 p-3 text-sm">
                        <h3 className="font-semibold">Alternative considered: {REC_META[pack.alternative.outcome].label}</h3>
                        <p className="text-muted-foreground">{pack.alternative.note}</p>
                      </section>
                    )}
                  </>
                )}
                <section data-prose="confidence explanation" className="rounded-md border p-3">
                  <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">Confidence signals <BoundaryTag cls="deterministic" short /></h3>
                  <SignalList signals={pack.signals} />
                  <ul className="mt-1 text-xs text-muted-foreground" aria-label="Composite reasons">{pack.composite.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                </section>
                <section data-prose="gate checks" className="rounded-md border p-3">
                  <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">Deterministic check results <BoundaryTag cls="deterministic" short /></h3>
                  <ul className="space-y-1 text-sm">
                    {pack.gate.checks.map((k) => (
                      <li key={k.name} className="flex items-start gap-2 rounded-md border px-2.5 py-1.5">
                        <StatusDot status={k.pass ? "ok" : "fail"} label="" />
                        <span><span className="font-medium">{k.name}.</span> <span className="text-muted-foreground">{k.detail}</span></span>
                      </li>
                    ))}
                  </ul>
                </section>
                {showRecommendation && pack.draftToPharmacy && (
                  <section data-prose="pharmacy draft" className="rounded-md border p-3">
                    <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">Draft explanation to the pharmacy <BoundaryTag cls="agent" short /></h3>
                    <blockquote className="rounded-md border-l-4 border-teal-600 bg-muted/40 p-3 text-sm">{pack.draftToPharmacy}</blockquote>
                    <span className="mt-1 text-xs text-muted-foreground">Draft · Human review required</span>
                  </section>
                )}
              </CardContent>
            </Card>
          </PageSection>
          </>}

          {clock.revealed >= 3 && <>
          <PageSection title="Applicable Drug Tariff provision" description={pack.clause ? `Version in force on the dispensing date: ${pack.tariffLabel}.` : "No provision could be retrieved for this endorsement type and date."}>
            {pack.clause ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{pack.clause.part}, {pack.clause.title}</CardTitle>
                  <CardDescription data-copy="label">Effective {pack.tariffLabel} · citation {pack.citationValid ? "validated against the corpus" : "not validated"} · synthetic paraphrase of the rulebook</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <blockquote className="border-l-4 border-sky-600 pl-3 text-sm">"{pack.clause.text}"</blockquote>
                  <ul className="grid gap-1 text-sm sm:grid-cols-2">
                    {pack.requirementResults.map((r) => (
                      <li key={r.requirement.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                        <span className={`size-2.5 rounded-full ${r.met === true ? "bg-emerald-600" : r.met === false ? "bg-rose-600" : "bg-slate-400"}`} aria-hidden="true" />
                        {r.requirement.label}: <span className="font-medium">{r.met === true ? "met" : r.met === false ? "not met" : "unknown"}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">No citation from memory; no recommendation without a retrieved provision.</p>
            )}
          </PageSection>
          </>}

          {clock.revealed >= 4 && <>
          <PageSection title="Conflicts and missing evidence" description={pack.conflicts.length ? "Each source is shown; the agent does not choose between them." : pack.signals.reconciliation === "agree"
            ? currentProcess?.capture?.declarationReconciled ? "Human-confirmed declaration matches the claim. Image agreement remains unknown." : "Comparable fields agree."
            : "Reconciliation not established."}>
            {pack.conflicts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{pack.signals.reconciliation === "agree"
                ? "This comparison does not establish agreement for missing or unreadable evidence."
                : "Missing, unreadable or unconfirmed fields still need evidence. No detected conflict does not prove agreement."}</p>
            ) : (
              <ul className="space-y-2">
                {pack.conflicts.map((k) => (
                  <li key={k.field} className="rounded-md border border-amber-500 bg-amber-50 p-3 text-sm dark:bg-amber-950">
                    <h3 className="font-semibold">{k.field} {k.material && <span className="ml-1 rounded bg-amber-700 px-1.5 py-0.5 text-xs text-white">material</span>}</h3>
                    <ul className="mt-1 grid gap-1 sm:grid-cols-2">{k.values.map((v) => <li key={v.origin} className="rounded bg-background px-2 py-1"><span className="text-muted-foreground">{v.origin}:</span> <span className="font-medium">{v.value}</span></li>)}</ul>
                    <p className="mt-1 text-muted-foreground">{k.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </PageSection>
          </>}
        </div>

        <div className="space-y-6 xl:col-span-2">
          {clock.revealed >= 1 && <>
          <CaseSourceEvidence c={c} />
          <PageSection title="Original machine capture, product and claim">
            <dl className="grid gap-2">
              <KeyValue k="Product (capture)" v={`${originalCapture.productText} · confidence ${originalCapture.productConfidence.toFixed(2)}`} />
              <KeyValue k="Product (master data)" v={pack.product ? `${pack.product.name}, pack ${pack.product.packSize}, category ${pack.product.category}, basic price £${pack.product.basicPrice.toFixed(2)}` : "Not resolved"} />
              <KeyValue k="Quantity (capture)" v={originalCapture.quantity ?? "Unreadable"} />
              <KeyValue k="Endorsement (capture)" v={`"${originalCapture.endorsementText || "none"}" · confidence ${originalCapture.endorsementConfidence.toFixed(2)}`} />
              <KeyValue k="Claim / ledger" v={`Qty ${c.claim.quantity}, £${c.claim.amountClaimed.toFixed(2)}, "${c.claim.endorsementText || "none"}", ${c.claim.submittedVia}`} />
              <KeyValue k="Concession this month" v={pack.concession ? `£${pack.concession.price.toFixed(2)} (${pack.tariffLabel})` : "None listed"} />
              <KeyValue k="Endorsement required?" v={pack.endorsementRequired === null ? "Unknown" : pack.endorsementRequired ? "Yes" : "No"} />
              <KeyValue k="Dispensing date (capture)" v={originalCapture.dispensingDate} />
              {c.paperDeclaration && <KeyValue k="Declared dispensing date for rule lookup" v={<>{c.paperDeclaration.dispensingDate}<span className="block text-xs text-muted-foreground">declared by the pharmacy, not read from the form</span></>} />}
            </dl>
          </PageSection>
          </>}
          {clock.revealed >= 2 && <>
          <PageSection title="Evidence" description="Every finding carries its source.">
            <ul className="space-y-1.5">
              {pack.evidence.map((e) => (
                <li key={e.id} className="rounded-md border p-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{e.field}</span>
                    <BoundaryTag cls={e.cls} short />
                  </div>
                  <p>{e.value}</p>
                  <p className="text-xs text-muted-foreground">Evidence: {e.origin} · {e.provenance}</p>
                </li>
              ))}
            </ul>
          </PageSection>
          </>}
        </div>
      </div>
        </div>
      </>}

      {(!agentEnabled || !pack.agentInvoked || clock.revealed >= 6) && <>
      <PageSection title="Operator decision" description="Human reason required; explain any override.">
        <Card className="border-orange-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BoundaryTag cls="human" /> {decided ? "Read-only: not awaiting an operator decision" : "Record the decision"}</CardTitle>
            {decided && existing.length > 0 && <CardDescription>Latest record: {existing[existing.length - 1].id}. Previous attempts remain in history.</CardDescription>}
          </CardHeader>
          {!decided && (
            <CardContent className="space-y-4">
              <RadioGroup value={chosen} onValueChange={(v) => setDecision(v as HumanDecision)} aria-label="Decision" className="grid gap-2 sm:grid-cols-2">
                {DECISIONS.filter((d) => agentEnabled || d.value !== "AMEND").map((d) => (
                  <div key={d.value} className="flex items-start gap-2 rounded-md border p-2.5">
                    <RadioGroupItem value={d.value} id={`d-${d.value}`} className="mt-0.5" disabled={agentEnabled && !showRecommendation && (d.value === "ACCEPT" || d.value === "AMEND")} />
                    <Label htmlFor={`d-${d.value}`} className="flex flex-col gap-0.5 font-normal">
                      <span className="font-medium">{!agentEnabled && d.value === "ACCEPT" ? "Sufficient (human choice)" : d.label}{showRecommendation && d.value === suggested ? " (as recommended)" : ""}</span>
                      <span className="text-xs text-muted-foreground">{!agentEnabled && d.value === "ACCEPT" ? "Your judgement, not an agent recommendation or payment approval." : d.help}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {canApprove && <div className="space-y-2">
                <label className="flex items-start gap-2"><input name="approve-draft" type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="mt-1 size-4" />Approve this draft for the pharmacy</label>
                <p className="text-sm text-muted-foreground">Optional. Only approved drafts accompany your human reason.</p>
              </div>}
              {disposition === "REFER_BACK" && <div className="space-y-1.5">
                <Label htmlFor="rb-code">RB code (required)</Label>
                <select id="rb-code" name="rb-code" value={rbCode} onChange={(event) => setRbCode(event.target.value)} required
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
                  <option value="">Choose an RB code</option>
                  {RB_CODE_CATALOG.map((entry) => <option key={entry.code} value={entry.code}>{entry.code}: {entry.reason}</option>)}
                </select>
              </div>}
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason (required)</Label>
                <Textarea id="reason" name="reason" autoComplete="off" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isOverride ? "Explain why you are departing from the recommendation." : "Explain your decision based on the evidence."} aria-required="true" minLength={8} />
              </div>
              <Button type="button" className="bg-orange-700 text-white hover:bg-orange-800" onClick={submit}>
                <Check aria-hidden="true" /> Record decision
              </Button>
              <p className="text-xs text-muted-foreground">Session record only. No payment approval.</p>
            </CardContent>
          )}
        </Card>
      </PageSection>
      </>}
    </div>
  );
}
