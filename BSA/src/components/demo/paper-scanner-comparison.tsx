import { useId } from "react";
import { PAPER_DECLARATION_PROVENANCE } from "@/lib/domain/paper-capture";
import type { PaperReconciliation } from "@/lib/domain/paper-reconciliation";
import { REFERRAL_FIELD_LABELS, type ReferralField } from "@/lib/domain/referral-wording";
import type { SubmissionReplica } from "@/lib/domain/submission-fidelity";
import { characterRecognitionConfidence, scannerSourceError, scannerValue } from "./paper-scanner-model";
import { SyntheticPaperScan } from "./synthetic-paper-scan";

export interface PaperScannerComparisonProps {
  readonly submission: SubmissionReplica;
  readonly reconciliation: PaperReconciliation;
}

export function PaperScannerComparison({ submission, reconciliation }: PaperScannerComparisonProps) {
  const id = useId();
  const sourceError = scannerSourceError(submission, reconciliation);
  if (sourceError) return <p role="alert">{sourceError}</p>;
  const { asSubmitted, paperScan } = submission;
  const { evidence, labels } = reconciliation;
  const paper = asSubmitted.paperDeclaration;
  const legacy = asSubmitted.declaration;
  const declaration = paper ? [
    { label: "Product", value: paper.typedProduct },
    { label: "Quantity", value: paper.quantity },
    { label: "Endorsement", value: paper.endorsementText },
    { label: "Dispensing date", value: paper.dispensingDate },
    { label: "Brand or manufacturer", value: paper.brandManufacturer },
    { label: "Pack size", value: paper.packSize },
    { label: "Presentation", value: paper.form },
    ...(legacy?.fields.prescriber !== undefined ? [{ label: "Prescriber", value: legacy.fields.prescriber }] : []),
  ] : legacy ? Object.entries(legacy.fields).map(([field, value]) => ({
    label: REFERRAL_FIELD_LABELS[field as ReferralField], value,
  })) : [];
  const capture = evidence.capture?.revision === evidence.revision ? evidence.capture : null;

  return <section aria-label="Paper scanner comparison" className="w-full min-w-0 space-y-5" data-paper-scanner-revision={asSubmitted.number}>
    <h2 className="text-lg font-semibold">{submission.heading}</h2>
    <div className="grid grid-cols-3 items-start gap-5" data-paper-scanner-columns>
      <section aria-labelledby={`${id}-declaration`} className="min-w-0 space-y-4 rounded-xl border bg-card p-4" data-paper-source="declaration">
        <h3 id={`${id}-declaration`} className="text-base font-semibold">{labels.declaration}</h3>
        {declaration.length ? <dl className="space-y-4 text-base">
          {declaration.map(({ label, value }) => <div key={label} className="space-y-1">
            <dt className="font-medium">{label}</dt>
            <dd className="whitespace-pre-wrap break-words">{scannerValue(value)}</dd>
          </div>)}
        </dl> : <p>No declaration accompanied this paper.</p>}
        {declaration.length > 0 && <p className="text-sm text-muted-foreground">{PAPER_DECLARATION_PROVENANCE}</p>}
      </section>
      <section aria-labelledby={`${id}-scan`} className="min-w-0 space-y-4 rounded-xl border bg-card p-4" data-paper-source="scan">
        <h3 id={`${id}-scan`} className="text-base font-semibold">{labels.scan}</h3>
        <SyntheticPaperScan scan={paperScan!} readable={evidence.scan.readable} />
        {evidence.scan.provenance === "acknowledged_pharmacy_amendment" && <p className="text-sm">{labels.amendment}</p>}
      </section>
      <section aria-labelledby={`${id}-ocr`} className="min-w-0 space-y-4 rounded-xl border bg-card p-4" data-paper-source="character-recognition">
        <h3 id={`${id}-ocr`} className="text-base font-semibold">{labels.characterRecognition}</h3>
        <p className="text-sm text-muted-foreground">{labels.synthetic}</p>
        {evidence.characterRecognition.length ? <dl className="space-y-4 text-base">
          {evidence.characterRecognition.map((observation) => <div key={observation.field} className="space-y-1" data-ocr-field={observation.field}>
            <dt className="font-medium">{REFERRAL_FIELD_LABELS[observation.field]}</dt>
            <dd className="whitespace-pre-wrap break-words" data-ocr-value>{observation.value === null ? "Unknown" : observation.value === "" ? "Blank" : scannerValue(observation.value)}</dd>
            <dd className="tabular-nums">Confidence: {characterRecognitionConfidence(observation.confidence)}</dd>
          </div>)}
        </dl> : <p>No hypothetical extraction supplied.</p>}
      </section>
    </div>
    {capture && <section aria-label="Human-confirmed effective evidence" className="space-y-3 rounded-xl border p-4" data-paper-human-capture>
      <h3 className="text-base font-semibold">Human-confirmed effective evidence</h3>
      <p className="text-sm">Revision {capture.revision}. Original scan and hypothetical extraction unchanged; human capture is separate evidence.</p>
      <dl className="grid grid-cols-3 gap-4 text-base">
        {Object.entries(capture.fields).map(([field, value]) => <div key={field}>
          <dt className="font-medium">{REFERRAL_FIELD_LABELS[field as ReferralField]}</dt>
          <dd className="whitespace-pre-wrap break-words">{scannerValue(value)}</dd>
        </div>)}
      </dl>
    </section>}
  </section>;
}
