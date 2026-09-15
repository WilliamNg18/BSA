import type { ItemVerification } from "./lifecycle";
import { immutable } from "./lifecycle-model";
import { QUALITY_THRESHOLD } from "./rules";
import { buildReferralNote, type ReferralField, type ReferralRequest } from "./referral-wording";

export const PAPER_RECONCILIATION_LABELS = {
  declaration: "Pharmacy's declaration (as typed)",
  scan: "Scan as the high-speed scanner sees it",
  characterRecognition: "Extracted by character recognition (hypothetical)",
  synthetic: "synthetic; illustrates what NHSBSA's capture would produce",
  humanCapture: "Human-confirmed effective evidence; the original scan and hypothetical extraction are unchanged",
  amendment: "Explicit pharmacy amendment (synthetic); previous submission evidence retained",
  release: "Release to existing pricing recommended; both gates satisfied; requires the operator's press because paper was scanned",
} as const;

export type PaperFieldValue = string | number | null;
export type PaperEvidenceValues = Readonly<Partial<Record<ReferralField, PaperFieldValue>>>;
export interface CharacterRecognitionField {
  readonly field: ReferralField;
  readonly value: PaperFieldValue;
  readonly confidence: number;
}
export interface PaperFieldRuleCheck {
  readonly field: ReferralField;
  readonly met: boolean | null;
  readonly request: ReferralRequest;
}
export interface PaperReconciliationInput {
  readonly revision: number;
  readonly declaration: PaperEvidenceValues;
  readonly scan: {
    readonly readable: boolean;
    readonly fields: PaperEvidenceValues;
    readonly provenance?: "original_scan" | "acknowledged_pharmacy_amendment";
  };
  readonly characterRecognition: readonly CharacterRecognitionField[];
  readonly tariffChecks: readonly PaperFieldRuleCheck[];
  readonly verification: ItemVerification;
  readonly capture?: {
    readonly revision: number;
    readonly declarationReconciled: boolean;
    readonly fields: PaperEvidenceValues;
  };
}
export interface PaperReconciliation {
  readonly labels: typeof PAPER_RECONCILIATION_LABELS;
  readonly evidence: PaperReconciliationInput;
  readonly requiresType1: boolean;
  readonly requiresOperatorRelease: true;
  readonly automaticRelease: false;
  readonly reconciliationBasis: "raw_sources" | "human_confirmed_capture" | "not_established";
  readonly outcome: "TYPE1_CONFIRMATION" | "REFER_BACK" | "REQUEST_INFORMATION" | "RELEASE_RECOMMENDED";
  readonly requests: readonly ReferralRequest[];
  readonly note: string | null;
  readonly summary: string;
}

const missing = (value: PaperFieldValue | undefined) => value === null || value === undefined ||
  typeof value === "string" && !value.trim();

function validateValues(values: PaperEvidenceValues): void {
  for (const value of Object.values(values)) {
    if (value !== null && value !== undefined && typeof value !== "string" &&
      !(typeof value === "number" && Number.isFinite(value))) throw new Error("Paper evidence contains an invalid field value.");
  }
}

/** Capture may explain low-confidence OCR; it cannot erase readable contradictory source evidence. */
export function reconcilePaperEvidence(input: PaperReconciliationInput): PaperReconciliation {
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error("A current paper revision is required.");
  validateValues(input.declaration);
  validateValues(input.scan.fields);
  if (input.capture) validateValues(input.capture.fields);
  const ocr = new Map<ReferralField, CharacterRecognitionField>();
  for (const observation of input.characterRecognition) {
    validateValues({ [observation.field]: observation.value });
    if (!Number.isFinite(observation.confidence) || observation.confidence < 0 || observation.confidence > 1) {
      throw new Error("Synthetic character-recognition confidence must be between zero and one.");
    }
    if (ocr.has(observation.field)) throw new Error("Character recognition has duplicate field observations.");
    ocr.set(observation.field, observation);
  }
  const capture = input.capture?.revision === input.revision ? input.capture : undefined;
  const fields = [...new Set(input.tariffChecks.map((check) => check.field))];
  if (!fields.length) throw new Error("Paper reconciliation requires field-level Tariff checks.");
  const poorCapture = !input.scan.readable || fields.some((field) => {
    const observation = ocr.get(field);
    return !observation || observation.value === null || observation.confidence < QUALITY_THRESHOLD;
  });
  const requiresType1 = poorCapture && !capture;
  const requests: ReferralRequest[] = [];
  if (!requiresType1) for (const field of fields) {
    const declared = input.declaration[field], scan = input.scan.fields[field], observation = ocr.get(field);
    if (missing(declared)) requests.push({ rule: "required_field", field });
    const captured = capture?.fields[field];
    const source = capture ? captured : observation?.value;
    const readableScanConflict = input.scan.readable && (missing(scan) || scan !== declared);
    const reliableOcrConflict = observation && observation.confidence >= QUALITY_THRESHOLD && !missing(observation.value) &&
      observation.value !== declared;
    if (!missing(declared) && (missing(source) || source !== declared || readableScanConflict || reliableOcrConflict)) {
      requests.push({ rule: "sources_must_agree", field });
    }
  }
  if (!requiresType1) {
    requests.push(...input.tariffChecks.filter((check) => check.met !== true).map((check) => check.request));
    if (capture && !capture.declarationReconciled) requests.push({ rule: "readable_evidence_required" });
  }
  const satisfied = input.verification.gate1 === "pass" && input.verification.gate2 === "pass" && input.verification.reconciled;
  if (!requiresType1 && !requests.length && !satisfied) requests.push({ rule: "readable_evidence_required" });
  const release = !requiresType1 && requests.length === 0 && satisfied;
  const informationOnly = requests.every((request) => request.rule === "readable_evidence_required");
  return immutable({
    labels: PAPER_RECONCILIATION_LABELS, evidence: input, requiresType1, requiresOperatorRelease: true, automaticRelease: false,
    reconciliationBasis: !release ? "not_established" : capture ? "human_confirmed_capture" : "raw_sources",
    outcome: requiresType1 ? "TYPE1_CONFIRMATION" : release ? "RELEASE_RECOMMENDED" : informationOnly ? "REQUEST_INFORMATION" : "REFER_BACK",
    requests, note: requests.length ? buildReferralNote(requests) : null,
    summary: requiresType1 ? "Confirm or correct Type 1 capture before Type 2 review."
      : release ? PAPER_RECONCILIATION_LABELS.release : "Field and rule reconciliation requires a pharmacy response.",
  });
}
