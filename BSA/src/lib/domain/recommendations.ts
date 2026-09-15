import type { CaseLifecycle, CaseRevision, ItemVerification, LifecycleDecisionRecord, OperatorDecisionDraft, PharmacyCorrectionDraft, Type1Capture } from "./lifecycle";
import type { CasePack, ExceptionCase, RequirementId, Signals, TariffClause } from "./types";
import { caseById } from "./cases";
import { captureForRevision, caseForLifecycle, immutable, paperDeclarationFields, validateSubmissionSources } from "./lifecycle-model";
import { runAgent } from "./agent";
import { initialisePharmacyDraft, previewPharmacyCorrection } from "./pharmacy-correction";
import { interpretPharmacyText } from "./pharmacy-check";
import { QUALITY_THRESHOLD } from "./rules";
import { versionForDate } from "./tariff";
import { evaluateItemVerification } from "./verification";
import { concreteSuggestions } from "./recommendation-suggestions";
import { evaluateEpsStrength, type EpsStrengthAssessment } from "./eps-strength";
import type { PaperReconciliation } from "./paper-reconciliation";
import { operatorRecommendationNote } from "./recommendation-audience";
import { evaluatePaperSubmission } from "./submission-views";
import { REFERRAL_FIELD_LABELS } from "./referral-wording";

export const RECOMMENDATION_AUTHORITY = "the agent verifies and advises; a person decides";

export interface RecommendationState {
  readonly lifecycles: Record<string, CaseLifecycle>;
  readonly caseRevisions: Record<string, readonly CaseRevision[]>;
  readonly pharmacyDrafts: Record<string, PharmacyCorrectionDraft>;
  readonly records: readonly LifecycleDecisionRecord[];
}

export type RecommendationContext =
  | { readonly kind: "current" }
  | { readonly kind: "draft" }
  | { readonly kind: "recorded"; readonly revision: number; readonly recordId?: string };

export interface ConcreteSuggestion {
  readonly field: RequirementId | "product";
  readonly label: string;
  readonly value: string | number | null;
  readonly status: "available" | "needs-human-input";
  readonly source: string;
  readonly focusTarget: "endorsementText" | "brandManufacturer" | "packSize" | "form" | "invoicePrice" | "typedProduct" | "quantity" | "dispensedCode";
}

export interface RecommendationRequirement {
  readonly id: string;
  readonly label: string;
  readonly status: "met" | "not_met" | "not_established";
  readonly basis?: "declared_format" | "received_source";
}

export interface DiagnosticFollowUp {
  readonly kind: "safe_human_follow_up";
  readonly caseId: string;
  readonly revision: number;
  readonly outcome: "REFER_BACK" | "REQUEST_INFORMATION";
  readonly rbCode: string;
  readonly note: string;
  readonly provenance: "reconciliation_failed" | "unverified";
  readonly kernelRecommendation: CasePack["recommendation"];
  readonly kernelGate: CasePack["gate"]["result"];
  readonly clauseId: string | null;
  readonly tariffVersion: string | null;
  readonly findings: readonly string[];
}

export interface ItemRecommendation {
  readonly ruleAuthority?: "retrieved_tariff" | "proposed_cross_record_check" | "unavailable";
  readonly strength?: EpsStrengthAssessment;
  readonly paper?: PaperReconciliation;
  readonly caseId: string;
  readonly revision: number;
  readonly context: RecommendationContext["kind"];
  readonly dispensingDate: string;
  readonly clause: TariffClause | null;
  readonly version: string | null;
  readonly versionLabel: string | null;
  readonly requirements: readonly RecommendationRequirement[];
  readonly missing: readonly string[];
  readonly suggestions: readonly ConcreteSuggestion[];
  /** This is the same prepared patch consumed by the shared human Apply action. */
  readonly preview: PharmacyCorrectionDraft | null;
  readonly outcome: "COMPLETE" | "REFER_BACK" | "REQUEST_INFORMATION" | "ABSTAIN";
  readonly summary: string;
  readonly signals: Signals;
  readonly kernelRecommendation: CasePack["recommendation"];
  readonly kernelGate: CasePack["gate"]["result"];
  readonly diagnostic: DiagnosticFollowUp | null;
  readonly sourceGap: string | null;
  readonly nextStep: string;
  readonly provenance: string;
  readonly operatorApproved: boolean;
  readonly requiresOperatorRelease: boolean;
  readonly operatorApplyAllowed: boolean;
  readonly operatorPreview: Omit<OperatorDecisionDraft, "appliedSuggestion"> | null;
  readonly verification: ItemVerification | null;
  readonly sourceAssessment: ItemVerification | null;
  readonly authorityLabel: typeof RECOMMENDATION_AUTHORITY;
}

function disagreementFindings(original: ExceptionCase, revision: CaseRevision, capture: Type1Capture | null): string[] {
  const declared = revision.paperDeclaration ? paperDeclarationFields(revision.paperDeclaration) : revision.declaration?.fields;
  if (!capture) return ["Image cannot be read; source reconciliation is not established. Request readable evidence or human capture."];
  const findings: string[] = [];
  const labels = { productCode: "Product", quantity: "Quantity", endorsementText: "Endorsement" };
  for (const field of ["productCode", "quantity", "endorsementText"] as const) {
    if (declared && capture.fields[field] !== declared[field]) findings.push(
      `${labels[field]}: pharmacy declared "${declared[field] ?? "not supplied"}"; human capture "${capture.fields[field] ?? "not supplied"}".`,
    );
  }
  for (const field of ["productCode", "quantity"] as const) {
    if (capture.fields[field] !== original.claim[field]) findings.push(
      `${labels[field]}: human capture "${capture.fields[field] ?? "not supplied"}"; retained claim "${original.claim[field]}".`,
    );
  }
  if (!capture.declarationReconciled && !findings.length) findings.push("Declaration reconciliation is not established; ask the pharmacy to confirm the declared fields against readable evidence.");
  return findings;
}

/** Read-only projection from the one store. Historical inputs exclude all later events and drafts. */
export function deriveRecommendation(
  state: RecommendationState, caseId: string, context: RecommendationContext = { kind: "current" },
): ItemRecommendation {
  const row = state.lifecycles[caseId], revisions = state.caseRevisions[caseId];
  if (!row || !revisions?.length) throw new Error("Recommendation requires an existing item.");
  const revision = context.kind === "recorded" ? revisions.find((entry) => entry.number === context.revision) : revisions.at(-1);
  if (!revision) throw new Error("Recorded recommendation revision is unavailable.");
  const record = context.kind === "recorded" && context.recordId
    ? state.records.find((entry) => entry.id === context.recordId && entry.caseId === caseId && (entry.revision ?? 1) === revision.number)
    : undefined;
  if (context.kind === "recorded" && context.recordId && !record) throw new Error("Recorded recommendation evidence is unavailable.");
  const history = row.history.filter((event) => (event.revision ?? 1) <= revision.number && (!record || event.at <= record.timestamp));
  const pinnedRow = { ...row, history, state: history.at(-1)?.to ?? row.state };
  const current = caseForLifecycle(caseId, { [caseId]: pinnedRow }, { [caseId]: revisions.filter((entry) => entry.number <= revision.number) });
  const original = caseById(caseId) ?? caseById(revision.templateCaseId);
  if (!current || !original) throw new Error("Original recommendation sources are unavailable.");
  const draft = context.kind === "draft" ? state.pharmacyDrafts[caseId] ?? initialisePharmacyDraft(current, revision) : null;
  if (draft && draft.revision !== revision.number) throw new Error("Recommendation draft is stale.");
  const candidate = draft ? { ...revision, ...draft, number: revision.number } : revision;
  const strength = candidate.epsPrescription?.supplyRecord ? evaluateEpsStrength(candidate.epsPrescription) : null;
  if (draft) {
    try {
      validateSubmissionSources({ ...candidate, precheck: undefined, caseId, revision: revision.number, channel: candidate.channel ?? "paper" }, revision.number);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      const date = candidate.epsPrescription?.dispensingDate ?? candidate.paperDeclaration?.dispensingDate ?? "";
      const version = versionForDate(date);
      return immutable({
        caseId, revision: revision.number, context: "draft", dispensingDate: date, clause: null,
        version: version?.version ?? null, versionLabel: version?.label ?? null,
        requirements: [{ id: "draft_input", label: error.message, status: "not_established" }],
        missing: [error.message], suggestions: [], preview: null, outcome: "ABSTAIN",
        summary: "Draft validation failed; correct the fields before checking.",
        signals: { provisionFound: false, sampleAgreement: { agree: 0, total: 0 }, reconciliation: "not_established",
          imageQuality: original.imageQuality, inCoverage: false },
        kernelRecommendation: "NONE", kernelGate: "NOT_RUN", diagnostic: null,
        sourceGap: error.message, nextStep: "Correct the invalid draft fields; no verification or approval has occurred.",
        provenance: "Unvalidated human draft", operatorApproved: false,
        requiresOperatorRelease: candidate.channel === "paper",
        operatorApplyAllowed: false, operatorPreview: null, verification: null, sourceAssessment: null, authorityLabel: RECOMMENDATION_AUTHORITY,
      });
    }
  }
  const capture = context.kind === "draft" ? null : captureForRevision(pinnedRow, revision.number);
  const assessment = evaluateItemVerification(original, candidate, true, capture);
  const date = candidate.epsPrescription?.dispensingDate ?? candidate.paperDeclaration?.dispensingDate ?? current.extracted.dispensingDate;
  const version = versionForDate(date);
  const channel = candidate.channel ?? (current.channel === "Electronic (EPS)" ? "eps" : "paper");
  const paper = channel === "paper" && context.kind !== "draft" ? evaluatePaperSubmission(original, candidate, capture) : null;
  const declared = candidate.paperDeclaration ? paperDeclarationFields(candidate.paperDeclaration) : candidate.declaration?.fields;
  const text = draft?.endorsementText ?? (channel === "paper" ? capture?.fields.endorsementText ?? declared?.endorsementText : undefined) ?? candidate.endorsementText;
  const fields = { ...current.extracted, ...(channel === "paper" ? capture?.fields ?? declared : {}),
    prescriber: (channel === "paper" ? capture?.fields.prescriber ?? declared?.prescriber : undefined) ?? current.extracted.prescriber,
    endorsementText: text, dispensingDate: date };
  const projectedDraft = draft ? caseForLifecycle(caseId, { [caseId]: pinnedRow }, { [caseId]: [
    ...revisions.filter((entry) => entry.number <= revision.number),
    { ...candidate, number: revision.number + 1, kind: draft.purpose === "new_submission" ? "submission" : "resubmission", precheck: null, confirmation: null },
  ] }) : null;
  if (draft && !projectedDraft) throw new Error("Draft recommendation source could not be projected.");
  const packInput = projectedDraft && channel === "paper"
    ? { ...projectedDraft, extracted: fields, readings: [] } : projectedDraft ?? current;
  const pack = runAgent(packInput, { agentEnabled: record ? record.recommendation !== "NONE" : true });
  const clauseId = context.kind === "draft" || !capture ? assessment.clauseId : assessment.sourceClauseId;
  const typedFacts = interpretPharmacyText(text);
  const unsupportedSpecial = typedFacts.type === "UNKNOWN" && /^\s*SP\b/i.test(text);
  const clause = strength ? null : version?.clauses.find((entry) => unsupportedSpecial ? entry.endorsementType === "SP" : entry.id === clauseId) ?? null;
  const sourceKnown = channel === "eps" || Boolean(capture) || context.kind === "draft" || Boolean(declared);
  const effectiveChecks = capture ? assessment.gate2Checks : assessment.gate1Checks;
  const requirements: RecommendationRequirement[] = (clause?.requirements ?? []).map((requirement) => {
    const checked = effectiveChecks.find((entry) => entry.name === requirement.label);
    return { id: requirement.id, label: requirement.label,
      status: !sourceKnown || !checked ? "not_established" : checked.pass ? "met" : "not_met" };
  });
  if (strength) {
    requirements.push({ id: "selected_pack_matches", label: "Selected pack matches prescription and supply",
      status: strength.complete ? "met" : "not_met" });
    for (const [index, check] of strength.checks.entries()) requirements.push({
      id: `strength-${index}`, label: check.name, status: check.pass ? "met" : "not_met", basis: "received_source",
    });
  }
  for (const [index, check] of (paper?.evidence.tariffChecks ?? []).entries()) {
    if (check.met !== true) requirements.push({ id: `paper-${index}`, label: REFERRAL_FIELD_LABELS[check.field],
      status: check.met === null ? "not_established" : "not_met", basis: "declared_format" });
  }
  const sourceGap = strength ? (!version ? "No dispensing-month reference is available; manual review is required." : null)
    : !clause ? "Governing provision unavailable for this source and dispensing date."
    : unsupportedSpecial ? "Unsupported input: SP is outside validated coverage; manual review only." : null;
  if (sourceGap) requirements.push({ id: clause ? "coverage" : "provision", label: clause ? "Validated interpretation coverage" : "Applicable provision", status: "not_established" });
  const unreadable = channel === "paper" && original.imageQuality < QUALITY_THRESHOLD;
  const findings = unreadable && (!assessment.verification.reconciled || assessment.verification.gate2 !== "pass") && context.kind !== "draft"
    ? disagreementFindings(original, candidate, capture) : [];
  if (unreadable && capture && context.kind !== "draft") {
    for (const check of assessment.gate2Checks.filter((entry) => !entry.pass)) {
      if (["Prescriber present", "Product identified", "Quantity present", "Dated citation validated"].includes(check.name)) findings.push(`${check.name}: ${check.detail}.`);
    }
  }
  for (const [index, finding] of findings.entries()) requirements.push({ id: `source-${index}`, label: finding, status: capture ? "not_met" : "not_established" });
  for (const [index, check] of assessment.gate1Checks.entries()) {
    if (!check.pass && !requirements.some((entry) => entry.label === check.name)) requirements.push({
      id: `format-${index}`, label: check.name, status: "not_met", basis: "declared_format",
    });
  }
  if (context.kind !== "draft" || channel === "eps") {
    for (const [index, check] of assessment.gate2Checks.entries()) {
      if (!check.pass && !requirements.some((entry) => entry.label === check.name)) requirements.push({
        id: `verification-${index}`, label: check.name,
        status: assessment.source === "unreadable_scan" ? "not_established" : "not_met", basis: "received_source",
      });
    }
  }
  const missing = requirements.filter((entry) => entry.status !== "met").map((entry) => entry.label);
  const baseDraft = draft ?? initialisePharmacyDraft(current, revision);
  const preview = previewPharmacyCorrection(current, revision, baseDraft);
  const suggestions = concreteSuggestions(requirements, baseDraft, preview, date);
  const paperRelease = paper?.outcome === "RELEASE_RECOMMENDED";
  const ordinary = !unsupportedSpecial && !paper?.requiresType1 &&
    (paperRelease || pack.gate.result === "PASS" && (pack.recommendation !== "SUFFICIENT" || assessment.releaseEligible && (!paper || paperRelease)));
  const safeNote = operatorRecommendationNote({ requirements, version: version?.version ?? null,
    ...(strength ? { strength } : {}), ...(paper ? { paper } : {}) });
  const fieldDisagreement = findings.some((finding) => finding.includes('"; '));
  const diagnostic: DiagnosticFollowUp | null = !ordinary && (findings.length || paper?.requests.length) ? {
    kind: "safe_human_follow_up", caseId, revision: revision.number,
    outcome: paper?.outcome === "REFER_BACK" || fieldDisagreement ? "REFER_BACK" : "REQUEST_INFORMATION",
    rbCode: paper?.outcome === "REFER_BACK" || fieldDisagreement ? "RB2B" : "",
    note: safeNote,
    provenance: fieldDisagreement ? "reconciliation_failed" : "unverified",
    kernelRecommendation: pack.recommendation, kernelGate: pack.gate.result,
    clauseId: clause?.id ?? null, tariffVersion: version?.version ?? null, findings,
  } : null;
  const complete = !sourceGap && missing.length === 0 && (!paper || paperRelease);
  const outcome = diagnostic?.outcome ?? (complete ? "COMPLETE" : sourceGap ? "ABSTAIN"
    : pack.recommendation === "REQUEST_INFORMATION" ? "REQUEST_INFORMATION" : "REFER_BACK");
  const clauseLabel = clause?.title.split(":")[0] ?? "Unavailable provision";
  return immutable({
    caseId, revision: revision.number, context: context.kind, dispensingDate: date,
    ruleAuthority: strength ? "proposed_cross_record_check" : clause ? "retrieved_tariff" : "unavailable",
    ...(strength ? { strength } : {}),
    ...(paper ? { paper } : {}),
    clause, version: version?.version ?? null, versionLabel: version?.label ?? null, requirements, missing,
    suggestions: complete ? [] : suggestions, preview: complete ? null : preview, outcome,
    summary: strength ? (complete ? "Complete against the proposed prescription and supply matching check; nothing to add."
      : "Prescription, selected claim and supply records require reconciliation.")
      : paperRelease ? paper.summary : complete ? `Complete against ${clauseLabel}, Version ${version?.label}; nothing to add.` :
      diagnostic ? "Safe human follow-up; verification remains unsuccessful." : sourceGap ?? "Correction required before the submission is complete.",
    signals: { ...pack.signals, provisionFound: Boolean(clause), inCoverage: unsupportedSpecial ? false : pack.signals.inCoverage,
      sampleAgreement: context.kind === "draft" ? { agree: 0, total: 0 } : pack.signals.sampleAgreement,
      reconciliation: context.kind === "draft" ? "not_established" : assessment.verification.reconciled ? "agree" : capture || channel === "eps" ? "conflict" : "not_established" },
    kernelRecommendation: record?.recommendation ?? pack.recommendation,
    kernelGate: record ? record.recommendation === "ABSTAIN" || record.recommendation === "NONE" ? "NOT_RUN"
      : record.checks.length ? record.checks.every((entry) => entry.pass) ? "PASS" : "FAIL" : "NOT_RUN" : pack.gate.result, diagnostic, sourceGap,
    nextStep: unsupportedSpecial && clause ? "Enter the actual invoice evidence for manual review; this input cannot be verified for release."
      : sourceGap ? "Request the applicable provision and readable source evidence." : channel === "paper"
      ? (paper?.requiresType1 ?? (unreadable && !capture)) ? "Confirm or correct Type 1 capture, then Type 2 review; unreadable paper always requires operator release."
        : "Requires the operator's press because paper was scanned." : complete ? "Continue through the existing submission or review controls." : "Apply a supported correction, then make a separate human submission or decision.",
    provenance: channel === "eps" ? "Typed EPS and retained claim ledger" : capture ? "Human-confirmed capture; original unreadable image retained"
      : declared ? "declared by the pharmacy, not read from the form; will be verified against the scan at NHSBSA" : "Unverified image evidence",
    operatorApproved: Boolean((record ?? (context.kind === "current" || context.kind === "draft" && draft?.purpose === "correction" ? state.records.filter((entry) =>
      entry.caseId === caseId && (entry.revision ?? 1) === revision.number).at(-1) : undefined))?.approvedDraft),
    requiresOperatorRelease: channel === "paper",
    operatorApplyAllowed: context.kind === "current" && ["in_review", "escalated"].includes(row.state) &&
      (!paper?.requiresType1 && (!unreadable || Boolean(capture))) && (ordinary || diagnostic !== null),
    operatorPreview: diagnostic ? {
      revision: revision.number, outcome: diagnostic.outcome, rbCode: diagnostic.rbCode, note: diagnostic.note,
    } : ordinary ? {
      revision: revision.number,
      outcome: paperRelease || pack.recommendation === "SUFFICIENT" ? "ACCEPT" : pack.recommendation === "REFER_BACK" ? "REFER_BACK" : "REQUEST_INFORMATION",
      rbCode: pack.recommendation === "REFER_BACK" ? current.scenario === "D" || current.epsPrescription?.supplyEvidence ? "RB2B" : "SYN-NCSO" : "",
      note: paperRelease ? paper.summary : pack.recommendation === "SUFFICIENT" ? pack.composite.reasons.join("; ") : safeNote,
    } : null,
    verification: context.kind === "draft" ? null : history.filter((event) => event.revision === revision.number && event.verification).at(-1)?.verification ?? null,
    sourceAssessment: context.kind === "draft" ? null : assessment.verification,
    authorityLabel: RECOMMENDATION_AUTHORITY,
  });
}

/** Approval may cite a diagnostic only when the exact same-revision facts still validate it. */
export function validateDiagnosticFollowUp(state: RecommendationState, caseId: string, snapshot: DiagnosticFollowUp): DiagnosticFollowUp {
  const recommendation = deriveRecommendation(state, caseId);
  if (!recommendation.operatorApplyAllowed || !recommendation.diagnostic ||
    JSON.stringify(recommendation.diagnostic) !== JSON.stringify(snapshot)) {
    throw new Error("Safe human follow-up is stale or does not match the current diagnostic evidence.");
  }
  return recommendation.diagnostic;
}
