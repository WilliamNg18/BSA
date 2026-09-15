import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecommendationCard } from "../../src/components/demo/recommendation-card";
import { recommendationForAudience, operatorRecommendationNote, PHARMACY_SUGGESTION_LABEL } from "../../src/lib/domain/recommendation-audience";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { evaluateEpsStrength, type EpsStrengthPrescription } from "../../src/lib/domain/eps-strength";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

function strengthRecommendation() {
  const source: EpsStrengthPrescription = {
    prescriber: { name: "Dr Example (synthetic)", practice: "Synthetic practice" }, patientLabel: "Synthetic example",
    prescriptionDate: "2026-08-21", dispensingDate: "2026-08-21", prescriberEndorsement: "", dispenserEndorsement: "NCSO RK 21/08/26",
    exemptionStatus: "exempt", claimMessageState: "submitted",
    supplyRecord: { productCode: "SYN-AMLO10-28", quantity: 28 },
    items: [{ prescribedCode: "SYN-AMLO10-28", product: "Amlodipine 10mg tablets", strength: "10mg", form: "tablets",
      quantity: 28, dose: "Synthetic placeholder", dispensedCode: "SYN-AMLO5-28", dispensedName: "Amlodipine 5mg tablets" }],
  };
  const strength = evaluateEpsStrength(source)!;
  const recommendation = { ...deriveRecommendation(store(), "EX-24112"), strength };
  return { source, recommendation };
}

describe("explicit recommendation audience boundary", () => {
  it("operator payload contains no proposed strength patch or preview, but retains exact source facts", () => {
    const { recommendation } = strengthRecommendation();
    const before = structuredClone(recommendation);
    const operator = recommendationForAudience(recommendation, "operator");
    expect(operator).toMatchObject({ audience: "operator", preview: null, suggestions: [], suggestionLabel: null,
      strength: { suggestion: null } });
    expect(operator.strength?.prescribed).toEqual(recommendation.strength.prescribed);
    expect(operator.strength?.selected).toEqual(recommendation.strength.selected);
    expect(operator.strength?.supplied).toEqual(recommendation.strength.supplied);
    expect(JSON.stringify(operator)).not.toContain("Select Amlodipine");
    expect(JSON.stringify(operator)).not.toContain("claimLinePreview");
    expect(operator.operatorPreview?.note ?? "").not.toMatch(/10mg|5mg|\b28\b|SYN-AMLO/);
    expect(recommendation).toEqual(before);
  });

  it("pharmacy retains the source-backed correction and exact preview with its own-records caption", () => {
    const { recommendation } = strengthRecommendation();
    const pharmacy = recommendationForAudience(recommendation, "pharmacy");
    expect(pharmacy.suggestionLabel).toBe(PHARMACY_SUGGESTION_LABEL);
    expect(pharmacy.strength?.suggestion).toEqual(recommendation.strength.suggestion);
    expect(pharmacy.strength?.suggestion?.label).toBe("Select Amlodipine 10mg tablets, 28");
    expect(pharmacy.preview).toEqual(recommendation.preview);
    expect(pharmacy.signals).toEqual(recommendation.signals);
  });

  it("operator is the fail-closed card default without hiding the prescribed or selected strengths", () => {
    const { recommendation } = strengthRecommendation(), apply = vi.fn(), before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation, onApply: apply }));
    expect(html).toContain('data-recommendation-audience="operator"');
    expect(html).toContain("Amlodipine 10mg tablets, 28");
    expect(html).toContain("Amlodipine 5mg tablets, 28");
    expect(html).not.toContain("Corrected preview");
    expect(html).not.toContain("Corrected claim line preview");
    expect(html).not.toContain("Select Amlodipine");
    expect(html).not.toContain("your agent");
    expect(apply).not.toHaveBeenCalled();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("only explicit pharmacy card renders proposed values and retains its real action marker", () => {
    const { recommendation } = strengthRecommendation();
    const html = renderToStaticMarkup(createElement(RecommendationCard, {
      recommendation, audience: "pharmacy", pharmacyAction: "apply-correction", onApply: () => {},
    }));
    expect(html).toContain("your agent&#x27;s suggestion from your records");
    expect(html).toContain("Select Amlodipine 10mg tablets, 28");
    expect(html).toContain("Corrected claim line preview");
    expect(html).toContain('data-pharmacy-action="apply-correction"');
    expect(html).not.toContain("Operator draft preview");
  });

  it("outbound note uses field identifiers rather than interpolating disagreeing quantities or product names", () => {
    const note = operatorRecommendationNote({
      version: "2026-08", requirements: [
        { id: "source-0", label: 'Quantity: pharmacy declared "100"; human capture "50".', status: "not_met" },
        { id: "brand_manufacturer", label: "Brand or manufacturer", status: "not_met" },
      ],
    });
    expect(note).toContain("Quantity must agree");
    expect(note).toContain("Brand or manufacturer required");
    expect(note).not.toMatch(/\b100\b|\b50\b|NCSO|Demo manufacturer/);
  });

  it("acknowledgement or Apply alone cannot fabricate operator-approved communication in an audience projection", () => {
    const r = deriveRecommendation(store(), "EX-24112");
    const pharmacy = recommendationForAudience(r, "pharmacy");
    expect(pharmacy.operatorApproved).toBe(false);
    expect(pharmacy.preview).not.toBeNull();
    expect(pharmacy.suggestionLabel).toBe(PHARMACY_SUGGESTION_LABEL);
  });
});
