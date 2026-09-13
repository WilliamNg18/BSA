import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function renderClaim(caseId: string) {
  const store = useAppStore.getState();
  const c = caseForLifecycle(caseId, store.lifecycles, store.caseRevisions, store.itemProcesses)!;
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ClaimDetail, { c, row: store.lifecycles[caseId] })));
}

beforeEach(() => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setPerspective("both");
});

describe("process claim evidence", () => {
  it("attributes automatic EPS pricing without inventing human review", () => {
    const store = useAppStore.getState();
    const c = caseForLifecycle("EX-24107", store.lifecycles, store.caseRevisions)!;
    store.submitItem({ caseId: c.id, channel: "eps", endorsementText: c.extracted.endorsementText });
    const before = useAppStore.getState().lifecycles;
    const markup = renderClaim(c.id);
    expect(markup).toContain("Paid on the normal schedule");
    expect(markup).toContain("priced by NHSBSA&#x27;s existing rules engine; no person involved");
    expect(markup).toContain("EPS typed message");
    expect(useAppStore.getState().lifecycles).toBe(before);
    expect(before[c.id].history.filter((entry) => entry.revision === 2).map((entry) => entry.actor)).toEqual(["pharmacy", "code"]);
  });

  for (const approve of [false, true]) {
    it(`exposes only the actual approved referral note in On mode, approved=${approve}`, () => {
      const store = useAppStore.getState();
      const caseId = "EX-24112";
      store.submitItem({ caseId, channel: "eps", endorsementText: "NCSO RK" });
      store.arriveInQueue(caseId);
      store.setAgentEnabled(true);
      store.recordType2Decision({
        caseId, decision: "REFER_BACK", rbCode: "SYN-NCSO",
        reason: "Raw operator reason retained exactly.",
        ...(approve ? { approvedDraft: "Add the dispensing date beside the initials." } : {}),
      });
      const history = useAppStore.getState().lifecycles[caseId].history;
      const on = renderClaim(caseId);
      expect(on).toContain("RB code");
      expect(on).toContain("SYN-NCSO");
      expect(on).not.toContain("Raw operator reason retained exactly.");
      expect(on.includes("Add the dispensing date beside the initials.")).toBe(approve);
      if (approve) {
        expect(on).toContain("Operator-approved note");
        expect(on).toContain("2026-08");
        expect(on).toContain("Exact fix");
      } else expect(on).toContain("No operator-approved draft");
      store.setAgentEnabled(false);
      const off = renderClaim(caseId);
      expect(off).toContain("Raw operator reason retained exactly.");
      expect(off).not.toContain("Add the dispensing date beside the initials.");
      expect(useAppStore.getState().lifecycles[caseId].history).toBe(history);
    });
  }

  it("renders paper declarations as immutable attempts, not image reads", () => {
    const store = useAppStore.getState();
    const caseId = "EX-24123";
    store.submitItem({ caseId, channel: "paper", endorsementText: "NCSO AB 27/08/26",
      declaration: {
        fields: { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)" },
        declaredAt: "2026-09-13T12:00:00Z", provenance: "pharmacy_declaration",
      } });
    const markup = renderClaim(caseId);
    expect(markup).toContain("Immutable pharmacy declaration");
    expect(markup).toContain("Current endorsement</dt><dd>NCSO AB 27/08/26</dd>");
    expect(markup).toContain("declared by the pharmacy, not read from the form");
    expect(markup).toContain("SYN-COCOD-100");
    expect(markup).toContain("Dr Demo (synthetic)");
    expect(markup).toContain("2026-09-13T12:00:00Z");
    expect(markup).not.toContain("no person involved");
    expect(useAppStore.getState().itemProcesses[caseId].capture).toBeNull();
  });

  it("does not describe human-reviewed Paid items as no-person pricing", () => {
    const store = useAppStore.getState();
    const caseId = "EX-24112";
    store.submitItem({ caseId, channel: "eps", endorsementText: "NCSO RK" });
    store.arriveInQueue(caseId);
    store.recordType2Decision({ caseId, decision: "ACCEPT", reason: "Human reviewed the supplied synthetic evidence." });
    const markup = renderClaim(caseId);
    expect(markup).toContain("Paid on the normal schedule");
    expect(markup).toContain("priced by NHSBSA&#x27;s existing rules engine");
    expect(markup).not.toContain("no person involved");
  });

  it("shows blind paper submission without inventing a declaration", () => {
    const store = useAppStore.getState();
    const caseId = "EX-24123";
    store.submitItem({ caseId, channel: "paper", endorsementText: "" });
    const markup = renderClaim(caseId);
    expect(markup).toContain("Paper");
    expect(markup).not.toContain("Immutable pharmacy declaration");
    expect(markup).not.toContain("no person involved");
    expect(useAppStore.getState().itemProcesses[caseId].routing.outcome).toBe("type1_capture");
    expect(useAppStore.getState().caseRevisions[caseId].at(-1)?.endorsementText).toBe("");
  });
});
