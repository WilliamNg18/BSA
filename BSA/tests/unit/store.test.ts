import { beforeEach, describe, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import * as content from "../../src/lib/domain/content";
import { useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("product-only session state", () => {
  it("has no presenter or discussion state or actions, including after reset", () => {
    const removed = ["presenterMode", "presenterBeat", "discussionMode", "setPresenterMode", "setPresenterBeat", "setDiscussionMode"];
    for (const key of removed) expect(useAppStore.getState()).not.toHaveProperty(key);
    useAppStore.getState().setAgentEnabled(false);
    useAppStore.getState().resetDemo();
    for (const key of removed) expect(useAppStore.getState()).not.toHaveProperty(key);
  });

  it("no longer exports presentation-only content to the application", () => {
    for (const key of ["WALKTHROUGH", "DISCUSSION_PROMPTS", "CHALLENGE_CARDS", "FAILURE_POINTS", "SETUP_NOTES"]) {
      expect(content).not.toHaveProperty(key);
    }
    expect(content.DELIVERY_SEQUENCE).toHaveLength(9);
    expect(content.ASSUMPTIONS).toHaveLength(8);
  });

  it("toggling assistance preserves cases and human records; Reset restores the seed", () => {
    const seed = useAppStore.getState();
    seed.setAgentEnabled(true);
    seed.submitItem({ caseId: CASES[1].id, channel: "eps", endorsementText: CASES[1].extracted.endorsementText });
    seed.arriveInQueue(CASES[1].id);
    const pack = runAgent(CASES[1]);
    const record = seed.recordDecision({
      caseId: "EX-24112", tariffVersion: "2026-08", agentVersion: "synthetic-test",
      inputs: ["Synthetic input"], sources: ["Synthetic source"], checks: pack.gate.checks,
      recommendation: "REFER_BACK", decision: "AMEND", overrideReason: "Synthetic override reason",
    });
    const recorded = useAppStore.getState();
    expect(recorded.caseStates["EX-24112"]).toBe("human_decision_recorded");
    expect(recorded.records).toContainEqual(record);
    recorded.setAgentEnabled(false);
    expect(useAppStore.getState().agentEnabled).toBe(false);
    expect(useAppStore.getState().caseStates).toBe(recorded.caseStates);
    expect(useAppStore.getState().records).toBe(recorded.records);
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState().agentEnabled).toBe(false);
    expect(useAppStore.getState().caseStates).toEqual(seed.caseStates);
    expect(useAppStore.getState().records).toEqual(seed.records);
    expect(useAppStore.getState().records.map((r) => r.id)).toEqual(["DR-000871", "DR-000872"]);
  });
});
