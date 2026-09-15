import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it } from "vitest";
import { PaperScannerComparison } from "../../src/components/demo/paper-scanner-comparison";
import { scannerSourceError } from "../../src/components/demo/paper-scanner-model";
import { getAsSubmitted, getPaperReconciliation } from "../../src/lib/domain/submission-views";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { initialisePharmacyDraft, preparePaperDemoDraft } from "../../src/lib/domain/pharmacy-correction";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";
import { caseById } from "../../src/lib/domain/cases";

const store = () => useAppStore.getState();
const B = "EX-24112", D = "EX-24123";
beforeEach(() => store().resetDemo());

function comparison(caseId: string) {
  const submission = getAsSubmitted(store(), caseId);
  const reconciliation = getPaperReconciliation(store(), caseId);
  if (!reconciliation) throw new Error("Expected canonical paper reconciliation.");
  expect(scannerSourceError(submission, reconciliation)).toBeNull();
  return { submission, reconciliation };
}

function render(caseId: string) {
  const before = getDomainSnapshot();
  const html = renderToStaticMarkup(createElement(PaperScannerComparison, comparison(caseId)));
  expect(getDomainSnapshot()).toEqual(before);
  expect(html.match(/data-paper-source=/g)).toHaveLength(3);
  expect(html).not.toContain('role="alert"');
  return html;
}

function rawColumns(html: string) {
  return ["declaration", "scan", "character-recognition"].map((source) =>
    html.split(`data-paper-source="${source}"`)[1].split("</section>")[0]);
}

it.each([B, D])("renders actual canonical submission %s without navigation or source writes", (caseId) => {
  const props = comparison(caseId);
  expect(props.submission.asSubmitted).toEqual(store().caseRevisions[caseId].at(-1));
  expect(props.submission.paperScan).toEqual(props.submission.asSubmitted.paperSource?.scan);
  const html = render(caseId);
  for (const perspective of ["pharmacy", "nhsbsa", "both"] as const) {
    store().setPerspective(perspective);
    expect(render(caseId)).toBe(html);
  }
});

it("retains the exact raw three-column rendering after unreadable Type 1 confirmation and final human release", () => {
  store().setAgentEnabled(true);
  const previous = store().caseRevisions[D].at(-1)!;
  const draft = preparePaperDemoDraft(sessionCase(D)!, previous, "complete");
  store().submitItem({ ...draft, caseId: D, channel: "paper" });
  const original = comparison(D);
  const raw = rawColumns(render(D));
  const revision = store().caseRevisions[D].at(-1)!;
  store().confirmType1({ caseId: D, revision: revision.number, fields: revision.declaration!.fields,
    provenance: "pharmacy_declaration", declarationReconciled: true });
  expect(rawColumns(render(D))).toEqual(raw);
  expect(render(D)).toContain("Human-confirmed effective evidence");
  expect(comparison(D).submission).toEqual(original.submission);
  store().releaseToPricing(D, "Human confirmed the synthetic paper evidence.");
  expect(rawColumns(render(D))).toEqual(raw);
  expect(store().itemProcesses[D].releaseOrigin).toBe("human_decision");
});

it("pins the source submission through a later information response rather than treating that response as another scan", () => {
  store().setAgentEnabled(true);
  const previous = store().caseRevisions[D].at(-1)!;
  const draft = preparePaperDemoDraft(sessionCase(D)!, previous, "complete");
  store().submitItem({ ...draft, caseId: D, channel: "paper" });
  const revision = store().caseRevisions[D].at(-1)!;
  store().confirmType1({ caseId: D, revision: revision.number, fields: revision.declaration!.fields,
    provenance: "pharmacy_declaration", declarationReconciled: true });
  store().requestInformation(D, "Please provide readable supporting evidence for review.");
  const before = comparison(D);
  store().sendConfirmation(D, "Separate supporting evidence supplied by the pharmacy.");
  expect(store().caseRevisions[D].at(-1)?.kind).toBe("confirmation");
  expect(comparison(D).submission).toEqual(before.submission);
  expect(comparison(D).reconciliation.evidence.revision).toBe(before.submission.asSubmitted.number);
  render(D);
});

it("renders the new acknowledged pharmacy amendment while preserving the earlier source object", () => {
  store().setAgentEnabled(true);
  const template = caseById(B)!;
  store().submitItem({ caseId: B, channel: "paper", endorsementText: template.paperDeclaration!.endorsementText,
    paperDeclaration: template.paperDeclaration });
  const before = comparison(B), retained = structuredClone(before);
  store().arriveInQueue(B);
  store().referBack(B, "RB2B", buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
  const revision = store().caseRevisions[B].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase(B)!, revision);
  store().setPharmacyDraft(B, { ...draft, purpose: "correction",
    paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: template.pharmacySupplyRecord!.brandManufacturer } });
  store().setCorrectionAcknowledgement(B, revision.number, true);
  store().resubmit(B);
  expect(render(B)).toContain("Explicit pharmacy amendment (synthetic)");
  expect(comparison(B).submission.asSubmitted.number).toBeGreaterThan(before.submission.asSubmitted.number);
  expect(before).toEqual(retained);
  expect(store().itemVerification[B].released).toBe(false);
});
