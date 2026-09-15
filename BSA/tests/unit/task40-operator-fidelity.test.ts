import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AsSubmittedEvidence, SubmittedCaseEvidence } from "../../src/components/demo/as-submitted-evidence";
import { OperatorActionPanel, OperatorAuditPanel } from "../../src/components/demo/operator-action-panel";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { CasePackPage } from "../../src/pages/case-pack";
import { caseById } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft, preparePaperDemoDraft } from "../../src/lib/domain/pharmacy-correction";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";
import { getAsSubmitted, getPaperReconciliation } from "../../src/lib/domain/submission-views";
import { getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return { ...actual, useAppStore: Object.assign(
    <T,>(selector: (state: ReturnType<typeof actual.useAppStore.getState>) => T) => selector(actual.useAppStore.getState()),
    actual.useAppStore,
  ) };
});

const state = () => useAppStore.getState();
const ids = ["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"] as const;
const escaped = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const panel = (id: string) => renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(OperatorActionPanel, { caseId: id })));
const evidence = (id: string) => renderToStaticMarkup(createElement(SubmittedCaseEvidence, { caseId: id }));
const casePack = (id: string) => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}`] },
  createElement(Routes, null, createElement(Route, { path: "/case/:id", element: createElement(CasePackPage) }))));

beforeEach(() => state().resetDemo());

function submitStrength(enabled: boolean) {
  state().setAgentEnabled(enabled);
  const id = "SYN-FQ123-MISMATCH", eps = caseById(id)!.epsPrescription!;
  state().submitItem({ caseId: id, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps });
  const revision = state().caseRevisions[id].at(-1)!;
  if (enabled) state().arriveInQueue(id);
  else state().reopenForAudit(id, revision.number, "Later query requires source comparison.");
  return id;
}

function resubmitCorrectedPaper(enabled: boolean) {
  const id = "EX-24112", original = caseById(id)!;
  state().setAgentEnabled(enabled);
  state().submitItem({ caseId: id, channel: "paper", endorsementText: original.paperDeclaration!.endorsementText,
    paperDeclaration: original.paperDeclaration });
  state().arriveInQueue(id);
  state().referBack(id, "RB2B", buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
  const revision = state().caseRevisions[id].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase(id)!, revision);
  state().setPharmacyDraft(id, { ...draft, purpose: "correction",
    paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: original.pharmacySupplyRecord!.brandManufacturer } });
  state().setCorrectionAcknowledgement(id, revision.number, true);
  state().resubmit(id);
  return id;
}

describe("Task 40 immutable operator source presentation", () => {
  it.each(ids)("renders the exact submitted object for %s in either mode without mutation", (id) => {
    const submitted = state().caseRevisions[id].filter((revision) => revision.kind !== "confirmation").at(-1)!;
    for (const enabled of [false, true]) {
      state().setAgentEnabled(enabled);
      const before = getDomainSnapshot();
      const replica = getAsSubmitted(state(), id);
      expect(replica.asSubmitted).toEqual(submitted);
      expect(evidence(id)).toContain(escaped(JSON.stringify(submitted, null, 2)));
      expect(evidence(id)).not.toMatch(/<(?:input|textarea|form|button)\b/);
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("distinguishes the endorsed pack from the actual supply without changing either", () => {
    const id = "SYN-FQ123-MISMATCH";
    const html = evidence(id), eps = getAsSubmitted(state(), id).asSubmitted.epsPrescription!;
    expect(html).toContain("Endorsed product and pack code");
    expect(html).toContain("Pharmacy&#x27;s actual supply record");
    expect(html).toContain(eps.items[0].dispensedCode);
    expect(html).toContain(eps.items[0].prescribedCode);
    expect(html).toContain(eps.supplyRecord!.productCode);
    expect(html).toContain(eps.exemptionStatus);
    expect(html).toContain(eps.prescriptionDate);
    expect(html).toContain(eps.dispensingDate);
    expect(html).not.toContain("Apply");
  });

  it("keeps an information response separate from the last submitted object", () => {
    const id = submitStrength(true);
    const submission = getAsSubmitted(state(), id);
    state().requestInformation(id, buildReferralNote([{ rule: "readable_evidence_required" }]));
    state().sendConfirmation(id, "The pharmacy confirms the original records remain unchanged.");
    const before = getDomainSnapshot();
    expect(getAsSubmitted(state(), id)).toEqual(submission);
    expect(evidence(id)).toContain(escaped(JSON.stringify(submission.asSubmitted, null, 2)));
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("preserves the three raw paper sources after human capture and keeps human evidence separate", () => {
    const id = "EX-24123";
    state().setAgentEnabled(true);
    const draft = preparePaperDemoDraft(sessionCase(id)!, state().caseRevisions[id].at(-1)!, "complete");
    state().submitItem({ ...draft, caseId: id, channel: "paper" });
    const submitted = getAsSubmitted(state(), id), revision = state().caseRevisions[id].at(-1)!;
    state().confirmType1({ caseId: id, revision: revision.number, fields: revision.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    const before = getDomainSnapshot();
    const html = evidence(id);
    expect(getAsSubmitted(state(), id)).toEqual(submitted);
    expect(html).toContain('data-paper-scanner-columns');
    expect(html).toContain("Pharmacy&#x27;s declaration (as typed)");
    expect(html).toContain("Scan as the high-speed scanner sees it");
    expect(html).toContain("Extracted by character recognition (hypothetical)");
    expect(html).toContain('aria-label="Human-confirmed effective evidence"');
    expect(getPaperReconciliation(state(), id)?.reconciliationBasis).toBe("human_confirmed_capture");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("mounts a single full-width comparison in the paper pack and before the ordinary form", () => {
    state().setAgentEnabled(true);
    const packed = casePack("EX-24123");
    expect(packed.match(/aria-label="Paper scanner comparison"/g)).toHaveLength(1);
    expect(packed.match(/<form\b/g)).toHaveLength(1);
    expect(packed).not.toContain('aria-label="Original pharmacy declaration"');
    const capture = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
    expect(capture.match(/aria-label="Paper scanner comparison"/g)).toHaveLength(1);
    expect(capture.indexOf("data-paper-scanner-columns")).toBeLessThan(capture.indexOf("<form"));
  });

  it("fails visibly when canonical paper reconciliation is unavailable", () => {
    const html = renderToStaticMarkup(createElement(AsSubmittedEvidence, {
      submission: getAsSubmitted(state(), "EX-24123"), reconciliation: null,
    }));
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("data-paper-scanner-columns");
    expect(evidence("unknown-item")).toContain('role="alert"');
  });
});

describe("Task 40 explicit operator actions", () => {
  it.each([false, true])("keeps a rejected proposed-value note unchanged, Agent %s", (enabled) => {
    const id = submitStrength(enabled), revision = state().caseRevisions[id].at(-1)!;
    const note = "Please select Amlodipine 10mg tablets.";
    state().setOperatorDraft(id, { revision: revision.number, outcome: "REFER_BACK", rbCode: "RB2B", note });
    const before = getDomainSnapshot();
    expect(() => state().referBack(id, "RB2B", note)).toThrow("proposed corrected value");
    expect(panel(id)).toContain(escaped(note));
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows safe operator Apply without a pharmacy target preview", () => {
    const id = submitStrength(true);
    const before = getDomainSnapshot(), html = panel(id);
    expect(html).toContain('data-recommendation-audience="operator"');
    expect(html).toContain("Operator draft preview");
    expect(html).not.toContain("Corrected claim line preview");
    expect(html).not.toContain("Corrected preview");
    expect(html).not.toContain("Select Amlodipine 10mg tablets");
    expect(getDomainSnapshot()).toEqual(before);
    state().applySuggestionToDecision(id);
    const draft = state().operatorDrafts[id];
    expect(draft.note).toContain("please state the accurate");
    expect(draft.note).not.toMatch(/10mg|SYN-AMLO10-28/);
    expect(panel(id)).toContain(escaped(draft.note));
    expect(state().records).toEqual(before.records);
  });

  it.each([false, true])("releases corrected paper with the real prefilled draft and one human action, Agent %s", (enabled) => {
    const id = resubmitCorrectedPaper(enabled);
    const before = getDomainSnapshot(), draft = before.operatorDrafts[id], html = panel(id);
    expect(before.lifecycles[id].state).toBe("resubmitted");
    expect(draft.outcome).toBe("ACCEPT");
    expect(html).toContain(escaped(draft.note));
    expect(html).toContain("Resubmitted, ready to release");
    expect(html).not.toContain(">Apply suggestion</button>");
    expect(html.match(/<button[^>]*>Release to pricing<\/button>/)?.[0]).not.toContain('disabled=""');
    expect(getReleaseEligibility(id).allowed).toBe(true);
    expect(getDomainSnapshot()).toEqual(before);
    state().releaseToPricing(id, draft.note);
    expect(state().lifecycles[id].history).toHaveLength(before.lifecycles[id].history.length + 1);
    expect(state().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", processStep: "release_to_pricing" });
    expect(state().itemProcesses[id].releaseOrigin).toBe("human_decision");
    expect(state().caseRevisions).toEqual(before.caseRevisions);
  });

  it.each([false, true])("shows the seed's actual ready-paper draft without an invented Apply, Agent %s", (enabled) => {
    state().setAgentEnabled(enabled);
    const before = getDomainSnapshot();
    expect(before.operatorDrafts["EX-24112"]).toMatchObject({ outcome: "ACCEPT", appliedSuggestion: false });
    const html = panel("EX-24112");
    expect(html).toContain(escaped(before.operatorDrafts["EX-24112"].note));
    expect(html).not.toContain(">Apply suggestion</button>");
    expect(html.match(/<button[^>]*>Release to pricing<\/button>/)?.[0]).not.toContain('disabled=""');
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("renders audit controls without reopening on render and preserves prior history on the explicit action", () => {
    const id = "EX-24107", before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(OperatorAuditPanel, { caseId: id }));
    expect(html).toContain("Open later audit or query");
    expect(html).toContain("Audit or later-query reason");
    expect(getDomainSnapshot()).toEqual(before);
    state().reopenForAudit(id, state().caseRevisions[id].at(-1)!.number, "Later query requires review of the retained submission.");
    expect(state().lifecycles[id].history.slice(0, -1)).toEqual(before.lifecycles[id].history);
    expect(state().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", processStep: "audit_reopened" });
    expect(state().caseRevisions).toEqual(before.caseRevisions);
    expect(renderToStaticMarkup(createElement(OperatorAuditPanel, { caseId: id }))).toBe("");
  });
});
