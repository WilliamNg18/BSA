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

describe("human re-check without an agent recommendation", () => {
  it("allows an explicit human choice without inventing advice or automatic pricing", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    store.resubmitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB dated 12/08/2026" });
    store.arriveInQueue("EX-24112");
    expect(useAppStore.getState().itemProcesses["EX-24112"].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(runAgent(sessionCase("EX-24112")!)).toMatchObject({ agentInvoked: false, recommendation: "NONE" });
    const html = casePack("EX-24112");
    expect(html).toContain("Rules checks complete; human re-check required");
    expect(html).toContain("Sufficient (human choice)");
    expect(html).not.toContain("Accept the recommendation");
    const sufficient = html.match(/<input(?=[^>]*id="d-ACCEPT")[^>]*>/)?.[0];
    expect(sufficient).toBeTruthy();
    expect(sufficient).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(sufficient).not.toMatch(/\schecked(?:=|\s|>)/);
    expect(html).not.toContain("Replay step by step");
    expect(() => store.recordType2Decision({ caseId: "EX-24112", decision: "ACCEPT", reason: "" })).toThrow();
    store.recordType2Decision({ caseId: "EX-24112", decision: "ACCEPT", reason: "Human checked the corrected endorsement evidence" });
    expect(useAppStore.getState().lifecycles["EX-24112"].state).toBe("paid");
    expect(useAppStore.getState().records.at(-1)?.recommendation).toBe("NONE");
  });

  it("does not enable acceptance of abstained evidence with assistance on", () => {
    const store = useAppStore.getState();
    store.confirmType1({ caseId: "EX-24123", revision: 1, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null } });
    store.setAgentEnabled(true);
    const html = casePack("EX-24123");
    const sufficient = html.match(/<input(?=[^>]*id="d-ACCEPT")[^>]*>/)?.[0];
    expect(sufficient).toMatch(/\sdisabled(?:=|\s|>)/);
    expect(html).toContain("The agent abstained");
  });
});
