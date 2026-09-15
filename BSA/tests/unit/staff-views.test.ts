import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueuePage } from "../../src/pages/queue";
import { DecisionRecordPage } from "../../src/pages/decision-record";
import { CasePackPage } from "../../src/pages/case-pack";
import { CaseTracePage } from "../../src/pages/case-trace";
import { NotificationContext } from "../../src/hooks/use-notification";
import { getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";
import { formatProcessItems, monthModel, MANUAL_LOOP_MONTH_DEFAULTS } from "../../src/lib/domain/baseline";
import { MANUAL_LOOP_METRICS } from "../../src/lib/domain/manual-loop-presentation";
import { staffLane } from "../../src/lib/case-presentation";
import { itemStateLabel, LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { CaseSourceEvidence, ConfirmedCaptureEvidence, OriginalPaperDeclaration, RawCaseFields } from "../../src/components/demo/case-presentation";
import { CASES, caseById } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import type { EpsPrescription } from "../../src/lib/domain/types";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

afterEach(() => useAppStore.getState().resetDemo());

function queue() {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(QueuePage)));
}

function record(id: string) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}/record`] },
    createElement(Routes, null, createElement(Route, { path: "/case/:id/record", element: createElement(DecisionRecordPage) }))));
}

function casePack(id: string) {
  return renderToStaticMarkup(createElement(NotificationContext.Provider, { value: { show: () => {}, clear: () => {} } },
    createElement(MemoryRouter, { initialEntries: [`/case/${id}`] },
      createElement(Routes, null, createElement(Route, { path: "/case/:id", element: createElement(CasePackPage) })))));
}

function trace(id: string) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}/trace`] },
    createElement(Routes, null, createElement(Route, { path: "/case/:id/trace", element: createElement(CaseTracePage) }))));
}

function openPaperReview(enabled = false) {
  const store = useAppStore.getState();
  store.setAgentEnabled(enabled);
  const paperDeclaration = caseById("EX-24112")!.paperDeclaration!;
  store.submitItem({ caseId: "EX-24112", channel: "paper", endorsementText: paperDeclaration.endorsementText, paperDeclaration });
  store.arriveInQueue("EX-24112");
}

function resubmitCorrectedPaper() {
  const store = useAppStore.getState();
  const revision = store.caseRevisions["EX-24112"].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase("EX-24112")!, revision);
  store.setPharmacyDraft("EX-24112", { ...draft, purpose: "correction", paperDeclaration: {
    ...draft.paperDeclaration!, brandManufacturer: caseById("EX-24112")!.pharmacySupplyRecord!.brandManufacturer,
  } });
  store.setCorrectionAcknowledgement("EX-24112", revision.number, true);
  store.resubmit("EX-24112");
}

function openStrengthReview() {
  const store = useAppStore.getState();
  store.setAgentEnabled(false);
  const caseId = "SYN-FQ123-MISMATCH";
  const epsPrescription = caseById(caseId)!.epsPrescription!;
  store.submitItem({ caseId, channel: "eps", endorsementText: epsPrescription.dispenserEndorsement, epsPrescription });
  expect(useAppStore.getState().lifecycles[caseId].state).toBe("paid");
  store.reopenForAudit(caseId, useAppStore.getState().caseRevisions[caseId].at(-1)!.number,
    "Later human audit queries the endorsed strength.");
}

describe("Task 29 current-revision staff presentation", () => {
  it.each([false, true])("separates automatic pricing, Type 1 and Type 2 without writing state, agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const html = queue();
    const table = html.match(/<table[^>]*data-type2-worklist[\s\S]*?<\/table>/)?.[0];
    expect(table).toBeTruthy();
    expect(table).not.toContain("EX-24107");
    expect(table).not.toContain("EX-24101");
    expect(table).not.toContain("EX-24123");
    expect(table).toContain("EX-24112");
    expect(table).not.toContain("SYN-FQ123-MISMATCH");
    expect(html).toContain('data-case-id="SYN-FQ123-MISMATCH"');
    expect(table).not.toContain("EX-24119");
    expect(table).not.toContain("EX-24088");
    for (const lifecycle of Object.values(before.lifecycles)) {
      const process = before.itemProcesses[lifecycle.caseId];
      if (staffLane(lifecycle, process) === "type2" && !["referred_back", "information_requested", "paid", "released_to_pricing"].includes(lifecycle.state)) expect(table).toContain(lifecycle.caseId);
      else expect(table).not.toContain(`data-case-id="${lifecycle.caseId}"`);
      if (staffLane(lifecycle, process)) expect(html).toContain(itemStateLabel(lifecycle, "nhsbsa", enabled, process));
    }
    expect(html).toContain('data-type1-case="EX-24123"');
    expect(html).toContain("Priced automatically this month, no person involved:");
    expect(html).toContain("Whole-service context, not session completions");
    expect(useAppStore.getState()).toBe(before);
  });

  it("uses shared monthly inputs, never the legacy referral-only projection", () => {
    const store = useAppStore.getState();
    store.setManualLoopInput("monthlyItems", "120000000");
    const model = monthModel({ ...MANUAL_LOOP_MONTH_DEFAULTS, monthlyItems: 120_000_000 });
    const html = queue();
    expect(html).toContain(`Priced automatically this month, no person involved: ${formatProcessItems(model.counts.autoPricedItems)}`);
    for (const { key, format } of MANUAL_LOOP_METRICS) {
      expect(html).toContain(`${format(model.today[key])} / ${format(model.withAgent[key])} (estimate)`);
    }
    expect(queue()).not.toContain("Show legacy full-day simulation");
  });

  it("excludes a newly auto-routed revision rather than retaining a stale staff row", () => {
    const store = useAppStore.getState();
    const caseId = "SYN-FQ123-MISMATCH";
    expect(queue()).toContain(`data-case-id="${caseId}"`);
    const epsPrescription = caseById(caseId)!.epsPrescription!;
    store.submitItem({ caseId, channel: "eps", endorsementText: epsPrescription.dispenserEndorsement, epsPrescription });
    expect(useAppStore.getState().itemProcesses[caseId].routing.outcome).toBe("auto_priced");
    expect(queue()).not.toContain(`data-case-id="${caseId}"`);
  });

  it("withholds stale routing with an explicit error", () => {
    const store = useAppStore.getState();
    useAppStore.setState({ itemProcesses: { ...store.itemProcesses,
      "EX-24112": { ...store.itemProcesses["EX-24112"], revision: -1 } } });
    expect(queue()).toContain("Some items lack current routing metadata");
    expect(queue()).not.toContain('data-case-id="EX-24112"');
  });

  it("opens the followed item's actual lane without expanding unrelated capture work or changing state", () => {
    const store = useAppStore.getState();
    openPaperReview();
    store.followCase("EX-24112");
    store.setAgentEnabled(true);
    const before = useAppStore.getState();
    const html = queue();
    expect(html).toContain('data-case-id="EX-24112"');
    expect(html).not.toContain('data-type1-case="EX-24123"');
    expect(html.indexOf("data-type2-worklist")).toBeLessThan(html.indexOf('aria-label="Background cases"'));
    expect(useAppStore.getState()).toBe(before);
  });

  it("keeps the followed paper state in the real open capture summary", () => {
    useAppStore.getState().followCase("EX-24123");
    const before = useAppStore.getState();
    const html = queue();
    expect(html).toMatch(/<details[^>]*open=""[^>]*data-type1-case="EX-24123"/);
    expect(html).toMatch(/<summary[\s\S]*?<span[^>]*data-item-state="true"/);
    expect(html).not.toContain('data-case-id="SYN-FQ123-MISMATCH"');
    expect(useAppStore.getState()).toBe(before);
  });

  it("shows manual Tariff lookup and a mandatory human reason for Type 2", () => {
    openStrengthReview();
    const before = getDomainSnapshot();
    const html = casePack("SYN-FQ123-MISMATCH");
    expect(html).toContain("Tariff to look up unaided");
    expect(html).toContain('id="reason"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain("EPS claim message");
    expect(html).toContain("EPS has no image");
    expect(html).not.toContain("Prescription image");
    expect(html).toContain("SYN-AMLO5-28");
    expect(html).toContain("SYN-AMLO10-28");
    expect(html).toContain("RB code list");
    expect(html).toContain("RB2B");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("does not fabricate agent assembly controls for automatic items", () => {
    useAppStore.getState().setAgentEnabled(true);
    const html = casePack("EX-24107");
    expect(html).toContain("data-automatic-case");
    expect(html).not.toContain("Replay step by step");
    expect(html).not.toContain(">Record decision<");
  });

  it.each([false, true])("shows an automated audit without requesting an impossible human decision, Agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const html = record("EX-24107");
    expect(html).toContain("Existing automatic pricing record");
    expect(html).toContain("No human decision was required");
    expect(html).not.toContain("Record a human decision from the case pack");
    expect(html).not.toContain("No human decision recorded yet");
    expect(html).not.toContain("data-manual-record-comparison");
    expect(useAppStore.getState()).toBe(before);
  });

  it.each([false, true])("does not invent human gathering on automatic traces, agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    for (const id of ["EX-24107"]) {
      const html = trace(id);
      expect(html).not.toContain("Manual gathering trace");
      expect(html).not.toContain("Replay step by step");
      expect(html).toContain("no person involved");
    }
  });

  it.each([false, true])("retains actual B decision reasons and cited history in mode %s", (enabled) => {
    const store = useAppStore.getState();
    openPaperReview(true);
    store.applySuggestionToDecision("EX-24112");
    const draft = useAppStore.getState().operatorDrafts["EX-24112"];
    store.referBack("EX-24112", draft.rbCode, draft.note);
    resubmitCorrectedPaper();
    expect(useAppStore.getState().lifecycles["EX-24112"].state).toBe("resubmitted");
    store.releaseToPricing("EX-24112", "Human checked the corrected brand evidence.");
    store.setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const original = before.records.find((entry) => entry.caseId === "EX-24112")!;
    const html = record("EX-24112");
    expect(html).toContain("Original decision history");
    expect(html).toContain(original.tariffVersion);
    expect(html).toContain(original.reason || original.overrideReason || "Not recorded");
    for (const source of original.sources) expect(html).toContain(source.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"));
    if (!enabled) expect(html).toContain("experience only, no rule recorded");
    expect(useAppStore.getState()).toBe(before);
  });

  it("does not invent a rule or approved draft when a manual record is viewed with assistance", () => {
    const store = useAppStore.getState();
    openPaperReview();
    store.recordType2Decision({ caseId: "EX-24112", decision: "REFER_BACK",
      reason: "Human found the brand or manufacturer missing", rbCode: "RB2B" });
    const original = useAppStore.getState().records.at(-1)!;
    store.setAgentEnabled(true);
    const html = record("EX-24112");
    expect(html).toContain("Human found the brand or manufacturer missing");
    expect(html).toContain("Not recorded together for this decision");
    expect(html).not.toContain("Operator-approved explanation");
    expect(original).toMatchObject({ tariffVersion: "n/a", recommendation: "NONE" });
    expect(original.approvedDraft).toBeUndefined();
    expect(useAppStore.getState().records.at(-1)).toBe(original);
  });

  it("keeps human-completed Type 2 decisions visible without moving them into the automatic aggregate", () => {
    const store = useAppStore.getState();
    openPaperReview();
    store.referBack("EX-24112", "RB2B", "Please confirm the brand or manufacturer supplied.");
    resubmitCorrectedPaper();
    store.arriveInQueue("EX-24112");
    expect(useAppStore.getState().itemProcesses["EX-24112"].readyToRelease).toBe(true);
    expect(getReleaseEligibility("EX-24112").allowed).toBe(true);
    store.releaseToPricing("EX-24112", "Human completed the independent evidence review");
    expect(useAppStore.getState().records.at(-1)).toMatchObject({ caseId: "EX-24112", decision: "ACCEPT" });
    expect(useAppStore.getState().lifecycles["EX-24112"].history.at(-1)).toMatchObject({
      actor: "operator", to: "released_to_pricing", releaseOrigin: "human_decision",
    });
    expect(useAppStore.getState().itemProcesses["EX-24112"].routing).toMatchObject({
      outcome: "type2_endorsement", requiresHuman: false,
    });
    expect(queue()).toContain('data-case-id="EX-24112"');
    expect(queue()).toContain("Decided");
    expect(queue().match(/<table[^>]*data-type2-worklist[\s\S]*?<\/table>/)?.[0]).not.toContain("EX-24112");
  });

  it.each([false, true])("keeps paper evidence and shared operational state in mode %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const html = casePack("EX-24123");
    expect(html).toContain('aria-label="Paper scanner comparison"');
    expect(html).toContain("Synthetic submitted paper scan: EX-24123");
    expect(html).not.toContain("EPS claim message");
    expect(html).toContain(LIFECYCLE_LABELS[useAppStore.getState().lifecycles["EX-24123"].state].pharmacy);
  });

  it("labels every confirmed declared value and preserves the original receipt", () => {
    const capture = {
      revision: 2, confirmedAt: "2026-08-27T10:00:00Z", operator: "Synthetic operator",
      fields: { productCode: "SYN-001", quantity: 100, endorsementText: "NCSO JB 27/08/26", prescriber: "Synthetic prescriber" },
      provenance: "pharmacy_declaration" as const, declarationReconciled: true,
    };
    const original = JSON.stringify(capture);
    const html = renderToStaticMarkup(createElement(ConfirmedCaptureEvidence, { capture }));
    expect(html.match(/declared by the pharmacy, not read from the form/g)).toHaveLength(4);
    expect(html).toContain("not proof the image was read");
    expect(html).toContain(capture.confirmedAt);
    expect(JSON.stringify(capture)).toBe(original);
  });

  it("shows the recorded EPS prescription without inventing or editing evidence", () => {
    const prescription: EpsPrescription = {
      prescriber: { name: "Prescriber (synthetic)", practice: "Practice (synthetic)" },
      patientLabel: "Patient (synthetic)", prescriptionDate: "2026-08-26", dispensingDate: "2026-08-27",
      items: [{ prescribedCode: "SYN-001", product: "Synthetic medicine", strength: "500 mg", form: "Tablets",
        quantity: 100, dose: "Synthetic directions", dispensedCode: "SYN-001", dispensedName: "Synthetic dispensed medicine" }],
      prescriberEndorsement: "Prescriber text", dispenserEndorsement: "NCSO JB 27/08/26",
      exemptionStatus: "not_recorded", claimMessageState: "submitted",
    };
    const c = { ...CASES[1], channel: "Electronic (EPS)" as const, epsPrescription: prescription };
    const original = JSON.stringify(c);
    const html = renderToStaticMarkup(createElement(CaseSourceEvidence, { c }));
    expect(html).toContain("Electronic prescription, synthetic");
    expect(html).toContain(prescription.patientLabel);
    expect(html).toContain(prescription.prescriber.practice);
    expect(html).toContain(prescription.dispenserEndorsement);
    expect(html).not.toContain("Original digital prescription not recorded");
    expect(html).not.toContain("<svg");
    expect(JSON.stringify(c)).toBe(original);
  });

  it("distinguishes repeated EPS comparison landmarks without changing their evidence", () => {
    const c = sessionCase("SYN-FQ123-MISMATCH")!;
    const before = useAppStore.getState();
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(CaseSourceEvidence, { c }),
      createElement(RawCaseFields, { c, contextLabel: "Manual comparison" })));
    const labels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain("Submitted electronic prescription, synthetic");
    expect(labels).toContain("Manual comparison: Submitted electronic prescription, synthetic");
    expect(labels).toContain("Manual comparison: Recorded dispenser claim");
    expect(html.match(/SYN-AMLO10-28/g)?.length).toBeGreaterThanOrEqual(2);
    expect(useAppStore.getState()).toBe(before);
  });

  it("never paints a declaration date onto the original paper image or machine capture", () => {
    const original = CASES[3];
    const c = { ...original, extracted: { ...original.extracted, dispensingDate: "2026-07-27" },
      paperDeclaration: { typedProduct: "Co-codamol 30/500 tablets", quantity: 100,
        endorsementText: "NCSO JB 27/07/26", dispensingDate: "2026-07-27", declaredByPharmacy: true as const } };
    const image = renderToStaticMarkup(createElement(CaseSourceEvidence, { c }));
    expect(image).not.toContain("2026-07-27");
    expect(image).toContain(original.extracted.dispensingDate);
    const fields = renderToStaticMarkup(createElement(RawCaseFields, { c }));
    expect(fields).toContain("Declared dispensing date");
    expect(fields).toContain("2026-07-27");
    expect(fields).toContain("declared by the pharmacy, not read from the form");
    const declared = renderToStaticMarkup(createElement(OriginalPaperDeclaration, { declaration: c.paperDeclaration }));
    expect(declared.match(/declared by the pharmacy, not read from the form/g)).toHaveLength(4);
    expect(declared).toContain("Human corrections and confirmation are recorded separately");
    expect(declared).toContain(c.paperDeclaration.endorsementText);
  });

  it.each([false, true])("uses the current paper revision rather than M's original EPS claim, agent %s", (enabled) => {
    const store = useAppStore.getState();
    store.submitItem({ caseId: "SYN-FQ123-MISMATCH", channel: "paper", endorsementText: "NCSO RK 21/08/26",
      paperDeclaration: { typedProduct: "SYN-AMLO10-28", quantity: 28, endorsementText: "NCSO RK 21/08/26",
        dispensingDate: "2026-08-21", declaredByPharmacy: true } });
    store.setAgentEnabled(enabled);
    const c = sessionCase("SYN-FQ123-MISMATCH")!;
    expect(c.channel).toBe("Paper FP10");
    expect(c.claim.submittedVia).toBe("EPS claim message");
    const before = useAppStore.getState();
    const evidence = renderToStaticMarkup(createElement(CaseSourceEvidence, { c }));
    expect(evidence).toContain("Prescription image");
    expect(evidence).not.toContain("EPS claim message");
    expect(evidence).not.toContain("EPS has no image");
    const pack = casePack(c.id);
    expect(pack).toContain('aria-label="Paper scanner comparison"');
    expect(pack).toContain("Synthetic submitted paper scan: SYN-FQ123-MISMATCH");
    expect(pack).not.toContain("EPS has no image");
    expect(useAppStore.getState()).toBe(before);
  });

  it.each([false, true])("uses the current EPS revision rather than D's original paper claim, agent %s", (enabled) => {
    const store = useAppStore.getState();
    store.submitItem({ caseId: "EX-24123", channel: "eps", endorsementText: "NCSO RK 21/08/26" });
    store.setAgentEnabled(enabled);
    const c = sessionCase("EX-24123")!;
    expect(c.channel).toBe("Electronic (EPS)");
    expect(c.claim.submittedVia).toBe("FP34C batch");
    expect(CASES[3].claim.submittedVia).toBe("FP34C batch");
    const before = useAppStore.getState();
    const evidence = renderToStaticMarkup(createElement(CaseSourceEvidence, { c }));
    expect(evidence).toContain("EPS claim message");
    expect(evidence).not.toContain("Prescription image");
    const pack = casePack(c.id);
    expect(pack).toContain("EPS claim message");
    expect(pack).not.toContain("Prescription image");
    expect(useAppStore.getState()).toBe(before);
  });
});
