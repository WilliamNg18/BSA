import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowBanner } from "../../src/components/demo/follow-banner";
import { FollowItem } from "../../src/components/demo/case-links";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { itemStateLabel } from "../../src/lib/domain/lifecycle";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { visitFollowedCase } from "../../src/lib/follow-navigation";
import { followedLastEvent } from "../../src/lib/follow-presentation";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const store = () => useAppStore.getState();
const render = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FollowBanner)));
beforeEach(() => store().resetDemo());

describe("persistent followed item banner", () => {
  it.each(["pharmacy", "nhsbsa", "both"] as const)("shows both buttons and actual perspective words in %s with and without demo mode", (perspective) => {
    store().followCase("EX-24123");
    store().setPerspective(perspective);
    for (const enabled of [false, true]) for (const step of [null, 10]) {
      store().setAgentEnabled(enabled);
      store().setDemoStep(step);
      const before = getDomainSnapshot();
      const html = render();
      expect(html).toContain('aria-label="Followed item"');
      expect(html).toContain("Following EX-24123 | Paper");
      expect(html).toContain('aria-label="Followed item views"');
      expect(html).toMatch(/<button[^>]*>Pharmacy view<\/button>/);
      expect(html).toMatch(/<button[^>]*>NHSBSA view<\/button>/);
      expect(html).toContain(itemStateLabel(store().lifecycles["EX-24123"], perspective, enabled));
      expect(html).toContain("Type 1: capture");
      expect(html).toContain("1 September (synthetic)");
      expect(html).not.toContain("Switch side");
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("uses actual submitted history and exposes Follow in restricted perspectives", () => {
    store().submitItem({ caseId: "EX-24123", channel: "paper", endorsementText: "NCSO JB 27/08/26" });
    store().followCase("EX-24123");
    store().setPerspective("pharmacy");
    expect(render()).toContain("Pharmacy submitted item");
    const html = renderToStaticMarkup(createElement(FollowItem, { id: "EX-24123" }));
    expect(html).toContain("Stop following this item");
  });

  it("renders no banner without Follow and no control for an unknown item", () => {
    expect(render()).toBe("");
    expect(renderToStaticMarkup(createElement(FollowItem, { id: "unknown" }))).toBe("");
  });

  it.each([false, true])("follows actual D submission, capture, referral, correction, resubmission and human release, Agent=%s", (enabled) => {
    const id = "EX-24123";
    store().setAgentEnabled(enabled);
    store().setDemoStep(10);
    store().followCase(id);
    const fields = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB", prescriber: "Dr Example (synthetic)" };
    const checkpoint = (location: string) => {
      const before = getDomainSnapshot();
      for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
        store().setPerspective(perspective);
        for (const side of ["pharmacy", "nhsbsa"] as const) {
          visitFollowedCase(side);
          expect(getDomainSnapshot()).toEqual(before);
          expect(store().agentEnabled).toBe(enabled);
          expect(store().demoStep).toBe(10);
          expect(store().followedCaseId).toBe(id);
          const html = render();
          expect(html).toContain("Following EX-24123 | Paper");
          expect(html).toContain(itemStateLabel(store().lifecycles[id], store().perspective, enabled));
          expect(html).toContain(location);
          expect(html).toContain(followedLastEvent(store().lifecycles[id]));
          expect(html).toContain("Pharmacy view");
          expect(html).toContain("NHSBSA view");
        }
      }
    };
    store().submitItem({ caseId: id, channel: "paper", endorsementText: fields.endorsementText,
      declaration: { fields, declaredAt: "2026-09-04T09:00:00Z", provenance: "pharmacy_declaration" } });
    checkpoint("Type 1: capture");
    store().confirmType1({ caseId: id, revision: store().caseRevisions[id].at(-1)!.number, fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    checkpoint("Type 2: review");
    if (enabled) {
      store().applySuggestionToDecision(id);
      checkpoint("Type 2: review");
    }
    store().referBack(id, "RB2B", enabled ? store().operatorDrafts[id].note : "Human requires the missing endorsement date.");
    checkpoint("Referred back to pharmacy");
    expect(render()).toContain(", RB2B (synthetic)");
    if (enabled) store().applySuggestedCorrection(id);
    else {
      const draft = initialisePharmacyDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!);
      const endorsementText = "NCSO JB 27/08/26";
      store().setPharmacyDraft(id, { ...draft, endorsementText,
        paperDeclaration: { ...draft.paperDeclaration!, endorsementText },
        declaration: { ...draft.declaration!, fields: { ...draft.declaration!.fields, endorsementText } } });
    }
    checkpoint("Referred back to pharmacy");
    store().resubmit(id);
    checkpoint("Type 1: capture");
    const corrected = store().caseRevisions[id].at(-1)!;
    store().confirmType1({ caseId: id, revision: corrected.number, fields: corrected.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    checkpoint("Type 2: review");
    store().releaseToPricing(id, "Human reconciled the corrected declaration and source evidence.");
    checkpoint("Released to existing pricing");
    expect(store().lifecycles[id].state).toBe("released_to_pricing");
    expect(render()).toContain("after operator review");
    expect(render()).not.toContain("no operator action");
    expect(render()).toContain("Released after operator review");
  });

  it("reserves no-operator copy for a real automatic release and retains it across toggle changes", () => {
    const id = "EX-24107";
    store().setAgentEnabled(true);
    const draft = initialisePharmacyDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!);
    store().submitItem({ ...draft, caseId: id, channel: draft.channel! });
    store().followCase(id);
    store().setPerspective("nhsbsa");
    for (const enabled of [false, true]) {
      store().setAgentEnabled(enabled);
      expect(render()).toContain("released to existing pricing, no operator action");
      expect(render()).not.toContain("after operator review");
    }
  });
});
