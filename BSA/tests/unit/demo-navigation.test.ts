import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_ALLOWED_CONTROLS, DEMO_CASE_IDS, DEMO_CONTROL_SELECTORS, DEMO_STEPS, demoStepDestination, getDemoStep } from "../../src/lib/domain/demo-steps";
import { navigateDemoStep } from "../../src/lib/demo-navigation";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";

beforeEach(() => useAppStore.getState().resetDemo());

describe("eleven-step navigation, never a business action", () => {
  it.each(DEMO_STEPS)("resolves $number to the frozen route, case and channel", (step) => {
    const destination = new URL(demoStepDestination(step), "https://example.test");
    const base = new URL(step.path, "https://example.test");
    expect(destination.pathname).toBe(base.pathname);
    expect(destination.hash).toBe(base.hash);
    expect(destination.searchParams.get("case")).toBe(step.caseId);
    expect(destination.searchParams.get("channel")).toBe(step.channel);
  });

  it.each([false, true])("preserves drafts, history and current mode across forward/back/jump/exit, enabled %s", (enabled) => {
    const store = useAppStore.getState();
    store.setAgentEnabled(enabled);
    store.setPerspective("pharmacy");
    store.setPharmacyDraft("EX-24112", { revision: store.caseRevisions["EX-24112"].at(-1)!.number, endorsementText: "Unsent human edit" });
    const before = getDomainSnapshot();
    const destinations: string[] = [];
    for (const step of [...DEMO_STEPS, ...[...DEMO_STEPS].reverse(), getDemoStep(4), getDemoStep(10)]) {
      navigateDemoStep(step.number, (path) => destinations.push(path));
      expect(useAppStore.getState().demoStep).toBe(step.number);
      expect(useAppStore.getState().agentEnabled).toBe(enabled);
      expect(useAppStore.getState().perspective).toBe("pharmacy");
      expect(getDomainSnapshot()).toEqual(before);
    }
    expect(destinations.at(-1)).toBe("/pharmacy?case=EX-24123&channel=paper");
    store.setDemoStep(null);
    expect(getDomainSnapshot()).toEqual(before);
    expect(useAppStore.getState().pharmacyDrafts["EX-24112"].endorsementText).toBe("Unsent human edit");
  });

  it("rejects invalid jumps before changing presentation or route", () => {
    useAppStore.getState().setDemoStep(4);
    const before = useAppStore.getState();
    for (const value of [0, -1, 12, NaN, Infinity, 4.5]) {
      expect(() => navigateDemoStep(value, () => { throw new Error("Must not navigate"); })).toThrow("Unknown demo step");
      expect(useAppStore.getState()).toBe(before);
    }
  });

  it("exports an immutable positive and absence contract for all eleven screens", () => {
    expect(Object.keys(DEMO_ALLOWED_CONTROLS)).toHaveLength(11);
    expect(Object.isFrozen(DEMO_ALLOWED_CONTROLS)).toBe(true);
    for (const step of DEMO_STEPS) {
      const controls = DEMO_ALLOWED_CONTROLS[step.number];
      expect(Object.isFrozen(controls)).toBe(true);
      expect(controls.every((control) => Boolean(DEMO_CONTROL_SELECTORS[control]))).toBe(true);
      if (![7, 8, 10].includes(step.number)) expect(controls).not.toContain("operator");
      if (step.number !== 8) expect(controls).not.toContain("queue-filter");
    }
  });

  it("uses only four playable cases and distinct paper hand-offs", () => {
    expect(DEMO_CASE_IDS).toEqual(["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"]);
    expect(DEMO_CASE_IDS).toEqual(PLAYABLE_CASE_IDS);
    expect(getDemoStep(6)).toMatchObject({ caseId: "EX-24123", path: "/pharmacy" });
    expect(getDemoStep(7)).toMatchObject({ caseId: "EX-24123", path: "/case/EX-24123" });
    expect(DEMO_ALLOWED_CONTROLS[6]).toEqual(["submission", "correction"]);
    expect(DEMO_ALLOWED_CONTROLS[7]).not.toContain("submission");
  });
});
