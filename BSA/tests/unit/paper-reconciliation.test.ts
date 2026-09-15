import { expect, it } from "vitest";
import { reconcilePaperEvidence, type PaperReconciliationInput } from "../../src/lib/domain/paper-reconciliation";

const complete = (): PaperReconciliationInput => ({
  revision: 2,
  declaration: { productCode: "SYN-PRODUCT", quantity: 28, brandManufacturer: "Example maker (synthetic)" },
  scan: { readable: true, fields: { productCode: "SYN-PRODUCT", quantity: 28, brandManufacturer: "Example maker (synthetic)" } },
  characterRecognition: [
    { field: "productCode", value: "SYN-PRODUCT", confidence: 0.99 },
    { field: "quantity", value: 28, confidence: 0.97 },
    { field: "brandManufacturer", value: "Example maker (synthetic)", confidence: 0.92 },
  ],
  tariffChecks: [
    { field: "productCode", met: true, request: { rule: "required_field", field: "productCode" } },
    { field: "quantity", met: true, request: { rule: "quantity_matches_prescription" } },
    { field: "brandManufacturer", met: true, request: { rule: "brand_required_for_multiple_suppliers" } },
  ],
  verification: { gate1: "pass", gate2: "pass", reconciled: true, released: false },
});

it("retains three independent evidence columns and recommends only a human paper release", () => {
  const input = complete(), result = reconcilePaperEvidence(input);
  expect(result.evidence).toEqual(input);
  expect(result.evidence).not.toBe(input);
  expect(result).toMatchObject({ requiresType1: false, requiresOperatorRelease: true, automaticRelease: false, outcome: "RELEASE_RECOMMENDED", note: null });
  expect(result.summary).toBe("Release to existing pricing recommended; both gates satisfied; requires the operator's press because paper was scanned");
  expect(result.labels.characterRecognition).toBe("Extracted by character recognition (hypothetical)");
  expect(result.labels.synthetic).toBe("synthetic; illustrates what NHSBSA's capture would produce");
});

it.each(["missing-declaration", "scan-conflict", "ocr-conflict", "missing-scan", "tariff-failure", "strength-failure", "concession-failure"] as const)(
  "fails safe on %s and keeps proposed values out of the referral", (fault) => {
    const source = complete();
    const input: PaperReconciliationInput = {
      ...source,
      ...(fault === "missing-declaration" ? { declaration: { ...source.declaration, brandManufacturer: "" } } : {}),
      ...(fault === "scan-conflict" ? { scan: { readable: true, fields: { ...source.scan.fields, quantity: 56 } } } : {}),
      ...(fault === "ocr-conflict" ? { characterRecognition: source.characterRecognition.map((field) => field.field === "quantity" ? { ...field, value: 56 } : field) } : {}),
      ...(fault === "missing-scan" ? { scan: { readable: true, fields: { ...source.scan.fields, brandManufacturer: "" } } } : {}),
      ...(fault === "tariff-failure" ? { tariffChecks: [...source.tariffChecks, { field: "brandManufacturer", met: false, request: { rule: "brand_required_for_multiple_suppliers" } }] } : {}),
      ...(fault === "strength-failure" ? { tariffChecks: [...source.tariffChecks, { field: "productCode", met: false, request: { rule: "strength_matches_prescription" } }] } : {}),
      ...(fault === "concession-failure" ? { tariffChecks: [...source.tariffChecks, { field: "productCode", met: false, request: { rule: "amount_matches_concession", tariffMonth: "2026-08" } }] } : {}),
    };
    const result = reconcilePaperEvidence(input);
    expect(result.outcome).toBe("REFER_BACK");
    expect(result.automaticRelease).toBe(false);
    expect(result.note).not.toMatch(/28|56|Example maker/);
    expect(result.evidence).toEqual(input);
  },
);

it("requires current Type 1 confirmation before Type 2, without presenting confirmed values as OCR", () => {
  const source = complete();
  const input = { ...source, scan: { ...source.scan, readable: false },
    characterRecognition: source.characterRecognition.map((field) => ({ ...field, confidence: 0.4 })) };
  expect(reconcilePaperEvidence(input).outcome).toBe("TYPE1_CONFIRMATION");
  const capture = { revision: 2, declarationReconciled: true, fields: source.declaration };
  expect(reconcilePaperEvidence({ ...input, capture: { ...capture, revision: 1 } }).requiresType1).toBe(true);
  const result = reconcilePaperEvidence({ ...input, capture });
  expect(result.outcome).toBe("RELEASE_RECOMMENDED");
  expect(result.evidence.characterRecognition[0].confidence).toBe(0.4);
  expect(result.evidence.scan.readable).toBe(false);
  expect(reconcilePaperEvidence({ ...input, capture: { ...capture, declarationReconciled: false } }).outcome).toBe("REQUEST_INFORMATION");
});

it("a human capture cannot erase high-confidence contradictory scan or OCR", () => {
  const source = complete();
  const capture = { revision: 2, declarationReconciled: true, fields: source.declaration };
  const result = reconcilePaperEvidence({ ...source, capture,
    characterRecognition: source.characterRecognition.map((field) => field.field === "quantity" ? { ...field, value: 56 } : field) });
  expect(result.outcome).toBe("REFER_BACK");
  expect(result.evidence.characterRecognition[1].value).toBe(56);
});

it("missing deterministic agreement cannot be replaced by matching synthetic field values", () => {
  expect(reconcilePaperEvidence({ ...complete(), verification: { gate1: "pass", gate2: "fail", reconciled: false, released: false } }).outcome).toBe("REQUEST_INFORMATION");
});

it.each([-0.1, 1.1, Number.NaN])("rejects invalid confidence %s", (confidence) => {
  expect(() => reconcilePaperEvidence({ ...complete(), characterRecognition: [{ field: "quantity", value: 28, confidence }] })).toThrow(/between zero and one/);
});

it("rejects duplicate extraction fields and absent field-rule checks explicitly", () => {
  const source = complete();
  expect(() => reconcilePaperEvidence({ ...source, characterRecognition: [source.characterRecognition[0], source.characterRecognition[0]] })).toThrow(/duplicate/);
  expect(() => reconcilePaperEvidence({ ...source, tariffChecks: [] })).toThrow(/field-level Tariff/);
});
