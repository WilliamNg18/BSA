import { describe, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { productByCode } from "../../src/lib/domain/reference";
import { TARIFF_VERSIONS } from "../../src/lib/domain/tariff";
import { AGREEMENT_THRESHOLD, QUALITY_THRESHOLD, complianceGate, compositeFrom, endorsementRequired,
  evaluateRequirements, mandatoryFieldsCheck, price, reconcile, sampleAgreement, validateCitation } from "../../src/lib/domain/rules";
import type { Conflict, Recommendation, RequirementResult, Signals } from "../../src/lib/domain/types";

const [july, august] = TARIFF_VERSIONS;
const clause = august.clauses[0];
const fields = CASES[0].extracted;
const facts = CASES[0].readings[0];
const mandatory = mandatoryFieldsCheck(fields);
const requirements = evaluateRequirements(clause, facts, fields);
const conflict: Conflict = { field: "Quantity", material: true, values: [], note: "Unresolved" };
const goodSignals: Signals = { provisionFound: true, imageQuality: 0.9, inCoverage: true,
  sampleAgreement: { agree: 3, total: 3 }, reconciliation: "agree" };

describe("pure compliance gate", () => {
  const gate = (rec: Recommendation, rr = requirements, conflicts: Conflict[] = [], citation: boolean | null = true, required: boolean | null = true) =>
    complianceGate(rec, rr, conflicts, mandatory, required, citation);

  it("permits complete evidence, without changing its inputs", () => {
    const before = structuredClone({ requirements, mandatory });
    expect(gate("SUFFICIENT").result).toBe("PASS");
    expect({ requirements, mandatory }).toEqual(before);
  });
  it.each([false, null])("rejects unvalidated citation %s", (citation) => {
    expect(gate("SUFFICIENT", requirements, [], citation).result).toBe("FAIL");
  });
  it.each([false, null])("cannot permit SUFFICIENT with requirement %s", (met) => {
    const rr = requirements.map((r, i) => i === 0 ? { ...r, met } : r);
    expect(gate("SUFFICIENT", rr).result).toBe("FAIL");
  });
  it("distinguishes no endorsement required from unknown or empty requirements", () => {
    expect(gate("SUFFICIENT", []).result).toBe("FAIL");
    expect(gate("SUFFICIENT", [], [], true, null).result).toBe("FAIL");
    expect(gate("SUFFICIENT", [], [], true, false).result).toBe("PASS");
  });
  it("blocks material conflicts but not immaterial notes", () => {
    expect(gate("SUFFICIENT", requirements, [conflict]).result).toBe("FAIL");
    expect(gate("SUFFICIENT", requirements, [{ ...conflict, material: false }]).result).toBe("PASS");
  });
  it("permits REFER_BACK only for a known unmet requirement", () => {
    expect(gate("REFER_BACK").result).toBe("FAIL");
    const unmet: RequirementResult[] = [{ ...requirements[0], met: false }];
    expect(gate("REFER_BACK", unmet).result).toBe("PASS");
    expect(gate("REFER_BACK", [{ ...unmet[0], met: null }]).result).toBe("FAIL");
  });
  it("permits REQUEST_INFORMATION for a material conflict only when common checks pass", () => {
    expect(gate("REQUEST_INFORMATION").result).toBe("FAIL");
    expect(gate("REQUEST_INFORMATION", requirements, [conflict]).result).toBe("PASS");
    // Missing fields justify gathering evidence, but cannot bypass the mandatory-fields gate.
    const missing = [{ name: "Missing", pass: false, detail: "Not read" }];
    expect(complianceGate("REQUEST_INFORMATION", [], [], missing, true, true).result).toBe("FAIL");
    expect(complianceGate("SUFFICIENT", requirements, [], missing, true, true).result).toBe("FAIL");
  });
  it.each(["ABSTAIN", "NONE"] as const)("does not run for %s even with invalid evidence", (rec) => {
    expect(gate(rec, [], [conflict], false).result).toBe("NOT_RUN");
  });
});

describe("five-signal composite", () => {
  it("pins structural thresholds", () => {
    expect(QUALITY_THRESHOLD).toBe(0.6);
    expect(AGREEMENT_THRESHOLD).toBe(2);
    expect(compositeFrom(goodSignals).level).toBe("high");
  });
  it.each([[0.599999, "abstain"], [0.6, "high"], [0.600001, "high"]] as const)("quality %s produces %s", (imageQuality, level) => {
    expect(compositeFrom({ ...goodSignals, imageQuality }).level).toBe(level);
  });
  it.each([[0, "abstain"], [1, "abstain"], [2, "medium"], [3, "high"]] as const)("%s of 3 readings produces %s", (agree, level) => {
    expect(compositeFrom({ ...goodSignals, sampleAgreement: { agree, total: 3 } }).level).toBe(level);
  });
  it("abstains when no readings exist", () => {
    expect(compositeFrom({ ...goodSignals, sampleAgreement: { agree: 0, total: 0 } }).level).toBe("abstain");
  });
  it("one weakness is medium, two or more low, missing provision always abstains", () => {
    expect(compositeFrom({ ...goodSignals, inCoverage: false }).level).toBe("medium");
    expect(compositeFrom({ ...goodSignals, reconciliation: "conflict" }).level).toBe("medium");
    expect(compositeFrom({ ...goodSignals, inCoverage: false, reconciliation: "conflict" }).level).toBe("low");
    expect(compositeFrom({ ...goodSignals, provisionFound: false }).level).toBe("abstain");
  });
});

describe("citation validity", () => {
  it("validates a retrieved span in the selected corpus", () => {
    expect(validateCitation(clause, august, clause.text)).toBe(true);
    expect(validateCitation(clause, august, "initialled and dated")).toBe(true);
  });
  it("rejects invented text, missing clause ids, blank spans and cross-version text", () => {
    expect(validateCitation(clause, august, "Invented provision")).toBe(false);
    expect(validateCitation({ ...clause, id: "invented" }, august, clause.text)).toBe(false);
    expect(validateCitation(clause, august, "")).toBe(false);
    expect(validateCitation(clause, august, "   ")).toBe(false);
    expect(validateCitation(clause, july, "initialled and dated")).toBe(false);
    expect(validateCitation({ ...clause, text: "Invented provision" }, august, "Invented provision")).toBe(false);
  });
  it("returns unknown when no clause or corpus is available", () => {
    expect(validateCitation(null, august, "anything")).toBeNull();
    expect(validateCitation(clause, null, clause.text)).toBeNull();
  });
});

describe("deterministic evidence checks", () => {
  it("groups only structural readings, ignoring prose; empty and tied samples have no reliable consensus", () => {
    expect(sampleAgreement(CASES[0].readings)).toMatchObject({ agree: 3, total: 3 });
    expect(sampleAgreement([])).toEqual({ agree: 0, total: 0, consensus: null });
    expect(sampleAgreement(CASES[3].readings)).toMatchObject({ agree: 1, total: 3 });
    expect(sampleAgreement([facts, { ...facts, dated: false }, { ...facts, note: "Different prose" }])).toMatchObject({ agree: 2, total: 3, consensus: facts });
  });
  it("evaluates unknown facts and all clause requirement types", () => {
    expect(evaluateRequirements(null, facts, fields)).toEqual([]);
    expect(evaluateRequirements(clause, null, fields).every((r) => r.met === null)).toBe(true);
    expect(evaluateRequirements(august.clauses[1], facts, fields).every((r) => r.met)).toBe(true);
    const specials = august.clauses[3];
    expect(evaluateRequirements(specials, { ...facts, quotedText: "SP £12.00" }, fields).every((r) => r.met)).toBe(true);
    expect(evaluateRequirements(specials, facts, { ...fields, quantity: null }).map((r) => r.met)).toEqual([true, false, false]);
  });
  it("finds absent mandatory fields", () => {
    expect(mandatory.every((m) => m.pass)).toBe(true);
    const missing = { ...fields, productCode: null, quantity: null, dispensingDate: "", prescriber: "Illegible" };
    expect(mandatoryFieldsCheck(missing).every((m) => !m.pass)).toBe(true);
  });
  it("handles unresolved product/version and the half-penny endorsement threshold", () => {
    const product = productByCode(fields.productCode)!;
    expect(endorsementRequired(null, august, 10).required).toBeNull();
    expect(endorsementRequired(product, null, 10).required).toBeNull();
    expect(endorsementRequired(product, august, product.basicPrice + 0.005).required).toBe(false);
    expect(endorsementRequired(product, august, product.basicPrice + 0.006).required).toBe(true);
  });
  it("retains product and amount conflicts without inventing unreadable quantities", () => {
    const product = productByCode(fields.productCode)!;
    expect(reconcile(fields, 28, fields.productCode!, 3.41, product, 3.41)).toEqual([]);
    expect(reconcile(fields, 28, "SYN-OTHER", 4, product, 3.41).map((c) => c.field)).toEqual(["Product", "Amount claimed"]);
    expect(reconcile({ ...fields, quantity: null, productCode: null }, 28, "SYN-OTHER", 4, null, null)).toEqual([]);
  });
  it("refuses to price", () => {
    expect(price).toThrow("This prototype does not price items.");
  });
});