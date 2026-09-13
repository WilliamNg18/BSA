import { paperDeclarationFields } from "./lifecycle-model";
import { interpretPharmacyText, PHARMACY_STEPS, type PharmacyCheck } from "./pharmacy-check";
import { productByCode } from "./reference";
import { evaluateRequirements, validateCitation } from "./rules";
import { versionForDate } from "./tariff";
import type { ExceptionCase, PaperDeclaration } from "./types";

export interface PaperDeclarationDraft {
  typedProduct: string;
  quantity: string;
  endorsementText: string;
  dispensingDate: string;
}

export const EMPTY_PAPER_DECLARATION: PaperDeclarationDraft = {
  typedProduct: "", quantity: "", endorsementText: "", dispensingDate: "",
};

export const WORKED_PAPER_DECLARATION: PaperDeclarationDraft = {
  typedProduct: "Co-codamol 30/500 tablets", quantity: "100",
  endorsementText: "NCSO JB 27/08/26", dispensingDate: "2026-08-27",
};

export function preparePaperDeclaration(draft: PaperDeclarationDraft): PaperDeclaration {
  const quantity = draft.quantity.trim();
  if (quantity && (!/^\d+$/.test(quantity) || !Number.isSafeInteger(Number(quantity)) || Number(quantity) <= 0)) {
    throw new Error("Enter a positive whole quantity, or leave it blank if unknown.");
  }
  const date = draft.dispensingDate.trim();
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
    throw new Error("Enter a valid dispensing date.");
  }
  return {
    typedProduct: draft.typedProduct.trim(), quantity: quantity ? Number(quantity) : null,
    endorsementText: draft.endorsementText.trim(), dispensingDate: date, declaredByPharmacy: true,
  };
}

/** Checks typed evidence only. Neither completeness nor advice confirms the paper. */
export function checkPaperDeclaration(c: ExceptionCase, paper: PaperDeclaration): PharmacyCheck {
  const facts = interpretPharmacyText(paper.endorsementText);
  const stop = (stage: number, gap: string): PharmacyCheck => ({
    status: "unable", facts, version: null, clause: null, checks: [], gap,
    agreement: "Typed declaration only; image cannot be read",
    stages: PHARMACY_STEPS.map((_, index) => index < stage ? "PASS" : index === stage ? "STOPPED" : "NOT RUN"),
  });
  const version = versionForDate(paper.dispensingDate);
  if (!version) return stop(2, "No Tariff version for the declared dispensing date.");
  let fields;
  try { fields = paperDeclarationFields(paper); }
  catch (cause) { return stop(0, cause instanceof Error ? cause.message : "Invalid paper declaration."); }
  if (facts.type !== "NCSO") return stop(1, "NCSO declaration not established; manual review remains available.");
  const clause = version.clauses.find((entry) => entry.endorsementType === facts.type) ?? null;
  if (!clause || validateCitation(clause, version, clause.text) !== true) return stop(3, "No validated provision for this declaration.");
  const requirements = evaluateRequirements(clause, facts, {
    ...c.extracted, ...fields, dispensingDate: paper.dispensingDate, prescriber: "",
  });
  const checks = [
    { id: "product", label: "Declared product identified and matches claim", met: Boolean(productByCode(fields.productCode)) && fields.productCode === c.claim.productCode },
    { id: "quantity", label: "Declared quantity present and matches claim", met: Number.isSafeInteger(fields.quantity) && (fields.quantity ?? 0) > 0 && fields.quantity === c.claim.quantity },
    ...requirements.map(({ requirement, met }) => ({ id: requirement.id, label: requirement.label, met })),
  ];
  const complete = checks.every((entry) => entry.met === true);
  return {
    status: complete ? "ready" : "missing", facts, version: version.version, clause: structuredClone(clause), checks,
    stages: ["PASS", "PASS", "PASS", "PASS", complete ? "PASS" : "MISSING"],
    gap: complete ? "Declaration complete; human confirmation and prescriber evidence are still required."
      : "Check the missing declaration fields. Your NCSO endorsement needs initials and date; the form must show both.",
    agreement: "Typed declaration only; image cannot be read",
  };
}
