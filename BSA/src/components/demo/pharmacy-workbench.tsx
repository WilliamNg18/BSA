import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeChoiceGroup as ToggleGroup, NativeChoiceItem as ToggleGroupItem } from "@/components/ui/native-radio-group";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, KeyValue, SyntheticTag } from "@/components/demo/labels";
import { PrescriptionForm } from "@/components/demo/prescription-form";
import { PainMarker } from "@/components/demo/pain-marker";
import { PharmacyTimeline } from "@/components/demo/pharmacy-timeline";
import { caseById } from "@/lib/domain/cases";
import { productByCode } from "@/lib/domain/reference";
import { PHARMACY_STEPS, pharmacyDateCorrection, pharmacySnapshot, type PharmacyScenario } from "@/lib/domain/pharmacy-check";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { usePharmacyCheck } from "@/hooks/use-pharmacy-check";
import { useAppStore } from "@/lib/store";
import type { PharmacyPrecheckSnapshot } from "@/lib/domain/lifecycle";
import type { ItemChannel, PharmacyDeclaration } from "@/lib/domain/types";

export function PharmacyPage() {
  const enabled = useAppStore((state) => state.agentEnabled);
  const perspective = useAppStore((state) => state.perspective);
  const caseRevisions = useAppStore((state) => state.caseRevisions);
  const recordCorrection = useAppStore((state) => state.recordPharmacyCorrection);
  const submit = useAppStore((state) => state.submitItem);
  const lifecycles = useAppStore((state) => state.lifecycles);
  const [scenario, setScenario] = useState<PharmacyScenario>("B");
  const [channel, setChannel] = useState<ItemChannel>("eps");
  const [declaredFields, setDeclaredFields] = useState<Record<string, { productCode: string; quantity: string; prescriber: string }>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [receiptKey, setReceiptKey] = useState<{ caseId: string; revision: number } | null>(null);
  const [error, setError] = useState("");
  const pendingCorrection = useRef<{ caseId: string; text: string; revision: number; before: PharmacyPrecheckSnapshot } | null>(null);
  const c = caseById(scenario === "A" ? "EX-24107" : scenario === "B" ? "EX-24112" : "EX-24123")!;
  const editKey = `${c.id}:${channel}`;
  const text = edited[editKey] ?? (channel === "paper" ? "" : c.extracted.endorsementText);
  const fields = declaredFields[c.id] ?? { productCode: "", quantity: "", prescriber: "" };
  const receipt = receiptKey ? caseRevisions[receiptKey.caseId]?.find((entry) => entry.number === receiptKey.revision) : null;
  const receiptEvents = receiptKey ? lifecycles[receiptKey.caseId]?.history.filter((event) => event.revision === receiptKey.revision) : [];
  const automaticallyPriced = receiptEvents?.some((event) => event.processStep === "automatic_pricing");
  const checkOptions = useMemo(() => ({
    channel,
    declaration: channel === "paper" ? {
      fields: { productCode: fields.productCode.trim() || null, quantity: fields.quantity.trim() ? Number(fields.quantity) : null, endorsementText: text, prescriber: fields.prescriber.trim() || null },
      declaredAt: new Date().toISOString(), provenance: "pharmacy_declaration" as const,
    } : undefined,
  }), [channel, fields.productCode, fields.quantity, fields.prescriber, text]);
  const current = usePharmacyCheck(c, text, enabled, checkOptions);
  const result = current.result;
  const mode = !enabled ? "off" : !result ? "pending" : "scripted";
  const status = !enabled ? "Not checked: manual submission"
    : !result ? "Scripted check in progress" : result.status === "ready"
      ? channel === "eps" ? "Complete: will flow to automated pricing" : "Declaration complete: human capture confirmation required"
      : result.status === "missing" ? "Information may be missing" : "Agent unable to determine";
  const canApply = enabled && result?.status === "missing" && scenario === "B" && result.facts?.type === "NCSO" && result.facts.initialled && result.checks.some((entry) => entry.id === "dated" && entry.met === false);
  const correction = canApply ? pharmacyDateCorrection(c, text) : text;
  const product = productByCode(c.extracted.productCode);
  const stoppedAtCapture = channel === "paper" && (scenario === "D" || c.imageQuality < QUALITY_THRESHOLD || !product);
  const update = (value: string) => {
    pendingCorrection.current = null;
    setEdited((old) => ({ ...old, [editKey]: value }));
  };
  function declaration(): PharmacyDeclaration | undefined {
    if (channel !== "paper") return undefined;
    const quantity = fields.quantity.trim() ? Number(fields.quantity) : null;
    if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0)) throw new Error("Declared quantity must be a positive number or left blank.");
    return { fields: { productCode: fields.productCode.trim() || null, quantity, endorsementText: text, prescriber: fields.prescriber.trim() || null },
      declaredAt: new Date().toISOString(), provenance: "pharmacy_declaration" };
  }
  useEffect(() => {
    const pending = pendingCorrection.current;
    if (!pending) return;
    if (!enabled || pending.caseId !== c.id || pending.text !== text ||
      pending.revision !== caseRevisions[c.id].at(-1)!.number + 1) {
      pendingCorrection.current = null;
      return;
    }
    if (!result || !current.checkedAt) return;
    pendingCorrection.current = null;
    if (result.status !== "ready") return;
    try {
      recordCorrection(c.id, pending.before, pharmacySnapshot(text, c.extracted.dispensingDate, mode, result, current.checkedAt), pending.revision);
    } catch (err) { setError(err instanceof Error ? err.message : "Correction evidence unavailable."); }
  }, [enabled, c, text, caseRevisions, result, current.checkedAt, mode, recordCorrection]);

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="space-y-2">
      <SyntheticTag>Synthetic pharmacy, synthetic prescription, synthetic claim</SyntheticTag>
      <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">Pharmacy pre-submission check</h1>
      <div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-md border px-2 py-1">Advisory only</span><span className="rounded-md border px-2 py-1" data-scripted-badge>Scripted signal · Not live</span><BoundaryTag cls="human" /></div>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <ToggleGroup value={scenario} onValueChange={(value) => { if (value) { pendingCorrection.current = null; setScenario(value as PharmacyScenario); setChannel(value === "D" ? "paper" : "eps"); } }} aria-label="Choose a scenario" className="flex-wrap justify-start">
        <ToggleGroupItem value="A">Complete endorsement</ToggleGroupItem>
        <ToggleGroupItem value="B">Information missing</ToggleGroupItem>
        <ToggleGroupItem value="D">Unreadable form</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup value={channel} onValueChange={(value) => {
        if (value === "eps" || value === "paper") { pendingCorrection.current = null; setChannel(value); }
      }} aria-label="Submission channel">
        <ToggleGroupItem value="eps">EPS</ToggleGroupItem>
        <ToggleGroupItem value="paper">Paper</ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-2">
      <PageSection title={channel === "eps" ? "EPS typed claim message" : "Paper form and typed declaration"}>
        {channel === "paper" ? <>
          <PrescriptionForm c={c} highlight={["item", "endorsement"]} />
          <p className="text-sm">Proposed declaration support. Type the fields alongside the form. The agent cannot read an unreadable scan.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="declared-product">Declared product code</Label>
              <Input id="declared-product" value={fields.productCode} aria-describedby="declaration-provenance" onChange={(event) => {
                pendingCorrection.current = null;
                setDeclaredFields((old) => ({ ...old, [c.id]: { ...fields, productCode: event.target.value } }));
              }} />
            </div>
            <div className="space-y-1"><Label htmlFor="declared-quantity">Declared quantity</Label>
              <Input id="declared-quantity" type="number" min="0" step="any" value={fields.quantity} aria-describedby="declaration-provenance" onChange={(event) => {
                pendingCorrection.current = null;
                setDeclaredFields((old) => ({ ...old, [c.id]: { ...fields, quantity: event.target.value } }));
              }} />
            </div>
            <div className="space-y-1 sm:col-span-2"><Label htmlFor="declared-prescriber">Declared prescriber (synthetic)</Label>
              <Input id="declared-prescriber" value={fields.prescriber} aria-describedby="declaration-provenance" onChange={(event) => {
                pendingCorrection.current = null;
                setDeclaredFields((old) => ({ ...old, [c.id]: { ...fields, prescriber: event.target.value } }));
              }} />
            </div>
          </div>
          <p id="declaration-provenance" className="text-sm">Every declaration field: declared by the pharmacy, not read from the form.</p>
        </> : <p className="text-sm">EPS carries product codes and the pharmacy&apos;s typed endorsement. No paper scan is used for this message.</p>}
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <KeyValue k="Product" v={product?.name ?? "Unresolved capture"} />
          <KeyValue k="Quantity" v={c.extracted.quantity ?? "Unreadable"} />
          <KeyValue k="Dispensing date" v={c.extracted.dispensingDate} />
          <KeyValue k="Provenance" v={channel === "eps" ? "Synthetic EPS claim message" : "Form evidence, not the typed declaration"} />
        </dl>
        <div className="space-y-2">
          <Label htmlFor="endorsement">Endorsement entered by the pharmacy</Label>
          <div className="flex gap-2"><Input id="endorsement" value={text} onChange={(event) => update(event.target.value)} aria-describedby={channel === "paper" ? "endorsement-help declaration-provenance" : "endorsement-help"} className={`min-w-0 font-mono ${canApply ? "border-amber-600 ring-1 ring-amber-600" : ""}`} /><Button variant="outline" onClick={() => update(channel === "paper" ? "" : c.extracted.endorsementText)}>Restore</Button></div>
          <p id="endorsement-help" className="text-xs text-muted-foreground">{canApply ? "Exact gap: Dated · Add the dispensing date beside the initials." : "Typed-field scenario · Original capture unchanged"}</p>
          <PainMarker resolved={enabled && result?.status === "ready"} pain="Typed field without a rule check · Scenario assumption" resolution="Typed requirements checked · Scripted signal" />
        </div>
      </PageSection>

      <PageSection title={enabled ? "Pre-submission check" : "Manual submission"}>
        <div className={`space-y-4 rounded-xl border p-4 ${result?.status === "ready" ? "border-emerald-600" : result?.status === "missing" ? "border-amber-600" : "border-border"}`}>
          <h3 className="text-lg font-semibold"><span role="status" data-pharmacy-status>{status}</span></h3>
          {!enabled ? <>
            <p className="text-sm">Agent Off · No checks performed in this scenario; real pharmacy checks are unknown.</p>
            <dl className="space-y-2 text-sm"><KeyValue k="Rule check" v="NOT RUN" /><KeyValue k="Version / clause" v="Not retrieved" /><KeyValue k="Scenario" v="Manual typed submission" /></dl>
          </> : <>
            <ol aria-label="Scripted pharmacy process" className="space-y-2">
              {PHARMACY_STEPS.map((label, index) => {
                const value = result ? result.stages[index] : stoppedAtCapture && index > 0 ? "NOT RUN" : index < current.phase ? "Staged" : index === current.phase ? "Checking" : "Pending";
                return <li key={label} className="flex justify-between gap-3 rounded-md border p-2 text-sm"><span>{label}</span><span className={value === "PASS" ? "font-semibold text-emerald-700 dark:text-emerald-300" : value === "MISSING" ? "font-semibold text-amber-800 dark:text-amber-200" : "font-medium"}>{value}</span></li>;
              })}
            </ol>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <KeyValue k="Endorsement type" v={result?.facts?.type ?? "Not established"} />
              <KeyValue k="Agreement" v={result?.agreement ?? "NOT RUN"} />
              <KeyValue k="Dispensing-date version" v={result?.version ?? "Not retrieved"} />
              <KeyValue k="Exact gap" v={result?.gap ?? "Pending"} />
            </dl>
            {result?.clause && <section className="space-y-3 rounded-lg bg-muted/40 p-3 [&_dt]:text-foreground" aria-label="Validated synthetic rule">
              <h3 className="font-semibold">Rule retrieved for {c.extracted.dispensingDate}</h3>
              <div className="flex flex-wrap gap-2"><BoundaryTag cls="agent" /><BoundaryTag cls="deterministic" /></div>
              <dl className="space-y-2 text-sm"><KeyValue k="Clause" v={`${result.clause.part} · ${result.clause.id} · ${result.clause.title}`} /><KeyValue k="Provenance" v={`Synthetic tariff ${result.version}`} /></dl>
              <p className="text-sm">{result.clause.text}</p>
              <h4 className="text-sm font-semibold">Deterministic checks</h4>
              <ul aria-label="Requirement checkboxes" className="space-y-2">
                {result.checks.map((entry) => <li key={entry.id} className={`flex items-center gap-2 rounded border p-2 text-sm ${entry.met ? "border-emerald-600" : "border-amber-600"}`}><input type="checkbox" checked={entry.met === true} readOnly aria-label={entry.label} className="size-4 accent-teal-700" /><span>{entry.label}: {entry.met === true ? "met" : "not met"}</span></li>)}
              </ul>
              <dl className="text-xs"><dt>Reading of the note (mocked interpretation):</dt><dd>{result.facts?.note}</dd></dl>
            </section>}
            {canApply && <section aria-label="Suggested correction" className="space-y-2 rounded-lg border border-amber-600 p-3">
              <h3 className="font-semibold">Suggested correction</h3>
              <dl className="text-sm"><KeyValue k="Append dispensing date" v={correction.slice(text.trimEnd().length).trim()} /><KeyValue k="Provenance" v="Dispensing date · Deterministic suggestion" /></dl>
              <Button variant="outline" onClick={() => {
                update(correction);
                pendingCorrection.current = {
                  caseId: c.id, text: correction, revision: caseRevisions[c.id].at(-1)!.number + 1,
                  before: pharmacySnapshot(text, c.extracted.dispensingDate, mode, result, current.checkedAt),
                };
                document.getElementById("endorsement")?.focus();
              }}>Apply fix</Button>
            </section>}
          </>}
          <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => {
            try {
            const precheck = pharmacySnapshot(text, c.extracted.dispensingDate, mode, result, current.checkedAt);
            submit({ caseId: c.id, channel, endorsementText: text, declaration: declaration(), precheck });
            const submitted = useAppStore.getState().caseRevisions[c.id].at(-1)!;
            setReceiptKey({ caseId: c.id, revision: submitted.number });
            setError("");
            } catch (err) { setError(err instanceof Error ? err.message : "Submission unavailable."); }
          }}><Send aria-hidden="true" />Continue with submission</Button>
          {error && <p role="alert">{error}</p>}
          <p className="text-sm">The agent verifies the submission and advises; a person decides. Submission remains your explicit action, even when advice is incomplete.</p>
          <PainMarker resolved={enabled && result?.status === "ready"} pain="Submit now; problem may surface later · Assumption" resolution="Complete before submission · No payment guarantee" />
        </div>
      </PageSection>
    </div>

    {receipt && receiptKey && <>
      <section aria-label="Submission receipt" className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Submission receipt</h2>
        <p role="status">Submitted (synthetic). No claim sent; no payment changed.</p>
        {automaticallyPriced ? <p>Paid on the normal schedule (synthetic): priced by NHSBSA&apos;s existing rules engine; no person involved.</p>
          : <p>{receipt.channel === "paper" ? "Paper submitted for capture and routing. Type 1 confirmation and any Type 2 judgement remain human actions." : "Submitted for Type 2 judgement. No referral or operator decision has been made by the agent."}</p>}
        {receipt.precheck?.mode === "scripted" && !automaticallyPriced && <section aria-label="Pre-built advisory case" className="space-y-1">
          <h3 className="font-semibold">Advisory case for NHSBSA</h3>
          <p>Submitted anyway: this check snapshot travels with the item. It is not an operator decision or an approved referral note.</p>
          <ul>{receipt.precheck.checks.map((check) => <li key={check.id}>{check.label}: {check.met === true ? "met" : check.met === false ? "missing" : "unknown"}</li>)}</ul>
        </section>}
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <KeyValue k="Receipt" v={`${receiptKey.caseId}:${receipt.number}`} /><KeyValue k="Case" v={receiptKey.caseId} /><KeyValue k="Submitted at" v={receipt.at} />
          <KeyValue k="Channel" v={receipt.channel === "paper" ? "Paper" : "EPS"} />
          <KeyValue k="Typed text snapshot" v={<span className="break-all">{receipt.endorsementText || "Empty"}</span>} />
          <KeyValue k="Check timestamp" v={receipt.precheck?.checkedAt ?? "No checks performed"} />
          <KeyValue k="Version / clause" v={`${receipt.precheck?.tariffVersion ?? "Not retrieved"} / ${receipt.precheck?.clauseId ?? "Not retrieved"}`} />
          <KeyValue k="Check result" v={receipt.precheck?.status ?? "not_checked"} /><KeyValue k="Storage" v="Shared lifecycle · Memory only" />
        </dl>
        {receipt.declaration && <section aria-label="Submitted pharmacy declaration" className="space-y-2">
          <h3 className="font-semibold">Declaration submitted with paper</h3>
          <p>Every field: declared by the pharmacy, not read from the form.</p>
          <dl><KeyValue k="Declared product code" v={receipt.declaration.fields.productCode ?? "Not declared"} />
            <KeyValue k="Declared quantity" v={receipt.declaration.fields.quantity ?? "Not declared"} />
            <KeyValue k="Declared prescriber" v={receipt.declaration.fields.prescriber ?? "Not declared"} />
            <KeyValue k="Declared endorsement" v={receipt.declaration.fields.endorsementText || "Not declared"} /></dl>
        </section>}
        <Button asChild variant="outline"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(receiptKey.caseId)}`}>View submitted claim</Link></Button>
        {perspective !== "pharmacy" && <Button asChild variant="outline"><Link to="/queue">Open shared queue</Link></Button>}
      </section>
      <PharmacyTimeline key={`${receiptKey.caseId}:${receipt.number}`} caseId={receiptKey.caseId} revision={receipt.number} />
    </>}
  </div>;
}
