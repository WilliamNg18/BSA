import { beforeEach, describe, expect, it } from "vitest";
import { endFollowVisit, followDestination, resolveFollowVisit, useFollowVisit, visitFollowedCase } from "../../src/lib/follow-navigation";
import { getDomainSnapshot, useAppStore, type Perspective } from "../../src/lib/store";

const store = () => useAppStore.getState();
const id = "EX-24123";
beforeEach(() => {
  store().resetDemo();
  store().setPerspective("both");
  endFollowVisit();
});

describe("explicit same-item follow navigation", () => {
  it.each(["pharmacy", "nhsbsa", "both"] as const)("resolves both destinations from %s without a hidden route", (perspective) => {
    for (const side of ["pharmacy", "nhsbsa"] as const) {
      const result = resolveFollowVisit(perspective, side, null);
      expect(result.perspective).toBe(perspective === side ? side : "both");
      expect(result.origin).toBe(perspective === "both" || perspective === side ? null : perspective);
    }
  });

  it("encodes the identical item in both destination forms", () => {
    expect(followDestination("pharmacy", "SYN /?&")).toBe("/pharmacy/claims?case=SYN%20%2F%3F%26");
    expect(followDestination("nhsbsa", "SYN /?&")).toBe("/case/SYN%20%2F%3F%26");
  });

  it.each([false, true])("preserves action-produced evidence and drafts, Agent=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    const seed = store().caseRevisions[id].at(-1)!;
    store().submitItem({ caseId: id, channel: "paper", endorsementText: seed.paperDeclaration!.endorsementText,
      declaration: seed.declaration, paperDeclaration: seed.paperDeclaration });
    store().confirmType1({ caseId: id, revision: store().caseRevisions[id].at(-1)!.number,
      fields: seed.declaration!.fields, provenance: "pharmacy_declaration", declarationReconciled: true });
    store().referBack(id, "RB2B", "Human requires reconciled presentation evidence.");
    store().setDemoStep(10);
    store().followCase(id);
    store().setPharmacyDraft(id, { revision: store().caseRevisions[id].at(-1)!.number, endorsementText: "NCSO JB 27/08/26" });
    const before = getDomainSnapshot();
    const drafts = store().pharmacyDrafts;
    const verification = store().itemVerification;
    const references = [store().lifecycles, store().caseRevisions, store().itemProcesses, store().operatorDrafts];
    for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      store().setPerspective(perspective);
      for (const side of ["pharmacy", "nhsbsa", "pharmacy"] as const) {
        expect(visitFollowedCase(side)).toBe(followDestination(side, id));
        expect(store().followedCaseId).toBe(id);
        expect(store().demoStep).toBe(10);
        expect(store().agentEnabled).toBe(enabled);
        expect(getDomainSnapshot()).toEqual(before);
        expect(store().pharmacyDrafts).toBe(drafts);
        expect(store().itemVerification).toBe(verification);
        [store().lifecycles, store().caseRevisions, store().itemProcesses, store().operatorDrafts]
          .forEach((reference, index) => expect(reference).toBe(references[index]));
      }
    }
  });

  it.each(["pharmacy", "nhsbsa"] as const)("restores %s only on the explicit return visit", (origin) => {
    const other = origin === "pharmacy" ? "nhsbsa" : "pharmacy";
    store().followCase(id);
    store().setPerspective(origin);
    visitFollowedCase(other);
    expect(store().perspective).toBe("both");
    expect(useFollowVisit.getState().temporary).toEqual({ caseId: id, origin });
    store().setAgentEnabled(true);
    store().setDemoStep(9);
    visitFollowedCase(other);
    expect(store().perspective).toBe("both");
    visitFollowedCase(origin);
    expect(store().perspective).toBe(origin);
    expect(useFollowVisit.getState().temporary).toBeNull();
  });

  it.each(["both", "pharmacy", "nhsbsa"] satisfies Perspective[])("honours an explicit %s choice instead of restoring the old perspective", (choice) => {
    store().followCase(id);
    store().setPerspective("pharmacy");
    visitFollowedCase("nhsbsa");
    endFollowVisit();
    store().setPerspective(choice);
    visitFollowedCase(choice === "nhsbsa" ? "nhsbsa" : "pharmacy");
    expect(store().perspective).toBe(choice);
    expect(useFollowVisit.getState().temporary).toBeNull();
  });

  it("clears temporary context on dismissal, a new followed item and Reset", () => {
    for (const change of [() => store().followCase(null), () => store().followCase("EX-24112"), () => store().resetDemo()]) {
      store().followCase(id);
      store().setPerspective("pharmacy");
      visitFollowedCase("nhsbsa");
      change();
      expect(useFollowVisit.getState().temporary).toBeNull();
    }
  });

  it("rejects navigation without a followed item and retains ordinary mode", () => {
    expect(() => visitFollowedCase("pharmacy")).toThrow("Follow an existing item");
    store().followCase(id);
    visitFollowedCase("nhsbsa");
    expect(store().demoStep).toBeNull();
  });
});
