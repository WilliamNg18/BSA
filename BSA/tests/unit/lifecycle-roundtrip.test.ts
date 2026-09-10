import { beforeEach, describe, expect, it } from "vitest";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { useAppStore } from "../../src/lib/store";

// Stream E owns this file. It exercises the Task 8 lifecycle contract that
// Stream B implements, pure against the store with no DOM/router involved.
// The frozen-contract checks below run now; the full round trip is Stream E's
// pending-integration evidence and is unskipped once Stream B's store lands
// (see docs/parallel-contracts.md and docs/PROGRESS.md Task 10/13).

beforeEach(() => useAppStore.getState().resetDemo());

describe("lifecycle slice: frozen contract", () => {
  it("starts empty and unfollowed, and every method currently throws not implemented", () => {
    const s = useAppStore.getState();
    expect(s.lifecycles).toEqual({});
    expect(s.followedCaseId).toBeNull();
    expect(() => s.submitFromPharmacy("EX-24107", "Synthetic endorsement")).toThrow("not implemented");
    expect(() => s.arriveInQueue("EX-24107")).toThrow("not implemented");
    expect(() => s.recordOperatorDecision("EX-24107", "ACCEPT", "Synthetic reason")).toThrow("not implemented");
    expect(() => s.resubmitFromPharmacy("EX-24107", "Synthetic endorsement")).toThrow("not implemented");
    expect(() => s.sendConfirmation("EX-24107", "Synthetic confirmation")).toThrow("not implemented");
    expect(() => s.followCase("EX-24107")).toThrow("not implemented");
  });

  it("keeps the seven exact lifecycle states and their frozen labels", () => {
    const states = Object.keys(LIFECYCLE_LABELS);
    expect(states).toEqual(["submitted", "in_review", "information_requested", "referred_back", "resubmitted", "paid", "escalated"]);
    // Pharmacy labels never vary by toggle; only the NHSBSA side does.
    for (const state of states as (keyof typeof LIFECYCLE_LABELS)[]) {
      expect(typeof LIFECYCLE_LABELS[state].pharmacy).toBe("string");
      expect(LIFECYCLE_LABELS[state].nhsbsa).toHaveProperty("on");
      expect(LIFECYCLE_LABELS[state].nhsbsa).toHaveProperty("off");
    }
  });
});

// Pending-integration: Stream B's implementation replaces the throwing
// methods with real transitions and append-only history. Unskip after B
// merges, per docs/parallel-contracts.md ("Merge B first, then A/C/D, then E").
describe.skip("lifecycle slice: pure round trip (pending-integration)", () => {
  it("follows a case, submits, arrives, is referred back, resubmits and pays with append-only history", () => {
    const store = useAppStore.getState();
    store.followCase("EX-24107");
    expect(useAppStore.getState().followedCaseId).toBe("EX-24107");

    store.submitFromPharmacy("EX-24107", "NCSO DL");
    let lifecycle = useAppStore.getState().lifecycles["EX-24107"];
    expect(lifecycle.state).toBe("submitted");
    expect(lifecycle.history).toHaveLength(1);

    store.arriveInQueue("EX-24107");
    lifecycle = useAppStore.getState().lifecycles["EX-24107"];
    expect(lifecycle.state).toBe("in_review");
    expect(lifecycle.history).toHaveLength(2);

    store.recordOperatorDecision("EX-24107", "REFER_BACK", "Missing dispensing date");
    lifecycle = useAppStore.getState().lifecycles["EX-24107"];
    expect(lifecycle.state).toBe("referred_back");
    expect(lifecycle.history).toHaveLength(3);

    store.resubmitFromPharmacy("EX-24107", "NCSO DL 03/09/2026");
    lifecycle = useAppStore.getState().lifecycles["EX-24107"];
    expect(lifecycle.state).toBe("resubmitted");
    expect(lifecycle.history).toHaveLength(4);

    store.recordOperatorDecision("EX-24107", "ACCEPT", "Complete endorsement");
    store.sendConfirmation("EX-24107", "Payment approved (synthetic)");
    lifecycle = useAppStore.getState().lifecycles["EX-24107"];
    expect(lifecycle.state).toBe("paid");
    expect(lifecycle.history).toHaveLength(6);

    // History is append-only: earlier entries never change and stay ordered.
    expect(lifecycle.history.map((e) => e.to)).toEqual([
      "submitted", "in_review", "referred_back", "resubmitted", "paid", "paid",
    ]);
    expect(lifecycle.history[0].actor).toBe("pharmacy");

    store.followCase(null);
    expect(useAppStore.getState().followedCaseId).toBeNull();
  });
});
