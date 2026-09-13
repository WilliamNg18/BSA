import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PharmacyClaimsPage } from "@/pages/pharmacy-claims";
import { LifecycleHistory } from "@/components/demo/lifecycle-history";
import { checkPharmacy, pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { PROCESS_MONTH_DEFAULTS, monthModel } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function renderClaims(caseId?: string) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/pharmacy/claims${caseId ? `?caseId=${caseId}` : ""}`] }, createElement(PharmacyClaimsPage)));
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
    store.setProcessInput("pharmacyCatchPercent", "30");
    const projection = monthModel({ ...PROCESS_MONTH_DEFAULTS, pharmacyCatchPercent: 30 });
    const markup = renderClaims();
    expect(markup).toContain(`Caught before submission</dt><dd>${new Intl.NumberFormat("en-GB").format(projection.withAgent.caughtBeforeSubmission)}</dd>`);
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
    useAppStore.getState().setProcessInput("monthlyItems", "invalid");
    expect(renderClaims()).toContain("Shared monthly scenario unavailable");
    expect(renderClaims()).not.toContain("100,000,000 items");
  });

  it("counts monthly events once per item while excluding confirmations from corrections", () => {
    const store = useAppStore.getState();
    const at = new Date().toISOString();
    const b = store.lifecycles["EX-24112"];
    const c = store.lifecycles["EX-24119"];
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
        expect(markup.includes("Follow this case")).toBe(perspective === "both");
        expect(markup.includes("Open shared queue")).toBe(perspective !== "pharmacy");
        expect(markup.includes(pharmacy ? "View NHSBSA case" : "View pharmacy claim")).toBe(pharmacy ? perspective !== "pharmacy" : perspective !== "nhsbsa");
        expect(markup).toContain('aria-label="Lifecycle events"');
        expect(markup).toContain('aria-label="Immutable pharmacy attempts"');
      });
    }
  }
});

describe("process claim evidence", () => {
  it("attributes an automatic EPS item to existing pricing without inventing human review", () => {
    const store = useAppStore.getState();
    const c = caseForLifecycle("EX-24107", store.lifecycles, store.caseRevisions)!;
    store.submitItem({ caseId: c.id, channel: "eps", endorsementText: c.extracted.endorsementText });
    const before = useAppStore.getState().lifecycles;
    const markup = renderClaims(c.id);
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
      const on = renderClaims(caseId);
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
      const off = renderClaims(caseId);
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
    const markup = renderClaims(caseId);
    expect(markup).toContain("Immutable pharmacy declaration");
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
    const markup = renderClaims(caseId);
    expect(markup).toContain("Paid on the normal schedule");
    expect(markup).toContain("priced by NHSBSA&#x27;s existing rules engine");
    expect(markup).not.toContain("no person involved");
  });

  it("shows a blind paper submission without inventing a pharmacy declaration", () => {
    const store = useAppStore.getState();
    const caseId = "EX-24123";
    store.submitItem({ caseId, channel: "paper", endorsementText: "" });
    const markup = renderClaims(caseId);
    expect(markup).toContain("Paper");
    expect(markup).not.toContain("Immutable pharmacy declaration");
    expect(markup).not.toContain("no person involved");
    expect(useAppStore.getState().itemProcesses[caseId].routing.outcome).toBe("type1_capture");
    expect(useAppStore.getState().caseRevisions[caseId].at(-1)?.endorsementText).toBe("");
  });
});
