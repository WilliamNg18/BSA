import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BoundaryTag } from "@/components/demo/labels";
import { PrescriptionForm } from "@/components/demo/prescription-form";
import { PainMarker } from "@/components/demo/pain-marker";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { useAppStore } from "@/lib/store";
import type { CaseRevision, ConfirmType1Input } from "@/lib/domain/lifecycle";
import type { ExceptionCase } from "@/lib/domain/types";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { paperImageEvidence } from "@/lib/domain/capture-evidence";
import { checkPaperDeclaration } from "@/lib/domain/paper-declaration";
import {
  PAPER_DECLARATION_PROVENANCE,
  prepareCaptureConfirmation,
  preparePaperCapture,
  type PaperCaptureDraft,
} from "@/lib/domain/paper-capture";

/** Q embeds this same store-connected surface in the lane and case pack. */
export function Type1Capture({ caseId, compact = false, evidencePlacement = "inline" }: {
  caseId: string;
  compact?: boolean;
  evidencePlacement?: "inline" | "external";
}) {
  const c = useLifecycleCase(caseId);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1));
  const process = useAppStore((s) => s.itemProcesses[caseId]);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const confirmType1 = useAppStore((s) => s.confirmType1);
  const heading = useRef<HTMLHeadingElement>(null);
  const capture = process?.capture;
  const previousCapture = useRef(capture);
  useEffect(() => {
    if (capture && capture !== previousCapture.current) heading.current?.focus();
    previousCapture.current = capture;
  }, [capture]);

  if (!c || !revision || !process || process.revision !== revision.number) {
    return <p role="alert">Current capture evidence is unavailable. Reopen the item from the queue.</p>;
  }
  if (capture?.revision === revision.number) {
    return (
      <section aria-label={`Type 1 capture for ${caseId}`} className="space-y-3 rounded-xl border p-4">
        <h3 ref={heading} tabIndex={-1} className="font-semibold">Human capture confirmed</h3>
        <BoundaryTag cls="human" />
        <p className="text-sm">Revision {capture.revision}. Confirmed by {capture.operator} at <time dateTime={capture.confirmedAt}>{capture.confirmedAt}</time>.</p>
        <p className="text-sm">Capture recorded; follow current routing.</p>
        <dl className="grid gap-3 break-words text-sm grid-cols-2">
          {(["productCode", "quantity", "endorsementText", "prescriber"] as const).map((field) => <div key={field}>
            <dt className="font-medium">{{ productCode: "Product code", quantity: "Quantity", endorsementText: "Endorsement", prescriber: "Prescriber" }[field]}</dt>
            <dd>{capture.fields[field] || "Unreadable or absent"}</dd>
            {capture.provenance === "pharmacy_declaration" && <dd className="text-xs">{PAPER_DECLARATION_PROVENANCE}</dd>}
          </div>)}
          {revision.paperDeclaration && <div><dt className="font-medium">Declared dispensing date</dt>
            <dd>{revision.paperDeclaration.dispensingDate || "Not declared"}</dd>
            <dd className="text-xs">{PAPER_DECLARATION_PROVENANCE}</dd></div>}
        </dl>
        <p className="text-xs text-muted-foreground">{capture.provenance === "pharmacy_declaration"
          ? `Fields ${PAPER_DECLARATION_PROVENANCE}; explicitly confirmed by a person.`
          : capture.declarationReconciled ? "Human-corrected capture. The operator attested reconciliation; this does not prove source agreement."
            : "Manually captured by a person; no declaration reconciliation asserted."}</p>
        {!compact && <CaptureTiming assisted={capture.declarationReconciled} />}
      </section>
    );
  }
  if (process.routing.outcome !== "type1_capture" || !process.routing.requiresHuman) {
    return <p className="text-sm">This item is not awaiting Type 1 capture.</p>;
  }
  return (
    <CaptureForm
      key={`${caseId}:${revision.number}:${revision.at}:${agentEnabled}`}
      c={c}
      revision={revision}
      agentEnabled={agentEnabled}
      confirmType1={confirmType1}
      compact={compact}
      externalEvidence={compact && evidencePlacement === "external"}
    />
  );
}

export function Type1CaptureEvidence({ caseId }: { caseId: string }) {
  const c = useLifecycleCase(caseId);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1));
  if (!c || !revision) return <p role="alert">Current capture evidence is unavailable. Reopen the item from the queue.</p>;
  return <section aria-label={`Read-only Type 1 source evidence for ${caseId}`} className="space-y-3">
    <h3 className="font-semibold">{caseId} · Read-only source comparison</h3>
    <div className="grid grid-cols-2 items-start gap-3">
      <OriginalCaptureImage c={c} revision={revision} compact />
      <ReceivedDeclaration revision={revision} compact />
    </div>
  </section>;
}

function OriginalCaptureImage({ c, revision, compact }: { c: ExceptionCase; revision: CaseRevision; compact: boolean }) {
  const poorScan = c.imageStyle === "handwritten_poor" || c.imageQuality < QUALITY_THRESHOLD;
  return <div data-capture-source={compact ? "image" : undefined} className={compact ? "min-w-0 space-y-1" : "min-w-0 space-y-2"}>
    <h4 className="text-sm font-medium">{poorScan ? "Original poor paper image" : "Original paper image"}</h4>
    <BoundaryTag cls="existing" />
    <PrescriptionForm c={paperImageEvidence(c, revision.templateCaseId)} highlight={[]} compact />
  </div>;
}

function ReceivedDeclaration({ revision, compact }: { revision: CaseRevision; compact: boolean }) {
  const declaration = revision.paperDeclaration;
  if (!declaration) return <p className="text-sm">No pharmacy declaration supplied.</p>;
  return <section aria-label="Original pharmacy declaration" data-capture-source={compact ? "declaration" : undefined}
    className={compact ? "min-w-0 space-y-1.5 rounded-md border p-2 text-xs" : "space-y-2 rounded-md border p-3 text-sm"}>
    <h4 className="font-semibold">Pharmacy declaration received with paper</h4>
    <p>{PAPER_DECLARATION_PROVENANCE}</p>
    <dl className={`grid grid-cols-2 ${compact ? "gap-x-2 gap-y-1" : "gap-2"}`}>
      <div><dt className="font-medium">Declared product</dt><dd>{declaration.typedProduct || "Not declared"}</dd></div>
      <div><dt className="font-medium">Declared quantity</dt><dd>{declaration.quantity ?? "Not declared"}</dd></div>
      <div><dt className="font-medium">Declared endorsement</dt><dd>{declaration.endorsementText || "Not declared"}</dd></div>
      <div><dt className="font-medium">Declared dispensing date</dt><dd>{declaration.dispensingDate || "Not declared"}</dd></div>
      <div><dt className="font-medium">Prescriber evidence</dt><dd>{revision.declaration?.fields.prescriber || "Not supplied"}</dd></div>
      <div><dt className="font-medium">Received revision</dt><dd>{revision.number}</dd></div>
    </dl>
  </section>;
}

function CaptureForm({ c, revision, agentEnabled, confirmType1, compact, externalEvidence }: {
  c: ExceptionCase;
  revision: CaseRevision;
  agentEnabled: boolean;
  confirmType1: (input: ConfirmType1Input) => void;
  compact: boolean;
  externalEvidence: boolean;
}) {
  const id = useId();
  const [sourceRevision, setSourceRevision] = useState(revision);
  const [prepared, setPrepared] = useState(() => preparePaperCapture(agentEnabled, revision.declaration));
  const [reconciled, setReconciled] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const productRef = useRef<HTMLInputElement>(null);
  const assisted = prepared.provenance === "pharmacy_declaration";
  const declaredCheck = assisted && revision.paperDeclaration ? checkPaperDeclaration(c, revision.paperDeclaration) : null;
  const poorScan = c.imageStyle === "handwritten_poor" || c.imageQuality < QUALITY_THRESHOLD;
  const unreadableExample = c.scenario === "D";
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Reset can replace a seed with the same number and timestamp.
  if (sourceRevision !== revision) {
    setSourceRevision(revision);
    setPrepared(preparePaperCapture(agentEnabled, revision.declaration));
    setReconciled(false);
    setCorrecting(false);
    setError("");
  }

  function changeField(field: keyof PaperCaptureDraft, value: string) {
    setPrepared((current) => ({ ...current, fields: { ...current.fields, [field]: value } }));
    setReconciled(false);
    setCorrecting(true);
    setError("");
  }
  function changeMode(useDeclaration: boolean) {
    setPrepared(preparePaperCapture(useDeclaration, revision.declaration));
    setReconciled(false);
    setCorrecting(!useDeclaration);
    setError("");
    productRef.current?.focus();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = prepareCaptureConfirmation({
      caseId: c.id, revision: revision.number, ...prepared, declarationReconciled: reconciled, declaration: revision.declaration,
    });
    if (!result.input) {
      setError(Object.values(result.errors)[0]);
      return;
    }
    try {
      confirmType1(result.input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Capture could not be confirmed. Reopen the item and try again.");
    }
  }

  const declarationChecks = declaredCheck && <details className={compact
    ? "space-y-2 border-t pt-1 text-xs"
    : "space-y-2 rounded-md border p-3 text-sm"}>
    <summary className="cursor-pointer font-medium focus-visible:outline-2">Declaration requirement checks</summary>
    <BoundaryTag cls="agent" />
    {declaredCheck.clause && <>
      <p>Declared dispensing-month Tariff: {declaredCheck.version}. {declaredCheck.clause.title}</p>
      <blockquote>{declaredCheck.clause.text}</blockquote>
      <BoundaryTag cls="deterministic" />
      <ul aria-label="Received declaration requirement checks">
        {declaredCheck.checks.map((check) => <li key={check.id}>{check.met === true ? "Met" : "Missing"}: {check.label}</li>)}
      </ul>
    </>}
  </details>;
  const originalDeclaration = agentEnabled && revision.paperDeclaration && <ReceivedDeclaration revision={revision} compact={compact} />;
  const correctButton = <Button type="button" variant="outline" size={compact ? "sm" : "default"} aria-pressed={correcting} onClick={() => {
    setCorrecting(true); setReconciled(false); setError(""); productRef.current?.focus();
  }}>Correct</Button>;
  const captureFields = (["productCode", "quantity", "endorsementText", "prescriber"] as const).map((field) => {
    const label = { productCode: "Product code", quantity: "Quantity", endorsementText: "Endorsement", prescriber: "Prescriber" }[field];
    const fieldId = `${id}-${field}`;
    const descriptionId = `${fieldId}-origin`;
    const origin = <span id={descriptionId} className="text-xs text-muted-foreground">{field === "prescriber" && !revision.declaration?.fields.prescriber
      ? "Separately established evidence" : assisted ? "Source: pharmacy declaration" : "Source: human capture"}</span>;
    return <div key={field} className={compact ? "min-w-0 space-y-1" : "space-y-1.5"}>
      {compact ? <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <Label htmlFor={fieldId}>{label}</Label>{origin}
      </div> : <Label htmlFor={fieldId}>{label}</Label>}
      {field === "endorsementText" ? (
        <Textarea id={fieldId} value={prepared.fields[field]} onChange={(event) => changeField(field, event.target.value)}
          aria-describedby={`${id}-help ${descriptionId}`} rows={compact ? 2 : 3}
          className={compact ? "min-h-12 [field-sizing:content]" : undefined} />
      ) : (
        <Input ref={field === "productCode" ? productRef : undefined} id={fieldId} value={prepared.fields[field]}
          onChange={(event) => changeField(field, event.target.value)}
          inputMode={field === "quantity" ? "numeric" : "text"} autoComplete="off"
          aria-describedby={`${id}-help ${descriptionId}`} className={compact ? "h-8" : undefined} />
      )}
      {!compact && origin}
    </div>;
  });

  return (
    <section aria-label={`Type 1 capture for ${c.id}`} data-type1-mode={correcting ? "correcting" : assisted ? "confirming" : "keying"}
      data-compact-capture={compact || undefined}
      className={compact ? "space-y-2 rounded-xl border bg-card p-3" : "space-y-4 rounded-xl border bg-card p-5"}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold">Type 1: {assisted ? "confirm, not key" : "manual keying"}</h3>
        <BoundaryTag cls="human" />
        <span className="rounded-md border px-2 py-1 text-xs font-medium">Proposed: paper declaration support</span>
      </div>
      {agentEnabled ? (
        <div className={compact ? "flex flex-wrap items-center gap-x-2 gap-y-1" : "space-y-2"}>
          <BoundaryTag cls="agent" />
          {!error && <p className="text-sm">{poorScan ? "Image unreadable; agreement unknown." : "Human capture or confirmation is required."}</p>}
        </div>
      ) : <PainMarker resolved={false} pain="No guidance, experience only" resolution="Human confirmation" />}
      <div className={compact ? "grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-3" : "grid min-w-0 gap-4 lg:grid-cols-2"}>
        {!externalEvidence && <OriginalCaptureImage c={c} revision={revision} compact={compact} />}
        {compact && !externalEvidence && originalDeclaration}
        <form data-capture-editor={compact || undefined} onSubmit={submit} noValidate className={compact ? "col-span-2 min-w-0 space-y-2" : "min-w-0 space-y-3"}>
          {!compact && originalDeclaration}
          {compact ? <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium">{correcting ? "Human corrections" : assisted ? "Confirm declared fields" : "Key what you can establish"}</h4>
              <p id={`${id}-help`} className="text-xs text-muted-foreground">{!error && "Unknown fields stay blank."}</p>
            </div>
            {assisted && correctButton}
          </div> : <>
            <h4 className="text-sm font-medium">{correcting ? "Human corrections" : assisted ? "Confirm declared fields" : "Key what you can establish"}</h4>
            <p id={`${id}-help`} className="text-xs text-muted-foreground">{!error && "Unknown fields stay blank."}</p>
          </>}
          {declarationChecks}
          {compact ? <div className="grid grid-cols-2 items-start gap-x-3 gap-y-2">{captureFields}</div> : captureFields}
          {assisted && (
            <div className={compact ? "space-y-1" : "space-y-2 rounded-lg border p-3"}>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={reconciled} onChange={(event) => { setReconciled(event.target.checked); setError(""); }}
                  className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2" />
                I have reconciled the declaration with the available evidence, including the dispensing date
              </label>
              {!error && <span className="text-xs text-muted-foreground">Attestation, not image agreement</span>}
              {!compact && <>{correctButton}
                <Button type="button" variant="outline" onClick={() => changeMode(false)}>Key fields manually</Button>
              </>}
            </div>
          )}
          {!assisted && agentEnabled && revision.declaration && (
            <Button type="button" variant="outline" onClick={() => changeMode(true)}>Review pharmacy declaration</Button>
          )}
          {error && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm font-medium text-destructive">{error}</p>}
          {compact ? <div className="flex flex-wrap items-center justify-between gap-2">
            {assisted && <Button type="button" variant="outline" size="sm" onClick={() => changeMode(false)}>Key fields manually</Button>}
            <Button type="submit" size="sm" className="h-auto min-h-9 whitespace-normal">{unreadableExample
              ? "Confirm capture and continue to Type 2" : "Confirm capture and continue"}</Button>
          </div> : <Button type="submit" className="h-auto min-h-10 whitespace-normal">{unreadableExample
            ? "Confirm capture and continue to Type 2" : "Confirm capture and continue"}</Button>}
        </form>
      </div>
      {!compact && <details className="space-y-2 border-t pt-3">
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2">Timing assumptions and routing</summary>
        <CaptureTiming assisted={assisted} />
        <BoundaryTag cls="deterministic" />
        <p className="text-xs text-muted-foreground">{unreadableExample
          ? "Code routes confirmed evidence to Type 2 judgement. The agent verifies and advises; a person decides."
          : "Code routes confirmed evidence to existing pricing or Type 2 judgement. The agent verifies and advises; a person decides."}</p>
      </details>}
    </section>
  );
}

function CaptureTiming({ assisted }: { assisted: boolean }) {
  const id = useId();
  const drafts = useAppStore((s) => s.manualLoopInputs);
  const setManualLoopInput = useAppStore((s) => s.setManualLoopInput);
  const selection = useManualLoopMonth();
  const seconds = assisted ? selection.result?.type1.confirmSeconds : selection.result?.type1.keySeconds;
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      {seconds !== undefined ? <TimingSteps key={`${assisted}:${seconds}`} seconds={seconds} assisted={assisted} />
        : <p role="status" className="text-sm">Timing unavailable. Correct the shared process assumptions.</p>}
      <p className="text-xs text-muted-foreground">Difficult-example assumptions, not the public Type 1 average. Timing never confirms capture or changes the item.</p>
      <details>
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">Edit timing assumptions</summary>
        <div className="mt-3 grid gap-3 grid-cols-2">
          {(["type1KeySeconds", "type1ConfirmSeconds"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`${id}-${field}`}>{field === "type1KeySeconds" ? "Today keying seconds" : "With declaration confirmation seconds"} (assumption)</Label>
              <Input id={`${id}-${field}`} inputMode="decimal" value={drafts[field]}
                onChange={(event) => setManualLoopInput(field, event.target.value)}
                aria-invalid={Boolean(selection.errors[field])} aria-describedby={selection.errors[field] ? `${id}-${field}-error` : undefined} />
              {selection.errors[field] && <p id={`${id}-${field}-error`} role="alert" className="text-sm text-destructive">{selection.errors[field]}</p>}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function TimingSteps({ seconds, assisted }: { seconds: number; assisted: boolean }) {
  const [step, setStep] = useState(2);
  const displayedSeconds = seconds * step / 2;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Timer className="size-5" aria-hidden="true" />
      <span className="text-sm font-medium">{assisted ? "Confirm, not key" : "Manual keying"} stopwatch (assumption)</span>
      <output aria-label={assisted ? "Assumed confirmation time" : "Assumed manual keying time"} aria-live="polite"
        className="font-mono text-lg tabular-nums">{displayedSeconds.toLocaleString("en-GB")} seconds{assisted ? " (estimate)" : ""}</output>
      <span className="text-xs text-muted-foreground">Illustration, not elapsed work</span>
      <Button type="button" variant="outline" size="sm" onClick={() => setStep(step === 2 ? 0 : step + 1)}>
        {step === 2 ? "Restart timing illustration" : "Next timing step"}
      </Button>
    </div>
  );
}
