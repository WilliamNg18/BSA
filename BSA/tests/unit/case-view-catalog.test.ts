import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { cases } from "../support/case-view-catalog";
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
