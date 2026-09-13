import { beforeEach, describe, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { capturedFieldsMatchSources, compatibleCapture } from "../../src/lib/domain/capture-evidence";
import { prepareCaptureConfirmation, preparePaperCapture } from "../../src/lib/domain/paper-capture";
import { sessionCase, useAppStore } from "../../src/lib/store";
import type { PaperCaptureDraft } from "../../src/lib/domain/paper-capture";
import type { PharmacyDeclaration } from "../../src/lib/domain/types";

const [, B, C, D] = CASES;
const store = () => useAppStore.getState();
const completeB: PaperCaptureDraft = {
  productCode: B.claim.productCode,
  quantity: String(B.claim.quantity),
  endorsementText: "NCSO RK 21/08/26",
  prescriber: B.extracted.prescriber,
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

describe("Type 1 manual capture routes as read without declaration reconciliation", () => {
  it.each([false, true])("completes fully keyed B with Agent=%s and no declaration or checkbox", (agentEnabled) => {
    store().setAgentEnabled(agentEnabled);
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: completeB.endorsementText });
    expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: true });
    const revisions = store().caseRevisions[B.id];
    const history = structuredClone(store().lifecycles[B.id].history);
    const records = store().records;
    const input = manualConfirmation(B.id, completeB);

    store().confirmType1(input);

    expect(store().itemProcesses[B.id].routing).toMatchObject({
      outcome: "type1_capture", requiresHuman: false, pricingAuthority: "existing_rules_engine",
    });
    expect(store().lifecycles[B.id].state).toBe("paid");
    expect(store().caseStates[B.id]).toBe("cleared_by_rules");
    expect(capturedFieldsMatchSources(sessionCase(B.id)!)).toBe(true);
    expect(compatibleCapture(sessionCase(B.id)!)).toBe(false);
    expect(store().records).toBe(records);
    expect(store().caseRevisions[B.id]).toBe(revisions);
    expect(store().lifecycles[B.id].history.slice(0, history.length)).toEqual(history);
    expect(store().lifecycles[B.id].history.slice(-2).map((event) => event.actor)).toEqual(["operator", "code"]);
    expect(store().lifecycles[B.id].history.at(-2)?.capture).toMatchObject({
      revision: input.revision, fields: input.fields, provenance: "human_capture", declarationReconciled: false,
    });
    expect(store().lifecycles[B.id].history.at(-1)?.message).not.toContain("no person involved");
  });

  it("routes explicitly reconciled B declaration to the same completed Type 1 outcome", () => {
    store().setAgentEnabled(true);
    const declaration: PharmacyDeclaration = {
      fields: { ...completeB, quantity: B.claim.quantity },
      declaredAt: "2026-09-13T10:00:00Z", provenance: "pharmacy_declaration",
    };
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: completeB.endorsementText, declaration });
    const prepared = preparePaperCapture(true, declaration);
    const context = { caseId: B.id, revision: store().itemProcesses[B.id].revision, ...prepared, declaration };
    expect(prepareCaptureConfirmation({ ...context, declarationReconciled: false }).input).toBeNull();
    const confirmed = prepareCaptureConfirmation({ ...context, declarationReconciled: true });
    if (!confirmed.input) throw new Error("Expected reconciled declaration preparation.");
    store().confirmType1(confirmed.input);
    expect(store().itemProcesses[B.id].routing).toMatchObject({
      outcome: "type1_capture", requiresHuman: false, pricingAuthority: "existing_rules_engine",
    });
    expect(store().lifecycles[B.id].state).toBe("paid");
  });

  it("does not permit an unreconciled pharmacy declaration to use the manual path", () => {
    const declaration: PharmacyDeclaration = {
      fields: { ...completeB, quantity: B.claim.quantity },
      declaredAt: "2026-09-13T10:00:00Z", provenance: "pharmacy_declaration",
    };
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: completeB.endorsementText, declaration });
    store().confirmType1({
      caseId: B.id, revision: store().itemProcesses[B.id].revision,
      fields: declaration.fields, provenance: "pharmacy_declaration", declarationReconciled: false,
    });
    expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
    expect(store().lifecycles[B.id].state).toBe("in_review");
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
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: completeB.endorsementText });
    store().confirmType1(manualConfirmation(B.id, { ...completeB, ...patch }));
    expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
    expect(store().lifecycles[B.id].state).toBe("in_review");
  });

  it("keeps complete manual D in Type 2 and preserves its unreconciled agent abstention", () => {
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
    store().submitItem({ caseId: C.id, channel: "paper", endorsementText: C.extracted.endorsementText });
    expect(store().itemProcesses[C.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(() => store().confirmType1(manualConfirmation(C.id, {
      productCode: C.claim.productCode, quantity: String(C.claim.quantity),
      endorsementText: C.extracted.endorsementText, prescriber: C.extracted.prescriber,
    }))).toThrow("current awaiting Type 1 revision");
    expect(runAgent(sessionCase(C.id)!).recommendation).toBe("REQUEST_INFORMATION");
    expect(C).toEqual(original);
  });
});
