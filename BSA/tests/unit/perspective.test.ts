import { afterEach, describe, expect, it } from "vitest";
import { canViewPath, perspectiveForPath, PERSPECTIVES } from "../../src/lib/perspective";
import { useAppStore } from "../../src/lib/store";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";

afterEach(() => { useAppStore.getState().resetDemo(); useAppStore.getState().setPerspective("both"); });

describe("perspective is presentation only", () => {
  it.each(PERSPECTIVES)("keeps operational references and Agent untouched in $label", ({ value }) => {
    const before = useAppStore.getState();
    before.setAgentEnabled(true);
    before.followCase("EX-24112");
    before.setPerspective(value);
    const after = useAppStore.getState();
    expect(after.perspective).toBe(value);
    expect(after.agentEnabled).toBe(true);
    expect(after.followedCaseId).toBe("EX-24112");
    for (const key of ["lifecycles", "caseRevisions", "caseStates", "records"] as const) {
      expect(after[key]).toBe(before[key]);
    }
    after.setAgentEnabled(false);
    expect(useAppStore.getState().perspective).toBe(value);
    after.resetDemo();
    expect(useAppStore.getState().perspective).toBe(value);
  });
  it.each([
    ["/pharmacy", "pharmacy"], ["/pharmacy/claims?caseId=SYN-1", "pharmacy"],
    ["/pharmacy/claims?case=EX-24112", "pharmacy"], ["/queue", "nhsbsa"],
    ["/case/EX-24112", "nhsbsa"], ["/case/SYN-1/trace", "nhsbsa"], ["/case/EX-24112/record", "nhsbsa"],
  ] as const)("classifies %s as %s", (path, side) => {
    expect(perspectiveForPath(path)).toBe(side);
    expect(canViewPath(side, path)).toBe(true);
    expect(canViewPath(side === "pharmacy" ? "nhsbsa" : "pharmacy", path)).toBe(false);
    expect(canViewPath("both", path)).toBe(true);
  });
  it.each(["/", "/#cases", "/#two-places", "/#pipeline", "/evaluation", "/boundary", "/assumptions", "/architecture", "/unknown", "/pharmacy-other"])("keeps shared or unknown %s available", (path) => {
    expect(perspectiveForPath(path)).toBeUndefined();
    for (const { value } of PERSPECTIVES) expect(canViewPath(value, path)).toBe(true);
  });
  it("keeps every original tour stop available in Both", () => {
    expect(TOUR_STOPS.every((stop) => canViewPath("both", stop.to))).toBe(true);
  });
});
