import type { SubmissionReplica } from "@/lib/domain/submission-fidelity";
import type { PaperReconciliation } from "@/lib/domain/paper-reconciliation";
import type { ExceptionCase } from "@/lib/domain/types";

export interface ScanTextBlock {
  readonly label: string;
  readonly lines: readonly string[];
}

/** Wrap source strings for legibility without completing uncertain characters or truncating evidence. */
export function wrapScanText(text: string, width = 30): string[] {
  if (!Number.isSafeInteger(width) || width < 1) throw new Error("A positive scan text width is required.");
  return text.split(/\r?\n/).flatMap((paragraph) => {
    if (!paragraph) return [""];
    const lines: string[] = [];
    let remaining = paragraph;
    while (remaining.length > width) {
      const space = remaining.lastIndexOf(" ", width);
      const end = space > 0 ? space : width;
      lines.push(remaining.slice(0, end));
      remaining = remaining.slice(end + (space > 0 ? 1 : 0));
    }
    lines.push(remaining);
    return lines;
  });
}

/** The scan alone supplies its drawing. Declaration, OCR and human capture cannot fill image gaps. */
export function scanTextBlocks(scan: ExceptionCase): ScanTextBlock[] {
  if (scan.capturedEvidence) throw new Error("Derived human capture cannot be rendered as the submitted scan.");
  return [
    ...scan.regions.map((region) => ({ label: region.label, lines: wrapScanText(region.text) })),
    { label: "Synthetic patient label", lines: wrapScanText(scan.patientLabel) },
    { label: "Submitting pharmacy", lines: wrapScanText(`${scan.pharmacy.name} (${scan.pharmacy.contractorCode})`) },
    { label: "Prescriber on source", lines: wrapScanText(scan.extracted.prescriber || "Not visible") },
    { label: "Source dispensing date", lines: wrapScanText(scan.extracted.dispensingDate || "Not visible") },
  ];
}

export function scannerSourceError(submission: SubmissionReplica, reconciliation: PaperReconciliation): string | null {
  if (submission.asSubmitted.channel !== "paper" || !submission.paperScan) return "The submitted paper scan is unavailable.";
  if (submission.asSubmitted.number !== reconciliation.evidence.revision) return "Scanner evidence does not belong to this submission revision.";
  if (submission.paperScan.id !== submission.asSubmitted.templateCaseId) return "The paper scan belongs to a different submission source.";
  if (submission.paperScan.capturedEvidence) return "Derived human capture cannot replace the submitted scan.";
  return null;
}

export function scannerValue(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "Not supplied" : String(value);
}

export function characterRecognitionConfidence(confidence: number): string {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error("Character-recognition confidence must be between zero and one.");
  return new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 20 }).format(confidence);
}
