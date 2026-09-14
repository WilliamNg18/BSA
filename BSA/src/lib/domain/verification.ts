/** Pure source validation. Advice and presentation cannot supply passing gates. */
import type { CaseRevision, ItemVerification, Type1Capture } from "./lifecycle";
import { NO_VERIFICATION } from "./lifecycle";
import type { ExceptionCase, ExtractedFields, GateCheck } from "./types";
import { paperDeclarationFields, validateSubmissionSources } from "./lifecycle-model";
import { productByCode } from "./reference";
import { EPS_SUPPLY_RULE, evaluateEpsSupply, createEpsPrescription } from "./eps-check";
import { interpretPharmacyText } from "./pharmacy-check";
import { endorsementRequired, evaluateRequirements, mandatoryFieldsCheck, QUALITY_THRESHOLD, reconcile, validateCitation } from "./rules";
import { versionForDate } from "./tariff";

export interface VerificationAssessment {
  readonly verification: ItemVerification;
  readonly gate1Checks: readonly GateCheck[];
  readonly gate2Checks: readonly GateCheck[];
  readonly tariffVersion: string | null;
  readonly clauseId: string | null;
  readonly source: "received_eps" | "readable_scan" | "human_capture" | "unreadable_scan";
  readonly releaseEligible: boolean;
  readonly reason: string;
}

const check = (name: string, pass: boolean, detail: string): GateCheck => ({ name, pass, detail });

/** `original` is retained source/ledger evidence, never the submitted-field projection. */
export function evaluateItemVerification(
  original: ExceptionCase, revision: CaseRevision, enabled: boolean, capture?: Type1Capture | null,
): VerificationAssessment {
  const channel = revision.channel ?? (original.claim.submittedVia === "EPS claim message" ? "eps" : "paper");
  validateSubmissionSources({ caseId: original.id, channel, endorsementText: revision.endorsementText,
    epsPrescription: revision.epsPrescription, paperDeclaration: revision.paperDeclaration, declaration: revision.declaration }, revision.number);
  const eps = revision.epsPrescription, paper = revision.paperDeclaration;
  const declared = paper ? paperDeclarationFields(paper) : revision.declaration?.fields;
  const item = eps?.items[0];
  const typed: ExtractedFields = {
    ...original.extracted,
    ...(item ? { productCode: item.dispensedCode, productText: item.dispensedName, quantity: item.quantity,
      prescriber: eps!.prescriber.name } : {}),
    ...(channel === "paper" && declared ? { productCode: declared.productCode, quantity: declared.quantity,
      prescriber: revision.declaration?.fields.prescriber?.trim() || original.extracted.prescriber } : {}),
    endorsementText: revision.endorsementText,
    dispensingDate: eps?.dispensingDate ?? paper?.dispensingDate ?? original.extracted.dispensingDate,
  };
  const version = versionForDate(typed.dispensingDate), product = productByCode(typed.productCode);
  const facts = interpretPharmacyText(typed.endorsementText);
  const supply = eps ? evaluateEpsSupply(eps) : typed.productCode === EPS_SUPPLY_RULE.productCode && typed.quantity !== null
    ? evaluateEpsSupply(createEpsPrescription({ ...original, extracted: typed })) : null;
  const required = endorsementRequired(product, version, original.claim.amountClaimed);
  const clause = version?.clauses.find((entry) => entry.endorsementType === (supply ? "SUPPLY" : facts.type)) ?? null;
  const formatSupply = supply ? [
    { id: "brand_manufacturer", met: Boolean(eps?.supplyEvidence?.brandManufacturer.trim()) },
    { id: "pack_size", met: Number.isSafeInteger(eps?.supplyEvidence?.packSize) && (eps?.supplyEvidence?.packSize ?? 0) > 0 },
    { id: "presentation", met: Boolean(eps?.supplyEvidence?.form.trim()) },
  ] : undefined;
  const requirements = evaluateRequirements(clause, facts, typed, formatSupply);
  const needsClause = supply !== null || required.required !== false || facts.present;
  const citation = Boolean(version && (!needsClause || validateCitation(clause, version, clause?.text ?? "") === true));
  const gate1Checks = [
    check("Typed product identified", Boolean(product), "Typed fields are declarations, not independent source readings."),
    check("Dispensing-date provision validated", citation, version?.version ?? "No dated provision"),
    check("Typed quantity present", Number.isSafeInteger(typed.quantity) && (typed.quantity ?? 0) > 0, String(typed.quantity)),
    check("Paper declaration supplied", channel !== "paper" || Boolean(declared), "Declared by the pharmacy, not read from the form."),
    check("Supported typed endorsement", supply !== null || !facts.present || facts.type === "NCSO", "Other endorsement types require human interpretation."),
    ...requirements.map((entry) => check(entry.requirement.label, entry.met === true, entry.met === true ? "Format requirement met" : "Missing or unknown")),
  ];
  if (needsClause) gate1Checks.push(check("Applicable requirements available", requirements.length > 0, clause?.id ?? "No clause"));

  const confirmed = capture?.revision === revision.number ? capture : null;
  const readable = original.imageQuality >= QUALITY_THRESHOLD &&
    Math.min(original.extracted.productConfidence, original.extracted.quantityConfidence, original.extracted.endorsementConfidence) >= QUALITY_THRESHOLD;
  const source: VerificationAssessment["source"] = channel === "eps" ? "received_eps" : confirmed ? "human_capture" : readable ? "readable_scan" : "unreadable_scan";
  const arrived: ExtractedFields = channel === "eps" ? typed : confirmed ? {
    ...original.extracted, ...confirmed.fields, prescriber: confirmed.fields.prescriber?.trim() || original.extracted.prescriber,
    dispensingDate: typed.dispensingDate,
  } : original.extracted;
  const knownSource = channel === "eps" || Boolean(confirmed) || readable;
  const declarationAgrees = channel === "eps" || Boolean(!declared && confirmed?.provenance === "human_capture") || Boolean(declared && arrived.productCode === declared.productCode &&
    arrived.quantity === declared.quantity && arrived.endorsementText.trim() === declared.endorsementText.trim() &&
    (confirmed ? confirmed.declarationReconciled : arrived.dispensingDate === typed.dispensingDate));
  // An EPS projection's claim copy is not independent evidence. Retain the original ledger.
  const ledgerAgrees = Boolean(productByCode(arrived.productCode)) && arrived.productCode === original.claim.productCode &&
    arrived.quantity === original.claim.quantity;
  const concession = version?.concessions.find((entry) => entry.productCode === arrived.productCode);
  const sourceConflicts = reconcile(arrived, original.claim.quantity, original.claim.productCode,
    original.claim.amountClaimed, productByCode(arrived.productCode), concession?.price ?? null);
  const packAgrees = !supply || eps?.supplyEvidence?.packSize === product?.packSize &&
    eps?.supplyEvidence?.form.trim().toLowerCase() === EPS_SUPPLY_RULE.form;
  const amountAgrees = Number.isFinite(original.claim.amountClaimed) && original.claim.amountClaimed >= 0 &&
    !sourceConflicts.some((entry) => entry.material) &&
    Boolean(concession || product && original.claim.amountClaimed <= product.basicPrice + 0.005);
  const reconciled = knownSource && declarationAgrees && ledgerAgrees && packAgrees && amountAgrees;
  const arrivedFacts = interpretPharmacyText(arrived.endorsementText);
  const receivedRequirements = evaluateRequirements(clause, arrivedFacts, arrived, supply?.checks);
  const gate2Checks = [
    check("Received source is readable or human-confirmed", knownSource, source),
    check("Received source agrees with declaration", declarationAgrees, channel === "eps" ? "Received EPS fields compared with independent ledger below" : "Scan or explicit human capture compared with declaration"),
    check("Independent claim product and quantity agree", ledgerAgrees, "Retained claim ledger, not a projection of submitted fields"),
    check("Product pack and presentation agree", packAgrees, "Catalogue pack checked independently of format"),
    check("Claimed amount agrees with dated reference", amountAgrees, "Validation only; no payment calculated"),
    check("Dated citation validated", citation, clause?.id ?? (citation ? "No endorsement required under dated rules" : "Missing provision")),
    ...mandatoryFieldsCheck(arrived),
    ...receivedRequirements.map((entry) => check(entry.requirement.label, entry.met === true, "Received-source requirement")),
  ];
  if (needsClause) gate2Checks.push(check("Received requirements available", receivedRequirements.length > 0, clause?.id ?? "No clause"));
  const pass1 = gate1Checks.every((entry) => entry.pass), pass2 = gate2Checks.every((entry) => entry.pass);
  const releaseEligible = pass2 && reconciled && (!enabled || pass1);
  return {
    verification: enabled ? { gate1: pass1 ? "pass" : "fail", gate2: pass2 ? "pass" : "fail", reconciled, released: false } : { ...NO_VERIFICATION },
    gate1Checks: enabled ? gate1Checks : [], gate2Checks, tariffVersion: version?.version ?? null, clauseId: clause?.id ?? null, source,
    releaseEligible,
    reason: releaseEligible ? "Current source facts validated for release to existing pricing." :
      [...(enabled ? gate1Checks : []), ...gate2Checks].filter((entry) => !entry.pass).map((entry) => entry.name).join("; "),
  };
}
