import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CasePackPage } from "../../src/pages/case-pack";
import { CaseTracePage } from "../../src/pages/case-trace";
import { DecisionRecordPage } from "../../src/pages/decision-record";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { OperatorActionPanel } from "../../src/components/demo/operator-action-panel";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import * as recommendations from "../../src/lib/domain/recommendations";

vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return { ...actual, useAppStore: Object.assign(
    <T,>(selector: (state: ReturnType<typeof actual.useAppStore.getState>) => T) => selector(actual.useAppStore.getState()),
    actual.useAppStore,
  ) };
});

beforeEach(() => { vi.restoreAllMocks(); useAppStore.getState().resetDemo(); });

function renderRoute(id: string, page: "pack" | "trace" | "record") {
  const suffix = page === "pack" ? "" : `/${page}`;
  const component = page === "pack" ? CasePackPage : page === "trace" ? CaseTracePage : DecisionRecordPage;
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}${suffix}`] },
    createElement(Routes, null, createElement(Route, { path: `/case/:id${suffix}`, element: createElement(component) }))));
}

describe("always-visible operator recommendations", () => {
  it.each(["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"])("shows exactly one complete card on each %s case surface without mutation", (id) => {
    useAppStore.getState().setAgentEnabled(true);
    const before = getDomainSnapshot();
    for (const page of ["pack", "trace", "record"] as const) {
      const html = renderRoute(id, page);
      expect(html.match(new RegExp(`data-recommendation-case="${id}"`, "g"))).toHaveLength(1);
      for (const label of ["Tariff version", "Requirement results", "Recommended outcome", "Confidence signals",
        "the agent verifies and advises; a person decides"]) expect(html).toContain(label);
    }
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("does not derive or show new recommendations in Off mode", () => {
    const derive = vi.spyOn(recommendations, "deriveRecommendation");
    const before = getDomainSnapshot();
    for (const page of ["pack", "trace", "record"] as const) expect(renderRoute("EX-24112", page)).not.toContain("data-recommendation-case");
    expect(derive).not.toHaveBeenCalled();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows advice during Type 1 without providing a diagnostic Apply before capture", () => {
    useAppStore.getState().setAgentEnabled(true);
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123", compact: true }));
    expect(html).toContain('data-recommendation-case="EX-24123"');
    expect(html).toContain("declared by the pharmacy, not read from the form");
    expect(html).not.toContain(">Apply suggestion</button>");
    expect(html).toContain("Confirm capture and continue to Type 2");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows the actual concrete date and preview before any human Apply", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO RK" });
    store.arriveInQueue("EX-24112");
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(OperatorActionPanel, { caseId: "EX-24112" })));
    expect(html).toContain("21/08/2026");
    expect(html).toContain("NCSO RK 21/08/26");
    expect(html).toContain("Operator draft preview");
    expect(html).toContain(">Apply suggestion</button>");
    expect(before.operatorDrafts["EX-24112"]).toBeUndefined();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("retains failed verification and abstention when a safe diagnostic draft is explicitly applied", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    store.confirmType1({ caseId: "EX-24123", revision: 1, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null } });
    const before = getDomainSnapshot();
    const render = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(OperatorActionPanel, { caseId: "EX-24123" })));
    const html = render();
    expect(html).toContain("Safe human follow-up");
    expect(html).toContain("ABSTAIN");
    expect(html).toContain(">Apply suggestion</button>");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Release to pricing<\/button>/);
    expect(getDomainSnapshot()).toEqual(before);
    store.applySuggestionToDecision("EX-24123");
    const applied = getDomainSnapshot();
    expect(applied.operatorDrafts["EX-24123"]).toMatchObject({ outcome: "REFER_BACK", rbCode: "RB2B", appliedSuggestion: true });
    expect(applied.itemVerification).toEqual(before.itemVerification);
    expect(applied.lifecycles["EX-24123"].state).toBe(before.lifecycles["EX-24123"].state);
    expect(applied.lifecycles["EX-24123"].history.at(-1)?.actor).toBe("operator");
    expect(render()).toContain("ABSTAIN");
    expect(render()).toMatch(/<button[^>]*disabled=""[^>]*>Release to pricing<\/button>/);
  });

  it("keeps an escalated case on actionable current advice rather than a read-only prior record", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO RK" });
    store.arriveInQueue("EX-24112");
    store.recordType2Decision({ caseId: "EX-24112", decision: "ESCALATE", reason: "Senior evidence review is required." });
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(OperatorActionPanel, { caseId: "EX-24112" })));
    expect(html).toContain("Current revision");
    expect(html).toContain(">Apply suggestion</button>");
  });

  it.each([false, true])("shows the exact current pharmacy answer immediately on every case surface, Agent %s", (enabled) => {
    const store = useAppStore.getState();
    store.setAgentEnabled(enabled);
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO RK" });
    store.arriveInQueue("EX-24112");
    store.requestInformation("EX-24112", "Please confirm the endorsement date.");
    const answer = "The pharmacy confirms the supplied date needs correction.";
    store.sendConfirmation("EX-24112", answer);
    const before = getDomainSnapshot();
    for (const page of ["pack", "trace", "record"] as const) {
      const html = renderRoute("EX-24112", page);
      expect(html.match(/data-pharmacy-confirmation="EX-24112"/g)).toHaveLength(1);
      const confirmation = html.match(/<section aria-label="Pharmacy confirmation"[\s\S]*?<\/section>/)?.[0];
      expect(confirmation).toContain(answer);
      expect(confirmation).toContain('role="status"');
      expect(confirmation).not.toContain("<details");
    }
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows a received Type 1 answer without treating free text as captured prescriber evidence", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    const source = store.caseRevisions["EX-24123"].at(-1)!;
    store.submitItem({ caseId: "EX-24123", channel: "paper", endorsementText: source.paperDeclaration!.endorsementText,
      paperDeclaration: source.paperDeclaration, declaration: source.declaration });
    const revision = useAppStore.getState().caseRevisions["EX-24123"].at(-1)!.number;
    store.confirmType1({ caseId: "EX-24123", revision, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null } });
    store.requestInformation("EX-24123", "Please confirm the prescriber against readable evidence.");
    const answer = "Prescriber confirmation supplied separately by the pharmacy.";
    store.sendConfirmation("EX-24123", answer);
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123", compact: true }));
    expect(html).toContain('data-pharmacy-confirmation="EX-24123"');
    expect(html).toContain(answer);
    expect(html).toMatch(/<input[^>]*id="[^"]*-prescriber"[^>]*value=""/);
    expect(getDomainSnapshot()).toEqual(before);
  });
});
