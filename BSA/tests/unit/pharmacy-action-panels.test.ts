import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PharmacyClaimActionPanel } from "@/components/demo/claim-detail";
import { PharmacyPage, PharmacySubmissionPanel } from "@/components/demo/pharmacy-workbench";
import { PharmacyClaimsPage } from "@/pages/pharmacy-claims";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { PharmacyReleasedCount, PharmacySubmissionReceipt } from "@/components/demo/pharmacy-submission-receipt";
import { useAppStore, getDomainSnapshot } from "@/lib/store";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";

const controls = vi.hoisted(() => new Map<string, () => void>());
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, asChild, ...props }: ComponentProps<"button"> & { "data-pharmacy-action"?: string; asChild?: boolean }) => {
    if (props["data-pharmacy-action"] && onClick) controls.set(props["data-pharmacy-action"], () => onClick({} as Parameters<NonNullable<typeof onClick>>[0]));
    return createElement(asChild ? "span" : "button", props, children);
  },
}));
vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});
const render = (component: ReturnType<typeof createElement>, path = "/") =>
  renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, component));
function currentDraft(id: string, channel?: "eps" | "paper") {
  const s = useAppStore.getState();
  return initialisePharmacyDraft(caseForLifecycle(id, s.lifecycles, s.caseRevisions, s.itemProcesses)!, s.caseRevisions[id].at(-1)!, channel);
}
function referB() {
  const s = useAppStore.getState();
  s.setAgentEnabled(true);
  s.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO RK" });
  s.arriveInQueue("EX-24112");
  s.recordType2Decision({ caseId: "EX-24112", decision: "REFER_BACK", rbCode: "SYN-NCSO",
    reason: "Add the dispensing date beside the initials.", approvedDraft: "Add the dispensing date beside the initials." });
}

beforeEach(() => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setPerspective("both");
  controls.clear();
  vi.stubGlobal("document", { getElementById: () => null });
});

describe("pharmacy panel human controls", () => {
  it("Apply writes the shared corrected field and pharmacy event, retains the approved response, and does not resubmit", () => {
    referB();
    const before = structuredClone(useAppStore.getState().caseRevisions["EX-24112"]);
    const initial = render(createElement(PharmacyClaimActionPanel, { caseId: "EX-24112" }));
    expect(initial).toContain("Operator-approved note");
    expect(initial).not.toContain("Submit another demonstration attempt");
    controls.get("apply-correction")!();
    const applied = useAppStore.getState();
    expect(applied.pharmacyDrafts["EX-24112"].endorsementText).toContain("21/08/26");
    expect(applied.caseRevisions["EX-24112"]).toEqual(before);
    expect(applied.lifecycles["EX-24112"].state).toBe("referred_back");
    expect(applied.lifecycles["EX-24112"].history.at(-1)).toMatchObject({ actor: "pharmacy", processStep: "correction_applied" });
    const html = render(createElement(PharmacyClaimActionPanel, { caseId: "EX-24112" }));
    expect(html).toContain("Operator-approved note");
    expect(html).toContain("Ready");
    expect(html).toContain("Changed fields highlighted");
    controls.get("resubmit")!();
    expect(useAppStore.getState().caseRevisions["EX-24112"].slice(0, -1)).toEqual(before);
    expect(useAppStore.getState().caseRevisions["EX-24112"].at(-1)).toMatchObject({ kind: "resubmission", number: before.at(-1)!.number + 1 });
    expect(useAppStore.getState().lifecycles["EX-24112"].history.some((event) => event.actor === "pharmacy" && event.processStep === "resubmission")).toBe(true);
  });

  it("Off retains manual draft fields and performs no advisory check or automatic Apply", () => {
    referB();
    useAppStore.getState().setAgentEnabled(false);
    const before = getDomainSnapshot();
    const html = render(createElement(PharmacyClaimActionPanel, { caseId: "EX-24112" }));
    expect(html).toContain("Resubmit blind");
    expect(html).toContain("Corrected endorsement");
    expect(html).toContain("Hypothetical");
    expect(html).not.toContain("Claims precheck");
    expect(controls.has("apply-correction")).toBe(false);
    expect(getDomainSnapshot()).toEqual(before);
    controls.get("resubmit")!();
    expect(useAppStore.getState().caseRevisions["EX-24112"].at(-1)?.precheck).toMatchObject({
      mode: "off", status: "not_checked", facts: null, checks: [], checkedAt: null,
    });
  });

  it.each([false, true])("preserves same drafts and sources across all perspectives, On=%s", (enabled) => {
    referB();
    const s = useAppStore.getState();
    s.setAgentEnabled(enabled);
    const draft = currentDraft("EX-24112");
    s.setPharmacyDraft("EX-24112", { ...draft, endorsementText: "Human unfinished draft",
      epsPrescription: draft.epsPrescription ? { ...draft.epsPrescription, dispenserEndorsement: "Human unfinished draft" } : undefined });
    const before = getDomainSnapshot();
    for (const perspective of ["pharmacy", "nhsbsa", "both"] as const) {
      s.setPerspective(perspective);
      expect(render(createElement(PharmacyClaimActionPanel, { caseId: "EX-24112" }))).toContain("Human unfinished draft");
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("Send confirmation uses retained input without changing conflicting source quantities", () => {
    const id = "EX-24112";
    const s = useAppStore.getState();
    s.submitItem({ caseId: id, channel: "eps", endorsementText: "NCSO RK" });
    s.arriveInQueue(id);
    s.requestInformation(id, "Please confirm the supplied endorsement with the original form.");
    const before = structuredClone(useAppStore.getState().caseRevisions[id]);
    s.setPharmacyDraft(id, { ...currentDraft(id), confirmation: "Please review both recorded quantities with the original form." });
    const html = render(createElement(PharmacyClaimActionPanel, { caseId: id }));
    expect(html).toContain(">Confirm");
    controls.get("confirmation")!();
    const after = useAppStore.getState();
    expect(after.caseRevisions[id].slice(0, -1)).toEqual(before);
    expect(after.caseRevisions[id].at(-1)?.confirmation).toBe("Please review both recorded quantities with the original form.");
    expect(after.lifecycles[id].history.some((event) => event.actor === "pharmacy" && event.to === "resubmitted")).toBe(true);
    const c = caseForLifecycle(id, after.lifecycles, after.caseRevisions, after.itemProcesses)!;
    const markup = render(createElement(ClaimDetail, { c, row: after.lifecycles[id] }));
    const confirmationAttempt = markup.split(`Attempt ${after.caseRevisions[id].at(-1)!.number} · confirmation`)[1];
    expect(confirmationAttempt).toContain("Check not recorded");
    expect(confirmationAttempt).not.toContain("· Seed");
    expect(confirmationAttempt).not.toContain("Full advisory snapshot");
  });

  it("compact panels expose only item actions and navigation never submits", () => {
    const before = getDomainSnapshot();
    const html = render(createElement(PharmacySubmissionPanel, { caseId: "EX-24107", channel: "eps", controls: "submit" }));
    expect(html).toContain("Send claim");
    for (const forbidden of ["Choose an EPS scenario", "Submission channel", "Restore draft", "Reset", "Apply suggested correction"]) expect(html).not.toContain(forbidden);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("fixes the first B workbench draft after Reset without approving or replacing the historical referral", () => {
    const id = "EX-24112";
    useAppStore.getState().setAgentEnabled(true);
    const before = structuredClone(useAppStore.getState().caseRevisions[id]);
    render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "eps" }));
    controls.get("apply-correction")!();
    const after = useAppStore.getState();
    expect(after.pharmacyDrafts[id]).toMatchObject({ purpose: "new_submission", appliedSuggestion: true });
    expect(after.pharmacyDrafts[id].endorsementText).toContain("21/08/26");
    expect(after.caseRevisions[id]).toEqual(before);
    expect(after.lifecycles[id].state).toBe("referred_back");
    expect(after.lifecycles[id].history.at(-1)?.approvedDraft).toBeUndefined();
    render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "eps" }));
    controls.get("submit")!();
    expect(useAppStore.getState().caseRevisions[id].at(-1)?.kind).toBe("submission");
    expect(useAppStore.getState().lifecycles[id].state).toBe("released_to_pricing");
  });

  it("counts a checked human correction before Send, once per attempt and across perspectives", () => {
    const s = useAppStore.getState(), caseId = "EX-24112";
    s.setAgentEnabled(true);
    expect(render(createElement(PharmacyClaimsPage))).toMatch(/Caught before submission<\/dt><dd[^>]*>0<\/dd>/);
    const before = structuredClone(s.caseRevisions[caseId]);
    render(createElement(PharmacySubmissionPanel, { caseId, channel: "eps" }));
    controls.get("apply-correction")!();
    for (const perspective of ["pharmacy", "nhsbsa", "both"] as const) {
      s.setPerspective(perspective);
      expect(render(createElement(PharmacyClaimsPage))).toMatch(/Caught before submission<\/dt><dd[^>]*>1<\/dd>/);
    }
    expect(useAppStore.getState().caseRevisions[caseId]).toEqual(before);
    s.setAgentEnabled(false);
    s.setAgentEnabled(true);
    expect(render(createElement(PharmacyClaimsPage))).toMatch(/Caught before submission<\/dt><dd[^>]*>1<\/dd>/);
    s.resetDemo();
    s.setAgentEnabled(true);
    expect(render(createElement(PharmacyClaimsPage))).toMatch(/Caught before submission<\/dt><dd[^>]*>0<\/dd>/);
  });

  it("does not count an approved referral correction as upfront prevention", () => {
    referB();
    render(createElement(PharmacyClaimActionPanel, { caseId: "EX-24112" }));
    controls.get("apply-correction")!();
    expect(useAppStore.getState().pharmacyDrafts["EX-24112"].appliedSuggestion).toBe(true);
    expect(render(createElement(PharmacyClaimsPage))).toMatch(/Caught before submission<\/dt><dd[^>]*>0<\/dd>/);
  });

  it("retains a human prescriber correction field beside the modern paper declaration", () => {
    const caseId = "EX-24123", s = useAppStore.getState();
    s.confirmType1({ caseId, revision: 1, fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null },
      provenance: "human_capture", declarationReconciled: false });
    s.referBack(caseId, "RB2B", "Please supply the missing prescriber and product details.");
    const before = getDomainSnapshot();
    const html = render(createElement(PharmacyClaimActionPanel, { caseId }));
    expect(html).toContain("Declared product");
    expect(html).toContain("Declared prescriber (synthetic)");
    expect(html).not.toContain("Dr Demo");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("the EPS Send control records an explicit pharmacy attempt without hidden Off checks", () => {
    const id = "EX-24107", before = structuredClone(useAppStore.getState().caseRevisions[id]);
    render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "eps" }));
    controls.get("submit")!();
    const after = useAppStore.getState(), revision = after.caseRevisions[id].at(-1)!;
    expect(after.caseRevisions[id].slice(0, -1)).toEqual(before);
    expect(revision.precheck).toMatchObject({ mode: "off", status: "not_checked", checkedAt: null });
    expect(after.itemVerification[id]).toMatchObject({ gate1: "none", gate2: "none" });
    expect(after.lifecycles[id].history.find((event) => event.revision === revision.number)).toMatchObject({ actor: "pharmacy" });
  });

  it("the ordinary B paper path explicitly posts paper without fabricating a declaration Off", () => {
    const id = "EX-24112", before = structuredClone(useAppStore.getState().caseRevisions[id]);
    const html = render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "paper" }));
    expect(html).toContain("Post paper");
    expect(html).not.toContain("Declared quantity");
    controls.get("submit")!();
    const after = useAppStore.getState().caseRevisions[id];
    expect(after.slice(0, -1)).toEqual(before);
    expect(after.at(-1)).toMatchObject({ channel: "paper", kind: "submission" });
    expect(after.at(-1)?.paperDeclaration).toBeUndefined();
    expect(after.at(-1)?.declaration).toBeUndefined();
  });

  it("generic Apply writes actual brand, pack and form without rewriting the EPS source", () => {
    const id = "SYN-FQ123-MISMATCH";
    useAppStore.getState().setAgentEnabled(true);
    const before = structuredClone(useAppStore.getState().caseRevisions[id]);
    render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "eps" }));
    controls.get("apply-correction")!();
    const after = useAppStore.getState();
    expect(after.pharmacyDrafts[id].epsPrescription?.supplyEvidence?.brandManufacturer).not.toBe("");
    expect(after.pharmacyDrafts[id].epsPrescription?.supplyEvidence?.packSize).toBe(21);
    expect(after.pharmacyDrafts[id].epsPrescription?.supplyEvidence?.form).not.toBe("");
    expect(after.caseRevisions[id]).toEqual(before);
    expect(after.lifecycles[id].history.at(-1)).toMatchObject({ actor: "pharmacy", processStep: "correction_applied" });
    expect(render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "eps" }))).toContain("Ready");
  });

  it.each([
    ["EX-24112", "endorsement"],
    ["SYN-FQ123-MISMATCH", "eps-pack"],
  ])("explicit Apply moves keyboard focus to the changed field for %s", (caseId, fieldId) => {
    useAppStore.getState().setAgentEnabled(true);
    const focus = vi.fn();
    const getElementById = vi.fn(() => ({ focus }));
    vi.stubGlobal("document", { getElementById });
    render(createElement(PharmacySubmissionPanel, { caseId, channel: "eps" }));
    controls.get("apply-correction")!();
    expect(getElementById).toHaveBeenCalledWith(fieldId);
    expect(focus).toHaveBeenCalledOnce();
    expect(useAppStore.getState().lifecycles[caseId].history.at(-1)?.actor).toBe("pharmacy");
  });

  it("keeps applied compact paper prose cumulatively below 25 words", () => {
    const id = "EX-24123", s = useAppStore.getState();
    s.setAgentEnabled(true);
    const draft = currentDraft(id, "paper");
    s.setPharmacyDraft(id, { ...draft, endorsementText: "NCSO JB",
      paperDeclaration: { ...draft.paperDeclaration!, endorsementText: "NCSO JB" } });
    render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "paper" }));
    controls.get("apply-correction")!();
    const html = render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "paper" }));
    const prose = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/g)].map((match) => match[1].replace(/<[^>]*>/g, "")).join(" ");
    expect(prose.trim().split(/\s+/).length).toBeLessThan(25);
  });

  it.each(["EX-24119", "EX-24088", "SYN-FQ123-READABLE", "SYN-FQ123-TYPE2"])("does not expose action controls for background %s", (caseId) => {
    const before = getDomainSnapshot();
    const html = render(createElement(PharmacyClaimActionPanel, { caseId }));
    expect(html).toContain("Background only, not playable");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<button");
    expect(getDomainSnapshot()).toEqual(before);
  });
});

describe("recorded receipt and release count", () => {
  it("keeps original and recorded EPS landmarks distinct without changing either source", () => {
    const caseId = "EX-24107", s = useAppStore.getState();
    s.submitItem({ ...currentDraft(caseId, "eps"), caseId, channel: "eps" });
    const before = getDomainSnapshot();
    const html = render(createElement(PharmacyPage), `/pharmacy?case=${caseId}&channel=eps`);
    expect(html.match(/aria-label="Submitted electronic prescription, synthetic"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Recorded claim: Submitted electronic prescription, synthetic"');
    expect(html).toContain('aria-label="Recorded claim: Recorded dispenser claim"');
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("only labels actual code release no-operator, never a precheck or toggle", () => {
    const id = "EX-24107";
    const s = useAppStore.getState();
    s.setAgentEnabled(true);
    s.submitItem({ ...currentDraft(id, "eps"), caseId: id, channel: "eps" });
    const number = useAppStore.getState().caseRevisions[id].at(-1)!.number;
    const html = render(createElement(PharmacySubmissionReceipt, { caseId: id, revisionNumber: number, compact: true }));
    expect(html).toContain("released to existing pricing, no operator action");
    expect(html).toContain("Gate 1");
    expect(html).not.toContain("will release");
    s.setAgentEnabled(false);
    expect(render(createElement(PharmacySubmissionReceipt, { caseId: id, revisionNumber: number, compact: true }))).toBe(html);
    expect(render(createElement(PharmacyReleasedCount))).toMatch(/data-pharmacy-released-count="true">1</);
    s.setManualLoopInput("preventionPercent", "1");
    expect(render(createElement(PharmacyReleasedCount))).toMatch(/data-pharmacy-released-count="true">1</);
  });

  describe("ordinary pharmacy preserves demo exit context", () => {
    it.each([
      ["EX-24107", "eps"], ["EX-24112", "eps"], ["SYN-FQ123-MISMATCH", "eps"], ["EX-24123", "paper"],
    ])("keeps %s and its channel without submission on exit", (caseId, channel) => {
      const s = useAppStore.getState();
      s.followCase(caseId);
      s.setAgentEnabled(true);
      s.setDemoStep(3);
      const before = getDomainSnapshot();
      s.setDemoStep(null);
      const html = render(createElement(PharmacyPage), `/pharmacy?case=${caseId}&channel=${channel}`);
      expect(html).toContain(`data-pharmacy-case="${caseId}"`);
      expect(html).toContain(channel === "eps" ? "Send claim" : "Post paper with declaration");
      if (channel === "eps") expect(html).toContain('aria-label="Choose an EPS scenario"');
      expect(useAppStore.getState().followedCaseId).toBe(caseId);
      expect(useAppStore.getState().agentEnabled).toBe(true);
      expect(getDomainSnapshot()).toEqual(before);
    });

    it("supports existing caseId links and derives their canonical channel", () => {
      const html = render(createElement(PharmacyPage), "/pharmacy?caseId=EX-24123");
      expect(html).toContain('data-pharmacy-case="EX-24123"');
      expect(html).toContain("Post paper");
      expect(html).not.toContain("Send claim");
    });

    it.each(["case=EX-24119", "case=EX-24107&channel=paper", "case=EX-24107&channel=unknown"])("never silently edits a different item for %s", (query) => {
      const before = getDomainSnapshot();
      const html = render(createElement(PharmacyPage), `/pharmacy?${query}`);
      expect(html).toContain("Unknown or mismatched example");
      expect(html).not.toContain("data-pharmacy-case");
      expect(getDomainSnapshot()).toEqual(before);
    });
  });

  it("never relabels a human-origin release no-operator", () => {
    const id = "EX-24107";
    const s = useAppStore.getState();
    const row = s.lifecycles[id];
    const verification = { gate1: "pass" as const, gate2: "pass" as const, reconciled: true, released: true };
    useAppStore.setState({ lifecycles: { ...s.lifecycles, [id]: { ...row, state: "released_to_pricing", history: [...row.history,
      { at: new Date().toISOString(), actor: "operator", from: "in_review", to: "released_to_pricing", revision: 1,
        message: "Human release", verification, releaseOrigin: "human_decision" }] } } });
    const html = render(createElement(PharmacySubmissionReceipt, { caseId: id, revisionNumber: 1, compact: true }));
    expect(html).toContain("after operator review");
    expect(html).not.toContain("no operator action");
  });

  it("keeps a receipt's release attribution after a later same-state pharmacy Apply", () => {
    const id = "EX-24107", s = useAppStore.getState();
    s.setAgentEnabled(true);
    s.submitItem({ ...currentDraft(id, "eps"), caseId: id, channel: "eps" });
    const revisionNumber = useAppStore.getState().caseRevisions[id].at(-1)!.number;
    const draft = currentDraft(id, "eps");
    s.setPharmacyDraft(id, { ...draft, purpose: "new_submission", endorsementText: "NCSO JB",
      epsPrescription: { ...draft.epsPrescription!, dispenserEndorsement: "NCSO JB" } });
    s.applySuggestedCorrection(id);
    expect(useAppStore.getState().lifecycles[id].history.at(-1)?.actor).toBe("pharmacy");
    const html = render(createElement(PharmacySubmissionReceipt, { caseId: id, revisionNumber, compact: true }));
    expect(html).toContain("released to existing pricing, no operator action");
    expect(html).toContain("Paid on the normal schedule");
  });

  it("does not invent no-operator verification for an unattributed release record", () => {
    const id = "EX-24107", s = useAppStore.getState(), row = s.lifecycles[id];
    useAppStore.setState({ lifecycles: { ...s.lifecycles, [id]: { ...row, state: "released_to_pricing", history: [...row.history,
      { at: new Date().toISOString(), actor: "code", from: "in_review", to: "released_to_pricing", revision: 1, message: "Legacy release" }] } } });
    const html = render(createElement(PharmacySubmissionReceipt, { caseId: id, revisionNumber: 1, compact: true }));
    expect(html).toContain("verification provenance unavailable");
    expect(html).not.toContain("no operator action");
    expect(html).not.toContain("Paid on the normal schedule");
  });
});
