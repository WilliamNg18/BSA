import { useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSwitch as Switch } from "@/components/ui/native-switch";
import { NativeChoiceGroup as ToggleGroup, NativeChoiceItem as ToggleGroupItem } from "@/components/ui/native-radio-group";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, KeyValue, SyntheticTag } from "@/components/demo/labels";
import { PrescriptionForm } from "@/components/demo/prescription-form";
import { PainMarker } from "@/components/demo/pain-marker";
import { PharmacyAssumptions } from "@/components/demo/pharmacy-assumptions";
import { PharmacyTimeline } from "@/components/demo/pharmacy-timeline";
import { caseById } from "@/lib/domain/cases";
import { productByCode } from "@/lib/domain/reference";
import { PHARMACY_STEPS, completePharmacyScenario, pharmacyDateCorrection, pharmacySnapshot, type PharmacyScenario } from "@/lib/domain/pharmacy-check";
import type { PharmacyReceipt } from "@/lib/domain/pharmacy-timeline";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { usePharmacyCheck } from "@/hooks/use-pharmacy-check";
import { useAppStore } from "@/lib/store";
import { usePharmacyStore } from "@/lib/pharmacy-store";

export function PharmacyPage() {
  const agentEnabled = useAppStore((state) => state.agentEnabled);
  const assumptions = usePharmacyStore((state) => state.assumptions);
  const submit = usePharmacyStore((state) => state.submit);
  const receipts = usePharmacyStore((state) => state.receipts);
  const [scenario, setScenario] = useState<PharmacyScenario>("B");
  const [agentAvailable, setAgentAvailable] = useState(true);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<PharmacyReceipt | null>(null);
  const [error, setError] = useState("");
  const c = caseById(scenario === "A" ? "EX-24107" : scenario === "B" ? "EX-24112" : "EX-24123")!;
  const text = edited[c.id] ?? c.extracted.endorsementText;
  const enabled = agentEnabled && agentAvailable;
  const current = usePharmacyCheck(c, text, enabled);
  const result = current.result;
  const mode = !agentEnabled ? "off" : !agentAvailable ? "unavailable" : !result ? "pending" : "scripted";
  const status = !enabled ? "Agent unable to determine" : !result ? "Scripted check in progress" : result.status === "ready" ? "Ready to submit" : result.status === "missing" ? "Information may be missing" : "Agent unable to determine";
  const canApply = enabled && result?.status === "missing" && scenario === "B" && result.facts?.type === "NCSO" && result.facts.initialled && result.checks.some((entry) => entry.id === "dated" && entry.met === false);
  const correction = canApply ? pharmacyDateCorrection(c, text) : text;
  const product = productByCode(c.extracted.productCode);
  const stoppedAtCapture = scenario === "D" || c.imageQuality < QUALITY_THRESHOLD || !product;
  const update = (value: string) => setEdited((old) => ({ ...old, [c.id]: value }));

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="space-y-2">
      <SyntheticTag>Synthetic pharmacy, synthetic prescription, synthetic claim</SyntheticTag>
      <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">Pharmacy pre-submission check</h1>
      <div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-md border px-2 py-1">Advisory only</span><span className="rounded-md border px-2 py-1" data-scripted-badge>Scripted signal · Not live</span><BoundaryTag cls="human" /></div>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <ToggleGroup value={scenario} onValueChange={(value) => { if (value) setScenario(value as PharmacyScenario); }} aria-label="Choose a scenario" className="flex-wrap justify-start">
        <ToggleGroupItem value="A">Complete endorsement</ToggleGroupItem>
        <ToggleGroupItem value="B">Information missing</ToggleGroupItem>
        <ToggleGroupItem value="D">Unreadable form</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex items-center gap-2"><Switch id="agent-available" checked={agentAvailable} onCheckedChange={setAgentAvailable} /><Label htmlFor="agent-available">Agent available</Label></div>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-2">
      <PageSection title="Typed submission">
        <PrescriptionForm c={c} highlight={["item", "endorsement"]} />
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <KeyValue k="Product" v={product?.name ?? "Unresolved capture"} />
          <KeyValue k="Quantity" v={c.extracted.quantity ?? "Unreadable"} />
          <KeyValue k="Dispensing date" v={c.extracted.dispensingDate} />
          <KeyValue k="Provenance" v="Synthetic fixture · Typed field" />
        </dl>
        <div className="space-y-2">
          <Label htmlFor="endorsement">Endorsement entered by the pharmacy</Label>
          <div className="flex gap-2"><Input id="endorsement" value={text} onChange={(event) => update(event.target.value)} aria-describedby="endorsement-help" className={`min-w-0 font-mono ${canApply ? "border-amber-600 ring-1 ring-amber-600" : ""}`} /><Button variant="outline" onClick={() => update(c.extracted.endorsementText)}>Restore</Button></div>
          <p id="endorsement-help" className="text-xs text-muted-foreground">{canApply ? "Exact gap: Dated · Add the dispensing date beside the initials." : "Typed-field scenario · Original capture unchanged"}</p>
          <PainMarker resolved={enabled && result?.status === "ready"} pain="Typed field without a rule check · Scenario assumption" resolution="Typed requirements checked · Scripted signal" />
        </div>
      </PageSection>

      <PageSection title={enabled ? "Pre-submission check" : "Manual submission"}>
        <div className={`space-y-4 rounded-xl border p-4 ${result?.status === "ready" ? "border-emerald-600" : result?.status === "missing" ? "border-amber-600" : "border-border"}`}>
          <h3 className="text-lg font-semibold"><span role="status" data-pharmacy-status>{status}</span></h3>
          {!enabled ? <>
            <p className="text-sm">{!agentEnabled ? "Agent Off · No checks performed in this scenario; real pharmacy checks are unknown." : "Agent unavailable · No checks performed; manual submission remains available."}</p>
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
              <Button variant="outline" onClick={() => { update(correction); document.getElementById("endorsement")?.focus(); }}>Apply correction</Button>
            </section>}
          </>}
          <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => {
            try {
            const precheck = pharmacySnapshot(text, c.extracted.dispensingDate, mode, result, current.checkedAt);
            setReceipt(submit({ caseId: c.id, scenario, submittedAt: new Date().toISOString(), precheck, assumptions,
              completeScenario: completePharmacyScenario(c, text, result) }));
            setError("");
            } catch (err) { setError(err instanceof Error ? err.message : "Submission unavailable."); }
          }}><Send aria-hidden="true" />Continue with submission</Button>
          {error && <p role="alert">{error}</p>}
          <PainMarker resolved={enabled && result?.status === "ready"} pain="Submit now; problem may surface later · Assumption" resolution="Complete before submission · No payment guarantee" />
        </div>
      </PageSection>
    </div>

    <PharmacyAssumptions />
    {receipt && <>
      <section aria-label="Submission receipt" className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Submission receipt</h2>
        <p role="status">Submitted (synthetic). No claim sent; no payment changed.</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <KeyValue k="Receipt" v={receipt.id} /><KeyValue k="Case" v={receipt.caseId} /><KeyValue k="Submitted at" v={receipt.submittedAt} />
          <KeyValue k="Typed text snapshot" v={<span className="break-all">{receipt.precheck.typedText || "Empty"}</span>} />
          <KeyValue k="Check timestamp" v={receipt.precheck.checkedAt ?? "No checks performed"} />
          <KeyValue k="Version / clause" v={`${receipt.precheck.tariffVersion ?? "Not retrieved"} / ${receipt.precheck.clauseId ?? "Not retrieved"}`} />
          <KeyValue k="Check result" v={receipt.precheck.status} /><KeyValue k="Session receipts" v={receipts.length} /><KeyValue k="Storage" v="Shared lifecycle · Memory only" />
        </dl>
        <Button asChild variant="outline"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(receipt.caseId)}`}>View submitted claim</Link></Button>
        <Button asChild variant="outline"><Link to="/queue">Open shared queue</Link></Button>
      </section>
      <PharmacyTimeline key={receipt.id} receipt={receipt} />
    </>}
  </div>;
}
