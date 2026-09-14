import { beforeEach, describe, expect, it } from "vitest";
import { caseViewState, recordHasRule, recordHasRuleAndReason, staffLane } from "../../src/lib/case-presentation";
import { runAgent } from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { historicalDecisionRecords, useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("current-revision case header state", () => {
  it("does not recycle the seeded D abstention when assistance is Off", () => {
    const pack = runAgent(CASES[3], { agentEnabled: false });
    expect(caseViewState(pack, undefined, false)).toBe("operator_review_required");
  });

  it("displays the current pack, not an older stored assistance state", () => {
    const pack = runAgent(CASES[2], { agentEnabled: true });
    expect(caseViewState(pack, undefined, false)).toBe("additional_evidence_required");
  });

  it("presents the historical F fixture's recorded decision regardless of comparison mode", () => {
    for (const agentEnabled of [false, true]) {
      expect(caseViewState(runAgent(CASES[5], { agentEnabled }), undefined, true)).toBe("human_decision_recorded");
    }
  });

  it("does not carry F's historical seed state onto an undecided manual revision", () => {
    expect(caseViewState(runAgent(CASES[5], { agentEnabled: false }), undefined, false)).toBe("operator_review_required");
  });

  it("attributes automatic routing to code rather than an agent or operator", () => {
    expect(caseViewState(null, useAppStore.getState().itemProcesses[CASES[0].id], false)).toBe("cleared_by_rules");
  });

  it("preserves the historical validated citation without inventing one from a Tariff date", () => {
    const original = historicalDecisionRecords()[0];
    expect(useAppStore.getState().records).toEqual([]);
    expect(recordHasRule(original)).toBe(true);
    expect(recordHasRule({ ...original, revision: 2, clauseId: undefined, recommendation: "ABSTAIN", checks: [] })).toBe(false);
    expect(recordHasRule({ ...original, tariffVersion: "n/a" })).toBe(false);
    expect(recordHasRuleAndReason({ ...original, reason: " ", overrideReason: " " })).toBe(false);
    expect(recordHasRuleAndReason({ ...original, reason: "Human reason" })).toBe(true);
    expect(recordHasRuleAndReason({ ...original, tariffVersion: "n/a", reason: "Human reason" })).toBe(false);
  });

  it("routes by operational facts, not a historical record or assistance mode", () => {
    const store = useAppStore.getState();
    const lifecycle = store.lifecycles["EX-24112"];
    const process = store.itemProcesses["EX-24112"];
    const humanRoute = { ...process, routing: { ...process.routing, outcome: "type2_endorsement" as const, requiresHuman: true, pricingAuthority: null } };
    expect(staffLane({ ...lifecycle, state: "in_review" }, humanRoute)).toBe("type2");
    expect(staffLane({ ...lifecycle, state: "information_requested" }, humanRoute)).toBe("type2");
    expect(staffLane({ ...lifecycle, state: "resubmitted" }, humanRoute)).toBe("type2");
    expect(staffLane({ ...lifecycle, state: "referred_back" }, humanRoute)).toBe("referred");
    expect(staffLane({ ...lifecycle, state: "paid" }, { ...humanRoute, routing: {
      ...humanRoute.routing, requiresHuman: false, pricingAuthority: "existing_rules_engine",
    } })).toBe("decided");
    expect(staffLane({ ...lifecycle, state: "released_to_pricing" }, { ...humanRoute, releaseOrigin: "human_decision", routing: {
      ...humanRoute.routing, requiresHuman: false, pricingAuthority: "existing_rules_engine",
    } })).toBe("decided");
    expect(staffLane({ ...lifecycle, state: "submitted" }, { ...humanRoute, routing: { ...humanRoute.routing, outcome: "type1_capture" } })).toBe("type1");
    expect(staffLane(lifecycle, { ...humanRoute, routing: { ...humanRoute.routing, outcome: "auto_priced", requiresHuman: false } })).toBeNull();
  });
});
