import { expect, it } from "vitest";
import { EXTENDED_REQUIREMENTS, LIVE_CHECKLIST, extendedRequirementTitle } from "./inventory";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";

it("does not treat the pre-addition 55 checks as the final extended inventory", () => {
  expect(LIVE_CHECKLIST).toHaveLength(75);
  expect(new Set(LIVE_CHECKLIST).size).toBe(75);
  expect(LIVE_CHECKLIST.slice(55)).toHaveLength(20);
});

it("requires each new requirement at both desktop widths and both Agent settings", () => {
  for (const requirement of Object.keys(EXTENDED_REQUIREMENTS) as (keyof typeof EXTENDED_REQUIREMENTS)[]) {
    for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
      expect(LIVE_CHECKLIST).toContain(extendedRequirementTitle(requirement, width, enabled));
    }
  }
});
