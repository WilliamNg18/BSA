/** Shared draft preparation. These helpers never submit or alter received evidence. */
import type { CaseRevision, PharmacyCorrectionDraft } from "./lifecycle";
import type { ExceptionCase, ItemChannel } from "./types";
import { immutable, paperDeclarationFields, validateSubmissionSources } from "./lifecycle-model";
import { caseById } from "./cases";
import { createEpsPrescription, EPS_SUPPLY_RULE } from "./eps-check";
import { interpretPharmacyText, PHARMACY_STEPS, type PharmacyCheck } from "./pharmacy-check";
import { productByCode, PRODUCTS } from "./reference";
import { evaluateItemVerification } from "./verification";
import { versionForDate } from "./tariff";

/** Keep the paper form and its derived declaration copy in one draft, not two authorities. */
export function synchronisePharmacyDraft(draft: Omit<PharmacyCorrectionDraft, "appliedSuggestion">, revision: CaseRevision): Omit<PharmacyCorrectionDraft, "appliedSuggestion"> {
  const paper = draft.paperDeclaration;
  if (!paper) return draft;
  const text = paper.typedProduct.trim();
  const product = PRODUCTS.find((entry) => entry.code === text || entry.name.toLowerCase() === text.toLowerCase());
  return { ...draft, endorsementText: paper.endorsementText,
    declaration: { fields: { productCode: product?.code ?? null, quantity: paper.quantity, endorsementText: paper.endorsementText,
      ...(draft.declaration?.fields.prescriber !== undefined ? { prescriber: draft.declaration.fields.prescriber } : {}) },
    declaredAt: draft.declaration?.declaredAt ?? revision.at, provenance: "pharmacy_declaration" } };
}

export function initialisePharmacyDraft(current: ExceptionCase, revision: CaseRevision, requestedChannel?: ItemChannel): PharmacyCorrectionDraft {
  const channel = requestedChannel ?? revision.channel ?? (current.claim.submittedVia === "EPS claim message" ? "eps" : "paper");
  if (channel === "eps") return immutable({
    revision: revision.number, channel, endorsementText: revision.endorsementText, appliedSuggestion: false,
    epsPrescription: { ...(revision.epsPrescription ?? createEpsPrescription(current)), dispenserEndorsement: revision.endorsementText, claimMessageState: "submitted" },
  });
  const paperDeclaration = revision.paperDeclaration ?? {
    typedProduct: current.extracted.productCode ?? current.extracted.productText,
    quantity: current.extracted.quantity, endorsementText: revision.endorsementText,
    dispensingDate: current.extracted.dispensingDate, declaredByPharmacy: true,
  };
  return immutable({ revision: revision.number, channel, endorsementText: paperDeclaration.endorsementText, paperDeclaration,
    declaration: { fields: { ...paperDeclarationFields(paperDeclaration),
      ...(revision.declaration?.fields.prescriber ? { prescriber: revision.declaration.fields.prescriber } : {}) },
    declaredAt: revision.declaration?.declaredAt ?? revision.at, provenance: "pharmacy_declaration" }, appliedSuggestion: false });
}

export function checkPharmacyCorrection(current: ExceptionCase, revision: CaseRevision, draft: PharmacyCorrectionDraft): PharmacyCheck {
  if (draft.revision !== revision.number) throw new Error("Pharmacy correction draft is stale.");
  const original = caseById(current.id) ?? caseById(revision.templateCaseId);
  if (!original) throw new Error("Original evidence is unavailable.");
  const candidate = { ...revision, ...draft, number: revision.number };
  const assessment = evaluateItemVerification(original, candidate, true);
  const date = draft.epsPrescription?.dispensingDate ?? draft.paperDeclaration?.dispensingDate ?? current.extracted.dispensingDate;
  const version = versionForDate(date);
  const clause = version?.clauses.find((entry) => entry.id === assessment.clauseId) ?? null;
  const checks = assessment.gate1Checks.map((entry, i) => ({ id: `format-${i}`, label: entry.name, met: entry.pass }));
  const ready = assessment.verification.gate1 === "pass";
  const facts = interpretPharmacyText(draft.endorsementText);
  const unresolvedStage = facts.type === "UNKNOWN" && !clause ? 1 : !version ? 2 : !clause && facts.type !== "NONE" ? 3 : null;
  if (unresolvedStage !== null) return {
    status: "unable", facts, version: assessment.tariffVersion, clause, checks,
    stages: PHARMACY_STEPS.map((_, index) =>
      index < unresolvedStage ? "PASS" : index === unresolvedStage ? "STOPPED" : "NOT RUN"),
    gap: checks.filter((entry) => !entry.met).map((entry) => entry.label).join(", "),
    agreement: "Typed declaration format only; received-source reconciliation remains separate",
  };
  return { status: ready ? "ready" : "missing", facts,
    version: assessment.tariffVersion, clause, checks, stages: ["PASS", "PASS", "PASS", "PASS", ready ? "PASS" : "MISSING"],
    gap: ready ? "None" : checks.filter((entry) => !entry.met).map((entry) => entry.label).join(", "),
    agreement: "Typed declaration format only; received-source reconciliation remains separate" };
}

export function previewPharmacyCorrection(current: ExceptionCase, revision: CaseRevision, draft = initialisePharmacyDraft(current, revision)): PharmacyCorrectionDraft | null {
  if (draft.revision !== revision.number) throw new Error("Pharmacy correction draft is stale.");
  const next: { -readonly [K in keyof PharmacyCorrectionDraft]: PharmacyCorrectionDraft[K] } = structuredClone(draft);
  const eps = next.epsPrescription, paper = next.paperDeclaration;
  let changed = false;
  if (eps?.items[0].dispensedCode === EPS_SUPPLY_RULE.productCode) {
    const evidence = { ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer,
      packSize: EPS_SUPPLY_RULE.packSize, form: EPS_SUPPLY_RULE.form };
    changed = JSON.stringify(eps.supplyEvidence) !== JSON.stringify(evidence);
    next.epsPrescription = { ...eps, supplyEvidence: evidence };
  }
  const facts = interpretPharmacyText(next.endorsementText);
  const date = eps?.dispensingDate ?? paper?.dispensingDate ?? current.extracted.dispensingDate;
  if (facts.type === "NCSO" && facts.initialled && !facts.dated && versionForDate(date)?.clauses
    .find((entry) => entry.endorsementType === "NCSO")?.requirements.some((entry) => entry.id === "dated")) {
    const [year, month, day] = date.split("-");
    next.endorsementText = `${next.endorsementText.trim().replace(/[ \t]+/g, " ")} ${day}/${month}/${year.slice(2)}`;
    changed = true;
  }
  if (!changed) return null;
  if (next.epsPrescription) next.epsPrescription = { ...next.epsPrescription, dispenserEndorsement: next.endorsementText, claimMessageState: "submitted" };
  if (paper) next.paperDeclaration = { ...paper, endorsementText: next.endorsementText };
  if (next.declaration) next.declaration = { ...next.declaration, fields: { ...next.declaration.fields, endorsementText: next.endorsementText,
    ...(next.paperDeclaration ? { productCode: paperDeclarationFields(next.paperDeclaration).productCode, quantity: next.paperDeclaration.quantity } : {}) } };
  if (next.declaration?.fields.productCode && !productByCode(next.declaration.fields.productCode)) throw new Error("Unknown corrected product.");
  validateSubmissionSources({ ...next, caseId: current.id, channel: next.channel ?? revision.channel ?? "paper" }, revision.number);
  return immutable({ ...next, appliedSuggestion: true, appliedFields: getChangedPharmacyFields(draft, next) });
}

export function getChangedPharmacyFields(before: PharmacyCorrectionDraft, after: PharmacyCorrectionDraft): NonNullable<PharmacyCorrectionDraft["appliedFields"]> {
  const fields: ("endorsementText" | "brandManufacturer" | "packSize" | "form")[] = [];
  if (before.endorsementText !== after.endorsementText) fields.push("endorsementText");
  for (const field of ["brandManufacturer", "packSize", "form"] as const) {
    if (before.epsPrescription?.supplyEvidence?.[field] !== after.epsPrescription?.supplyEvidence?.[field]) fields.push(field);
  }
  return fields;
}

export function suggestedPharmacyCorrection(current: ExceptionCase, revision: CaseRevision, draft = initialisePharmacyDraft(current, revision)): PharmacyCorrectionDraft {
  const preview = previewPharmacyCorrection(current, revision, draft);
  if (!preview) throw new Error("No supported correction is available; enter the required facts explicitly.");
  return preview;
}

/** Explicit human-selected synthetic prefill, not an interpretation of the retained scan. */
export function preparePaperDemoDraft(current: ExceptionCase, revision: CaseRevision, variant: "complete" | "missing"): PharmacyCorrectionDraft {
  if (current.id !== "EX-24123" || !["complete", "missing"].includes(variant)) throw new Error("Choose a supported unreadable-paper demo declaration.");
  const original = caseById(current.id);
  if (!original) throw new Error("Original paper demo evidence is unavailable.");
  const date = original.extracted.dispensingDate;
  const [year, month, day] = date.split("-");
  const endorsementText = variant === "complete" ? `NCSO JB ${day}/${month}/${year.slice(2)}` : "NCSO JB";
  const draft = {
    revision: revision.number, channel: "paper" as const, purpose: "new_submission" as const,
    endorsementText, paperDeclaration: {
      typedProduct: original.claim.productCode, quantity: original.claim.quantity, endorsementText,
      dispensingDate: date, declaredByPharmacy: true as const,
    },
  };
  const prepared = synchronisePharmacyDraft(draft, revision);
  return immutable({ ...prepared, declaration: {
    ...prepared.declaration!,
    fields: { ...prepared.declaration!.fields, prescriber: "Dr Example (synthetic demo declaration)" },
  }, appliedSuggestion: false });
}
