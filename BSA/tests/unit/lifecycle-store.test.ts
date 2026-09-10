import { beforeEach, describe, expect, it } from "vitest";
import { CASES, QUEUE_FILLER } from "../../src/lib/domain/cases";
import { PHARMACIES } from "../../src/lib/domain/reference";
import { seededLifecycles } from "../../src/lib/domain/lifecycle-seed";
import type { PharmacyPrecheckSnapshot } from "../../src/lib/domain/lifecycle";
import { useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

const lifecycle = (caseId: string) => useAppStore.getState().lifecycles[caseId];
const states = () => useAppStore.getState().lifecycles;

function snapshot(): PharmacyPrecheckSnapshot {
  return {
    typedText: "NCSO RK",
    dispensingDate: "2026-08-21",
    facts: { type: "NCSO", present: true, initialled: true, dated: false, quotedText: "NCSO RK", note: "Initialled, not dated." },
    tariffVersion: "2026-08",
    clauseId: "PII-9",
    checkedAt: "2026-09-04T09:40:00.000Z",
    status: "missing",
    checks: [{ id: "dated", label: "Dated", met: false }],
    mode: "scripted",
  };
}

describe("seeded synthetic month", () => {
  it("covers the five existing pharmacies with their actual contractor codes", () => {
    const codes = new Set(Object.values(states()).map((l) => l.pharmacyCode));
    expect([...codes].sort()).toEqual(PHARMACIES.map((p) => p.contractorCode).sort());
    for (const c of CASES) expect(lifecycle(c.id).pharmacyCode).toBe(c.pharmacy.contractorCode);
    expect(Object.keys(states())).toHaveLength(CASES.length + QUEUE_FILLER.length);
  });

  it("seeds every submission inside one synthetic month, in order", () => {
    for (const record of Object.values(states())) {
      const times = record.history.map((e) => Date.parse(e.at));
      expect(times).toEqual([...times].sort((a, b) => a - b));
      const submitted = new Date(times[0]);
      expect(submitted.toISOString().slice(0, 7)).toBe("2026-08");
      expect(record.state).toBe(record.history[record.history.length - 1].to);
    }
  });

  it("keeps the canonical outcomes: E cleared without a model call and F already decided", () => {
    expect(lifecycle("EX-24101").state).toBe("paid");
    expect(lifecycle("EX-24101").history.map((e) => e.actor)).toEqual(["pharmacy", "code", "code"]);
    expect(lifecycle("EX-24088").state).toBe("referred_back");
    expect(lifecycle("EX-24088").history[2].actor).toBe("operator");
    for (const id of ["EX-24107", "EX-24112", "EX-24119", "EX-24123"]) expect(lifecycle(id).state).toBe("in_review");
  });

  it("is deterministic", () => {
    expect(seededLifecycles()).toEqual(seededLifecycles());
    expect(seededLifecycles()).toEqual(states());
  });
});

describe("validated transitions", () => {
  it("completes a referred-back round trip and records the operator draft", () => {
    const store = useAppStore.getState();
    store.recordOperatorDecision("EX-24112", "REFER_BACK", "Endorsement is not dated", "Add the dispensing date");
    expect(lifecycle("EX-24112").state).toBe("referred_back");
    expect(lifecycle("EX-24112").history[2].exactFix).toBe("Add the dispensing date");
    store.resubmitFromPharmacy("EX-24112", "NCSO RK 21/08/26", snapshot());
    expect(lifecycle("EX-24112").state).toBe("resubmitted");
    expect(lifecycle("EX-24112").history[3].clauseId).toBe("PII-9");
    expect(lifecycle("EX-24112").history[3].tariffVersion).toBe("2026-08");
    store.arriveInQueue("EX-24112");
    expect(lifecycle("EX-24112").state).toBe("in_review");
    store.recordOperatorDecision("EX-24112", "ACCEPT", "Corrected endorsement is sufficient");
    expect(lifecycle("EX-24112").state).toBe("paid");
    expect(lifecycle("EX-24112").history).toHaveLength(6);
  });

  it("answers a request for information and allows escalation before payment", () => {
    const store = useAppStore.getState();
    store.recordOperatorDecision("EX-24119", "REQUEST_INFORMATION", "Quantity conflict needs confirming");
    expect(lifecycle("EX-24119").state).toBe("information_requested");
    store.sendConfirmation("EX-24119", "Quantity dispensed was 56");
    expect(lifecycle("EX-24119").state).toBe("resubmitted");
    store.arriveInQueue("EX-24119");
    store.recordOperatorDecision("EX-24119", "ESCALATE", "Senior review requested");
    expect(lifecycle("EX-24119").state).toBe("escalated");
    store.recordOperatorDecision("EX-24119", "AMEND", "Senior operator amended the claim");
    expect(lifecycle("EX-24119").state).toBe("paid");
  });

  it("creates a lifecycle only for a case that is not already tracked", () => {
    useAppStore.setState({ lifecycles: {} });
    useAppStore.getState().submitFromPharmacy("EX-24123", "NCSO", snapshot());
    expect(lifecycle("EX-24123").state).toBe("submitted");
    expect(lifecycle("EX-24123").pharmacyCode).toBe("FK390");
    expect(lifecycle("EX-24123").history[0].from).toBeNull();
    expect(lifecycle("EX-24123").history[0].actor).toBe("pharmacy");
    useAppStore.getState().submitFromPharmacy("EX-24123", "NCSO again");
    expect(lifecycle("EX-24123").history).toHaveLength(1);
  });

  it("copies a precheck snapshot so a later caller change cannot alter history", () => {
    useAppStore.setState({ lifecycles: {} });
    const precheck = snapshot();
    useAppStore.getState().submitFromPharmacy("EX-24112", "NCSO RK", precheck);
    (precheck as { clauseId: string | null }).clauseId = "PII-99";
    expect(lifecycle("EX-24112").history[0].clauseId).toBe("PII-9");
  });
});

describe("actor authority", () => {
  it("never records an agent actor, and only code routes into the queue", () => {
    const store = useAppStore.getState();
    store.recordOperatorDecision("EX-24107", "REFER_BACK", "Endorsement needs a date");
    store.resubmitFromPharmacy("EX-24107", "NCSO JB 14/08/26");
    store.arriveInQueue("EX-24107");
    const events = Object.values(states()).flatMap((l) => l.history);
    expect(events.some((e) => e.actor === "agent")).toBe(false);
    for (const event of events) {
      if (event.to === "in_review") expect(event.actor).toBe("code");
      if (event.to === "submitted" || event.to === "resubmitted") expect(event.actor).toBe("pharmacy");
    }
    const decided = lifecycle("EX-24107").history.filter((e) => e.to === "referred_back");
    expect(decided.every((e) => e.actor === "operator")).toBe(true);
  });
});

describe("rejected mutations", () => {
  it("rejects unknown cases, empty text and short reasons without changing history", () => {
    const before = states();
    const store = useAppStore.getState();
    store.submitFromPharmacy("EX-00000", "NCSO");
    store.submitFromPharmacy("EX-24112", "   ");
    store.arriveInQueue("EX-00000");
    store.recordOperatorDecision("EX-24112", "REFER_BACK", "short");
    store.recordOperatorDecision("EX-24112", "REFER_BACK", "   ");
    store.sendConfirmation("EX-24112", "");
    expect(states()).toEqual(before);
  });

  it("rejects transitions that the state does not allow", () => {
    const store = useAppStore.getState();
    store.arriveInQueue("EX-24107");
    expect(lifecycle("EX-24107").history).toHaveLength(2);
    store.resubmitFromPharmacy("EX-24107", "NCSO JB 14/08/26");
    expect(lifecycle("EX-24107").state).toBe("in_review");
    store.sendConfirmation("EX-24088", "Correction sent");
    expect(lifecycle("EX-24088").state).toBe("referred_back");
    store.recordOperatorDecision("EX-24101", "REFER_BACK", "Already released to pricing");
    expect(lifecycle("EX-24101").state).toBe("paid");
    expect(lifecycle("EX-24101").history).toHaveLength(3);
  });

  it("refuses direct mutation of stored records and follows only tracked cases", () => {
    const record = lifecycle("EX-24107");
    expect(() => { record.state = "paid"; }).toThrow();
    expect(() => record.history.push({ at: "2026-09-05T09:00:00.000Z", actor: "operator", from: "in_review", to: "paid", message: "Injected" })).toThrow();
    const store = useAppStore.getState();
    store.followCase("EX-00000");
    expect(useAppStore.getState().followedCaseId).toBeNull();
    store.followCase("EX-24107");
    expect(useAppStore.getState().followedCaseId).toBe("EX-24107");
    store.followCase(null);
    expect(useAppStore.getState().followedCaseId).toBeNull();
  });
});

describe("append-only history, shared visibility and Reset", () => {
  it("appends without rewriting earlier events, and both sides read one record", () => {
    const beforeHistory = lifecycle("EX-24112").history;
    const pharmacyView = () => useAppStore.getState().lifecycles["EX-24112"];
    useAppStore.getState().recordOperatorDecision("EX-24112", "REFER_BACK", "Endorsement is not dated");
    const after = lifecycle("EX-24112");
    expect(after.history.slice(0, beforeHistory.length)).toEqual([...beforeHistory]);
    expect(after.history).toHaveLength(beforeHistory.length + 1);
    expect(pharmacyView()).toBe(after);
    expect(pharmacyView().state).toBe("referred_back");
    expect(beforeHistory).toHaveLength(2);
  });

  it("restores the seeded month and clears the followed case on Reset", () => {
    const store = useAppStore.getState();
    store.recordOperatorDecision("EX-24112", "REFER_BACK", "Endorsement is not dated");
    store.followCase("EX-24112");
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState().followedCaseId).toBeNull();
    expect(lifecycle("EX-24112").state).toBe("in_review");
    expect(lifecycle("EX-24112").history).toHaveLength(2);
    expect(states()).toEqual(seededLifecycles());
  });
});
