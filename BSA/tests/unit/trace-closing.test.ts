import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseTracePage } from "@/pages/case-trace";
import { CASES } from "@/lib/domain/cases";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function closing(id: string) {
  const markup = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}/trace`] },
    createElement(Routes, null, createElement(Route, { path: "/case/:id/trace", element: createElement(CaseTracePage) }))));
  return markup.slice(markup.indexOf("Where it ends"));
}

beforeEach(() => useAppStore.getState().resetDemo());

describe("trace closing follows current routing authority", () => {
  it.each(["EX-24107", "EX-24101"])("%s needs neither an agent nor a person after automatic pricing", (id) => {
    for (const enabled of [false, true]) {
      useAppStore.getState().setAgentEnabled(enabled);
      const before = useAppStore.getState();
      const html = closing(id);
      expect(html).toContain("no person involved. The agent was not invoked.");
      expect(html).toContain("Open case evidence");
      expect(html).not.toContain("The rest is a person");
      expect(html).not.toContain("Open the operator case pack");
      expect(useAppStore.getState()).toBe(before);
    }
  });

  it.each([false, true])("completed human capture retains human attribution, Agent %s", (enabled) => {
    const store = useAppStore.getState();
    const b = CASES.find((item) => item.id === "EX-24112")!;
    store.setAgentEnabled(enabled);
    store.submitItem({ caseId: b.id, channel: "paper", endorsementText: "NCSO RK 21/08/26" });
    store.confirmType1({
      caseId: b.id, revision: useAppStore.getState().itemProcesses[b.id].revision,
      fields: { productCode: b.extracted.productCode, quantity: b.extracted.quantity, endorsementText: "NCSO RK 21/08/26" },
      provenance: "human_capture", declarationReconciled: false,
    });
    const before = useAppStore.getState();
    expect(before.lifecycles[b.id].state).toBe("paid");
    const html = closing(b.id);
    expect(html).toContain("Human review is complete.");
    expect(html).toContain("no further operator decision is needed.");
    expect(html).not.toContain("no person involved");
    expect(useAppStore.getState()).toBe(before);
  });

  it.each([false, true])("human-required cases describe assistance honestly, Agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const html = closing("EX-24119");
    expect(html).toContain(enabled ? "The rest is a person." : "A person decides; the agent was not invoked.");
    expect(html).toContain("Open the operator case pack");
    expect(html).not.toContain("no person involved");
    expect(useAppStore.getState()).toBe(before);
  });
});
