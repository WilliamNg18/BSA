import { afterEach, beforeEach, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { useAppStore, sessionCase } from "../../src/lib/store";
import { runAgent } from "../../src/lib/domain/agent";
import { pharmacySnapshot } from "../../src/lib/domain/pharmacy-check";

const store = () => useAppStore.getState();
const F = CASES[5], B = CASES[1];
beforeEach(() => store().resetDemo());
afterEach(() => store().resetDemo());

it.each([false, true])("F's history never blocks a new complete EPS demonstration submission, flag=%s", (on) => {
  const original = structuredClone(store().records[0]);
  const records = store().records;
  store().setAgentEnabled(on);
  store().submitItem({ caseId: F.id, channel: "eps", endorsementText: "NCSO DL 06/08/26" });
  expect(store().itemProcesses[F.id].routing).toMatchObject({ outcome: "auto_priced", requiresHuman: false });
  store().arriveInQueue(F.id);
  expect(store().caseStates[F.id]).not.toBe("human_decision_recorded");
  expect(runAgent(sessionCase(F.id)!)).toMatchObject({ recommendation: "NONE", agentInvoked: false, state: "cleared_by_rules" });
  expect(store().lifecycles[F.id].state).toBe(on ? "released_to_pricing" : "paid");
  expect(store().records).toBe(records);
  expect(store().records[0]).toEqual(original);
  expect(store().lifecycles[F.id].history.at(-1)).toMatchObject({ actor: "code", revision: 3 });
  expect(() => store().recordOperatorDecision(F.id, "ACCEPT", "Human checked corrected evidence")).toThrow(/while paid|while released_to_pricing/);
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
  store().submitFromPharmacy(B.id, text, {
    typedText: text, dispensingDate: B.extracted.dispensingDate, mode: "scripted", status: "ready", checkedAt: "2026-09-10T09:00:00Z",
    facts: { ...B.readings[0], quotedText: text, dated: true }, tariffVersion: "2026-08", clauseId: "P2-C9", checks: [{ id: "dated", label: "Dated", met: true }],
  });
  store().setAgentEnabled(true);
  store().arriveInQueue(B.id);
  expect(store().lifecycles[B.id].state).toBe("in_review");
  expect(runAgent(sessionCase(B.id)!).recommendation).toBe("REFER_BACK");
  expect(store().records).toHaveLength(2);
});