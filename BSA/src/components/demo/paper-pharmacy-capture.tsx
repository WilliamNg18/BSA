import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoundaryTag } from "./labels";
import { PainMarker } from "./pain-marker";
import { PrescriptionForm } from "./prescription-form";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { useAppStore } from "@/lib/store";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";
import { PAPER_DECLARATION_PROVENANCE } from "@/lib/domain/paper-capture";
import { checkPaperDeclaration, EMPTY_PAPER_DECLARATION, preparePaperDeclaration, WORKED_PAPER_DECLARATION, type PaperDeclarationDraft } from "@/lib/domain/paper-declaration";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { CASES } from "@/lib/domain/cases";
import { paperImageEvidence } from "@/lib/domain/capture-evidence";
import type { PaperDeclaration } from "@/lib/domain/types";

const defaultCaseId = CASES.find((c) => c.scenario === "D")!.id;

export function PaperPharmacyCapture({ caseId = defaultCaseId }: { caseId?: string } = {}) {
  const c = useLifecycleCase(caseId);
  const enabled = useAppStore((s) => s.agentEnabled);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1));
  const lifecycle = useAppStore((s) => s.lifecycles[caseId]);
  const submitItem = useAppStore((s) => s.submitItem);
  const resubmitItem = useAppStore((s) => s.resubmitItem);
  const id = useId();
  const [draft, setDraft] = useState<PaperDeclarationDraft>({ ...EMPTY_PAPER_DECLARATION });
  const [sourceRevision, setSourceRevision] = useState(revision);
  const [error, setError] = useState("");
  if (revision !== sourceRevision) {
    setSourceRevision(revision);
    setDraft({ ...EMPTY_PAPER_DECLARATION });
    setError("");
  }
  if (!c || !revision || !lifecycle) return <p role="alert">Paper item unavailable. Reopen it from the pharmacy workbench.</p>;

  let paper: PaperDeclaration | undefined;
  let validationError = "";
  try { paper = enabled ? preparePaperDeclaration(draft) : undefined; }
  catch (cause) { validationError = cause instanceof Error ? cause.message : "Declaration cannot be checked."; }
  const result = paper ? checkPaperDeclaration(c, paper) : null;
  const labels: Record<keyof PaperDeclarationDraft, string> = {
    typedProduct: "Declared product", quantity: "Declared quantity", endorsementText: "Declared endorsement", dispensingDate: "Declared dispensing date",
  };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validationError) { setError(validationError); return; }
    try {
      const send = lifecycle!.state === "referred_back" || lifecycle!.state === "information_requested" ? resubmitItem : submitItem;
      send({
        caseId, revision: revision!.number, channel: "paper", endorsementText: paper?.endorsementText ?? c!.extracted.endorsementText,
        ...(paper ? { paperDeclaration: paper } : {}),
        precheck: pharmacySnapshot(paper?.endorsementText ?? c!.extracted.endorsementText,
          paper?.dispensingDate ?? c!.extracted.dispensingDate, enabled ? "scripted" : "off", result, result ? new Date().toISOString() : null),
      });
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Paper submission failed. Please try again."); }
  }
  return <section aria-label="Paper pharmacy submission" className="space-y-4">
    <h2 className="text-lg font-semibold">{enabled ? "Proposed: paper form and declaration" : "Paper prescription posted to NHSBSA"}</h2>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <div className="min-w-0 space-y-2">
        <BoundaryTag cls="existing" />
        <PrescriptionForm c={paperImageEvidence(c, revision.templateCaseId)} highlight={[]} compact />
        <p className="text-sm">Synthetic poor image. NHSBSA: image cannot be read.</p>
      </div>
      <form onSubmit={submit} noValidate className="min-w-0 space-y-4">
        <BoundaryTag cls="human" />
        {enabled ? <>
          <p className="text-sm">Type what is written on the paper. This proposed declaration travels with it, not as an image reading.</p>
          <Button type="button" variant="outline" onClick={() => { setDraft({ ...WORKED_PAPER_DECLARATION }); setError(""); }}>Load worked declaration</Button>
          {(Object.keys(labels) as (keyof PaperDeclarationDraft)[]).map((field) => <div className="space-y-1" key={field}>
            <Label htmlFor={`${id}-${field}`}>{labels[field]}</Label>
            <Input id={`${id}-${field}`} type={field === "dispensingDate" ? "date" : "text"}
              inputMode={field === "quantity" ? "numeric" : undefined} value={draft[field]}
              aria-describedby={`${id}-${field}-origin`}
              onChange={(event) => { setDraft((value) => ({ ...value, [field]: event.target.value })); setError(""); }} />
            <p id={`${id}-${field}-origin`} className="text-xs text-muted-foreground">{PAPER_DECLARATION_PROVENANCE}</p>
          </div>)}
          <div aria-live="polite" className="space-y-2 rounded-lg border p-3">
            <BoundaryTag cls="agent" />
            <p className="text-xs">Scripted declaration check, not live. The agent verifies and advises; a person decides.</p>
            <p className="text-sm">{result?.status === "ready" ? "Declaration complete, not capture confirmed" : "Declaration needs review"}</p>
            <p className="text-sm">{validationError || result?.gap}</p>
            {result?.clause && <>
              <p className="text-sm">Dispensing-month Tariff: {result.version}. {result.clause.title}</p>
              <blockquote className="text-sm">{result.clause.text}</blockquote>
              <BoundaryTag cls="deterministic" />
              <ul aria-label="Declaration requirement checks" className="space-y-1 text-sm">
                {result.checks.map((check) => <li key={check.id}>{check.met === true ? "Met" : check.met === false ? "Missing" : "Unknown"}: {check.label}</li>)}
              </ul>
            </>}
            <p className="text-xs">The form must show initials and date. Prescriber evidence and explicit human reconciliation remain necessary at NHSBSA.</p>
          </div>
        </> : <>
          <p className="text-sm">No typed declaration. The paper is posted; NHSBSA staff key the unreadable scan without guidance.</p>
          <PainMarker resolved={false} pain="Problems discovered weeks later" resolution="Declaration checked before posting" />
          <p className="text-sm">Type 1 keys by eye. Type 2 judges from experience and can refer back RB2B.</p>
          <p className="text-xs">Weeks of delay illustrate today's journey, not this demo's elapsed time or a service promise.</p>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit">{enabled ? "Post paper with declaration" : "Post paper"}</Button>
        <p className="text-xs">Posting never confirms capture or makes a Type 2 decision.</p>
      </form>
    </div>
    <section aria-label="Current paper submission" className="space-y-2 rounded-lg border p-4">
      <h3 className="font-semibold">Current item: {LIFECYCLE_LABELS[lifecycle.state].pharmacy}</h3>
      <p className="text-sm">Attempt {revision.number}. Shared with NHSBSA in every perspective.</p>
      {enabled && revision.paperDeclaration && <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {(Object.keys(labels) as (keyof PaperDeclarationDraft)[]).map((field) => <div key={field}>
          <dt className="font-medium">{labels[field]}</dt>
          <dd>{String(revision.paperDeclaration![field] ?? "Not declared") || "Not declared"}</dd>
          <dd className="text-xs text-muted-foreground">{PAPER_DECLARATION_PROVENANCE}</dd>
        </div>)}
      </dl>}
    </section>
  </section>;
}
