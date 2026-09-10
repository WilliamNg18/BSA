import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Check, FileText, Scale } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PageSection } from "@/components/page-section";
import { ErrorState } from "@/components/states";
import { CaseHeader } from "@/components/demo/case-header";
import { BoundaryTag, KeyValue, RecommendationBadge, StatusDot } from "@/components/demo/labels";
import { REC_META } from "@/components/demo/label-meta";
import { PrescriptionForm } from "@/components/demo/prescription-form";
import { CompositeBadge, SignalList } from "@/components/demo/signals";
import { runAgent } from "@/lib/domain/agent";
import { caseById } from "@/lib/domain/cases";
import type { HumanDecision } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";

const DECISIONS: { value: HumanDecision; label: string; help: string }[] = [
  { value: "ACCEPT", label: "Accept the recommendation", help: "Proceed as the agent recommends." },
  { value: "AMEND", label: "Amend", help: "Same outcome, different wording or reason." },
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
  const navigate = useNavigate();
  const c = caseById(id);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const state = useAppStore((s) => (id ? s.caseStates[id] : undefined));
  const recordDecision = useAppStore((s) => s.recordDecision);
  const records = useAppStore((s) => s.records);
  const existing = useMemo(() => records.filter((r) => r.caseId === id), [records, id]);
  const pack = useMemo(() => (c ? runAgent(c, { agentEnabled }) : null), [c, agentEnabled]);
  const [decision, setDecision] = useState<HumanDecision | null>(null);
  const [reason, setReason] = useState("");

  if (!c || !pack || !state) {
    return <ErrorState title="Case not found" description="Choose a case from the exception queue." action={<Button asChild variant="outline"><Link to="/queue">Go to the queue</Link></Button>} />;
  }

  const showRecommendation = pack.agentInvoked && pack.recommendation !== "ABSTAIN" && pack.recommendation !== "NONE" && pack.gate.result === "PASS";
  const suggested = showRecommendation ? suggestedFor(pack.recommendation) : "ESCALATE";
  const chosen = !showRecommendation && (decision === "ACCEPT" || decision === "AMEND") ? "ESCALATE" : decision ?? suggested;
  const isOverride = showRecommendation && chosen !== suggested && !(chosen === "ACCEPT");
  const needsReason = isOverride || !showRecommendation;
  const decided = state === "human_decision_recorded";

  function submit() {
    if (!c || !pack) return;
    if (needsReason && reason.trim().length < 8) {
      toast.error("A reason is required when you override the recommendation, or when there is no recommendation to accept.");
      return;
    }
    const rec = recordDecision({
      caseId: c.id,
      tariffVersion: pack.tariffVersion,
      agentVersion: pack.agentVersion,
      inputs: [
        `Extracted fields: ${c.extracted.productText}, qty ${c.extracted.quantity ?? "?"}, endorsement "${c.extracted.endorsementText || "none"}"`,
        `Claim: qty ${c.claim.quantity}, £${c.claim.amountClaimed.toFixed(2)}, ${c.claim.submittedVia}`,
        `Image ${c.id}.tif, quality ${c.imageQuality.toFixed(2)}`,
      ],
      sources: Array.from(new Set(pack.evidence.map((e) => e.origin))),
      checks: pack.gate.checks,
      recommendation: pack.recommendation,
      decision: chosen,
      overrideReason: reason.trim() || null,
    });
    toast.success(`Decision recorded as ${rec.id}`);
    navigate(`/case/${c.id}/record`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CaseHeader
        c={c}
        state={state}
        title={`Operator case pack: ${c.title}`}
        intro="Review the form, evidence, applicable rule, conflicts and gate checks. Assistance recommends only; the operator decides."
      />

      {!pack.agentInvoked && (
        <Alert>
          <FileText aria-hidden="true" />
          <AlertTitle>{pack.state === "cleared_by_rules" ? "Cleared by deterministic rules; the agent was not called" : "Agent recommendations are switched off"}</AlertTitle>
          <AlertDescription>{pack.reasons.join(" ")} The operator works the item exactly as today, with the gathered evidence attached.</AlertDescription>
        </Alert>
      )}
      {pack.recommendation === "ABSTAIN" && (
        <Alert className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950">
          <AlertTriangle className="text-rose-700" aria-hidden="true" />
          <AlertTitle>The agent abstained</AlertTitle>
          <AlertDescription>
            <p>No recommendation is shown because the evidence does not support one. The item follows today's process; nothing about it has been changed.</p>
            <ul className="mt-1 list-disc pl-5">{pack.abstainReasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </AlertDescription>
        </Alert>
      )}
      {pack.agentInvoked && pack.gate.result === "FAIL" && (
        <Alert className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950">
          <AlertTriangle className="text-rose-700" aria-hidden="true" />
          <AlertTitle>Recommendation withheld by the compliance gate</AlertTitle>
          <AlertDescription>The agent proposed an outcome the rules do not permit. The operator sees the evidence only.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
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
                {pack.draftToPharmacy && (
                  <section data-prose="pharmacy draft" className="rounded-md border p-3">
                    <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">Draft explanation to the pharmacy <BoundaryTag cls="agent" short /></h3>
                    <blockquote className="rounded-md border-l-4 border-teal-600 bg-muted/40 p-3 text-sm">{pack.draftToPharmacy}</blockquote>
                    <span className="mt-1 text-xs text-muted-foreground">Draft · Human review required</span>
                  </section>
                )}
              </CardContent>
            </Card>
          </PageSection>

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

          <PageSection title="Conflicts and missing evidence" description={pack.conflicts.length ? "Each source is shown; the agent does not choose between them." : "The sources agree."}>
            {pack.conflicts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No disagreement between the form, the extracted fields, the claim and the product data.</p>
            ) : (
              <ul className="space-y-2">
                {pack.conflicts.map((k) => (
                  <li key={k.field} className="rounded-md border border-amber-500 bg-amber-50 p-3 text-sm dark:bg-amber-950">
                    <h3 className="font-semibold">{k.field} {k.material && <span className="ml-1 rounded bg-amber-600 px-1.5 py-0.5 text-xs text-white">material</span>}</h3>
                    <ul className="mt-1 grid gap-1 sm:grid-cols-2">{k.values.map((v) => <li key={v.origin} className="rounded bg-background px-2 py-1"><span className="text-muted-foreground">{v.origin}:</span> <span className="font-medium">{v.value}</span></li>)}</ul>
                    <p className="mt-1 text-muted-foreground">{k.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </PageSection>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <PageSection title="Prescription image" description="The regions the agent read are highlighted.">
            <PrescriptionForm c={c} highlight={["item", "endorsement"]} />
          </PageSection>
          <PageSection title="Extracted fields, product and claim">
            <dl className="grid gap-2">
              <KeyValue k="Product (capture)" v={`${c.extracted.productText} · confidence ${c.extracted.productConfidence.toFixed(2)}`} />
              <KeyValue k="Product (master data)" v={pack.product ? `${pack.product.name}, pack ${pack.product.packSize}, category ${pack.product.category}, basic price £${pack.product.basicPrice.toFixed(2)}` : "Not resolved"} />
              <KeyValue k="Quantity (capture)" v={c.extracted.quantity ?? "Unreadable"} />
              <KeyValue k="Endorsement (capture)" v={`"${c.extracted.endorsementText || "none"}" · confidence ${c.extracted.endorsementConfidence.toFixed(2)}`} />
              <KeyValue k="Claim / ledger" v={`Qty ${c.claim.quantity}, £${c.claim.amountClaimed.toFixed(2)}, "${c.claim.endorsementText || "none"}", ${c.claim.submittedVia}`} />
              <KeyValue k="Concession this month" v={pack.concession ? `£${pack.concession.price.toFixed(2)} (${pack.tariffLabel})` : "None listed"} />
              <KeyValue k="Endorsement required?" v={pack.endorsementRequired === null ? "Unknown" : pack.endorsementRequired ? "Yes" : "No"} />
              <KeyValue k="Dispensing date" v={c.extracted.dispensingDate} />
            </dl>
          </PageSection>
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
        </div>
      </div>

      <PageSection title="Operator decision" description="The consequential decision is a person's. A reason is mandatory for any override, and whenever there is no recommendation to accept.">
        <Card className="border-orange-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BoundaryTag cls="human" /> {decided ? "Decision already recorded for this case" : "Record the decision"}</CardTitle>
            {decided && existing.length > 0 && <CardDescription>Recorded as {existing[existing.length - 1].id}. Reset the demo from the header to work it again.</CardDescription>}
          </CardHeader>
          {!decided && (
            <CardContent className="space-y-4">
              <RadioGroup value={chosen} onValueChange={(v) => setDecision(v as HumanDecision)} aria-label="Decision" className="grid gap-2 sm:grid-cols-2">
                {DECISIONS.map((d) => (
                  <div key={d.value} className="flex items-start gap-2 rounded-md border p-2.5">
                    <RadioGroupItem value={d.value} id={`d-${d.value}`} className="mt-0.5" disabled={!showRecommendation && (d.value === "ACCEPT" || d.value === "AMEND")} />
                    <Label htmlFor={`d-${d.value}`} className="flex flex-col gap-0.5 font-normal">
                      <span className="font-medium">{d.label}{showRecommendation && d.value === suggested ? " (as recommended)" : ""}</span>
                      <span className="text-xs text-muted-foreground">{d.help}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="space-y-1.5">
                <Label htmlFor="reason">{needsReason ? "Reason (required)" : "Reason (optional)"}</Label>
                <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isOverride ? "Why you are departing from the recommendation. This is the most valuable data the system collects." : needsReason ? "Explain your decision based on the evidence." : "Optional note for the record."} aria-required={needsReason} />
              </div>
              <Button type="button" className="bg-orange-700 text-white hover:bg-orange-800" onClick={submit}>
                <Check aria-hidden="true" /> Record decision
              </Button>
              <p className="text-xs text-muted-foreground">This prototype writes a session record only. No payments or approvals; existing systems retain pricing and referral responsibility.</p>
            </CardContent>
          )}
        </Card>
      </PageSection>
    </div>
  );
}
