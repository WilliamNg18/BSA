import { describe, expect, it } from "vitest";
import { HISTORICAL_DECISION_RECORDS } from "../../data/archive/decision-records";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { AGENT_VERSION, TOOL_DEFINITIONS } from "../../src/lib/domain/tools";
import { historicalDecisionRecords, useAppStore } from "../../src/lib/store";

describe("neutral current metadata and immutable historical provenance", () => {
  it("uses capability names for every current tool definition and trace", () => {
    const names = TOOL_DEFINITIONS.map((tool) => tool.production);
    for (const c of CASES) names.push(...runAgent(c).trace.flatMap((step) => step.toolCalls?.map((tool) => tool.productionService) ?? []));
    expect(names.join("\n")).not.toMatch(/Azure|OpenAI|Cosmos|Foundry|Microsoft/i);
    expect(AGENT_VERSION).toBe("prototype-0.6 (interpretation step mocked; production: constrained model call)");
  });

  it("retains original F record values outside the operational store", () => {
    const records = historicalDecisionRecords();
    expect(records).toEqual(HISTORICAL_DECISION_RECORDS);
    expect(records).not.toBe(HISTORICAL_DECISION_RECORDS);
    expect(records[0]).toMatchObject({
      id: "DR-000871", timestamp: "2026-09-03T15:02:11", tariffVersion: "2026-08",
      agentVersion: "prototype-0.5 (interpretation step mocked; production: constrained Azure OpenAI call)",
      recommendation: "REFER_BACK", decision: "REFER_BACK",
    });
    expect(Object.isFrozen(HISTORICAL_DECISION_RECORDS[0].checks)).toBe(true);
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState().records).toEqual([]);
  });

  it("does not change the canonical automatic, referral, conflict or abstention outcomes", () => {
    expect(runAgent(CASES[0])).toMatchObject({ recommendation: "NONE", agentInvoked: false });
    expect(runAgent(CASES[1]).recommendation).toBe("REFER_BACK");
    expect(runAgent(CASES[1], { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
    expect(runAgent(CASES[2]).recommendation).toBe("REQUEST_INFORMATION");
    expect(runAgent(CASES[3])).toMatchObject({ recommendation: "ABSTAIN", abstainReasons: expect.any(Array) });
    expect(runAgent(CASES[3]).abstainReasons).toHaveLength(3);
    expect(runAgent(CASES[4])).toMatchObject({ recommendation: "NONE", agentInvoked: false });
  });
});
