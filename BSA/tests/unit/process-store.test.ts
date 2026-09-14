import { beforeEach, describe, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { routeSubmission, routingFactsForCase } from "../../src/lib/domain/routing";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { usePharmacyStore } from "../../src/lib/pharmacy-store";
import { useQueueStore } from "../../src/lib/queue-store";
import { caseForLifecycle } from "../../src/lib/domain/lifecycle-model";
import type { DeclaredItemFields, RoutingFacts } from "../../src/lib/domain/types";

const [A, B, C, D, E, F] = CASES;
const store = () => useAppStore.getState();
const fields: DeclaredItemFields = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)" };
beforeEach(() => store().resetDemo());

function submitD(captured = fields, reconciled = true) {
  store().submitItem({ caseId: D.id, channel: "paper", endorsementText: captured.endorsementText,
    declaration: { fields: captured, declaredAt: "2026-09-13T10:00:00Z", provenance: "pharmacy_declaration" } });
  store().confirmType1({ caseId: D.id, revision: store().itemProcesses[D.id].revision, fields: captured,
    provenance: "pharmacy_declaration", declarationReconciled: reconciled });
}

describe("canonical deterministic routing", () => {
  it.each([A, E])("$scenario automatically prices without any human or model", (c) => {
    for (const enabled of [false, true]) {
      store().setAgentEnabled(enabled);
      store().submitItem({ caseId: c.id, channel: "eps", endorsementText: c.extracted.endorsementText });
      expect(store().itemProcesses[c.id].routing).toMatchObject({ outcome: "auto_priced", requiresHuman: false, pricingAuthority: "existing_rules_engine" });
      expect(store().lifecycles[c.id].state).toBe(enabled ? "released_to_pricing" : "paid");
      expect(store().lifecycles[c.id].history.some((event) => event.actor === "operator")).toBe(false);
      expect(runAgent(sessionCase(c.id)!).agentInvoked).toBe(false);
      expect(() => store().recordType2Decision({ caseId: c.id, decision: "ACCEPT", reason: "Not an operator item" })).toThrow();
    }
  });
  it("B August refers, July is sufficient; C conflict and F historical decision survive", () => {
    expect(runAgent(B).recommendation).toBe("REFER_BACK");
    expect(runAgent(B, { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
    expect(runAgent(C).recommendation).toBe("REQUEST_INFORMATION");
    expect(store().records[0]).toMatchObject({ caseId: F.id, id: "DR-000871" });
    expect(routeSubmission(routingFactsForCase(B, "eps")).outcome).toBe("type2_endorsement");
    expect(routeSubmission(routingFactsForCase(B, "paper")).outcome).toBe("type1_capture");
  });
  it("does not use perspective or agent in the pure function", () => {
    const facts = routingFactsForCase(A, "eps");
    expect(routeSubmission({ ...facts, type2Decision: "insufficient" }).outcome).toBe("referred_back");
    expect(routeSubmission({ ...facts, hasConflict: true }).outcome).toBe("type2_endorsement");
    expect(() => routeSubmission({ ...facts, readable: "yes" } as unknown as RoutingFacts)).toThrow();
  });
  it.each(["Illegible", "", "   "])("does not automatically price missing mandatory prescriber %j", (prescriber) => {
    const missing = { ...A, extracted: { ...A.extracted, prescriber } };
    expect(routeSubmission(routingFactsForCase(missing, "eps"))).toMatchObject({ outcome: "type2_endorsement", pricingAuthority: null, requiresHuman: true });
    expect(runAgent(missing)).toMatchObject({ agentInvoked: true, gate: { result: "FAIL" } });
  });
  it.each(["BB RK", "BB RK 21/08/26", "XP RK", "XP RK 21/08/26"])("routes %s to interpretation rather than automatic pricing", (endorsementText) => {
    for (const enabled of [false, true]) {
      store().setAgentEnabled(enabled);
      store().submitItem({ caseId: B.id, channel: "eps", endorsementText });
      expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
      expect(store().lifecycles[B.id].state).toBe("submitted");
      expect(store().lifecycles[B.id].history.at(-1)?.processStep).toBe(enabled ? "verification" : "submission");
    }
  });
  it("keeps interpretation work in Type 2 even when the base product needs no endorsement", () => {
    const facts = routingFactsForCase({ ...E, extracted: { ...E.extracted, endorsementText: "BB RK" } }, "eps");
    expect(facts).toMatchObject({ endorsementRequired: false, endorsementPresent: true, interpretationRequired: true });
    expect(routeSubmission(facts)).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null });
  });
});

describe("explicit captured authority", () => {
  it("seeds D with a proposed declaration but never preconfirms or repairs the scan", () => {
    expect(store().caseRevisions[D.id][0].declaration?.fields).toEqual({
      productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26",
    });
    expect(store().caseRevisions[D.id][0].declaration?.fields.prescriber).toBeUndefined();
    expect(store().itemProcesses[D.id].capture).toBeNull();
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: true });
    store().setAgentEnabled(true);
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation: "ABSTAIN", gate: { result: "NOT_RUN" } });
    expect(store().lifecycles[D.id].history.some((event) => event.capture)).toBe(false);
  });
  it("builds D from reconciled human-confirmed declaration without repairing image evidence", () => {
    const original = structuredClone(D);
    expect(runAgent(D).recommendation).toBe("ABSTAIN");
    submitD();
    const c = sessionCase(D.id)!;
    const pack = runAgent(c);
    expect(c.imageQuality).toBe(0.31);
    expect(c.extracted).toEqual(original.extracted);
    expect(c.regions).toEqual(original.regions);
    expect(c.readings).toEqual(original.readings);
    expect(pack).toMatchObject({ recommendation: "SUFFICIENT", gate: { result: "PASS" }, signals: { imageQuality: 0.31 } });
    expect(pack.evidence.filter((e) => e.id.startsWith("e-captured-")).every((e) => e.origin === "Declared by the pharmacy, not read from the form")).toBe(true);
    expect(store().itemProcesses[D.id].routing.outcome).toBe("type2_endorsement");
    expect(store().lifecycles[D.id].state).toBe("in_review");
    expect(D).toEqual(original);
  });
  it.each([false, true])("unreconciled or conflicting capture abstains, conflict=%s", (conflict) => {
    submitD(conflict ? { ...fields, quantity: 99 } : fields, conflict);
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation: "ABSTAIN", gate: { result: "NOT_RUN" } });
  });
  it("missing mandatory prescriber withholds advice, never supplies a guessed value", () => {
    submitD({ ...fields, prescriber: null });
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation: "ABSTAIN", gate: { result: "NOT_RUN" } });
    expect(sessionCase(D.id)!.extracted.prescriber).toBe("Illegible");
  });
  it("rejects stale captures and requires a human RB code/reason", () => {
    submitD();
    expect(() => store().confirmType1({ caseId: D.id, revision: 1, fields, provenance: "human_capture", declarationReconciled: true })).toThrow();
    expect(() => store().recordType2Decision({ caseId: D.id, decision: "REFER_BACK", reason: "Missing presentation" })).toThrow(/RB code/);
    store().recordType2Decision({ caseId: D.id, decision: "REFER_BACK", reason: "Missing presentation", rbCode: "RB2B" });
    expect(store().itemProcesses[D.id]).toMatchObject({ rbCode: "RB2B", routing: { outcome: "referred_back" } });
    expect(store().records.at(-1)).toMatchObject({ rbCode: "RB2B", revision: 2 });
  });
  it("new submission clears capture authority and keeps the earlier revision immutable", () => {
    submitD();
    const before = store().caseRevisions[D.id][1];
    const capture = structuredClone(store().itemProcesses[D.id].capture);
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: fields.endorsementText });
    expect(store().itemProcesses[D.id].capture).toBeNull();
    expect(sessionCase(D.id)!.capturedEvidence).toBeUndefined();
    expect(store().caseRevisions[D.id][1]).toEqual(before);
    expect(runAgent(sessionCase(D.id)!).recommendation).toBe("ABSTAIN");
    expect(store().lifecycles[D.id].history.find((event) => event.capture)?.capture).toEqual(capture);
    const historical = caseForLifecycle(D.id, store().lifecycles, { [D.id]: store().caseRevisions[D.id].slice(0, 2) });
    expect(runAgent(historical!).recommendation).toBe("SUFFICIENT");
  });

  it.each(["submitFromPharmacy", "resubmitFromPharmacy"] as const)("retains a paper channel across %s and requires capture again", (action) => {
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: B.extracted.endorsementText });
    store().confirmType1({ caseId: B.id, revision: 2, fields: { productCode: B.extracted.productCode, quantity: B.extracted.quantity, endorsementText: B.extracted.endorsementText },
      provenance: "human_capture", declarationReconciled: true });
    store().recordType2Decision({ caseId: B.id, decision: "REFER_BACK", reason: "Date missing from the endorsement", rbCode: "SYN-NCSO" });
    store()[action](B.id, "NCSO RK 21/08/26");
    expect(store().caseRevisions[B.id].at(-1)?.channel).toBe("paper");
    expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: true });
    expect(store().lifecycles[B.id].state).toBe(action === "submitFromPharmacy" ? "submitted" : "resubmitted");
  });

  it("seeds automatic items as paid and never leaves them in a staff pending state", () => {
    for (const [id, process] of Object.entries(store().itemProcesses)) {
      if (process.routing.outcome === "auto_priced") expect(store().lifecycles[id].state).toBe("paid");
    }
  });

  it("takes machine channels from actual claim metadata, not legacy image labels", () => {
    expect(CASES.map((c) => store().caseRevisions[c.id][0].channel)).toEqual(["paper", "eps", "eps", "paper", "eps", "eps"]);
    for (const c of CASES) {
      expect(sessionCase(c.id)?.channel).toBe(c.claim.submittedVia === "EPS claim message" ? "Electronic (EPS)" : "Paper FP10");
    }
  });
  it("records a human sufficient D as decided Type 2, never no-person automatic", () => {
    submitD();
    store().setAgentEnabled(true);
    expect(() => store().recordType2Decision({ caseId: D.id, decision: "ACCEPT", reason: "" })).toThrow(/reason/i);
    store().recordType2Decision({ caseId: D.id, decision: "ACCEPT", reason: "Human checked the declared fields against the clause." });
    expect(store().lifecycles[D.id].state).toBe("paid");
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: false, pricingAuthority: "existing_rules_engine" });
    expect(store().records.at(-1)).toMatchObject({ caseId: D.id, decision: "ACCEPT" });
  });
  it("accepts a blind paper submission, rejecting malformed declaration shapes atomically", () => {
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: "" });
    expect(store().itemProcesses[D.id].routing.outcome).toBe("type1_capture");
    const snapshot = getDomainSnapshot();
    expect(() => store().submitItem({ caseId: D.id, channel: "paper", endorsementText: "", declaration: {
      fields: { ...fields, quantity: -1, endorsementText: "" }, declaredAt: "2026-09-13T10:00:00Z", provenance: "pharmacy_declaration",
    } })).toThrow(/fields/);
    expect(getDomainSnapshot()).toEqual(snapshot);
  });
});

it("uses one operational store and presentation never changes the domain snapshot", () => {
  const snapshot = getDomainSnapshot();
  expect(usePharmacyStore.getState()).toBe(store().pharmacy);
  expect(useQueueStore.getState()).toBe(store().queue);
  store().setPerspective("pharmacy");
  store().setAgentEnabled(true);
  store().queue.jump(20);
  expect(getDomainSnapshot()).toEqual(snapshot);
  expect(Object.isFrozen(getDomainSnapshot().itemProcesses)).toBe(true);
});
