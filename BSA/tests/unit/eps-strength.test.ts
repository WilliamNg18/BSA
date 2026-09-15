import { describe, expect, it } from "vitest";
import {
  applyEpsStrengthCorrection, EPS_STRENGTH_CORRECT_CODE, EPS_STRENGTH_SELECTED_CODE,
  evaluateEpsStrength, type EpsStrengthPrescription,
} from "../../src/lib/domain/eps-strength";
import { productByCode } from "../../src/lib/domain/reference";
import type { Product } from "../../src/lib/domain/types";

// G adds this pack to the canonical catalogue during integration; the correction already uses its real 10mg entry.
const selectedPack: Product = {
  code: EPS_STRENGTH_SELECTED_CODE, name: "Amlodipine 5mg tablets", packSize: 28, category: "M", basicPrice: 0.82,
};
const lookup = (code: string | null) => code === selectedPack.code ? selectedPack : productByCode(code);
function message(): EpsStrengthPrescription {
  return {
    prescriber: { name: "Dr Example (synthetic)", practice: "Hillcrest Practice (synthetic)" },
    patientLabel: "Synthetic example", prescriptionDate: "2026-08-21", dispensingDate: "2026-08-21",
    items: [{
      prescribedCode: EPS_STRENGTH_CORRECT_CODE, product: "Amlodipine 10mg tablets", strength: "10mg",
      form: "tablets", quantity: 28, dose: "Synthetic placeholder only; not clinical advice",
      dispensedCode: EPS_STRENGTH_SELECTED_CODE, dispensedName: "Amlodipine 5mg tablets",
    }],
    supplyRecord: { productCode: EPS_STRENGTH_CORRECT_CODE, quantity: 28 },
    prescriberEndorsement: "", dispenserEndorsement: "NCSO RK 21/08/26",
    exemptionStatus: "exempt", claimMessageState: "draft",
  };
}
function withItem(patch: Partial<EpsStrengthPrescription["items"][number]>) {
  const value = message();
  return { ...value, items: [{ ...value.items[0], ...patch }] };
}

describe("source-backed EPS wrong strength", () => {
  it("identifies prescribed 10mg, selected 5mg and actual supplied 10mg independently", () => {
    const result = evaluateEpsStrength(message(), lookup)!;
    expect(result.complete).toBe(false);
    expect(result.prescribed).toMatchObject({ code: EPS_STRENGTH_CORRECT_CODE, strength: "10mg", packSize: 28 });
    expect(result.selected).toMatchObject({ code: EPS_STRENGTH_SELECTED_CODE, strength: "5mg", packSize: 28 });
    expect(result.supplied).toEqual(result.prescribed);
    expect(result.checks.map((entry) => entry.pass)).toEqual([true, true, true, true, false]);
    expect(result.gap).toBe("Strength mismatch: prescribed 10mg, selected 5mg");
  });

  it("returns a concrete correction and preview from the existing catalogue reference", () => {
    const result = evaluateEpsStrength(message(), lookup)!;
    const actualReference = productByCode(EPS_STRENGTH_CORRECT_CODE)!;
    expect(result.suggestion).toEqual({
      label: "Select Amlodipine 10mg tablets, 28",
      patch: { dispensedCode: actualReference.code, dispensedName: actualReference.name },
      claimLinePreview: "Amlodipine 10mg tablets, 28 | product and pack code: SYN-AMLO10-28 | quantity: 28",
      source: "your agent's suggestion from your records",
    });
    expect(result.prescribed).not.toHaveProperty("basicPrice");
  });

  it("checks received copies afresh rather than accepting a previous suggestion as proof", () => {
    const source = message();
    const received = { ...structuredClone(source), claimMessageState: "submitted" as const };
    const advice = evaluateEpsStrength(source, lookup)!;
    expect(advice.suggestion).not.toBeNull();
    expect(evaluateEpsStrength(received, lookup)?.complete).toBe(false);
    expect(received.items[0].dispensedCode).toBe(EPS_STRENGTH_SELECTED_CODE);
    expect(received).not.toHaveProperty("released");
  });

  it("Apply changes only the selected claim code and name, not the source or other fields", () => {
    const source = message();
    Object.freeze(source.items[0]);
    Object.freeze(source.items);
    Object.freeze(source.supplyRecord);
    Object.freeze(source);
    const before = structuredClone(source);
    const corrected = applyEpsStrengthCorrection(source, lookup);
    expect(source).toEqual(before);
    expect(corrected).toEqual({
      ...before, items: [{ ...before.items[0], dispensedCode: EPS_STRENGTH_CORRECT_CODE, dispensedName: "Amlodipine 10mg tablets" }],
    });
    expect(corrected.supplyRecord).not.toBe(source.supplyRecord);
    expect(corrected.claimMessageState).toBe("draft");
    expect(evaluateEpsStrength(corrected, lookup)).toMatchObject({ complete: true, gap: "None", suggestion: null });
    expect(evaluateEpsStrength({ ...corrected, claimMessageState: "submitted" }, lookup)?.complete).toBe(true);
  });

  it("cannot invent an actual supply record from the selected pack or prescription", () => {
    const source = { ...message(), supplyRecord: undefined };
    expect(evaluateEpsStrength(source, lookup)).toMatchObject({ complete: false, suggestion: null, supplied: null });
    expect(() => applyEpsStrengthCorrection(source, lookup)).toThrow("No source-backed");
  });

  it.each([
    { productCode: EPS_STRENGTH_SELECTED_CODE, quantity: 28 },
    { productCode: EPS_STRENGTH_CORRECT_CODE, quantity: 56 },
    { productCode: "SYN-UNKNOWN", quantity: 28 },
    { productCode: EPS_STRENGTH_CORRECT_CODE, quantity: 0 },
    { productCode: EPS_STRENGTH_CORRECT_CODE, quantity: Number.NaN },
  ])("refuses a correction when actual supply disagrees or is unknown: %j", (supplyRecord) => {
    const source = { ...message(), supplyRecord };
    expect(evaluateEpsStrength(source, lookup)).toMatchObject({ complete: false, suggestion: null });
    expect(() => applyEpsStrengthCorrection(source, lookup)).toThrow("No source-backed");
  });

  it.each([
    { strength: "5mg" }, { product: "Amlodipine 5mg tablets" }, { form: "capsules" },
    { quantity: 14 }, { quantity: 28.5 }, { prescribedCode: "SYN-UNKNOWN" },
  ])("does not repair prescription-source fields using claim data: %j", (patch) => {
    expect(evaluateEpsStrength(withItem(patch), lookup)).toMatchObject({ complete: false, suggestion: null });
  });

  it("refuses to guess which line to correct in a multi-item message", () => {
    const source = message();
    expect(evaluateEpsStrength({ ...source, items: [...source.items, ...source.items] }, lookup))
      .toMatchObject({ complete: false, suggestion: null });
    expect(evaluateEpsStrength({ ...source, items: [] }, lookup))
      .toMatchObject({ complete: false, suggestion: null });
  });

  it("does not treat a known code with a wrong selected name as verified", () => {
    const source = withItem({ dispensedCode: EPS_STRENGTH_CORRECT_CODE, dispensedName: "Amlodipine 5mg tablets" });
    expect(evaluateEpsStrength(source, lookup)?.complete).toBe(false);
    expect(evaluateEpsStrength(applyEpsStrengthCorrection(source, lookup), lookup)?.complete).toBe(true);
  });

  it("rejects a fabricated or unavailable reference instead of claiming a concrete pack", () => {
    const unavailable = (code: string | null) => code === EPS_STRENGTH_CORRECT_CODE ? null : lookup(code);
    const falseIdentity = () => selectedPack;
    expect(evaluateEpsStrength(message(), unavailable)).toMatchObject({ complete: false, suggestion: null });
    expect(evaluateEpsStrength(message(), falseIdentity)).toMatchObject({ complete: false, suggestion: null });
  });

  it("does not run on unrelated EPS without the actual supply contract", () => {
    const unrelated = withItem({ prescribedCode: "SYN-SERT50-28", dispensedCode: "SYN-SERT50-28" });
    expect(evaluateEpsStrength({ ...unrelated, supplyRecord: undefined }, lookup)).toBeNull();
  });

  it("does not manufacture another correction after the source-backed selection is applied", () => {
    const corrected = applyEpsStrengthCorrection(message(), lookup);
    expect(() => applyEpsStrengthCorrection(corrected, lookup)).toThrow("No source-backed");
  });
});
