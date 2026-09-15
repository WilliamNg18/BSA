import { expect, it } from "vitest";
import { assertSafeOperatorNote, buildReferralNote, type ReferralRequest } from "../../src/lib/domain/referral-wording";

const examples: readonly { request: ReferralRequest; proposed: string[] }[] = [
  { request: { rule: "strength_matches_prescription" }, proposed: ["10mg", "SYN-AMLO10-28", "Amlodipine 10mg tablets, 28"] },
  { request: { rule: "quantity_matches_prescription" }, proposed: ["28"] },
  { request: { rule: "brand_required_for_multiple_suppliers" }, proposed: ["Example manufacturer (synthetic)"] },
  { request: { rule: "amount_matches_concession", tariffMonth: "2026-08" }, proposed: ["2.40", "GBP 2.40"] },
];

it.each(examples)("the $request.rule note never contains the proposed correction", ({ request, proposed }) => {
  const note = buildReferralNote([request]);
  expect(() => assertSafeOperatorNote(note, proposed)).not.toThrow();
  for (const value of proposed) {
    expect(note).not.toContain(value);
    expect(() => assertSafeOperatorNote(`${note}; please enter ${value}`, proposed)).toThrow(/proposed corrected value/);
  }
});

it("uses exact field and rule requests, not the original evidence values", () => {
  expect(buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }])).toBe(
    "Brand or manufacturer required for a generic with more than one supplier; please state the product supplied");
  expect(buildReferralNote([{ rule: "quantity_matches_prescription" }])).toBe(
    "Quantity claimed does not match the prescription; please state the accurate quantity");
  expect(buildReferralNote([{ rule: "amount_matches_concession", tariffMonth: "2026-08" }])).toBe(
    "Amount claimed does not match the concession price for August 2026; please state the accurate amount");
});

it.each(["10 MG", "10-mg", "１０ｍｇ", "SYN / AMLO10 / 28"])("rejects proposed-value aliases in manual notes: %s", (alias) => {
  expect(() => assertSafeOperatorNote(`Please use ${alias} instead`, ["10mg", "SYN-AMLO10-28"])).toThrow(/proposed corrected value/);
});

it("rejects missing rules, invalid dates and incomplete note guards explicitly", () => {
  expect(() => buildReferralNote([])).toThrow(/field and rule/);
  expect(() => buildReferralNote([{ rule: "amount_matches_concession", tariffMonth: "2026-13" }])).toThrow(/valid dispensing-month/);
  expect(() => assertSafeOperatorNote("short", [])).toThrow(/eight characters/);
  expect(() => assertSafeOperatorNote("Please confirm the accurate quantity", [""])).toThrow(/non-empty source value/);
});

it("deduplicates rule requests without rewriting supplied human text or evidence", () => {
  const request = { rule: "required_field", field: "packSize" } as const;
  expect(buildReferralNote([request, request])).toBe(buildReferralNote([request]));
  const evidence = { asSubmitted: "5mg", proposed: "10mg", note: "Please confirm 10mg" };
  const original = structuredClone(evidence);
  expect(() => assertSafeOperatorNote(evidence.note, [evidence.proposed])).toThrow();
  expect(evidence).toEqual(original);
});
