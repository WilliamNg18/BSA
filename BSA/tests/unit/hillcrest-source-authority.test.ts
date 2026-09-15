import { beforeEach, describe, expect, it } from "vitest";
import { CASES, caseById } from "../../src/lib/domain/cases";
import { createEpsPrescription } from "../../src/lib/domain/eps-check";
import { runAgent } from "../../src/lib/domain/agent";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
const A = CASES[0], B = caseById("EX-24112")!, D = caseById("EX-24123")!;
beforeEach(() => store().resetDemo());

describe("reviewed source authority boundaries", () => {
  it.each(["ESCALATE", "REQUEST_INFORMATION", "REFER_BACK"] as const)("retains review authority after a human %s disposition", (decision) => {
    for (const enabled of [false, true]) {
      store().resetDemo();
      const id = B.id;
      store().setAgentEnabled(enabled);
      store().arriveInQueue(id);
      store().recordType2Decision({ caseId: id, decision, reason: "Further human review of corrected evidence is required.", rbCode: "SYN-NCSO" });
      const pack = runAgent(sessionCase(id)!, { agentEnabled: enabled });
      expect(sessionCase(id)?.requiresHumanRecheck).toBe(true);
      expect(pack.state).not.toBe("cleared_by_rules");
      expect(pack.trace.map((step) => step.summary).join(" ")).not.toContain("no person involved");
      expect(store().lifecycles[id].state).not.toBe("paid");
      expect(store().itemProcesses[id].routing.pricingAuthority).toBeNull();
    }
  });
  it("a newly declared generic paper product cannot price as its nongeneric template", () => {
    const id = "SYN-FQ123-MISMATCH";
    store().submitItem({ caseId: id, channel: "paper", endorsementText: "", paperDeclaration: {
      typedProduct: "SYN-AMOX500-GENERIC-21", quantity: 21, dispensingDate: "2026-08-11",
      endorsementText: "", declaredByPharmacy: true,
    } });
    expect(store().itemProcesses[id].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: true, pricingAuthority: null });
    expect(store().lifecycles[id].state).toBe("submitted");
    expect(runAgent(sessionCase(id)!)).not.toMatchObject({ state: "cleared_by_rules" });
    store().confirmType1({ caseId: id, revision: store().caseRevisions[id].at(-1)!.number, provenance: "human_capture", declarationReconciled: true,
      fields: { productCode: "SYN-AMOX500-GENERIC-21", quantity: 21, endorsementText: "", prescriber: "Dr Demo (synthetic)" } });
    expect(() => store().recordType2Decision({ caseId: id, decision: "ACCEPT", reason: "Supply evidence still missing on paper." })).toThrow();
    expect(store().lifecycles[id].state).toBe("in_review");
  });

  it("omitting both source payloads cannot change the generic item's prescribed identity", () => {
    const id = B.id;
    store().submitItem({ caseId: id, channel: "paper", endorsementText: "" });
    expect(sessionCase(id)?.extracted.productCode).toBe("SYN-AMOX500-GENERIC-21");
    expect(store().itemProcesses[id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
    expect(store().lifecycles[id].state).toBe("submitted");
  });

  it("rejects incompatible prescribed and dispensed products rather than erasing the discrepancy", () => {
    const original = createEpsPrescription(A);
    const prescription = { ...original, claimMessageState: "submitted" as const,
      items: [{ ...original.items[0], dispensedCode: "SYN-LEVO100-28", dispensedName: "Levothyroxine 100mcg tablets" }] };
    const before = getDomainSnapshot();
    expect(() => store().submitItem({ caseId: A.id, channel: "eps", endorsementText: prescription.dispenserEndorsement, epsPrescription: prescription })).toThrow(/product|substitut/i);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("legacy replay retains the actual immutable paper date rather than the original template date", () => {
    const declaration = { typedProduct: "Co-codamol 30/500 tablets", quantity: 100, endorsementText: "NCSO JB 27/07/26",
      dispensingDate: "2026-07-27", declaredByPharmacy: true as const };
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: declaration.endorsementText, paperDeclaration: declaration });
    const previous = store().caseRevisions[D.id].at(-1)!;
    store().submitFromPharmacy(D.id, declaration.endorsementText);
    expect(store().caseRevisions[D.id].at(-1)?.paperDeclaration).toEqual(declaration);
    expect(sessionCase(D.id)?.extracted.dispensingDate).toBe("2026-07-27");
    expect(store().caseRevisions[D.id].at(-2)).toEqual(previous);
    const retained = store().caseRevisions[D.id].at(-1)!;
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: declaration.endorsementText, declaration: retained.declaration });
    expect(store().caseRevisions[D.id].at(-1)?.paperDeclaration).toEqual(declaration);
    expect(sessionCase(D.id)?.extracted.dispensingDate).toBe("2026-07-27");
  });

  it("an explicit new Off paper submission does not inherit prior declaration or capture authority", () => {
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: "NCSO JB 27/07/26", paperDeclaration: {
      typedProduct: "Co-codamol 30/500 tablets", quantity: 100, endorsementText: "NCSO JB 27/07/26",
      dispensingDate: "2026-07-27", declaredByPharmacy: true,
    } });
    const previous = store().caseRevisions[D.id].at(-1)!;
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: "" });
    expect(store().caseRevisions[D.id].at(-1)?.paperDeclaration).toBeUndefined();
    expect(store().caseRevisions[D.id].at(-1)?.declaration).toBeUndefined();
    expect(sessionCase(D.id)?.capturedEvidence).toBeUndefined();
    expect(store().itemProcesses[D.id].routing.outcome).toBe("type1_capture");
    expect(store().caseRevisions[D.id].at(-2)).toEqual(previous);
  });

  it.each([false, true])("the pending human recheck is also authoritative in its agent pack, enabled=%s", (enabled) => {
    const id = B.id;
    store().setAgentEnabled(enabled);
    store().arriveInQueue(id);
    expect(store().itemProcesses[id].routing.requiresHuman).toBe(true);
    const pack = runAgent(sessionCase(id)!, { agentEnabled: enabled });
    expect(pack.state).not.toBe("cleared_by_rules");
    expect(store().caseStates[id]).not.toBe("cleared_by_rules");
    expect(pack.trace.map((step) => step.summary).join(" ")).not.toContain("no person involved");
    if (enabled) expect(pack).toMatchObject({ recommendation: "SUFFICIENT", gate: { result: "PASS" }, agentInvoked: true });
    else expect(pack).toMatchObject({ recommendation: "NONE", agentInvoked: false });
    store().releaseToPricing(id, "Human checked the corrected paper source.");
    expect(store().lifecycles[id].state).toBe("released_to_pricing");
    expect(store().itemProcesses[id].releaseOrigin).toBe("human_decision");
    expect(store().caseRevisions[id].at(-1)?.paperDeclaration?.brandManufacturer).toBe(B.pharmacySupplyRecord!.brandManufacturer);
    const completed = runAgent(sessionCase(id)!, { agentEnabled: enabled });
    expect(completed.state).not.toBe("cleared_by_rules");
    expect(completed.trace.map((step) => step.summary).join(" ")).not.toContain("no person involved");
  });
});
