import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { PharmacyClaimActionPanel } from "@/components/demo/claim-detail";
import { PharmacySubmissionPanel } from "@/components/demo/pharmacy-workbench";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { getDomainSnapshot, useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const id = "EX-24112";
const approvalLabel = "Operator-approved; the agent verified and advised.";
const render = (component: ReturnType<typeof createElement>) => renderToStaticMarkup(createElement(MemoryRouter, null, component));
const renderClaim = () => render(createElement(PharmacyClaimActionPanel, { caseId: id }));

beforeEach(() => useAppStore.getState().resetDemo());

function approveReferralAfterConfirmation() {
  const s = useAppStore.getState();
  s.setAgentEnabled(true);
  s.submitItem({ caseId: id, channel: "eps", endorsementText: "NCSO RK" });
  s.arriveInQueue(id);
  s.requestInformation(id, "Please confirm the current synthetic evidence for EX-24112.");
  s.sendConfirmation(id, "The pharmacy confirms its recorded evidence for EX-24112; a human must reconcile it.");
  s.arriveInQueue(id);
  s.applySuggestionToDecision(id);
  const draft = useAppStore.getState().operatorDrafts[id];
  s.referBack(id, draft.rbCode, draft.note);
}

it("shows existing current-revision approval before any pharmacy edit after request and confirmation", () => {
  approveReferralAfterConfirmation();
  const before = getDomainSnapshot(), revision = before.caseRevisions[id].at(-1)!;
  expect(before.pharmacyDrafts[id]).toBeUndefined();
  expect(before.records.at(-1)?.approvedDraft).toBeDefined();
  expect(before.records.at(-1)?.revision).toBe(revision.number);
  const html = renderClaim();
  expect(html).toContain('data-recommendation-case="EX-24112"');
  expect(html).toContain(approvalLabel);
  expect(getDomainSnapshot()).toEqual(before);
});

it("never labels a new-submission workbench recommendation as an approved referral", () => {
  approveReferralAfterConfirmation();
  const before = getDomainSnapshot();
  const html = render(createElement(PharmacySubmissionPanel, { caseId: id, channel: "eps" }));
  expect(html).toContain('data-recommendation-case="EX-24112"');
  expect(html).not.toContain(approvalLabel);
  expect(getDomainSnapshot()).toEqual(before);
});

it("preserves an explicitly selected new-submission draft even in claim detail", () => {
  approveReferralAfterConfirmation();
  const s = useAppStore.getState(), revision = s.caseRevisions[id].at(-1)!;
  const c = caseForLifecycle(id, s.lifecycles, s.caseRevisions, s.itemProcesses)!;
  s.setPharmacyDraft(id, { ...initialisePharmacyDraft(c, revision), purpose: "new_submission" });
  const before = getDomainSnapshot();
  expect(renderClaim()).not.toContain(approvalLabel);
  expect(getDomainSnapshot()).toEqual(before);
});

it.each(["seed", "manual", "older approved revision"] as const)("does not infer approval from %s evidence", (source) => {
  const s = useAppStore.getState();
  s.setAgentEnabled(true);
  if (source === "older approved revision") approveReferralAfterConfirmation();
  if (source !== "seed") {
    s.submitItem({ caseId: id, channel: "eps", endorsementText: "NCSO RK" });
    s.arriveInQueue(id);
    s.referBack(id, "SYN-NCSO", "Human reason only; no generated pharmacy note was approved.");
  }
  const before = getDomainSnapshot();
  expect(renderClaim()).not.toContain(approvalLabel);
  expect(getDomainSnapshot()).toEqual(before);
});
