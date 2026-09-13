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
import { useProcessMonth } from "@/hooks/use-process-month";
import { useAppStore } from "@/lib/store";
import type { CaseRevision, ConfirmType1Input } from "@/lib/domain/lifecycle";
import type { ExceptionCase } from "@/lib/domain/types";
import {
  PAPER_DECLARATION_PROVENANCE,
  prepareCaptureConfirmation,
  preparePaperCapture,
  type PaperCaptureDraft,
} from "@/lib/domain/paper-capture";

/** Q embeds this same store-connected surface in the lane and case pack. */
export function Type1Capture({ caseId }: { caseId: string }) {
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
        <p className="text-sm">Capture is recorded. Follow the current routing outcome; no further capture is requested.</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-medium">Product code</dt><dd>{capture.fields.productCode ?? "Unreadable"}</dd></div>
          <div><dt className="font-medium">Quantity</dt><dd>{capture.fields.quantity ?? "Unreadable"}</dd></div>
          <div><dt className="font-medium">Endorsement</dt><dd className="break-words">{capture.fields.endorsementText || "Unreadable or absent"}</dd></div>
          <div><dt className="font-medium">Prescriber</dt><dd>{capture.fields.prescriber || "Unreadable"}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">{capture.provenance === "pharmacy_declaration"
          ? `Fields ${PAPER_DECLARATION_PROVENANCE}; explicitly confirmed by a person.`
          : capture.declarationReconciled ? "Human-corrected capture; declaration and paper explicitly reconciled."
            : "Manually captured by a person; no declaration reconciliation asserted."}</p>
        <CaptureTiming assisted={capture.declarationReconciled} />
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
    />
  );
}

function CaptureForm({ c, revision, agentEnabled, confirmType1 }: {
  c: ExceptionCase;
  revision: CaseRevision;
  agentEnabled: boolean;
  confirmType1: (input: ConfirmType1Input) => void;
}) {
  const id = useId();
  const [sourceRevision, setSourceRevision] = useState(revision);
  const [prepared, setPrepared] = useState(() => preparePaperCapture(agentEnabled, revision.declaration));
  const [reconciled, setReconciled] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const productRef = useRef<HTMLInputElement>(null);
  const assisted = prepared.provenance === "pharmacy_declaration";
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Reset can replace a seed with the same number and timestamp.
  if (sourceRevision !== revision) {
    setSourceRevision(revision);
    setPrepared(preparePaperCapture(agentEnabled, revision.declaration));
    setReconciled(false);
    setError("");
  }

  function changeField(field: keyof PaperCaptureDraft, value: string) {
    setPrepared((current) => ({ ...current, fields: { ...current.fields, [field]: value } }));
    setReconciled(false);
    setError("");
  }
  function changeMode(useDeclaration: boolean) {
    setPrepared(preparePaperCapture(useDeclaration, revision.declaration));
    setReconciled(false);
    setError("");
    productRef.current?.focus();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = prepareCaptureConfirmation({
      caseId: c.id, revision: revision.number, ...prepared, declarationReconciled: reconciled, declaration: revision.declaration,
    });
    if (!result.input) {
      setError(Object.values(result.errors).join(" "));
      return;
    }
    try {
      confirmType1(result.input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Capture could not be confirmed. Reopen the item and try again.");
    }
  }

  return (
    <section aria-label={`Type 1 capture for ${c.id}`} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold">Type 1: {assisted ? "confirm, not key" : "manual keying"}</h3>
        <BoundaryTag cls="human" />
        <span className="rounded-md border px-2 py-1 text-xs font-medium">Proposed: paper declaration support</span>
      </div>
      {agentEnabled ? (
        <div className="space-y-2">
          <BoundaryTag cls="agent" />
          <p className="text-sm">The agent cannot read this scan. {assisted ? "Check the pharmacy declaration against the paper; confirm or correct it." : "Unreconciled evidence: the agent abstains. Manual capture remains available."}</p>
        </div>
      ) : <PainMarker resolved={false} pain="No guidance, experience only" resolution="Human confirmation" />}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <h4 className="text-sm font-medium">Original poor paper image</h4>
          <BoundaryTag cls="existing" />
          <PrescriptionForm c={c} highlight={[]} compact />
          <p className="text-xs text-muted-foreground">Synthetic poor scan. Declaration support does not improve image quality.</p>
        </div>
        <form onSubmit={submit} noValidate className="min-w-0 space-y-3">
          <h4 className="text-sm font-medium">{assisted ? "Pharmacy declaration received with paper" : "Key what you can establish"}</h4>
          <p id={`${id}-help`} className="text-xs text-muted-foreground">{assisted
            ? "Original declaration stays unchanged. Your corrections are recorded separately."
            : "Leave unreadable fields blank. Do not guess; Type 2 can refer back with RB2B."}</p>
          {(["productCode", "quantity", "endorsementText", "prescriber"] as const).map((field) => {
            const label = { productCode: "Product code", quantity: "Quantity", endorsementText: "Endorsement", prescriber: "Prescriber" }[field];
            const fieldId = `${id}-${field}`;
            const descriptionId = `${fieldId}-origin`;
            return (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={fieldId}>{label}</Label>
                {field === "endorsementText" ? (
                  <Textarea id={fieldId} value={prepared.fields[field]} onChange={(event) => changeField(field, event.target.value)}
                    aria-describedby={`${id}-help ${descriptionId}`} rows={3} />
                ) : (
                  <Input ref={field === "productCode" ? productRef : undefined} id={fieldId} value={prepared.fields[field]}
                    onChange={(event) => changeField(field, event.target.value)}
                    inputMode={field === "quantity" ? "numeric" : "text"} autoComplete="off"
                    aria-describedby={`${id}-help ${descriptionId}`} />
                )}
                <p id={descriptionId} className="text-xs text-muted-foreground">{assisted
                  ? `Original source: ${PAPER_DECLARATION_PROVENANCE}` : "Human capture, not agent extraction"}</p>
                {assisted && <p className="break-words text-xs">Original declaration: {revision.declaration?.fields[field] || "Not supplied"}</p>}
              </div>
            );
          })}
          {assisted && (
            <div className="space-y-2 rounded-lg border p-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={reconciled} onChange={(event) => { setReconciled(event.target.checked); setError(""); }}
                  className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2" />
                I have reconciled the declaration with the paper
              </label>
              <p className="text-xs text-muted-foreground">A typed-field check is not human reconciliation. If you cannot reconcile the evidence, use manual capture.</p>
              <Button type="button" variant="outline" onClick={() => changeMode(false)}>Key fields manually</Button>
            </div>
          )}
          {!assisted && agentEnabled && revision.declaration && (
            <Button type="button" variant="outline" onClick={() => changeMode(true)}>Review pharmacy declaration</Button>
          )}
          {error && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" className="h-auto min-h-10 whitespace-normal">Confirm capture and continue to Type 2</Button>
        </form>
      </div>
      <CaptureTiming assisted={assisted} />
      <div className="space-y-2 border-t pt-3">
        <BoundaryTag cls="deterministic" />
        <p className="text-xs text-muted-foreground">Code routes after explicit capture. A compatible confirmed declaration can support a built Type 2 case with a dated clause.</p>
        <p className="text-xs text-muted-foreground">the agent verifies the submission and advises; a person decides</p>
      </div>
    </section>
  );
}

function CaptureTiming({ assisted }: { assisted: boolean }) {
  const id = useId();
  const drafts = useAppStore((s) => s.processInputs);
  const setProcessInput = useAppStore((s) => s.setProcessInput);
  const selection = useProcessMonth();
  const seconds = assisted ? selection.result?.type1.confirmSeconds : selection.result?.type1.keySeconds;
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      {seconds !== undefined ? <TimingSteps key={`${assisted}:${seconds}`} seconds={seconds} assisted={assisted} />
        : <p role="status" className="text-sm">Timing unavailable. Correct the shared process assumptions.</p>}
      <p className="text-xs text-muted-foreground">Difficult-example assumptions, not the public Type 1 average. Timing never confirms capture or changes the item.</p>
      <details>
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">Edit timing assumptions</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["type1KeySeconds", "type1ConfirmSeconds"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`${id}-${field}`}>{field === "type1KeySeconds" ? "Today keying seconds" : "With declaration confirmation seconds"} (assumption)</Label>
              <Input id={`${id}-${field}`} inputMode="decimal" value={drafts[field]}
                onChange={(event) => setProcessInput(field, event.target.value)}
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
        className="font-mono text-lg tabular-nums">{displayedSeconds.toLocaleString("en-GB")} seconds</output>
      <span className="text-xs text-muted-foreground">Illustration, not elapsed work</span>
      <Button type="button" variant="outline" size="sm" onClick={() => setStep(step === 2 ? 0 : step + 1)}>
        {step === 2 ? "Restart timing illustration" : "Next timing step"}
      </Button>
    </div>
  );
}
