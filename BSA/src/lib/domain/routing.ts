import type { ExceptionCase, RoutingFacts, RoutingResult } from "./types";
import { productByCode } from "./reference";
import { endorsementRequired, evaluateRequirements, mandatoryFieldsCheck, QUALITY_THRESHOLD, reconcile } from "./rules";
import { interpretPharmacyText } from "./pharmacy-check";
import { versionForDate } from "./tariff";
import { createEpsPrescription, evaluateEpsSupply, EPS_SUPPLY_RULE } from "./eps-check";

export const RB_CODE_CATALOG = Object.freeze([
  { code: "RB2B", reason: "Missing product presentation", provenance: "public" },
  { code: "SYN-NCSO", reason: "Incomplete NCSO endorsement (synthetic code)", provenance: "synthetic" },
] as const);

/** Code routes facts, never an Agent flag, perspective or recommendation. */
export function routeSubmission(facts: RoutingFacts): RoutingResult {
  if (!facts || !["eps", "paper"].includes(facts.channel) ||
    !["not_decided", "sufficient", "insufficient", "request_information"].includes(facts.type2Decision) ||
    ["readable", "handwritten", "captureConfirmed", "mandatoryFieldsComplete", "endorsementRequired", "endorsementPresent", "endorsementComplete", "interpretationRequired", "hasConflict"]
      .some((key) => typeof facts[key as keyof RoutingFacts] !== "boolean")) throw new Error("Invalid routing facts.");
  const result = (outcome: RoutingResult["outcome"], reason: string): RoutingResult => ({
    outcome, reason, requiresHuman: outcome === "type1_capture" || outcome === "type2_endorsement",
    pricingAuthority: outcome === "auto_priced" ? "existing_rules_engine" : null,
  });
  if (facts.channel === "paper" && !facts.captureConfirmed && (!facts.readable || facts.handwritten)) return result("type1_capture", "Human product capture required before routing.");
  if (facts.type2Decision === "insufficient") return result("referred_back", "Human judgement found insufficient information; RB code and reason required.");
  if (!facts.mandatoryFieldsComplete) return result("type2_endorsement", "Mandatory evidence is missing; human review required before pricing.");
  if (facts.type2Decision === "sufficient") return {
    outcome: "type2_endorsement", reason: "Human judgement complete; existing rules engine handles normal pricing.",
    requiresHuman: false, pricingAuthority: "existing_rules_engine",
  };
  if (facts.hasConflict || facts.type2Decision === "request_information") return result("type2_endorsement", "Conflicting evidence requires human judgement.");
  if (facts.interpretationRequired || facts.endorsementRequired && (!facts.endorsementPresent || !facts.endorsementComplete)) {
    return result("type2_endorsement", "Endorsement requires human interpretation.");
  }
  if (facts.captureConfirmed) return {
    outcome: "type1_capture", reason: "Human capture complete; existing rules engine handles normal pricing.",
    requiresHuman: false, pricingAuthority: "existing_rules_engine",
  };
  return result("auto_priced", "Priced by NHSBSA's existing rules engine, no person involved.");
}

export function routingFactsForCase(c: ExceptionCase, channel: RoutingFacts["channel"], captureConfirmed = false): RoutingFacts {
  const version = versionForDate(c.extracted.dispensingDate);
  const product = productByCode(c.extracted.productCode);
  const required = endorsementRequired(product, version, c.claim.amountClaimed);
  const facts = interpretPharmacyText(c.extracted.endorsementText);
  const clause = version?.clauses.find((entry) => entry.endorsementType === facts.type) ?? null;
  const requirements = evaluateRequirements(clause, facts, c.extracted);
  const complete = requirements.length > 0 && requirements.every((entry) => entry.met === true);
  const readable = channel === "eps"
    ? Boolean(product && c.extracted.quantity !== null)
    : c.imageQuality >= QUALITY_THRESHOLD && Math.min(c.extracted.productConfidence, c.extracted.quantityConfidence, c.extracted.endorsementConfidence) >= QUALITY_THRESHOLD;
  const concession = version?.concessions.find((entry) => entry.productCode === product?.code);
  const supply = c.epsPrescription ? evaluateEpsSupply(c.epsPrescription) : c.extracted.productCode === EPS_SUPPLY_RULE.productCode
    ? evaluateEpsSupply(createEpsPrescription(c)) : null;
  return {
    channel, readable, handwritten: channel === "paper" && c.imageStyle !== "printed", captureConfirmed,
    mandatoryFieldsComplete: Boolean(product) && mandatoryFieldsCheck(c.extracted).every((check) => check.pass) && (supply?.complete ?? true),
    endorsementRequired: supply !== null || required.required !== false, endorsementPresent: supply ? supply.complete : facts.present, endorsementComplete: supply?.complete ?? complete,
    interpretationRequired: supply ? !supply.complete : required.required === null || facts.present && (facts.type !== "NCSO" || !complete) || captureConfirmed && c.scenario === "D",
    hasConflict: reconcile(c.extracted, c.claim.quantity, c.claim.productCode, c.claim.amountClaimed, product, concession?.price ?? null).some((entry) => entry.material),
    type2Decision: "not_decided",
  };
}
