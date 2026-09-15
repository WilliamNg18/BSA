import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowBanner } from "../../src/components/demo/follow-banner";
import { FollowItem } from "../../src/components/demo/case-links";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { itemStateLabel } from "../../src/lib/domain/lifecycle";
import { initialisePharmacyDraft, preparePaperDemoDraft } from "../../src/lib/domain/pharmacy-correction";
import { visitFollowedCase } from "../../src/lib/follow-navigation";
import { followedLastEvent } from "../../src/lib/follow-presentation";
import { BACKGROUND_CASES, PLAYABLE_CASE_IDS, caseById } from "../../src/lib/domain/cases";

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
      expect(html).toContain("14 September (synthetic)");
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

  it("offers Follow only for the shared four playable items, never background rows", () => {
    for (const id of PLAYABLE_CASE_IDS) {
      expect(renderToStaticMarkup(createElement(FollowItem, { id }))).toContain("Follow this item");
    }
    for (const { id } of BACKGROUND_CASES) {
      expect(renderToStaticMarkup(createElement(FollowItem, { id }))).toBe("");
      expect(() => store().followCase(id)).toThrow();
      expect(store().followedCaseId).toBeNull();
    }
  });

  it.each([false, true])("retains the question, confirmation and latest event through both views without Reset, Agent=%s", (enabled) => {
    const id = "EX-24112";
    store().setAgentEnabled(enabled);
    store().setDemoStep(10);
    store().followCase(id);
    const paper = caseById(id)!.paperDeclaration!;
    store().submitItem({ caseId: id, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper });
    store().arriveInQueue(id);
    const question = "Please confirm the dispensing details.";
    const answer = "The pharmacy has confirmed the dispensing details.";
    for (const action of [
      { run: () => store().requestInformation(id, question), label: "Operator requested information", state: "information_requested" },
      { run: () => store().sendConfirmation(id, answer), label: enabled ? "Verification recorded" : "Pharmacy sent confirmation", state: "resubmitted" },
    ]) {
      action.run();
      const before = getDomainSnapshot();
      expect(store().lifecycles[id].state).toBe(action.state);
      for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
        store().setPerspective(perspective);
        for (const side of ["pharmacy", "nhsbsa"] as const) {
          expect(visitFollowedCase(side)).toBe(side === "pharmacy" ? `/pharmacy/claims?case=${id}` : `/case/${id}`);
          const html = render();
          expect(html).toContain(`Following ${id} | Paper`);
          expect(html).toContain(action.label);
          expect(html).toMatch(/<button[^>]*>Pharmacy view<\/button>/);
          expect(html).toMatch(/<button[^>]*>NHSBSA view<\/button>/);
          expect(store().demoStep).toBe(10);
          expect(store().agentEnabled).toBe(enabled);
          expect(getDomainSnapshot()).toEqual(before);
        }
      }
    }
    expect(store().lifecycles[id].history.some((event) => event.decision === "REQUEST_INFORMATION" && event.reason === question)).toBe(true);
    expect(store().lifecycles[id].history.some((event) => event.actor === "pharmacy" &&
      event.from === "information_requested" && event.to === "resubmitted")).toBe(true);
    expect(store().caseRevisions[id].at(-1)?.confirmation).toBe(answer);
  });

  it.each([false, true])("follows actual unreadable paper submission, capture and human release, Agent=%s", (enabled) => {
    const id = "EX-24123";
    store().setAgentEnabled(enabled);
    store().setDemoStep(10);
    store().followCase(id);
    const prepared = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!, "complete");
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
          expect(html).toContain(itemStateLabel(store().lifecycles[id], store().perspective, enabled, store().itemProcesses[id]));
          expect(html).toContain(location);
          expect(html).toContain(followedLastEvent(store().lifecycles[id]));
          expect(html).toContain("Pharmacy view");
          expect(html).toContain("NHSBSA view");
        }
      }
    };
    store().submitItem({ ...prepared, caseId: id, channel: "paper" });
    checkpoint("Type 1: capture");
    const submitted = store().caseRevisions[id].at(-1)!;
    store().confirmType1({ caseId: id, revision: submitted.number, fields: submitted.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    checkpoint("Type 2: awaiting operator release");
    if (enabled) {
      store().applySuggestionToDecision(id);
      checkpoint("Type 2: awaiting operator release");
    }
    store().releaseToPricing(id, "Human reconciled the corrected declaration and source evidence.");
    checkpoint("Released to existing pricing");
    expect(store().lifecycles[id].state).toBe("released_to_pricing");
    expect(render()).toContain("after operator review");
    expect(render()).not.toContain("no operator action");
    expect(render()).toContain("Released after operator review");
    if (enabled) {
      const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!, "missing");
      store().setPharmacyDraft(id, { ...draft, purpose: "new_submission" });
      store().applySuggestedCorrection(id);
      expect(store().lifecycles[id].state).toBe("released_to_pricing");
      expect(render()).toContain("Pharmacy applied correction");
      expect(render()).toContain("after operator review");
      expect(render()).not.toContain("no operator action");
    }
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
