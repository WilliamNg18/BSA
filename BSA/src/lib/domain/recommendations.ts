import type { CaseLifecycle, CaseRevision, LifecycleDecisionRecord, PharmacyCorrectionDraft, Type1Capture } from "./lifecycle";
import type { CasePack, ExceptionCase, RequirementId, Signals, TariffClause } from "./types";
import { caseById } from "./cases";
import { captureForRevision, caseForLifecycle, immutable, paperDeclarationFields } from "./lifecycle-model";
import { runAgent } from "./agent";
import { evaluateEpsSupply } from "./eps-check";
import { initialisePharmacyDraft, previewPharmacyCorrection } from "./pharmacy-correction";
import { interpretPharmacyText } from "./pharmacy-check";
import { evaluateRequirements, QUALITY_THRESHOLD } from "./rules";
import { versionForDate } from "./tariff";
import { evaluateItemVerification } from "./verification";

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
  readonly field: RequirementId;
  readonly label: string;
  readonly value: string | number | null;
  readonly status: "available" | "needs-human-input";
  readonly source: string;
  readonly focusTarget: "endorsementText" | "brandManufacturer" | "packSize" | "form" | "invoicePrice";
}

export interface RecommendationRequirement {
  readonly id: string;
  readonly label: string;
  readonly status: "met" | "not_met" | "not_established";
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
  readonly authorityLabel: typeof RECOMMENDATION_AUTHORITY;
}

function disagreementFindings(original: ExceptionCase, revision: CaseRevision, capture: Type1Capture | null): string[] {
  const declared = revision.paperDeclaration ? paperDeclarationFields(revision.paperDeclaration) : revision.declaration?.fields;
  if (!capture) return ["Image cannot be read; source reconciliation is not established. Request readable evidence or human capture."];
  const findings: string[] = [];
  for (const field of ["productCode", "quantity", "endorsementText"] as const) {
    if (declared && capture.fields[field] !== declared[field]) findings.push(
      `${field}: pharmacy declared "${declared[field] ?? "not supplied"}"; human capture "${capture.fields[field] ?? "not supplied"}".`,
    );
  }
  for (const field of ["productCode", "quantity"] as const) {
    if (capture.fields[field] !== original.claim[field]) findings.push(
      `${field}: human capture "${capture.fields[field] ?? "not supplied"}"; retained claim "${original.claim[field]}".`,
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
  const capture = context.kind === "draft" ? null : captureForRevision(pinnedRow, revision.number);
  const assessment = evaluateItemVerification(original, candidate, true, capture);
  const date = candidate.epsPrescription?.dispensingDate ?? candidate.paperDeclaration?.dispensingDate ?? current.extracted.dispensingDate;
  const version = versionForDate(date);
  const channel = candidate.channel ?? (current.channel === "Electronic (EPS)" ? "eps" : "paper");
  const declared = candidate.paperDeclaration ? paperDeclarationFields(candidate.paperDeclaration) : candidate.declaration?.fields;
  const text = draft?.endorsementText ?? (channel === "paper" ? capture?.fields.endorsementText ?? declared?.endorsementText : undefined) ?? candidate.endorsementText;
  const fields = { ...current.extracted, ...(channel === "paper" ? capture?.fields ?? declared : {}),
    prescriber: (channel === "paper" ? capture?.fields.prescriber ?? declared?.prescriber : undefined) ?? current.extracted.prescriber,
    endorsementText: text, dispensingDate: date };
  const pack = runAgent(current, { agentEnabled: true });
  const clauseId = context.kind === "draft" || !capture ? assessment.clauseId : assessment.sourceClauseId;
  const clause = version?.clauses.find((entry) => entry.id === clauseId) ?? null;
  const sourceKnown = channel === "eps" || Boolean(capture) || context.kind === "draft" || Boolean(declared);
  const supply = candidate.epsPrescription ? evaluateEpsSupply(candidate.epsPrescription) : null;
  const requirements: RecommendationRequirement[] = evaluateRequirements(clause, sourceKnown ? interpretPharmacyText(text) : null, fields, supply?.checks)
    .map(({ requirement, met }) => ({ id: requirement.id, label: requirement.label, status: met === null ? "not_established" : met ? "met" : "not_met" }));
  const sourceGap = !clause ? "Governing provision unavailable for this source and dispensing date." : null;
  if (sourceGap) requirements.push({ id: "provision", label: "Applicable provision", status: "not_established" });
  const unreadable = channel === "paper" && original.imageQuality < QUALITY_THRESHOLD;
  const findings = unreadable && !assessment.verification.reconciled && context.kind !== "draft"
    ? disagreementFindings(original, candidate, capture) : [];
  for (const [index, finding] of findings.entries()) requirements.push({ id: `source-${index}`, label: finding, status: capture ? "not_met" : "not_established" });
  const missing = requirements.filter((entry) => entry.status !== "met").map((entry) => entry.label);
  const baseDraft = draft ?? initialisePharmacyDraft(current, revision);
  const preview = context.kind !== "recorded" ? previewPharmacyCorrection(current, revision, baseDraft) : null;
  const suggestions: ConcreteSuggestion[] = [];
  if (preview && preview.endorsementText !== baseDraft.endorsementText) suggestions.push({
    field: "dated", label: `Add the dispensing date, ${date.split("-").reverse().join("/")}, beside the initials`,
    value: date.split("-").reverse().join("/"), status: "available", source: "Dispensing date", focusTarget: "endorsementText",
  });
  const beforeSupply = baseDraft.epsPrescription?.supplyEvidence, afterSupply = preview?.epsPrescription?.supplyEvidence;
  if (afterSupply) for (const [field, key, label] of [
    ["brand_manufacturer", "brandManufacturer", "Brand or manufacturer"],
    ["pack_size", "packSize", "Pack size"],
    ["presentation", "form", "Form dispensed"],
  ] as const) {
    if (beforeSupply?.[key] !== afterSupply[key]) suggestions.push({
      field, label, value: afterSupply[key], status: "available", source: "Synthetic product supply record", focusTarget: key,
    });
  }
  if (requirements.some((entry) => entry.id === "invoice_price" && entry.status !== "met")) suggestions.push({
    field: "invoice_price", label: "invoice price required; enter £x.xx", value: null, status: "needs-human-input",
    source: "Invoice required; claim amount is not invoice evidence", focusTarget: "invoicePrice",
  });
  const ordinary = pack.gate.result === "PASS";
  const diagnostic: DiagnosticFollowUp | null = !ordinary && findings.length ? {
    kind: "safe_human_follow_up", caseId, revision: revision.number,
    outcome: capture ? "REFER_BACK" : "REQUEST_INFORMATION", rbCode: capture ? "RB2B" : "",
    note: `${findings.join(" ")} ${capture ? "Please correct or confirm these fields against the paper form." : "Please provide readable evidence for operator comparison."}`,
    provenance: capture ? "reconciliation_failed" : "unverified",
    kernelRecommendation: pack.recommendation, kernelGate: pack.gate.result,
    clauseId: clause?.id ?? null, tariffVersion: version?.version ?? null, findings,
  } : null;
  const complete = !sourceGap && missing.length === 0;
  const outcome = diagnostic?.outcome ?? (complete ? "COMPLETE" : sourceGap ? "ABSTAIN" : "REFER_BACK");
  const clauseLabel = clause?.title.split(":")[0] ?? "Unavailable provision";
  return immutable({
    caseId, revision: revision.number, context: context.kind, dispensingDate: date,
    clause, version: version?.version ?? null, versionLabel: version?.label ?? null, requirements, missing,
    suggestions: complete ? [] : suggestions, preview: complete ? null : preview, outcome,
    summary: complete ? `Complete against ${clauseLabel}, Version ${version?.label}; nothing to add.` :
      diagnostic ? "Safe human follow-up; verification remains unsuccessful." : sourceGap ?? "Correction required before the submission is complete.",
    signals: { ...pack.signals, provisionFound: Boolean(clause),
      reconciliation: context.kind === "draft" ? "not_established" : assessment.verification.reconciled ? "agree" : capture || channel === "eps" ? "conflict" : "not_established" },
    kernelRecommendation: pack.recommendation, kernelGate: pack.gate.result, diagnostic, sourceGap,
    nextStep: sourceGap ? "Request the applicable provision and readable source evidence." : unreadable
      ? "Requires operator release because the scan could not be read." : complete ? "Continue through the existing submission or review controls." : "Apply a supported correction, then make a separate human submission or decision.",
    provenance: channel === "eps" ? "Typed EPS and retained claim ledger" : capture ? "Human-confirmed capture; original unreadable image retained"
      : declared ? "declared by the pharmacy, not read from the form; will be verified against the scan at NHSBSA" : "Unverified image evidence",
    operatorApproved: Boolean(record?.approvedDraft), requiresOperatorRelease: unreadable,
    operatorApplyAllowed: context.kind === "current" && ["in_review", "escalated"].includes(row.state) &&
      (!unreadable || Boolean(capture)) && (ordinary || diagnostic !== null),
    authorityLabel: RECOMMENDATION_AUTHORITY,
  });
}
