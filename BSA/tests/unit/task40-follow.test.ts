import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowBanner } from "../../src/components/demo/follow-banner";
import { LifecycleHistory } from "../../src/components/demo/lifecycle-history";
import { BACKGROUND_CASES, PLAYABLE_CASE_IDS, caseById } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";
import { getAsSubmitted } from "../../src/lib/domain/submission-views";
import { itemStateLabel } from "../../src/lib/domain/lifecycle";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { followDestination, visitFollowedCase } from "../../src/lib/follow-navigation";
import { followedLastEvent, historyStateLabel } from "../../src/lib/follow-presentation";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const store = () => useAppStore.getState();
const strength = "SYN-FQ123-MISMATCH", paper = "EX-24112";
const renderBanner = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FollowBanner)));
const renderHistory = (id: string) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LifecycleHistory, { id })));
beforeEach(() => {
  store().resetDemo();
  store().setPerspective("both");
});

function visitEverySide(id: string, location: string) {
  const snapshot = getDomainSnapshot(), enabled = store().agentEnabled, step = store().demoStep;
  const submitted = getAsSubmitted(store(), id);
  for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
    store().setPerspective(perspective);
    for (const side of ["pharmacy", "nhsbsa"] as const) {
      expect(visitFollowedCase(side)).toBe(followDestination(side, id));
      const row = store().lifecycles[id], process = store().itemProcesses[id];
      const html = renderBanner();
      expect(html).toContain(`Following ${id} | ${process.channel === "eps" ? "EPS" : "Paper"}`);
      expect(html).toContain(itemStateLabel(row, store().perspective, enabled, process));
      expect(html).toContain(location);
      expect(html).toContain(followedLastEvent(row));
      expect(html).toMatch(/<button[^>]*>Pharmacy view<\/button>/);
      expect(html).toMatch(/<button[^>]*>NHSBSA view<\/button>/);
      expect(getDomainSnapshot()).toEqual(snapshot);
      expect(getAsSubmitted(store(), id)).toEqual(submitted);
      expect(store().followedCaseId).toBe(id);
      expect(store().demoStep).toBe(step);
      expect(store().agentEnabled).toBe(enabled);
    }
  }
}

describe("Task 40 Follow uses actual acknowledgements and channel-specific rechecks", () => {
  it.each([false, true])("shows the existing simultaneous month without creating a stage, Agent=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    store().setDemoStep(10);
    const initial = getDomainSnapshot();
    const locations = {
      "EX-24107": "Released to existing pricing",
      "SYN-FQ123-MISMATCH": "Referred back to pharmacy",
      "EX-24112": "Type 2: awaiting operator release",
      "EX-24123": "Type 1: capture",
    };
    for (const id of PLAYABLE_CASE_IDS) {
      store().followCase(id);
      visitEverySide(id, locations[id]);
    }
    expect(getDomainSnapshot()).toEqual(initial);
    expect(store().lifecycles["EX-24107"].state).toBe("paid");
    expect(store().lifecycles[strength].state).toBe("referred_back");
    expect(store().lifecycles[paper].state).toBe("resubmitted");
    expect(renderHistory(paper)).toContain("Resubmitted, ready to release");
    expect(BACKGROUND_CASES.every(({ id }) => !store().lifecycles[id])).toBe(true);
  });

  it.each([false, true])("keeps the wrong-strength audit/referral/ACK history through automatic recheck, Agent=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    store().setDemoStep(10);
    store().followCase(strength);
    const eps = caseById(strength)!.epsPrescription!;
    store().submitItem({ caseId: strength, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps });
    const revision = store().caseRevisions[strength].at(-1)!;
    const original = getAsSubmitted(store(), strength);
    if (enabled) {
      expect(store().lifecycles[strength].state).toBe("submitted");
      expect(store().itemVerification[strength].released).toBe(false);
      visitEverySide(strength, "Type 2: review");
      store().arriveInQueue(strength);
    } else {
      expect(store().lifecycles[strength].state).toBe("paid");
      visitEverySide(strength, "Released to existing pricing");
      const pricedHistory = [...store().lifecycles[strength].history];
      store().reopenForAudit(strength, revision.number, "A later audit queries the endorsed strength.");
      expect(store().lifecycles[strength].history.slice(0, -1)).toEqual(pricedHistory);
      expect(renderBanner()).toContain("Operator reopened for audit");
    }
    visitEverySide(strength, "Type 2: review");
    const note = buildReferralNote([{ rule: "strength_matches_prescription" }]);
    store().referBack(strength, "RB2B", note);
    const referralHistory = [...store().lifecycles[strength].history];
    visitEverySide(strength, "Referred back to pharmacy");
    expect(renderBanner()).toContain(", RB2B (synthetic)");
    const draft = initialisePharmacyDraft(sessionCase(strength)!, revision);
    store().setPharmacyDraft(strength, { ...draft, purpose: "correction" });
    if (enabled) {
      store().applySuggestedCorrection(strength);
      expect(renderBanner()).toContain("Pharmacy applied correction");
    } else {
      store().setPharmacyDraft(strength, { ...draft, purpose: "correction", epsPrescription: {
        ...draft.epsPrescription!, items: draft.epsPrescription!.items.map((item) => ({
          ...item, dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets",
        })),
      } });
    }
    visitEverySide(strength, "Referred back to pharmacy");
    expect(getAsSubmitted(store(), strength)).toEqual(original);
    for (const acknowledged of [true, false, true]) {
      store().setCorrectionAcknowledgement(strength, revision.number, acknowledged);
      expect(renderBanner()).toContain(acknowledged ? "Pharmacy acknowledged correction" : "Pharmacy withdrew acknowledgement");
      expect(store().lifecycles[strength].history.at(-1)).toMatchObject({
        actor: "pharmacy", from: "referred_back", to: "referred_back", processStep: "correction_acknowledged",
      });
      visitEverySide(strength, "Referred back to pharmacy");
    }
    const acknowledgement = store().pharmacyDrafts[strength].correctionAcknowledgement;
    store().resubmit(strength);
    const row = store().lifecycles[strength];
    expect(row.state).toBe(enabled ? "released_to_pricing" : "paid");
    expect(row.history.slice(0, referralHistory.length)).toEqual(referralHistory);
    expect(row.history.at(-1)?.actor).toBe("code");
    expect(store().caseRevisions[strength].at(-1)?.correctionAcknowledgement).toEqual(acknowledgement);
    expect(store().itemProcesses[strength].routing.requiresHuman).toBe(false);
    visitEverySide(strength, "Released to existing pricing");
    expect(renderBanner()).not.toContain("after operator review");
    expect(store().lifecycles[strength].history.find((event) => event.decision === "REFER_BACK" && event.revision === revision.number)?.reason).toBe(note);
    if (enabled) {
      expect(renderBanner()).toContain("no operator action");
      expect(row.history.at(-1)?.releaseOrigin).toBe("automatic_verification");
      const index = row.history.findIndex((event) => event.decision === "REFER_BACK" && event.revision === revision.number);
      expect(historyStateLabel(row, index, "nhsbsa", enabled)).not.toContain("no operator action");
      store().setAgentEnabled(false);
      expect(renderBanner()).toContain("no operator action");
    }
  });

  it.each([false, true])("shows acknowledged paper ready to release until the actual operator press, Agent=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    store().setDemoStep(10);
    store().followCase(paper);
    const source = caseById(paper)!;
    store().submitItem({ caseId: paper, channel: "paper", endorsementText: source.paperDeclaration!.endorsementText,
      paperDeclaration: source.paperDeclaration });
    visitEverySide(paper, "Type 2: review");
    store().arriveInQueue(paper);
    const note = buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]);
    store().referBack(paper, "RB2B", note);
    visitEverySide(paper, "Referred back to pharmacy");
    const revision = store().caseRevisions[paper].at(-1)!;
    const draft = initialisePharmacyDraft(sessionCase(paper)!, revision);
    store().setPharmacyDraft(paper, { ...draft, purpose: "correction" });
    if (enabled) store().applySuggestedCorrection(paper);
    else store().setPharmacyDraft(paper, { ...draft, purpose: "correction",
      paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: source.pharmacySupplyRecord!.brandManufacturer } });
    visitEverySide(paper, "Referred back to pharmacy");
    store().setCorrectionAcknowledgement(paper, revision.number, true);
    expect(renderBanner()).toContain("Pharmacy acknowledged correction");
    visitEverySide(paper, "Referred back to pharmacy");
    const history = [...store().lifecycles[paper].history];
    store().resubmit(paper);
    expect(store().lifecycles[paper].state).toBe("resubmitted");
    expect(store().operatorDrafts[paper].outcome).toBe("ACCEPT");
    expect(store().itemVerification[paper].released).toBe(false);
    expect(renderBanner()).toContain("Resubmitted, ready to release");
    expect(renderHistory(paper)).toContain("Resubmitted, ready to release");
    expect(renderBanner()).not.toContain("no operator action");
    visitEverySide(paper, "Type 2: awaiting operator release");
    store().releaseToPricing(paper, "Human checked the acknowledged paper amendment.");
    expect(store().lifecycles[paper].history.slice(0, history.length)).toEqual(history);
    expect(store().lifecycles[paper].history.at(-1)).toMatchObject({ actor: "operator", releaseOrigin: "human_decision" });
    visitEverySide(paper, "Released to existing pricing");
    expect(renderBanner()).toContain("after operator review");
    expect(renderBanner()).not.toContain("no operator action");
  });
});
