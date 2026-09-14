import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PharmacyClaimsPage } from "@/pages/pharmacy-claims";
import { LifecycleHistory } from "@/components/demo/lifecycle-history";
import { checkPharmacy, pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { MANUAL_LOOP_MONTH_DEFAULTS, formatProcessHours, formatProcessItems, monthModel } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function renderClaims() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/pharmacy/claims"] }, createElement(PharmacyClaimsPage)));
}

function recordedClaims() {
  return renderClaims().split('aria-label="Shared monthly process projection"')[0];
}

beforeEach(() => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setPerspective("both");
});

describe("claims presentation uses recorded events separately from monthly projections", () => {
  it("renders exact mode guides, four filters and five columns", () => {
    const markup = renderClaims();
    expect(markup).toContain('role="group" aria-label="Claim filters"');
    expect(markup).toContain("Today: referred-back items appear in MYS Unpaid items with an RB code");
    expect(markup.match(/aria-pressed=/g)).toHaveLength(4);
    expect(markup.match(/scope="col"/g)).toHaveLength(5);
    expect(recordedClaims()).not.toContain("Caught before submission");
    useAppStore.getState().setAgentEnabled(true);
    expect(renderClaims()).toContain("Read the operator-approved fix, correct the endorsement, then explicitly resubmit.");
  });

  it("reads caught counts from explicit pharmacy events, not ready revisions or projections", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    const c = caseForLifecycle("EX-24112", store.lifecycles, store.caseRevisions)!;
    const before = pharmacySnapshot(c.extracted.endorsementText, c.extracted.dispensingDate, "scripted",
      checkPharmacy(c, c.extracted.endorsementText), new Date().toISOString());
    const text = `${c.extracted.endorsementText} 21/08/26`;
    const after = pharmacySnapshot(text, c.extracted.dispensingDate, "scripted", checkPharmacy(c, text), new Date().toISOString());
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>0<\/dd>/);
    store.recordPharmacyCorrection(c.id, before, after, 2);
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>1<\/dd>/);
    store.recordPharmacyCorrection(c.id, before, after, 2);
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>1<\/dd>/);
    store.setManualLoopInput("preventionPercent", "30");
    const projection = monthModel({ ...MANUAL_LOOP_MONTH_DEFAULTS, preventionPercent: 30 });
    const markup = renderClaims();
    expect(markup).toContain(`data-pharmacy-model="prevented">${formatProcessItems(projection.cohorts.prevented)} (estimate)</dd>`);
    expect(markup).toMatch(new RegExp(`data-pharmacy-model="operatorHours"[^]*?aria-label="${formatProcessHours(projection.withAgent.operatorHours)}"`));
    expect(markup).toMatch(new RegExp(`data-pharmacy-model="pharmacyCompletionHours"[^]*?aria-label="${formatProcessHours(projection.withAgent.pharmacyCompletionHours)}"`));
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>1<\/dd>/);
    store.setAgentEnabled(false);
    expect(recordedClaims()).not.toContain("Caught before submission");
    store.setAgentEnabled(true);
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>1<\/dd>/);
    store.resetDemo();
    store.setAgentEnabled(true);
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>0<\/dd>/);
  });

  it("excludes another pharmacy and another month from actual catch counts", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    const c = caseForLifecycle("EX-24112", store.lifecycles, store.caseRevisions)!;
    const before = pharmacySnapshot(c.extracted.endorsementText, c.extracted.dispensingDate, "scripted",
      checkPharmacy(c, c.extracted.endorsementText), new Date().toISOString());
    const text = `${c.extracted.endorsementText} 21/08/26`;
    const after = pharmacySnapshot(text, c.extracted.dispensingDate, "scripted", checkPharmacy(c, text), new Date().toISOString());
    store.recordPharmacyCorrection(c.id, before, after, 2);
    const event = useAppStore.getState().pharmacyCorrections[0];
    useAppStore.setState({ pharmacyCorrections: [{ ...event, pharmacyCode: "FH774" }, { ...event, at: "2000-01-01T00:00:00Z" }] });
    expect(recordedClaims()).toMatch(/Caught before submission<\/dt><dd[^>]*>0<\/dd>/);
  });

  it("reports invalid model inputs without retaining stale projected values", () => {
    useAppStore.getState().setManualLoopInput("monthlyItems", "invalid");
    expect(renderClaims()).toContain("Shared monthly scenario unavailable");
    expect(renderClaims()).not.toContain("100,000,000 items");
  });

  it("counts monthly events once per item while excluding confirmations from corrections", () => {
    const store = useAppStore.getState();
    const at = new Date().toISOString();
    const b = store.lifecycles["EX-24112"];
    const c = store.lifecycles["EX-24123"];
    useAppStore.setState({
      lifecycles: {
        [b.caseId]: { ...b, history: [
          { at, actor: "pharmacy", from: null, to: "submitted", message: "Submitted" },
          { at, actor: "operator", from: "in_review", to: "referred_back", message: "Returned" },
          { at, actor: "operator", from: "in_review", to: "referred_back", message: "Returned again" },
        ] },
        [c.caseId]: { ...c, pharmacyCode: b.pharmacyCode, history: [
          { at: "2000-01-01T00:00:00Z", actor: "pharmacy", from: null, to: "submitted", message: "Old submission" },
        ] },
      },
      caseRevisions: {
        [b.caseId]: [...store.caseRevisions[b.caseId], { ...store.caseRevisions[b.caseId][0], number: 2, kind: "resubmission", at }],
        [c.caseId]: [...store.caseRevisions[c.caseId], { ...store.caseRevisions[c.caseId][0], number: 2, kind: "confirmation", at }],
      },
    });
    const markup = renderClaims();
    expect(markup).toMatch(/Submitted this month<\/dt><dd[^>]*>1<\/dd>/);
    expect(markup).toMatch(/Referred back<\/dt><dd[^>]*>1<\/dd>/);
    expect(markup).toMatch(/Corrected\/resubmitted<\/dt><dd[^>]*>1<\/dd>/);
    expect(markup).toMatch(/Paid<\/dt><dd[^>]*>0<\/dd>/);
  });
});

describe("claim history perspective boundaries", () => {
  for (const perspective of ["pharmacy", "nhsbsa", "both"] as const) {
    for (const pharmacy of [false, true]) {
      it(`history audience pharmacy=${pharmacy} perspective=${perspective}`, () => {
        useAppStore.getState().setPerspective(perspective);
        const markup = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LifecycleHistory, { id: "EX-24112", pharmacy })));
        expect(markup.includes("Follow this case")).toBe(true);
        expect(markup.includes("Open shared queue")).toBe(perspective !== "pharmacy");
        expect(markup.includes(pharmacy ? "View NHSBSA case" : "View pharmacy claim")).toBe(pharmacy ? perspective !== "pharmacy" : perspective !== "nhsbsa");
        expect(markup).toContain('aria-label="Lifecycle events"');
        expect(markup).toContain('aria-label="Immutable pharmacy attempts"');
      });
    }
  }
});
