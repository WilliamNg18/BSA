import { epsStrengthForAudience, type EpsStrengthCard } from "./eps-strength";
import { immutable } from "./lifecycle-model";
import type { ItemRecommendation } from "./recommendations";
import { buildReferralNote, PHARMACY_SUGGESTION_LABEL, type ReferralRequest } from "./referral-wording";

export { PHARMACY_SUGGESTION_LABEL };
export type RecommendationAudience = "operator" | "pharmacy";

type AudienceFacts = Omit<ItemRecommendation, "suggestions" | "preview" | "strength"> & {
  readonly strength?: EpsStrengthCard;
};
export type AudienceRecommendation = AudienceFacts & (
  | { readonly audience: "operator"; readonly suggestions: readonly []; readonly preview: null; readonly suggestionLabel: null }
  | { readonly audience: "pharmacy"; readonly suggestions: ItemRecommendation["suggestions"]; readonly preview: ItemRecommendation["preview"]; readonly suggestionLabel: typeof PHARMACY_SUGGESTION_LABEL }
);

/** Only rule/field identifiers reach outbound wording; evidence values are never interpolated. */
export function recommendationReferralRequests(r: Pick<ItemRecommendation, "requirements" | "strength" | "paper" | "version">): ReferralRequest[] {
  if (r.paper?.requests.length) return [...r.paper.requests];
  if (r.strength && !r.strength.complete) return [{ rule: "strength_matches_prescription" }];
  const requests: ReferralRequest[] = [];
  for (const entry of r.requirements.filter((requirement) => requirement.status !== "met")) {
    if (entry.id === "brand_manufacturer") requests.push({ rule: "brand_required_for_multiple_suppliers" });
    else if (entry.id === "pack_size") requests.push({ rule: "required_field", field: "packSize" });
    else if (entry.id === "presentation") requests.push({ rule: "required_field", field: "form" });
    else if (["dated", "initialled", "endorsement_present"].includes(entry.id)) requests.push({ rule: "endorsement_initialled_and_dated" });
    else if (entry.id === "quantity_stated") requests.push({ rule: "quantity_matches_prescription" });
    else if (entry.id === "invoice_price") requests.push({ rule: "required_field", field: "amountClaimed" });
    else if (/prescriber/i.test(entry.label)) requests.push({ rule: "required_field", field: "prescriber" });
    else if (/quantity/i.test(entry.label)) requests.push({ rule: "sources_must_agree", field: "quantity" });
    else if (/amount|concession/i.test(entry.label) && r.version) requests.push({ rule: "amount_matches_concession", tariffMonth: r.version });
    else if (/product/i.test(entry.label)) requests.push({ rule: "sources_must_agree", field: "productCode" });
    else if (/endorsement/i.test(entry.label)) requests.push({ rule: "sources_must_agree", field: "endorsementText" });
    else requests.push({ rule: "readable_evidence_required" });
  }
  return requests.length ? requests : [{ rule: "readable_evidence_required" }];
}

export function operatorRecommendationNote(r: Pick<ItemRecommendation, "requirements" | "strength" | "paper" | "version">): string {
  return buildReferralNote(recommendationReferralRequests(r));
}

/** Audience is presentation, never an input to validation, approval, acknowledgement or routing. */
export function recommendationForAudience(r: ItemRecommendation, audience: RecommendationAudience): AudienceRecommendation {
  const { suggestions, preview, strength, ...facts } = r;
  const safeNote = operatorRecommendationNote(r);
  const common: AudienceFacts = {
    ...facts,
    diagnostic: r.diagnostic ? { ...r.diagnostic, note: safeNote } : null,
    operatorPreview: r.operatorPreview ? { ...r.operatorPreview,
      note: r.operatorPreview.outcome === "ACCEPT" ? r.operatorPreview.note : safeNote } : null,
    ...(strength ? { strength: epsStrengthForAudience(strength, audience) } : {}),
  };
  return immutable(audience === "pharmacy"
    ? { ...common, audience, suggestions, preview, suggestionLabel: PHARMACY_SUGGESTION_LABEL }
    : { ...common, audience, suggestions: [], preview: null, suggestionLabel: null });
}
