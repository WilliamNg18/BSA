import { describe, expect, it } from "vitest";
import { caseById } from "@/lib/domain/cases";
import { createEpsPrescription, EPS_SUPPLY_RULE, evaluateEpsSupply } from "@/lib/domain/eps-check";

const generic = () => ({
  ...createEpsPrescription(caseById("EX-24101")!),
  items: createEpsPrescription(caseById("EX-24101")!).items.map((item) => ({ ...item, prescribedCode: EPS_SUPPLY_RULE.productCode, dispensedCode: EPS_SUPPLY_RULE.productCode })),
  supplyEvidence: { ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: "", packSize: 21, form: "capsules" },
});

describe("synthetic EPS source evidence", () => {
  it("creates a novice-readable digital draft without changing source evidence", () => {
    const c = caseById("EX-24107")!;
    const before = structuredClone(c);
    expect(createEpsPrescription(c)).toMatchObject({
      patientLabel: "Patient A (synthetic)",
      items: [{ product: "Sertraline", strength: "50mg", form: "tablets", quantity: 28, dose: "Synthetic placeholder only; not clinical advice" }],
      prescriberEndorsement: "", dispenserEndorsement: "NCSO JB 14/08/26", claimMessageState: "draft",
    });
    expect(c).toEqual(before);
  });

  it("does not invent a digital draft from unreadable paper", () => {
    expect(() => createEpsPrescription(caseById("EX-24123")!)).toThrow("known synthetic product");
  });

  it("leaves baseline E outside the additional supply demonstration", () => {
    expect(evaluateEpsSupply(createEpsPrescription(caseById("EX-24101")!))).toBeNull();
  });

  it("identifies precisely the missing manufacturer without mutating the draft", () => {
    const draft = generic(), before = structuredClone(draft);
    const result = evaluateEpsSupply(draft)!;
    expect(result.complete).toBe(false);
    expect(result.version).toBe("2026-08");
    expect(result.checks.filter((check) => !check.met).map((check) => check.id)).toEqual(["brand_manufacturer"]);
    expect(draft).toEqual(before);
  });

  it("cannot bypass the product rule by omitting its optional evidence", () => {
    const draft = generic();
    const result = evaluateEpsSupply({ items: draft.items, dispensingDate: draft.dispensingDate });
    expect(result?.complete).toBe(false);
    expect(result?.checks.filter((check) => !check.met).map((check) => check.id)).toEqual(["supply_product", "brand_manufacturer", "pack_size", "presentation"]);
  });

  it.each([
    { field: "brandManufacturer", value: "  ", id: "brand_manufacturer" },
    { field: "packSize", value: null, id: "pack_size" },
    { field: "packSize", value: 28, id: "pack_size" },
    { field: "form", value: "", id: "presentation" },
    { field: "form", value: "tablets", id: "presentation" },
  ])("checks $field against the synthetic rule", ({ field, value, id }) => {
    const draft = generic();
    const evidence = { ...draft.supplyEvidence, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer, [field]: value };
    const result = evaluateEpsSupply({ ...draft, supplyEvidence: evidence })!;
    expect(result.complete).toBe(false);
    expect(result.checks.filter((check) => !check.met).map((check) => check.id)).toEqual([id]);
  });

  it("resolves all requirements only from supplied source fields", () => {
    const draft = generic();
    expect(evaluateEpsSupply({ ...draft, supplyEvidence: { ...draft.supplyEvidence, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer } })).toMatchObject({ complete: true, gap: "None" });
  });

  it("does not apply the synthetic rule to another product or an invalid month", () => {
    const draft = generic();
    expect(evaluateEpsSupply({ ...draft, dispensingDate: "2026-02-31" })?.complete).toBe(false);
    expect(evaluateEpsSupply({ ...draft, items: createEpsPrescription(caseById("EX-24107")!).items })?.checks[0].met).toBe(false);
  });
});
