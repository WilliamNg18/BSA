import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { cases, caseViewRoutes } from "../support/case-view-catalog";
import { PLAYABLE_CASES } from "../../src/lib/domain/cases";

it("keeps the same four route identities with current canonical case titles", () => {
  expect(cases).toEqual([
    { id: "EX-24107", title: "Valid and complete" },
    { id: "EX-24112", title: "Paper endorsement: brand required" },
    { id: "SYN-FQ123-MISMATCH", title: "Wrong strength selected" },
    { id: "EX-24123", title: "Deliberate failure and abstention" },
  ]);
  expect(cases).toEqual(PLAYABLE_CASES.map(({ id, title }) => ({ id, title })));
});

it("uses one catalog for route fixtures and operator view expectations", () => {
  for (const path of ["../e2e/fixtures.ts", "../e2e/operator-action-helpers.ts"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    expect(source).toContain('export { cases } from "../support/case-view-catalog";');
    expect(source).not.toContain("export const cases =");
  }
});

it.each([
  ["EX-24107", "eps"], ["EX-24112", "paper"],
  ["SYN-FQ123-MISMATCH", "eps"], ["EX-24123", "paper"],
])("retains all five actual %s views with its canonical %s submission channel", (id, channel) => {
  expect(caseViewRoutes(id)).toEqual([
    `/pharmacy?case=${id}&channel=${channel}`,
    `/pharmacy/claims?caseId=${id}`,
    `/case/${id}`, `/case/${id}/trace`, `/case/${id}/record`,
  ]);
});

it("rejects unknown or retired operational IDs instead of inventing an EPS route", () => {
  for (const id of ["unknown", "EX-24119", "EX-24088"]) {
    expect(() => caseViewRoutes(id)).toThrow("No canonical submission channel");
  }
});
