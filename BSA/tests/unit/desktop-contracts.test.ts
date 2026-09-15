import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { itemStateLabel, LIFECYCLE_LABELS, NO_VERIFICATION, type CaseLifecycle } from "../../src/lib/domain/lifecycle";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { caseById } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";

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

  it("retains recorded seed verification without inventing verification for unperformed items", () => {
    expect(Object.keys(store().itemVerification).sort()).toEqual(Object.keys(store().lifecycles).sort());
    for (const id of ["EX-24107", "EX-24123"]) expect(store().itemVerification[id]).toEqual(NO_VERIFICATION);
    expect(store().itemVerification["EX-24112"]).toEqual({ gate1: "pass", gate2: "pass", reconciled: true, released: false });
    expect(store().itemVerification["SYN-FQ123-MISMATCH"]).toEqual({ gate1: "fail", gate2: "fail", reconciled: false, released: false });
    expect(LIFECYCLE_LABELS.released_to_pricing.pharmacy).toBe("Verified and released to pricing (synthetic)");
    expect(LIFECYCLE_LABELS.released_to_pricing.nhsbsa.on).toBe("Verified, released to existing pricing, no operator action");
    const original = getDomainSnapshot();
    expect(() => store().releaseToPricing("SYN-FQ123-MISMATCH", "Human checked this item")).toThrow(/referred_back/);
    expect(getDomainSnapshot()).toEqual(original);
  });

  it("applies a valid operator suggestion as a human draft and history event, not a decision", () => {
    const id = "EX-24112";
    const paperDeclaration = caseById(id)!.paperDeclaration!;
    store().submitItem({ caseId: id, channel: "paper", endorsementText: paperDeclaration.endorsementText, paperDeclaration });
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
    store().arriveInQueue(id);
    store().referBack(id, "RB2B", buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
    const revision = store().caseRevisions[id].at(-1)!;
    expect(() => store().setPharmacyDraft(id, { revision: 0, endorsementText: "NCSO RK 21/08/26" })).toThrow("stale");
    store().setPharmacyDraft(id, { ...initialisePharmacyDraft(caseById(id)!, revision), purpose: "correction" });
    expect(store().caseRevisions[id].at(-1)).toBe(revision);
    expect(() => store().resubmit(id)).toThrow("must be checked");
    store().setCorrectionAcknowledgement(id, revision.number, true);
    store().resubmit(id);
    expect(store().caseRevisions[id].at(-1)).toMatchObject({ number: revision.number + 1, kind: "resubmission", endorsementText: "NCSO RK 21/08/26" });
    expect(store().lifecycles[id].state).toBe("resubmitted");
    expect(store().lifecycles[id].history).toContainEqual(expect.objectContaining({ actor: "pharmacy", processStep: "correction_acknowledged" }));
    expect(() => store().resubmit(id)).toThrow("current pharmacy correction draft");
  });

  it("resets new drafts, verification and demo mode while preserving perspective", () => {
    const initial = getDomainSnapshot();
    store().setDemoStep(4);
    store().setPerspective("pharmacy");
    store().setPharmacyDraft("EX-24112", { revision: store().caseRevisions["EX-24112"].at(-1)!.number, endorsementText: "NCSO RK 21/08/26" });
    store().resetDemo();
    expect(store().demoStep).toBeNull();
    expect(store().operatorDrafts).toEqual(initial.operatorDrafts);
    expect(store().pharmacyDrafts).toEqual({});
    expect(store().itemVerification).toEqual(initial.itemVerification);
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
    const unverified: CaseLifecycle = { ...row, history: [{ ...row.history[0], actor: "code", releaseOrigin: "automatic_verification" }] };
    expect(itemStateLabel(unverified, "nhsbsa", true)).toBe("Release recorded; verification provenance unavailable (synthetic)");
    const id = "EX-24107";
    store().setAgentEnabled(true);
    store().submitItem({ caseId: id, channel: "eps", endorsementText: store().caseRevisions[id][0].endorsementText });
    const automatic = store().lifecycles[id];
    expect(automatic.history.at(-1)).toMatchObject({
      actor: "code", releaseOrigin: "automatic_verification",
      verification: { gate1: "pass", gate2: "pass", reconciled: true, released: true },
    });
    expect(itemStateLabel(automatic, "nhsbsa", true)).toBe("Verified, released to existing pricing, no operator action");
  });
});
