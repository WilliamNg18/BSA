import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { PharmacySubmissionPanel } from "@/components/demo/pharmacy-workbench";
import { PharmacyClaimActionPanel } from "@/components/demo/claim-detail";
import { PharmacyCorrectionAcknowledgement } from "@/components/demo/pharmacy-correction-acknowledgement";
import { getDomainSnapshot, sessionCase, useAppStore } from "@/lib/store";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";
import { deriveRecommendation } from "@/lib/domain/recommendations";
import { buildReferralNote, PHARMACY_SUGGESTION_LABEL } from "@/lib/domain/referral-wording";
import { getAsSubmitted } from "@/lib/domain/submission-views";
import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";

const controls = vi.hoisted(() => new Map<string, () => void>());
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, asChild, ...props }: ComponentProps<"button"> & { "data-pharmacy-action"?: string; "data-pharmacy-demo"?: string; asChild?: boolean }) => {
    const action = props["data-pharmacy-action"] ?? props["data-pharmacy-demo"];
    if (action && onClick && !props.disabled) controls.set(action, () => onClick({} as Parameters<NonNullable<typeof onClick>>[0]));
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
const s = () => useAppStore.getState();
const strength = "SYN-FQ123-MISMATCH", paper = "EX-24112";
const render = (element: ReturnType<typeof createElement>) => {
  controls.clear();
  return renderToStaticMarkup(createElement(MemoryRouter, null, element));
};
const submission = (id: string) => render(createElement(PharmacySubmissionPanel, { caseId: id }));
const claim = (id: string) => render(createElement(PharmacyClaimActionPanel, { caseId: id }));
function click(action: string) {
  const handler = controls.get(action);
  if (!handler) throw new Error(`Real enabled control ${action} was not rendered.`);
  handler();
}
function acknowledge(id: string) {
  const draft = s().pharmacyDrafts[id];
  const node = PharmacyCorrectionAcknowledgement({ caseId: id, draft, act: (action) => action() });
  const handler = node.props.children[0].props.onChange;
  handler({ target: { checked: true } });
}
function saveManual(id: string, update: (draft: PharmacyCorrectionDraft) => PharmacyCorrectionDraft) {
  const draft = initialisePharmacyDraft(sessionCase(id)!, s().caseRevisions[id].at(-1)!);
  s().setPharmacyDraft(id, { ...update(draft), purpose: "correction" });
}
beforeEach(() => {
  s().resetDemo();
  controls.clear();
  vi.stubGlobal("document", { getElementById: () => null });
});

it("the real strength Apply previews and writes only the 10mg selection before explicit Send", () => {
  s().setAgentEnabled(true);
  const before = getDomainSnapshot();
  const html = submission(strength);
  expect(html).toContain("Select Amlodipine 10mg tablets, 28");
  expect(html).toContain(PHARMACY_SUGGESTION_LABEL.replace("'", "&#x27;"));
  expect(html).toContain("Strength mismatch: prescribed 10mg, selected 5mg");
  click("apply-correction");
  const applied = s().pharmacyDrafts[strength];
  expect(applied.epsPrescription?.items[0].dispensedCode).toBe("SYN-AMLO10-28");
  expect(applied.epsPrescription?.supplyRecord).toEqual(before.caseRevisions[strength].at(-1)?.epsPrescription?.supplyRecord);
  expect(s().caseRevisions).toEqual(before.caseRevisions);
  expect(s().lifecycles[strength].state).toBe("referred_back");
  submission(strength);
  click("submit");
  expect(s().lifecycles[strength].state).toBe("released_to_pricing");
  expect(s().itemVerification[strength]).toEqual({ gate1: "pass", gate2: "pass", reconciled: true, released: true });
  expect(s().lifecycles[strength].history.some((event) => event.actor === "pharmacy" && event.processStep === "submission")).toBe(true);
});

it.each([false, true])("real strength referral, correction, acknowledgement and Resubmit preserve source, mode=%s", (enabled) => {
  s().setAgentEnabled(enabled);
  submission(strength); click("submit");
  const source = getAsSubmitted(s(), strength), revision = s().caseRevisions[strength].at(-1)!;
  if (enabled) s().arriveInQueue(strength);
  else {
    expect(s().lifecycles[strength].state).toBe("paid");
    s().reopenForAudit(strength, revision.number, "Later audit queries the selected strength.");
  }
  const note = buildReferralNote([{ rule: "strength_matches_prescription" }]);
  s().referBack(strength, "RB2B", note);
  expect(note).not.toMatch(/10mg|5mg|28/);
  const html = claim(strength);
  expect(html).toContain(note);
  expect(controls.has("resubmit")).toBe(false);
  if (enabled) click("apply-correction");
  else {
    expect(controls.has("apply-correction")).toBe(false);
    saveManual(strength, (draft) => ({ ...draft, epsPrescription: { ...draft.epsPrescription!,
      items: draft.epsPrescription!.items.map((item) => ({ ...item, dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets" })),
    } }));
  }
  expect(s().caseRevisions[strength].at(-1)).toEqual(source.asSubmitted);
  acknowledge(strength);
  const acknowledged = s().pharmacyDrafts[strength].correctionAcknowledgement;
  claim(strength); click("resubmit");
  expect(s().caseRevisions[strength].at(-1)).toMatchObject({ number: revision.number + 1, kind: "resubmission", correctionAcknowledgement: acknowledged });
  expect(s().lifecycles[strength].state).toBe(enabled ? "released_to_pricing" : "paid");
  expect(s().itemProcesses[strength].routing.requiresHuman).toBe(false);
  expect(s().caseRevisions[strength].find((entry) => entry.number === revision.number)).toEqual(source.asSubmitted);
});

it.each(["EX-24112", "EX-24123"])("paper preparation restores exactly two non-date fields, then Post remains human-gated: %s", (id) => {
  s().setAgentEnabled(true);
  const before = getDomainSnapshot();
  submission(id); click("missing");
  const missing = s().pharmacyDrafts[id];
  expect(missing.paperDeclaration).toMatchObject({ typedProduct: "", quantity: null });
  expect(missing.paperDeclaration?.dispensingDate).toBe(sessionCase(id)!.extracted.dispensingDate);
  submission(id);
  const recommendation = deriveRecommendation(s(), id, { kind: "draft" });
  expect(recommendation.preview?.paperDeclaration?.typedProduct).toBeTruthy();
  click("apply-correction");
  const applied = s().pharmacyDrafts[id];
  expect(applied.paperDeclaration).toEqual(recommendation.preview?.paperDeclaration);
  expect(applied.appliedFields).toEqual(expect.arrayContaining(["typedProduct", "quantity"]));
  expect(s().caseRevisions).toEqual(before.caseRevisions);
  const html = submission(id);
  expect(html).toMatch(/<input(?=[^>]*id="paper-typedProduct")(?=[^>]*ring-2)[^>]*>/);
  click("submit");
  expect(s().itemVerification[id].released).toBe(false);
  expect(s().caseRevisions[id].at(-1)?.paperDeclaration).toEqual(applied.paperDeclaration);
  expect(submission(id)).toContain("Paper is scanned at NHSBSA");
});

it.each([false, true])("readable paper uses own records, ACK and real Resubmit but only the operator releases, mode=%s", (enabled) => {
  s().setAgentEnabled(enabled);
  const original = sessionCase(paper)!;
  s().submitItem({ caseId: paper, channel: "paper", endorsementText: original.paperDeclaration!.endorsementText,
    paperDeclaration: { ...original.paperDeclaration!, brandManufacturer: "" } });
  const before = getAsSubmitted(s(), paper);
  s().arriveInQueue(paper);
  s().referBack(paper, "RB2B", buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
  claim(paper);
  if (enabled) click("apply-correction");
  else saveManual(paper, (draft) => ({ ...draft, paperDeclaration: { ...draft.paperDeclaration!,
    brandManufacturer: original.pharmacySupplyRecord!.brandManufacturer,
  } }));
  acknowledge(paper);
  claim(paper); click("resubmit");
  expect(s().lifecycles[paper].state).toBe("resubmitted");
  expect(s().itemProcesses[paper].readyToRelease).toBe(true);
  expect(s().itemVerification[paper].released).toBe(false);
  expect(s().caseRevisions[paper].find((entry) => entry.number === before.asSubmitted.number)).toEqual(before.asSubmitted);
  s().releaseToPricing(paper, "Human reviewed the acknowledged paper correction.");
  const html = claim(paper);
  expect(html).toMatch(/[Oo]perator|human/);
  expect(html).not.toContain("no operator action");
  expect(s().itemProcesses[paper].releaseOrigin).toBe("human_decision");
});
