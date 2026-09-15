import { beforeEach, describe, expect, it } from "vitest";
import { CASES, caseById } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { capturedFieldsMatchSources, compatibleCapture } from "../../src/lib/domain/capture-evidence";
import { prepareCaptureConfirmation, preparePaperCapture } from "../../src/lib/domain/paper-capture";
import { getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";
import type { PaperCaptureDraft } from "../../src/lib/domain/paper-capture";
import type { PharmacyDeclaration } from "../../src/lib/domain/types";

const C = CASES[2], D = caseById("EX-24123")!, B = caseById("EX-24112")!;
const store = () => useAppStore.getState();
const completeD: PaperCaptureDraft = {
  productCode: D.claim.productCode,
  quantity: String(D.claim.quantity),
  endorsementText: "NCSO JB 27/08/26",
  prescriber: "Dr Example (synthetic)",
};

beforeEach(() => store().resetDemo());

function manualConfirmation(caseId: string, fields: PaperCaptureDraft) {
  const prepared = prepareCaptureConfirmation({
    caseId, revision: store().itemProcesses[caseId].revision,
    ...preparePaperCapture(false), fields, declarationReconciled: false,
  });
  if (!prepared.input) throw new Error("Expected valid manual capture preparation.");
  expect(prepared.input).toMatchObject({ provenance: "human_capture", declarationReconciled: false });
  return prepared.input;
}

describe("Type 1 manual capture retains a separate human release", () => {
  it.each([false, true])("fully keyed D never auto-prices with Agent=%s and no declaration or checkbox", (agentEnabled) => {
    store().setAgentEnabled(agentEnabled);
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: completeD.endorsementText });
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: true });
    const revisions = store().caseRevisions[D.id];
    const history = structuredClone(store().lifecycles[D.id].history);
    const records = store().records;
    const input = manualConfirmation(D.id, completeD);

    store().confirmType1(input);

    expect(store().itemProcesses[D.id].routing).toMatchObject({
      outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null,
    });
    expect(store().lifecycles[D.id].state).toBe("in_review");
    expect(store().caseStates[D.id]).not.toBe("cleared_by_rules");
    expect(capturedFieldsMatchSources(sessionCase(D.id)!)).toBe(true);
    expect(compatibleCapture(sessionCase(D.id)!)).toBe(false);
    expect(getReleaseEligibility(D.id).allowed).toBe(!agentEnabled);
    expect(store().records).toBe(records);
    expect(store().caseRevisions[D.id]).toBe(revisions);
    expect(store().lifecycles[D.id].history.slice(0, history.length)).toEqual(history);
    expect(store().lifecycles[D.id].history.filter((event) => event.capture).at(-1)?.capture).toMatchObject({
      revision: input.revision, fields: input.fields, provenance: "human_capture", declarationReconciled: false,
    });
    expect(store().lifecycles[D.id].history.at(-1)?.message).not.toContain("no person involved");
  });

  it("routes explicitly reconciled D declaration to human release, not automatic pricing", () => {
    store().setAgentEnabled(true);
    const declaration: PharmacyDeclaration = {
      fields: { ...completeD, quantity: D.claim.quantity },
      declaredAt: "2026-09-13T10:00:00Z", provenance: "pharmacy_declaration",
    };
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: completeD.endorsementText, declaration });
    const prepared = preparePaperCapture(true, declaration);
    const context = { caseId: D.id, revision: store().itemProcesses[D.id].revision, ...prepared, declaration };
    expect(prepareCaptureConfirmation({ ...context, declarationReconciled: false }).input).toBeNull();
    const confirmed = prepareCaptureConfirmation({ ...context, declarationReconciled: true });
    if (!confirmed.input) throw new Error("Expected reconciled declaration preparation.");
    store().confirmType1(confirmed.input);
    expect(store().itemProcesses[D.id].routing).toMatchObject({
      outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null,
    });
    expect(store().lifecycles[D.id].state).toBe("in_review");
    store().releaseToPricing(D.id, "Human checked the reconciled paper declaration.");
    expect(store().lifecycles[D.id].state).toBe("released_to_pricing");
    expect(store().itemProcesses[D.id].releaseOrigin).toBe("human_decision");
  });

  it("does not permit an unreconciled pharmacy declaration to use the manual path", () => {
    const declaration: PharmacyDeclaration = {
      fields: { ...completeD, quantity: D.claim.quantity },
      declaredAt: "2026-09-13T10:00:00Z", provenance: "pharmacy_declaration",
    };
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: completeD.endorsementText, declaration });
    store().confirmType1({
      caseId: D.id, revision: store().itemProcesses[D.id].revision,
      fields: declaration.fields, provenance: "pharmacy_declaration", declarationReconciled: false,
    });
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
    expect(store().lifecycles[D.id].state).toBe("in_review");
  });

  it.each([
    { endorsementText: "NCSO RK" },
    { endorsementText: "BB RK" },
    { quantity: "29" },
    { quantity: "" },
    { productCode: "" },
    { productCode: "SYN-UNKNOWN" },
    { prescriber: "Illegible" },
  ])("keeps unresolved manually keyed evidence in Type 2: %j", (patch) => {
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: completeD.endorsementText });
    store().confirmType1(manualConfirmation(D.id, { ...completeD, ...patch }));
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
    expect(store().lifecycles[D.id].state).toBe("in_review");
  });

  it("keeps complete manual D in Type 2 and preserves its unreconciled agent abstention", () => {
    store().setAgentEnabled(true);
    const original = structuredClone(D);
    const fields = {
      productCode: D.claim.productCode, quantity: String(D.claim.quantity),
      endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)",
    };
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: "" });
    store().confirmType1(manualConfirmation(D.id, fields));
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation: "ABSTAIN", gate: { result: "NOT_RUN" } });
    expect(sessionCase(D.id)).toMatchObject({ extracted: original.extracted, regions: original.regions, readings: original.readings, imageQuality: 0.31 });
  });

  it("preserves C's conflict and rejects capture outside the Type 1 lane", () => {
    const original = structuredClone(C);
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: B.paperDeclaration!.endorsementText, paperDeclaration: B.paperDeclaration });
    expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    const before = getDomainSnapshot();
    expect(() => store().confirmType1(manualConfirmation(B.id, completeD))).toThrow("current awaiting Type 1 revision");
    expect(getDomainSnapshot()).toEqual(before);
    expect(runAgent(C)).toMatchObject({ recommendation: "REQUEST_INFORMATION", conflicts: [
      expect.objectContaining({ field: "Quantity", material: true }),
    ] });
    expect(sessionCase(C.id)).toBeNull();
    expect(C).toEqual(original);
  });
});
