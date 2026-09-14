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
  expect(markup).toContain("Where it ends");
  return markup.slice(markup.indexOf("Where it ends"));
}

beforeEach(() => useAppStore.getState().resetDemo());

describe("trace closing follows current routing authority", () => {
  it("A needs neither an agent nor a person after automatic pricing, including the no-model path", () => {
    const id = "EX-24107";
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

  it.each([
    { id: "EX-24112", enabled: false },
    { id: "EX-24112", enabled: true },
    { id: "SYN-FQ123-MISMATCH", enabled: false },
    { id: "SYN-FQ123-MISMATCH", enabled: true },
  ])("$id describes required human review honestly, Agent $enabled", ({ id, enabled }) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const html = closing(id);
    expect(html).toContain(enabled ? "The rest is a person." : "A person decides; the agent was not invoked.");
    expect(html).toContain("Open the operator case pack");
    expect(html).not.toContain("no person involved");
    expect(useAppStore.getState()).toBe(before);
  });

  it.each([false, true])("D release remains human-attributed with current gate evidence, Agent %s", (enabled) => {
    const store = useAppStore.getState();
    const id = "EX-24123";
    store.setAgentEnabled(enabled);
    const declaration = useAppStore.getState().caseRevisions[id].at(-1)!.declaration!;
    store.submitItem({
      caseId: id, channel: "paper", endorsementText: declaration.fields.endorsementText,
      declaration,
    });
    const revision = useAppStore.getState().caseRevisions[id].at(-1)!;
    store.confirmType1({
      caseId: id, revision: revision.number,
      fields: { ...revision.declaration!.fields, prescriber: "Separately established synthetic prescriber" },
      provenance: "human_capture", declarationReconciled: true,
    });
    store.releaseToPricing(id, "I checked the declaration against the retained evidence.");
    const before = useAppStore.getState();
    expect(before.lifecycles[id].state).toBe("released_to_pricing");
    expect(before.itemProcesses[id].releaseOrigin).toBe("human_decision");
    expect(before.lifecycles[id].history.at(-1)).toMatchObject({
      actor: "operator", releaseOrigin: "human_decision", decision: "ACCEPT",
    });
    expect(before.itemVerification[id]).toEqual(enabled
      ? { gate1: "pass", gate2: "pass", reconciled: true, released: true }
      : { gate1: "none", gate2: "none", reconciled: false, released: true });
    const html = closing(id);
    expect(html).toContain("Human review is complete.");
    expect(html).toContain("no further operator decision is needed.");
    expect(html).not.toContain("no person involved");
    expect(html).not.toContain("no operator action");
    expect(useAppStore.getState()).toBe(before);
  });
});
