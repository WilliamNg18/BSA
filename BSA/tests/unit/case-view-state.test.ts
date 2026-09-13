import { describe, expect, it } from "vitest";
import { caseViewState, recordHasRule } from "../../src/lib/case-presentation";
import { runAgent } from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { useAppStore } from "../../src/lib/store";

describe("current-revision case header state", () => {
  it("does not recycle the seeded D abstention when assistance is Off", () => {
    const pack = runAgent(CASES[3], { agentEnabled: false });
    expect(caseViewState(pack, undefined, false)).toBe("operator_review_required");
  });

  it("displays the current pack, not an older stored assistance state", () => {
    const pack = runAgent(CASES[2], { agentEnabled: true });
    expect(caseViewState(pack, undefined, false)).toBe("additional_evidence_required");
  });

  it("shows a current human record regardless of the comparison mode", () => {
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
    const original = useAppStore.getState().records[0];
    expect(recordHasRule(original)).toBe(true);
    expect(recordHasRule({ ...original, revision: 2, clauseId: undefined, recommendation: "ABSTAIN", checks: [] })).toBe(false);
    expect(recordHasRule({ ...original, tariffVersion: "n/a" })).toBe(false);
  });
});
