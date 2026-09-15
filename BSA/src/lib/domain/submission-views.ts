import type { CaseLifecycle, CaseRevision, ItemProcess, Type1Capture } from "./lifecycle";
import type { ExceptionCase } from "./types";
import { caseById } from "./cases";
import { captureForRevision, paperDeclarationFields } from "./lifecycle-model";
import { createPaperSubmissionSource } from "./paper-source";
import { lastPharmacySubmission, submissionReplica, type SubmissionReplica } from "./submission-fidelity";
import { reconcilePaperEvidence, type PaperFieldRuleCheck, type PaperReconciliation } from "./paper-reconciliation";
import { evaluateItemVerification } from "./verification";
import { productByCode } from "./reference";
import { EPS_SUPPLY_RULE } from "./eps-check";
import { interpretPharmacyText } from "./pharmacy-check";
import { versionForDate } from "./tariff";

export interface SubmissionViewState {
  readonly lifecycles: Record<string, CaseLifecycle>;
  readonly caseRevisions: Record<string, readonly CaseRevision[]>;
}

function currentSubmission(state: SubmissionViewState, caseId: string) {
  const row = state.lifecycles[caseId], revisions = state.caseRevisions[caseId];
  if (!row || !revisions?.length) throw new Error("The submitted item is unavailable.");
  const revision = lastPharmacySubmission(revisions);
  const original = caseById(revision.templateCaseId);
  if (!original) throw new Error("Original submission sources are unavailable.");
  return { row, revision, original };
}

export function getAsSubmitted(state: SubmissionViewState, caseId: string): SubmissionReplica {
  const { revision, original } = currentSubmission(state, caseId);
  return submissionReplica(revision, revision.channel === "paper" ? (revision.paperSource ?? createPaperSubmissionSource(original, revision)).scan : undefined);
}

export function getPaperReconciliation(state: SubmissionViewState, caseId: string): PaperReconciliation | null {
  const { row, revision, original } = currentSubmission(state, caseId);
  if (revision.channel !== "paper") return null;
  return evaluatePaperSubmission(original, revision, captureForRevision(row, revision.number));
}

export function evaluatePaperSubmission(original: ExceptionCase, revision: CaseRevision, capture: Type1Capture | null = null): PaperReconciliation {
  if (revision.channel !== "paper") throw new Error("Paper reconciliation requires a paper submission.");
  const source = revision.paperSource ?? createPaperSubmissionSource(original, revision);
  const fields = revision.declaration?.fields ?? (revision.paperDeclaration ? paperDeclarationFields(revision.paperDeclaration) : null);
  const declaration = { ...fields, dispensingDate: revision.paperDeclaration?.dispensingDate ?? original.extracted.dispensingDate };
  const assessment = evaluateItemVerification(original, revision, true, capture);
  const date = declaration.dispensingDate, facts = interpretPharmacyText(fields?.endorsementText ?? "");
  const checks: PaperFieldRuleCheck[] = [
    { field: "productCode", met: Boolean(productByCode(fields?.productCode ?? null)), request: { rule: "required_field", field: "productCode" } },
    { field: "quantity", met: fields?.quantity === original.claim.quantity, request: { rule: "quantity_matches_prescription" } },
    { field: "dispensingDate", met: Boolean(versionForDate(date)), request: { rule: "required_field", field: "dispensingDate" } },
    { field: "prescriber", met: Boolean(fields?.prescriber?.trim() && fields.prescriber.trim().toLowerCase() !== "illegible"),
      request: { rule: "required_field", field: "prescriber" } },
    { field: "endorsementText", met: facts.present && facts.initialled === true && facts.dated === true,
      request: { rule: "endorsement_initialled_and_dated" } },
  ];
  if (original.claim.productCode === EPS_SUPPLY_RULE.productCode) checks.push(
    { field: "brandManufacturer", met: Boolean(fields?.brandManufacturer?.trim()), request: { rule: "brand_required_for_multiple_suppliers" } },
    { field: "packSize", met: fields?.packSize === EPS_SUPPLY_RULE.packSize, request: { rule: "sources_must_agree", field: "packSize" } },
    { field: "form", met: fields?.form === EPS_SUPPLY_RULE.form, request: { rule: "required_field", field: "form" } },
  );
  return reconcilePaperEvidence({
    revision: revision.number, declaration,
    scan: { readable: source.scan.imageQuality >= 0.6, fields: { ...source.fields, dispensingDate: source.scan.extracted.dispensingDate },
      provenance: source.provenance },
    characterRecognition: source.characterRecognition, tariffChecks: checks, verification: assessment.verification,
    ...(capture ? { capture: { revision: capture.revision, declarationReconciled: capture.declarationReconciled,
      fields: { ...capture.fields, dispensingDate: date } } } : {}),
  });
}

export function isPaperReadyToRelease(row: CaseLifecycle, process: ItemProcess | undefined): boolean {
  return Boolean(process?.channel === "paper" && process.readyToRelease && ["resubmitted", "in_review"].includes(row.state) &&
    row.history.at(-1)?.revision === process.revision);
}
