import { afterEach, beforeEach, expect, it } from "vitest";
import { CASES, caseById } from "../../src/lib/domain/cases";
import { historicalDecisionRecords, useAppStore, sessionCase } from "../../src/lib/store";
import { historicalLifecycleFixtures } from "../../src/lib/domain/lifecycle-seed";
import { runAgent } from "../../src/lib/domain/agent";
import { pharmacySnapshot } from "../../src/lib/domain/pharmacy-check";

const store = () => useAppStore.getState();
const A = CASES[0], F = CASES[5], B = caseById("EX-24112")!;
beforeEach(() => store().resetDemo());
afterEach(() => store().resetDemo());

it.each([false, true])("A's new complete EPS submission leaves F's historical evidence untouched, flag=%s", (on) => {
  const historicalRecords = historicalDecisionRecords();
  const historical = historicalLifecycleFixtures();
  const original = structuredClone({ historicalRecords, historical });
  const records = store().records;
  store().setAgentEnabled(on);
  store().submitItem({ caseId: A.id, channel: "eps", endorsementText: A.extracted.endorsementText });
  expect(store().itemProcesses[A.id].routing).toMatchObject({ outcome: "auto_priced", requiresHuman: false });
  store().arriveInQueue(A.id);
  expect(store().caseStates[A.id]).not.toBe("human_decision_recorded");
  expect(runAgent(sessionCase(A.id)!)).toMatchObject({ recommendation: "NONE", agentInvoked: false, state: "cleared_by_rules" });
  expect(store().lifecycles[A.id].state).toBe(on ? "released_to_pricing" : "paid");
  expect(store().records).toBe(records);
  expect(store().records).toEqual([]);
  expect({ historicalRecords, historical }).toEqual(original);
  expect(historicalDecisionRecords()).toEqual(original.historicalRecords);
  expect(historicalLifecycleFixtures()).toEqual(original.historical);
  expect(sessionCase(F.id)).toBeNull();
  expect(store().caseRevisions[A.id].at(-1)?.verificationEnabled).toBe(on);
  expect(store().lifecycles[A.id].history.at(-1)).toMatchObject({ actor: "code", revision: 2 });
  expect(() => store().recordOperatorDecision(A.id, "ACCEPT", "Human checked corrected evidence")).toThrow(/while paid|while released_to_pricing/);
});

it.each(["off", "pending", "unavailable"] as const)("retains an unperformed %s precheck without inventing results", (mode) => {
  const text = B.extracted.endorsementText;
  const snapshot = pharmacySnapshot(text, B.extracted.dispensingDate, mode, null, null);
  store().submitFromPharmacy(B.id, text, snapshot);
  expect(store().caseRevisions[B.id].at(-1)?.precheck).toEqual(snapshot);
  expect(store().lifecycles[B.id].state).toBe("submitted");
  expect(store().lifecycles[B.id].history.at(-1)?.actor).toBe("pharmacy");
});

it("a claimed ready snapshot cannot change a recommendation or pay a claim", () => {
  const text = B.extracted.endorsementText;
  store().submitItem({ caseId: B.id, channel: "paper", endorsementText: text, paperDeclaration: B.paperDeclaration, precheck: {
    typedText: text, dispensingDate: B.extracted.dispensingDate, mode: "scripted", status: "ready", checkedAt: "2026-09-10T09:00:00Z",
    facts: { ...B.readings[0], quotedText: text, dated: true }, tariffVersion: "2026-08", clauseId: "P2-C9", checks: [{ id: "dated", label: "Dated", met: true }],
  } });
  store().setAgentEnabled(true);
  store().arriveInQueue(B.id);
  expect(store().lifecycles[B.id].state).toBe("in_review");
  expect(runAgent(sessionCase(B.id)!).recommendation).toBe("REFER_BACK");
  expect(store().records).toHaveLength(0);
});