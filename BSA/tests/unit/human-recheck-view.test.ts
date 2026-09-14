import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CasePackPage } from "../../src/pages/case-pack";
import { NotificationContext } from "../../src/hooks/use-notification";
import { sessionCase, useAppStore } from "../../src/lib/store";
import { runAgent } from "../../src/lib/domain/agent";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

afterEach(() => useAppStore.getState().resetDemo());

function casePack(id: string) {
  return renderToStaticMarkup(createElement(NotificationContext.Provider, { value: { show: () => {}, clear: () => {} } },
    createElement(MemoryRouter, { initialEntries: [`/case/${id}`] },
      createElement(Routes, null, createElement(Route, { path: "/case/:id", element: createElement(CasePackPage) })))));
}

describe("human re-check respects current recommendation authority", () => {
  it.each([false, true])("retains explicit human judgement with assistance %s", (enabled) => {
    const store = useAppStore.getState();
    store.setAgentEnabled(enabled);
    store.resubmitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB dated 12/08/2026" });
    store.arriveInQueue("EX-24112");
    expect(useAppStore.getState().itemProcesses["EX-24112"].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(runAgent(sessionCase("EX-24112")!, { agentEnabled: enabled })).toMatchObject(enabled
      ? { agentInvoked: true, recommendation: "SUFFICIENT", gate: { result: "PASS" } }
      : { agentInvoked: false, recommendation: "NONE" });
    const html = casePack("EX-24112");
    expect(html).toContain("Sufficient (human choice)");
    expect(html).not.toContain("data-automatic-case");
    expect(html).not.toContain("Cleared by deterministic rules; the agent was not called");
    const sufficient = html.match(/<input(?=[^>]*value="ACCEPT")[^>]*>/)?.[0];
    expect(sufficient).toBeTruthy();
    expect(sufficient).not.toMatch(/\sdisabled(?:=|\s|>)/);
    if (!enabled) {
      expect(sufficient).not.toMatch(/\schecked(?:=|\s|>)/);
      expect(html).not.toContain("Replay step by step");
    }
    expect(() => store.releaseToPricing("EX-24112", "")).toThrow();
    store.releaseToPricing("EX-24112", "Human checked the corrected endorsement evidence");
    expect(useAppStore.getState().lifecycles["EX-24112"].state).toBe("released_to_pricing");
    expect(useAppStore.getState().records.at(-1)?.recommendation).toBe("NONE");
  });

  it("does not enable release of abstained evidence with assistance on", () => {
    const store = useAppStore.getState();
    store.confirmType1({ caseId: "EX-24123", revision: 1, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null } });
    store.setAgentEnabled(true);
    const html = casePack("EX-24123");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Release to pricing<\/button>/);
    expect(html).toContain("The agent abstained");
  });
});
