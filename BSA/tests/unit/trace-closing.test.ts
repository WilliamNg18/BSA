import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseTracePage } from "@/pages/case-trace";
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

  it.each([false, true])("readable corrected paper requires explicit release without invented Type 1 capture, Agent %s", (enabled) => {
    const store = useAppStore.getState();
    const id = "EX-24112";
    store.setAgentEnabled(enabled);
    const ready = useAppStore.getState();
    const revision = ready.caseRevisions[id].at(-1)!;
    expect(ready.itemProcesses[id]).toMatchObject({
      readyToRelease: true, routing: { outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null },
    });
    expect(() => store.confirmType1({ caseId: id, revision: revision.number, fields: revision.declaration!.fields,
      provenance: "human_capture", declarationReconciled: false })).toThrow("Capture requires");
    expect(useAppStore.getState()).toBe(ready);
    expect(ready.lifecycles[id].state).toBe("resubmitted");
    expect(ready.itemVerification[id].released).toBe(false);
    const pending = closing(id);
    expect(pending).toContain("Open the operator case pack");
    expect(pending).not.toContain("no further operator decision is needed.");
    store.releaseToPricing(id, "Human checked the acknowledged paper evidence.");
    const before = useAppStore.getState();
    expect(before.lifecycles[id].state).toBe("released_to_pricing");
    expect(before.itemProcesses[id].releaseOrigin).toBe("human_decision");
    const html = closing(id);
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
