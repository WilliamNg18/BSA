import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { itemStateLabel, LIFECYCLE_LABELS, NO_VERIFICATION, type CaseLifecycle } from "../../src/lib/domain/lifecycle";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

describe("Tasks 31-36 desktop contracts", () => {
  it("freezes eleven ordered steps without using navigation as operational authority", () => {
    expect(DEMO_STEPS.map((step) => step.number)).toEqual(Array.from({ length: 11 }, (_, i) => i + 1));
    expect(new Set(DEMO_STEPS.map((step) => step.id)).size).toBe(11);
    expect(Object.isFrozen(DEMO_STEPS)).toBe(true);
    expect(DEMO_STEPS.every(Object.isFrozen)).toBe(true);
    const initial = getDomainSnapshot();
    for (const step of DEMO_STEPS) {
      store().setDemoStep(step.number);
      expect(store().demoStep).toBe(step.number);
      expect(getDomainSnapshot()).toEqual(initial);
    }
    for (const value of [0, 12, 1.5, NaN, Infinity]) expect(() => store().setDemoStep(value)).toThrow();
    store().setDemoStep(null);
    expect(store().demoStep).toBeNull();
  });

  it("starts verification as unperformed, never as a success-shaped default", () => {
    expect(Object.keys(store().itemVerification).sort()).toEqual(Object.keys(store().lifecycles).sort());
    for (const verification of Object.values(store().itemVerification)) expect(verification).toEqual(NO_VERIFICATION);
    expect(LIFECYCLE_LABELS.released_to_pricing.pharmacy).toBe("Verified and released to pricing (synthetic)");
    expect(LIFECYCLE_LABELS.released_to_pricing.nhsbsa.on).toBe("Verified, released to existing pricing, no operator action");
    const original = getDomainSnapshot();
    expect(() => store().releaseToPricing("SYN-FQ123-TYPE2", "Human checked this item")).toThrow("Both verification gates");
    expect(getDomainSnapshot()).toEqual(original);
  });

  it("applies a valid operator suggestion as a human draft and history event, not a decision", () => {
    const id = "EX-24112";
    store().submitItem({ caseId: id, channel: "eps", endorsementText: "NCSO RK" });
    store().arriveInQueue(id);
    const before = getDomainSnapshot();
    expect(() => store().applySuggestionToDecision(id)).toThrow("off");
    store().setAgentEnabled(true);
    store().applySuggestionToDecision(id);
    expect(store().operatorDrafts[id]).toMatchObject({ outcome: "REFER_BACK", rbCode: "SYN-NCSO", appliedSuggestion: true });
    expect(store().lifecycles[id].state).toBe("in_review");
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({
      actor: "operator", from: "in_review", to: "in_review", processStep: "suggestion_applied",
    });
    expect(store().records).toEqual(before.records);
    expect(store().caseRevisions).toEqual(before.caseRevisions);
    expect(store().itemVerification).toEqual(before.itemVerification);
  });

  it("uses explicit pharmacy drafts and rejects stale or absent resubmission", () => {
    const id = "EX-24112";
    expect(() => store().resubmit(id)).toThrow("current pharmacy correction draft");
    const revision = store().caseRevisions[id].at(-1)!;
    expect(() => store().setPharmacyDraft(id, { revision: 0, endorsementText: "NCSO RK 21/08/26" })).toThrow("stale");
    store().setPharmacyDraft(id, { revision: revision.number, endorsementText: "NCSO RK 21/08/26" });
    expect(store().caseRevisions[id].at(-1)).toBe(revision);
    store().resubmit(id);
    expect(store().caseRevisions[id].at(-1)).toMatchObject({ number: revision.number + 1, kind: "resubmission", endorsementText: "NCSO RK 21/08/26" });
    expect(store().lifecycles[id].state).toBe("resubmitted");
    expect(store().lifecycles[id].history.at(-1)?.actor).toBe("pharmacy");
    expect(() => store().resubmit(id)).toThrow("current pharmacy correction draft");
  });

  it("resets new drafts, verification and demo mode while preserving perspective", () => {
    store().setDemoStep(4);
    store().setPerspective("pharmacy");
    store().setPharmacyDraft("EX-24112", { revision: store().caseRevisions["EX-24112"].at(-1)!.number, endorsementText: "NCSO RK 21/08/26" });
    store().resetDemo();
    expect(store().demoStep).toBeNull();
    expect(store().operatorDrafts).toEqual({});
    expect(store().pharmacyDrafts).toEqual({});
    expect(Object.values(store().itemVerification).every((v) => v.gate1 === "none" && v.gate2 === "none" && !v.released)).toBe(true);
    expect(store().perspective).toBe("pharmacy");
    expect(store().agentEnabled).toBe(false);
  });

  it("reserves no-operator wording for automatic verification, not human releases", () => {
    const row: CaseLifecycle = {
      caseId: "EX-24112", pharmacyCode: "FQ123", state: "released_to_pricing",
      history: [{ at: "2026-09-14T12:00:00Z", actor: "operator", from: "in_review", to: "released_to_pricing",
        message: "Human release", releaseOrigin: "human_decision" }],
    };
    expect(itemStateLabel(row, "nhsbsa", true)).toContain("after operator review");
    expect(itemStateLabel(row, "pharmacy")).not.toContain("no operator action");
    const automatic: CaseLifecycle = { ...row, history: [{ ...row.history[0], actor: "code", releaseOrigin: "automatic_verification" }] };
    expect(itemStateLabel(automatic, "nhsbsa", true)).toBe("Verified, released to existing pricing, no operator action");
  });
});
