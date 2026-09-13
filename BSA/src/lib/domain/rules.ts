import type {
  Composite,
  Conflict,
  EndorsementFacts,
  ExtractedFields,
  GateCheck,
  Product,
  Recommendation,
  RequirementResult,
  Signals,
  TariffClause,
  TariffVersion,
} from "./types";

// DETERMINISTIC CODE. Nothing in this file calls a model. These functions are
// the parts an auditor can challenge line by line: rule checks, the compliance
// gate, the confidence composite, citation validation. Pricing is a stub that
// refuses, by design.

export const QUALITY_THRESHOLD = 0.6;
export const AGREEMENT_THRESHOLD = 2; // of 3 readings

/** Is an endorsement required for this product in this month? Pure lookup. */
export function endorsementRequired(
  product: Product | null,
  version: TariffVersion | null,
  amountClaimed: number,
): { required: boolean | null; reason: string } {
  if (!product || !version) {
    return { required: null, reason: "Product or Tariff version not resolved; requirement cannot be determined." };
  }
  const concession = version.concessions.find((c) => c.productCode === product.code);
  if (amountClaimed > product.basicPrice + 0.005) {
    return concession
      ? { required: true, reason: `Claimed amount exceeds the basic price and a concession exists for ${version.label}: an NCSO endorsement is required.` }
      : { required: true, reason: `Claimed amount exceeds the basic price and no concession exists for ${version.label}: an endorsement justifying the claim is required.` };
  }
  return { required: false, reason: "Claimed amount is at or below the basic price; no endorsement is required." };
}

export function mandatoryFieldsCheck(f: ExtractedFields): GateCheck[] {
  return [
    { name: "Product identified", pass: Boolean(f.productCode?.trim()), detail: f.productCode ? f.productText : "Product could not be resolved from the read" },
    { name: "Quantity present", pass: f.quantity !== null && Number.isSafeInteger(f.quantity) && f.quantity > 0, detail: f.quantity !== null ? String(f.quantity) : "Quantity unreadable" },
    { name: "Dispensing date present", pass: Boolean(f.dispensingDate.trim()), detail: f.dispensingDate || "Missing" },
    { name: "Prescriber present", pass: Boolean(f.prescriber.trim()) && f.prescriber.trim().toLowerCase() !== "illegible", detail: f.prescriber },
  ];
}

/** Evaluate each requirement in the clause against the structured facts. */
export function evaluateRequirements(
  clause: TariffClause | null,
  facts: EndorsementFacts | null,
  extracted: ExtractedFields,
): RequirementResult[] {
  if (!clause) return [];
  return clause.requirements.map((requirement) => {
    let met: boolean | null = null;
    if (!facts) met = null;
    else if (requirement.id === "endorsement_present") met = facts.present;
    else if (requirement.id === "initialled") met = facts.initialled;
    else if (requirement.id === "dated") met = facts.dated;
    else if (requirement.id === "quantity_stated") met = extracted.quantity !== null;
    else if (requirement.id === "invoice_price") met = /£\s?\d/.test(facts.quotedText);
    return { requirement, met };
  });
}

/** Compare extracted values with the claim and product data. Never silently picks a winner. */
export function reconcile(
  extracted: ExtractedFields,
  claimQuantity: number,
  claimProductCode: string,
  claimAmount: number,
  product: Product | null,
  concessionPrice: number | null,
): Conflict[] {
  const conflicts: Conflict[] = [];
  if (extracted.quantity !== null && extracted.quantity !== claimQuantity) {
    conflicts.push({
      field: "Quantity",
      values: [
        { origin: "Form image (capture)", value: String(extracted.quantity) },
        { origin: "Claim message / ledger", value: String(claimQuantity) },
      ],
      material: true,
      note: "The amount payable scales with quantity, so this disagreement is material. Flagged for the operator; not resolved by the agent.",
    });
  }
  if (extracted.productCode && extracted.productCode !== claimProductCode) {
    conflicts.push({
      field: "Product",
      values: [
        { origin: "Form image (capture)", value: extracted.productCode },
        { origin: "Claim message / ledger", value: claimProductCode },
      ],
      material: true,
      note: "Different products would price differently.",
    });
  }
  if (product && concessionPrice !== null && Math.abs(claimAmount - concessionPrice) > 0.005 && extracted.quantity === claimQuantity) {
    conflicts.push({
      field: "Amount claimed",
      values: [
        { origin: "Claim message / ledger", value: `£${claimAmount.toFixed(2)}` },
        { origin: "Concession price (Tariff)", value: `£${concessionPrice.toFixed(2)}` },
      ],
      material: true,
      note: "Claimed amount does not match the concession price for the month.",
    });
  }
  return conflicts;
}

/** Agreement between independent readings of the endorsement. */
export function sampleAgreement(readings: EndorsementFacts[]): { agree: number; total: number; consensus: EndorsementFacts | null } {
  if (readings.length === 0) return { agree: 0, total: 0, consensus: null };
  const key = (r: EndorsementFacts) => `${r.type}|${r.present}|${r.initialled}|${r.dated}`;
  const counts = new Map<string, number>();
  for (const r of readings) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
  let best = "";
  let bestN = 0;
  counts.forEach((n, k) => {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  });
  const consensus = readings.find((r) => key(r) === best) ?? null;
  return { agree: bestN, total: readings.length, consensus };
}

/** Structural confidence: never self-reported by the model. */
export function compositeFrom(signals: Signals): Composite {
  const reasons: string[] = [];
  let abstain = false;
  if (!signals.provisionFound) {
    reasons.push("No governing provision could be retrieved for this endorsement type and date");
    abstain = true;
  }
  if (signals.imageQuality < QUALITY_THRESHOLD) {
    reasons.push(`Image quality ${signals.imageQuality.toFixed(2)} is below the ${QUALITY_THRESHOLD.toFixed(2)} threshold`);
    abstain = true;
  }
  if (signals.sampleAgreement.agree < AGREEMENT_THRESHOLD) {
    reasons.push(`Only ${signals.sampleAgreement.agree} of ${signals.sampleAgreement.total} readings agree`);
    abstain = true;
  }
  if (abstain) return { level: "abstain", reasons };
  if (signals.reconciliation === "conflict") reasons.push("Evidence sources disagree on a material field");
  if (!signals.inCoverage) reasons.push("Exception category is outside the validated evaluation set");
  if (signals.sampleAgreement.total > 0 && signals.sampleAgreement.agree < signals.sampleAgreement.total) reasons.push("Readings not unanimous");
  if (reasons.length === 0) return { level: "high", reasons: ["All five structural signals satisfied"] };
  return { level: reasons.length === 1 ? "medium" : "low", reasons };
}

/** The compliance gate. Pure code; the model cannot call, alter or bypass it. */
export function complianceGate(
  recommendation: Recommendation,
  requirementResults: RequirementResult[],
  conflicts: Conflict[],
  mandatory: GateCheck[],
  endorsementRequired: boolean | null,
  citationValid: boolean | null,
): { result: "PASS" | "FAIL" | "NOT_RUN"; checks: GateCheck[] } {
  if (recommendation === "ABSTAIN" || recommendation === "NONE") {
    return { result: "NOT_RUN", checks: [{ name: "Gate not run", pass: true, detail: "No recommendation was made, so there is nothing to permit." }] };
  }
  const allMet = requirementResults.length > 0 && requirementResults.every((r) => r.met === true);
  const anyUnmet = requirementResults.some((r) => r.met === false);
  const materialConflict = conflicts.some((c) => c.material);
  const mandatoryOk = mandatory.every((m) => m.pass);
  const checks: GateCheck[] = [
    { name: "Recommendation cites a validated provision", pass: citationValid === true, detail: citationValid ? "Citation resolves to the corpus for the dispensing date" : "Citation missing or not found in the corpus" },
    { name: "Mandatory fields present", pass: mandatoryOk, detail: mandatoryOk ? "All mandatory fields read" : "One or more mandatory fields missing" },
    { name: "Agent has not priced or disposed", pass: true, detail: "Recommendation only; no payment value written, no case state changed by the agent" },
  ];
  if (recommendation === "SUFFICIENT") {
    checks.push({ name: "Every requirement of the clause is met", pass: allMet || endorsementRequired === false, detail: allMet ? "All requirements satisfied" : endorsementRequired === false ? "No endorsement required" : "At least one requirement unmet: SUFFICIENT is not permitted" });
    checks.push({ name: "No unresolved material conflict", pass: !materialConflict, detail: materialConflict ? "A material conflict is open: SUFFICIENT is not permitted" : "Sources agree" });
  } else if (recommendation === "REFER_BACK") {
    checks.push({ name: "At least one requirement is unmet", pass: anyUnmet, detail: anyUnmet ? "Refer back is what the rule requires" : "All requirements met: refer back would be unjustified" });
  } else if (recommendation === "REQUEST_INFORMATION") {
    checks.push({ name: "A material conflict or missing evidence exists", pass: materialConflict || !mandatoryOk, detail: materialConflict ? "Sources disagree; further evidence is the permitted next step" : "No conflict: request information would be unjustified" });
  }
  return { result: checks.every((c) => c.pass) ? "PASS" : "FAIL", checks };
}

/** Citation validation: the quoted span must exist in the clause of the version in force. */
export function validateCitation(clause: TariffClause | null, version: TariffVersion | null, quoted: string): boolean | null {
  if (!clause || !version) return null;
  if (!quoted.trim()) return false;
  const retrieved = version.clauses.find((c) => c.id === clause.id);
  return Boolean(retrieved && retrieved.text.includes(quoted) && clause.text.includes(quoted));
}

/** Pricing is out of scope for the agent and for this prototype. */
export function price(): never {
  throw new Error("Pricing is performed by NHSBSA's existing deterministic calculation. This prototype does not price items.");
}
