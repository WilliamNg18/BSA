import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CasePackPage } from "../../src/pages/case-pack";
import { NotificationContext } from "../../src/hooks/use-notification";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { runAgent } from "../../src/lib/domain/agent";
import { caseById } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";

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
    const template = caseById("EX-24112")!;
    store.submitItem({ caseId: template.id, channel: "paper", endorsementText: template.paperDeclaration!.endorsementText,
      paperDeclaration: template.paperDeclaration });
    store.arriveInQueue(template.id);
    if (!enabled) {
      const initial = getDomainSnapshot();
      const manual = casePack(template.id).match(/<input(?=[^>]*value="ACCEPT")[^>]*>/)?.[0];
      expect(manual).toBeTruthy();
      expect(manual).not.toMatch(/\schecked(?:=|\s|>)/);
      expect(getDomainSnapshot()).toEqual(initial);
    }
    store.referBack(template.id, "RB2B", buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
    const revision = useAppStore.getState().caseRevisions[template.id].at(-1)!;
    const draft = initialisePharmacyDraft(sessionCase(template.id)!, revision);
    store.setPharmacyDraft(template.id, { ...draft, purpose: "correction", paperDeclaration: {
      ...draft.paperDeclaration!, brandManufacturer: template.pharmacySupplyRecord!.brandManufacturer,
    } });
    const unacknowledged = getDomainSnapshot();
    expect(() => store.resubmit(template.id)).toThrow("must be checked");
    expect(getDomainSnapshot()).toEqual(unacknowledged);
    store.setCorrectionAcknowledgement(template.id, revision.number, true);
    store.resubmit(template.id);
    expect(useAppStore.getState().lifecycles[template.id].state).toBe("resubmitted");
    expect(useAppStore.getState().itemProcesses[template.id].readyToRelease).toBe(true);
    expect(useAppStore.getState().itemVerification[template.id].released).toBe(false);
    store.arriveInQueue("EX-24112");
    expect(useAppStore.getState().itemProcesses["EX-24112"].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(runAgent(sessionCase("EX-24112")!, { agentEnabled: enabled })).toMatchObject(enabled
      ? { agentInvoked: true, recommendation: "SUFFICIENT", gate: { result: "PASS" } }
      : { agentInvoked: false, recommendation: "NONE" });
    const before = getDomainSnapshot();
    const html = casePack("EX-24112");
    expect(html).toContain("Sufficient (human choice)");
    expect(html).not.toContain("data-automatic-case");
    expect(html).not.toContain("Cleared by deterministic rules; the agent was not called");
    const sufficient = html.match(/<input(?=[^>]*value="ACCEPT")[^>]*>/)?.[0];
    expect(sufficient).toBeTruthy();
    expect(sufficient).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(sufficient).toMatch(/\schecked(?:=|\s|>)/);
    expect(before.operatorDrafts[template.id]).toMatchObject({ outcome: "ACCEPT", appliedSuggestion: false });
    if (!enabled) {
      expect(html).not.toContain("Replay step by step");
    }
    expect(getDomainSnapshot()).toEqual(before);
    expect(() => store.releaseToPricing("EX-24112", "")).toThrow();
    expect(getDomainSnapshot()).toEqual(before);
    store.releaseToPricing("EX-24112", "Human checked the corrected brand evidence");
    expect(useAppStore.getState().lifecycles["EX-24112"].state).toBe("released_to_pricing");
    expect(useAppStore.getState().records.at(-1)?.recommendation).toBe("NONE");
    expect(useAppStore.getState().lifecycles[template.id].history.at(-1)).toMatchObject({
      actor: "operator", releaseOrigin: "human_decision", decision: "ACCEPT",
    });
  });

  it("does not enable release of abstained evidence with assistance on", () => {
    const store = useAppStore.getState();
    store.confirmType1({ caseId: "EX-24123", revision: 1, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null } });
    store.setAgentEnabled(true);
    const before = getDomainSnapshot();
    const html = casePack("EX-24123");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Release to pricing<\/button>/);
    expect(html).toContain("The agent abstained");
    expect(() => store.releaseToPricing("EX-24123", "Human judgement cannot repair unknown evidence.")).toThrow();
    expect(getDomainSnapshot()).toEqual(before);
  });
});
