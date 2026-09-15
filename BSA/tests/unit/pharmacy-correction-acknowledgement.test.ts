import { createElement, isValidElement, type ChangeEventHandler } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { PharmacyCorrectionAcknowledgement } from "@/components/demo/pharmacy-correction-acknowledgement";
import { PharmacyClaimActionPanel } from "@/components/demo/claim-detail";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";
import { correctionFingerprint, CORRECTION_ACKNOWLEDGEMENT_LABEL } from "@/lib/domain/correction-acknowledgement";
import { getDomainSnapshot, sessionCase, useAppStore } from "@/lib/store";
import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const id = "EX-24112";
const store = () => useAppStore.getState();
const initial = () => initialisePharmacyDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!);
const renderClaim = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PharmacyClaimActionPanel, { caseId: id })));

function checkbox(draft: PharmacyCorrectionDraft, act: (action: () => void) => void = (action) => action()) {
  const element = PharmacyCorrectionAcknowledgement({ caseId: id, draft, act });
  const input: unknown = element.props.children[0];
  if (!isValidElement<{ onChange: ChangeEventHandler<HTMLInputElement>; checked: boolean; required: boolean }>(input)) {
    throw new Error("The accuracy acknowledgement must render a real input.");
  }
  return input.props;
}
function choose(draft: PharmacyCorrectionDraft, checked: boolean, act?: (action: () => void) => void) {
  const handler = checkbox(draft, act).onChange;
  handler({ target: { checked } } as Parameters<typeof handler>[0]);
}

beforeEach(() => store().resetDemo());

it.each([false, true])("the actual required checkbox writes one pharmacy acknowledgement, mode=%s", (enabled) => {
  store().setAgentEnabled(enabled);
  const draft = initial(), before = getDomainSnapshot();
  const input = checkbox(draft);
  expect(input.required).toBe(true);
  expect(input.checked).toBe(false);
  const markup = renderClaim();
  expect(markup).toContain(CORRECTION_ACKNOWLEDGEMENT_LABEL);
  expect(markup).toMatch(/data-pharmacy-action="resubmit"[^>]*disabled=""/);
  expect(getDomainSnapshot()).toEqual(before);
  choose(draft, true);
  const saved = store().pharmacyDrafts[id];
  expect(saved.correctionAcknowledgement).toEqual({ revision: draft.revision, fingerprint: correctionFingerprint(saved) });
  expect(store().lifecycles[id].history.at(-1)).toMatchObject({
    actor: "pharmacy", processStep: "correction_acknowledged", from: "referred_back", to: "referred_back",
  });
  expect(store().caseRevisions).toEqual(before.caseRevisions);
  expect(checkbox(saved).checked).toBe(true);
  expect(renderClaim()).not.toMatch(/data-pharmacy-action="resubmit"[^>]*disabled=""/);
  choose(saved, false);
  expect(checkbox(store().pharmacyDrafts[id]).checked).toBe(false);
  expect(() => store().resubmit(id)).toThrow("must be checked");
});

it("edits invalidate the displayed acknowledgement; presentation changes preserve it", () => {
  choose(initial(), true);
  for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
    store().setPerspective(perspective);
    store().setAgentEnabled(perspective === "pharmacy");
    expect(checkbox(store().pharmacyDrafts[id]).checked).toBe(true);
  }
  const draft = store().pharmacyDrafts[id], text = `${draft.endorsementText} `;
  store().setPharmacyDraft(id, { ...draft, endorsementText: text,
    ...(draft.epsPrescription ? { epsPrescription: { ...draft.epsPrescription, dispenserEndorsement: text } } : {}),
    ...(draft.paperDeclaration ? { paperDeclaration: { ...draft.paperDeclaration, endorsementText: text } } : {}),
  });
  expect(checkbox(store().pharmacyDrafts[id]).checked).toBe(false);
  expect(renderClaim()).toMatch(/data-pharmacy-action="resubmit"[^>]*disabled=""/);
});

it("converts an explicitly selected demonstration draft only on the human acknowledgement action", () => {
  store().setPharmacyDraft(id, { ...initial(), purpose: "new_submission" });
  const before = getDomainSnapshot();
  expect(checkbox(store().pharmacyDrafts[id]).checked).toBe(false);
  expect(getDomainSnapshot()).toEqual(before);
  choose(store().pharmacyDrafts[id], true);
  expect(store().pharmacyDrafts[id].purpose).toBe("correction");
  expect(checkbox(store().pharmacyDrafts[id]).checked).toBe(true);
});

it("a stale checkbox invokes the normal visible-error boundary without changing state", () => {
  const draft = initial();
  choose(draft, true);
  store().resubmit(id);
  const before = getDomainSnapshot();
  let error = "";
  choose(draft, true, (action) => {
    try { action(); } catch (cause) { error = cause instanceof Error ? cause.message : "Unexpected action error"; }
  });
  expect(error).toMatch(/stale|state|referred|correction/i);
  expect(getDomainSnapshot()).toEqual(before);
});
