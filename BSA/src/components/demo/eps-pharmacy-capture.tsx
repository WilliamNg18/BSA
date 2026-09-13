import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeChoiceGroup, NativeChoiceItem } from "@/components/ui/native-radio-group";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, KeyValue } from "./labels";
import { EpsPrescriptionMessage } from "./eps-prescription-message";
import { PainMarker } from "./pain-marker";
import { PharmacyTimeline } from "./pharmacy-timeline";
import { usePharmacyCheck } from "@/hooks/use-pharmacy-check";
import { caseById } from "@/lib/domain/cases";
import { createEpsPrescription, EPS_SUPPLY_RULE } from "@/lib/domain/eps-check";
import { checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { PHARMACY_STEPS, pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { productByCode } from "@/lib/domain/reference";
import type { EpsPrescription } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";

const SCENARIOS = [
  { id: "EX-24107", label: "Complete endorsement" },
  { id: "EX-24112", label: "NCSO missing date" },
  { id: "SYN-FQ123-TYPE2", label: "Generic missing brand" },
] as const;

interface EditorState {
  initialDraft: EpsPrescription;
  draft: EpsPrescription;
  observedRevision: number;
  receiptNumber: number | null;
}

function initialEditorState(caseId: string): EditorState {
  const { lifecycles, caseRevisions, itemProcesses } = useAppStore.getState();
  const source = caseForLifecycle(caseId, lifecycles, caseRevisions, itemProcesses)!;
  const initial = source.epsPrescription ?? createEpsPrescription(caseById(caseId) ?? source);
  const initialDraft: EpsPrescription = { ...structuredClone(initial), claimMessageState: "draft" };
  return { initialDraft, draft: initialDraft, observedRevision: caseRevisions[caseId].at(-1)!.number, receiptNumber: null };
}

export function EpsPharmacyCapture() {
  const [caseId, setCaseId] = useState<string>("EX-24112");
  const [editors, setEditors] = useState<Record<string, EditorState>>(() => Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, initialEditorState(scenario.id)])));
  return <div className="space-y-4">
    <NativeChoiceGroup value={caseId} onValueChange={setCaseId} aria-label="Choose an EPS scenario" className="flex-wrap justify-start">
      {SCENARIOS.map((scenario) => <NativeChoiceItem key={scenario.id} value={scenario.id}>{scenario.label}</NativeChoiceItem>)}
    </NativeChoiceGroup>
    <EpsClaimEditor key={caseId} caseId={caseId} editor={editors[caseId]} updateEditor={(patch) => setEditors((current) => ({
      ...current, [caseId]: { ...current[caseId], ...patch },
    }))} />
  </div>;
}

function EpsClaimEditor({ caseId, editor, updateEditor }: { caseId: string; editor: EditorState; updateEditor: (patch: Partial<EditorState>) => void }) {
  const enabled = useAppStore((state) => state.agentEnabled);
  const perspective = useAppStore((state) => state.perspective);
  const lifecycles = useAppStore((state) => state.lifecycles);
  const revisions = useAppStore((state) => state.caseRevisions);
  const processes = useAppStore((state) => state.itemProcesses);
  const { draft, initialDraft, observedRevision, receiptNumber } = editor;
  const [error, setError] = useState("");
  const [applied, setApplied] = useState("");
  const projected = useMemo(() => {
    const latest = revisions[caseId].at(-1)!;
    return caseForLifecycle(caseId, lifecycles, {
      ...revisions,
      [caseId]: [...revisions[caseId].slice(0, -1), { ...latest, channel: "eps", endorsementText: draft.dispenserEndorsement, epsPrescription: draft }],
    }, processes)!;
  }, [caseId, draft, lifecycles, revisions, processes]);
  const current = usePharmacyCheck(projected, draft.dispenserEndorsement, enabled, undefined, checkEpsPharmacy);
  const result = current.result;
  const status = !enabled ? "Not checked: manual submission" : !result ? "Scripted check in progress"
    : result.status === "ready" ? "Complete: will flow to automated pricing, no person involved"
      : result.status === "missing" ? "Information missing" : "Manual review required";
  const mode = !enabled ? "off" : !result ? "pending" : "scripted";
  const missing = new Set(result?.checks.filter((check) => check.met !== true).map((check) => check.id));
  const supply = draft.supplyEvidence;
  const receipt = revisions[caseId].find((revision) => revision.number === receiptNumber);
  const automatic = lifecycles[caseId].history.some((event) => event.revision === receiptNumber && event.processStep === "automatic_pricing");
  const update = (next: EpsPrescription) => { updateEditor({ draft: next }); setApplied(""); setError(""); };
  const supplyUpdate = (patch: Partial<NonNullable<EpsPrescription["supplyEvidence"]>>) => update({
    ...draft, supplyEvidence: { ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: "", packSize: null, form: "", ...supply, ...patch },
  });
  const suggestion = !enabled || !result || result.status !== "missing" ? null
    : missing.has("initialled") ? { label: "Add the contractor's initials", field: "endorsement", patch: null }
      : missing.has("dated") ? { label: "Add today's date beside the initials", field: "date", patch: null }
        : missing.has("brand_manufacturer") ? { label: "Add the brand or manufacturer dispensed", field: "brand", patch: { brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer } }
          : missing.has("pack_size") ? { label: "Add the pack size", field: "pack", patch: { packSize: EPS_SUPPLY_RULE.packSize } }
            : missing.has("presentation") ? { label: "State the form dispensed, for example tablets", field: "form", patch: { form: EPS_SUPPLY_RULE.form } } : null;
  const [year, month, day] = draft.dispensingDate.split("-");
  const dateCorrection = `${day}/${month}/${year?.slice(2)}`;

  return <div className="space-y-5">
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <PageSection title="Prescription and dispenser's claim">
        <EpsPrescriptionMessage prescription={draft} dispenser={false} />
        <section aria-label="Dispenser's part" className="space-y-4 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Dispenser&apos;s part</h3><BoundaryTag cls="human" /></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <KeyValue k="Product dispensed" v={draft.items[0].dispensedName} />
            <KeyValue k="dm+d-style code (synthetic)" v={draft.items[0].dispensedCode} />
          </dl>
          <div className="space-y-1"><Label htmlFor="eps-dispensing-date">Dispensing date</Label>
            <Input id="eps-dispensing-date" type="date" value={draft.dispensingDate} onChange={(event) => update({ ...draft, dispensingDate: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endorsement">Dispenser endorsement</Label>
            <Input id="endorsement" value={draft.dispenserEndorsement} onChange={(event) => update({ ...draft, dispenserEndorsement: event.target.value })}
              aria-describedby="eps-endorsement-help" className={enabled && (missing.has("dated") || missing.has("initialled")) ? "border-amber-600 ring-1 ring-amber-600" : ""} />
            <Button variant="outline" onClick={() => {
              update(structuredClone(initialDraft));
              document.getElementById("endorsement")?.focus();
            }}>Restore draft</Button>
            <p id="eps-endorsement-help" className="text-xs text-muted-foreground">Your actual text is sent unchanged. Prescriber and dispenser endorsements are separate.</p>
            <PainMarker resolved={enabled && result?.status === "ready"} pain="No check against this month's rule" resolution="Dispensing-month requirements checked" />
          </div>
          {draft.items[0].dispensedCode === EPS_SUPPLY_RULE.productCode && <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">Generic supply evidence (synthetic)</legend>
            <div className="space-y-1"><Label htmlFor="eps-manufacturer">Brand or manufacturer dispensed</Label>
              <Input id="eps-manufacturer" value={supply?.brandManufacturer ?? ""} onChange={(event) => supplyUpdate({ brandManufacturer: event.target.value })} aria-describedby={enabled && missing.has("brand_manufacturer") ? "eps-gap" : undefined} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label htmlFor="eps-pack">Pack size dispensed</Label>
                <Input id="eps-pack" type="number" min="1" step="1" value={supply?.packSize ?? ""} onChange={(event) => supplyUpdate({ packSize: event.target.value === "" ? null : Number(event.target.value) })} />
              </div>
              <div className="space-y-1"><Label htmlFor="eps-form">Form dispensed</Label>
                <Input id="eps-form" value={supply?.form ?? ""} onChange={(event) => supplyUpdate({ form: event.target.value })} />
              </div>
            </div>
          </fieldset>}
          <fieldset><legend className="mb-2 text-sm font-medium">Exemption status</legend>
            <NativeChoiceGroup value={draft.exemptionStatus} onValueChange={(value) => {
              if (value === "exempt" || value === "chargeable" || value === "not_recorded") update({ ...draft, exemptionStatus: value });
            }} aria-label="Exemption status" className="flex-wrap justify-start">
              <NativeChoiceItem value="exempt">Exempt</NativeChoiceItem>
              <NativeChoiceItem value="chargeable">Chargeable</NativeChoiceItem>
              <NativeChoiceItem value="not_recorded">Not recorded</NativeChoiceItem>
            </NativeChoiceGroup>
          </fieldset>
        </section>
      </PageSection>
      <PageSection title={enabled ? "Pre-submission check" : "Manual submission"}>
        <h3 role="status" data-pharmacy-status className="text-lg font-semibold">{status}</h3>
        <p className="text-sm">The agent verifies and advises; a person decides.</p>
        {!enabled ? <dl className="space-y-2 text-sm"><KeyValue k="Rule check" v="NOT RUN" /><KeyValue k="Version / clause" v="Not retrieved" /></dl> : <>
          <div className="flex flex-wrap gap-2"><BoundaryTag cls="agent" /><BoundaryTag cls="deterministic" /></div>
          <ol aria-label="Scripted pharmacy process" className="space-y-2">
            {PHARMACY_STEPS.map((label, index) => <li key={label} className="flex justify-between gap-2 rounded border p-2 text-sm">
              <span>{index === 0 ? "Digital claim fields" : label}</span><span>{result?.stages[index] ?? (index < current.phase ? "Staged" : index === current.phase ? "Checking" : "Pending")}</span>
            </li>)}
          </ol>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <KeyValue k="Endorsement type recognised" v={result?.facts?.type ?? "Pending"} />
            <KeyValue k="Dispensing-date version" v={result?.version ?? "Not retrieved"} />
          </dl>
          <p id="eps-gap" className="rounded-lg border p-3 text-sm"><strong>Exact gap: </strong>{result?.gap ?? "Pending"}</p>
          {result?.clause && <section aria-label="Validated synthetic rule" className="space-y-3 rounded-lg bg-muted/40 p-3">
            <h3 className="font-semibold">Retrieved clause: {result.clause.id}</h3>
            <p className="text-sm">{result.clause.text}</p>
            <p className="text-xs text-muted-foreground">Synthetic Tariff {result.version}. Demonstration rule, not real Drug Tariff text.</p>
          </section>}
          {result && result.checks.length > 0 && <ul aria-label="Requirement checkboxes" className="space-y-2">
            {result.checks.map((check) => <li key={check.id} className={`flex items-center gap-2 rounded border p-2 text-sm ${check.met === true ? "border-emerald-600" : "border-amber-600"}`}>
              <input type="checkbox" checked={check.met === true} readOnly aria-label={check.label} className="size-4 accent-teal-700" />
              <span>{check.label}: {check.met === true ? "met" : check.met === false ? "missing" : "unknown"}</span>
            </li>)}
          </ul>}
          {suggestion && <section aria-label="Suggested correction" className="space-y-3 rounded-lg border border-amber-600 p-3">
            <h3 className="font-semibold">{suggestion.label}</h3>
            <p className="text-sm">{suggestion.field === "date" ? `Demo dispensing day: ${dateCorrection}, not the computer's date.`
              : suggestion.field === "endorsement" ? "Only the person dispensing can supply their initials."
                : `Synthetic reference: ${productByCode(EPS_SUPPLY_RULE.productCode)?.name ?? EPS_SUPPLY_RULE.productCode}. Confirm the actual product before applying.`}</p>
            {suggestion.patch && <dl className="text-sm"><KeyValue k="Suggested field value" v={Object.values(suggestion.patch).join(", ")} /></dl>}
            <Button variant="outline" onClick={() => {
              if (suggestion.field === "endorsement") { document.getElementById("endorsement")?.focus(); return; }
              if (suggestion.patch) supplyUpdate(suggestion.patch);
              else update({ ...draft, dispenserEndorsement: `${draft.dispenserEndorsement.trimEnd()} ${dateCorrection}` });
              setApplied("Correction applied to the draft only. Send claim remains a separate action.");
              document.getElementById(suggestion.field === "brand" ? "eps-manufacturer" : suggestion.field === "pack" ? "eps-pack" : suggestion.field === "form" ? "eps-form" : "endorsement")?.focus();
            }}>{suggestion.field === "endorsement" ? "Enter initials" : "Apply correction"}</Button>
          </section>}
          {applied && <p role="status" className="text-sm">{applied}</p>}
        </>}
        <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => {
          try {
            const store = useAppStore.getState();
            const payload = { caseId, revision: observedRevision, channel: "eps" as const, endorsementText: draft.dispenserEndorsement,
              epsPrescription: { ...draft, claimMessageState: "submitted" as const },
              precheck: pharmacySnapshot(draft.dispenserEndorsement, draft.dispensingDate, mode, result, current.checkedAt) };
            store.submitItem(payload);
            const submitted = useAppStore.getState().caseRevisions[caseId].at(-1)!;
            updateEditor({ observedRevision: submitted.number, receiptNumber: submitted.number }); setError("");
          } catch (err) { setError(err instanceof Error ? err.message : "Claim submission unavailable."); }
        }}><Send aria-hidden="true" />Send claim</Button>
        <BoundaryTag cls="human" />
        <PainMarker resolved={enabled && result?.status === "ready"} pain="Problems found at NHSBSA weeks later" resolution="Advice checked before sending; no payment guarantee" />
        <p className="text-xs text-muted-foreground">Send creates a new synthetic attempt. Use the claim view to correct a referral. No real claim or payment changes.</p>
        {error && <p role="alert">{error}</p>}
      </PageSection>
    </div>
    {receipt && <section aria-label="Submission receipt" className="space-y-4 rounded-xl border p-4">
      <h2 className="font-semibold">Submission receipt</h2>
      <p role="status">Submitted (synthetic). Original attempts are retained.</p>
      <p className="text-sm">{automatic ? "Paid on the normal schedule: priced by NHSBSA's existing rules engine, no person involved."
        : receipt.kind === "resubmission" ? "Resubmitted: awaiting human re-check." : "Awaiting Type 2 judgement. No referral or operator decision has been made by the agent."}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2"><KeyValue k="Receipt" v={`${caseId}:${receipt.number}`} /><KeyValue k="Submitted at" v={receipt.at} />
        <KeyValue k="Typed text snapshot" v={receipt.endorsementText || "Empty"} /><KeyValue k="Check result" v={receipt.precheck?.status ?? "not_checked"} />
        <KeyValue k="Check timestamp" v={receipt.precheck?.checkedAt ?? "No checks performed"} />
        <KeyValue k="Version / clause" v={`${receipt.precheck?.tariffVersion ?? "Not retrieved"} / ${receipt.precheck?.clauseId ?? "Not retrieved"}`} />
        <KeyValue k="Storage" v="Shared lifecycle, memory only" /></dl>
      {receipt.epsPrescription && <details><summary className="cursor-pointer font-medium">Recorded claim message</summary><div className="mt-3"><EpsPrescriptionMessage prescription={receipt.epsPrescription} /></div></details>}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(caseId)}`}>View submitted claim</Link></Button>
        {perspective !== "pharmacy" && <Button asChild variant="outline"><Link to="/queue">Open shared queue</Link></Button>}
      </div>
      <PharmacyTimeline key={`${caseId}:${receipt.number}`} caseId={caseId} revision={receipt.number} />
    </section>}
  </div>;
}
