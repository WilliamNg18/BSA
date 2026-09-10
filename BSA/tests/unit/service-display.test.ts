import { describe, expect, it } from "vitest";
import { agentVersionLabel, productionServiceLabel } from "../../src/lib/service-display";
import { runAgent } from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { AGENT_VERSION, TOOL_DEFINITIONS } from "../../src/lib/domain/tools";

describe("production metadata display only", () => {
  it.each([
    ["Azure AI Document Intelligence (layout)", "Document layout analysis"],
    ["Azure AI Search (versioned corpus, effective-date filter)", "Search (versioned corpus, effective-date filter)"],
    ["Azure Functions (pure functions)", "Deterministic code (pure functions)"],
    ["Azure Functions", "Deterministic code"],
    ["Azure Cosmos DB (append-only)", "Append-only record store"],
  ])("maps %s to a generic service", (raw, label) => {
    expect(productionServiceLabel(raw)).toBe(label);
  });

  it("preserves unmapped source labels verbatim, not a blanket vendor scrub", () => {
    for (const value of ["Claim ledger and submission records", "Synthetic history", "Evidence quoting Azure", "constructor"]) {
      expect(productionServiceLabel(value)).toBe(value);
    }
  });

  it("preserves the agent version identifier and mocked status", () => {
    expect(agentVersionLabel(AGENT_VERSION)).toBe("prototype-0.5 (interpretation step mocked; production: constrained model call)");
    expect(agentVersionLabel("other-version")).toBe("other-version");
    expect(AGENT_VERSION).toContain("Azure OpenAI");
  });

  it.each(CASES)("does not mutate case $scenario evidence or production contracts", (item) => {
    const pack = runAgent(item);
    const before = structuredClone(pack);
    const definitions = structuredClone(TOOL_DEFINITIONS);
    for (const step of pack.trace) {
      step.toolCalls.forEach((call) => productionServiceLabel(call.productionService));
      step.items.forEach((text) => text.replace(pack.agentVersion, agentVersionLabel(pack.agentVersion)));
    }
    expect(pack).toEqual(before);
    expect(TOOL_DEFINITIONS).toEqual(definitions);
    expect(TOOL_DEFINITIONS.find((tool) => tool.name === "read_image_region")?.production).toContain("Azure AI Document Intelligence");
  });
});
