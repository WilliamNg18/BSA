import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueuePage } from "../../src/pages/queue";
import { DecisionRecordPage } from "../../src/pages/decision-record";
import { CasePackPage } from "../../src/pages/case-pack";
import { CaseTracePage } from "../../src/pages/case-trace";
import { NotificationContext } from "../../src/hooks/use-notification";
import { useAppStore } from "../../src/lib/store";
import { formatProcessItems, monthModel, MANUAL_LOOP_MONTH_DEFAULTS } from "../../src/lib/domain/baseline";
import { MANUAL_LOOP_METRICS } from "../../src/lib/domain/manual-loop-presentation";
import { staffLane } from "../../src/lib/case-presentation";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { CaseSourceEvidence, ConfirmedCaptureEvidence, OriginalPaperDeclaration, RawCaseFields } from "../../src/components/demo/case-presentation";
import { CASES } from "../../src/lib/domain/cases";
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
    expect(table).toContain("EX-24119");
    for (const lifecycle of Object.values(before.lifecycles)) {
      const process = before.itemProcesses[lifecycle.caseId];
      if (staffLane(lifecycle, process) === "type2") expect(table).toContain(lifecycle.caseId);
      else expect(table).not.toContain(`data-case-id="${lifecycle.caseId}"`);
      if (staffLane(lifecycle, process)) expect(html).toContain(LIFECYCLE_LABELS[lifecycle.state].pharmacy);
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
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB dated 12/08/2026" });
    expect(useAppStore.getState().itemProcesses["EX-24112"].routing.outcome).toBe("auto_priced");
    expect(queue()).not.toContain('data-case-id="EX-24112"');
  });

  it("withholds stale routing with an explicit error", () => {
    const store = useAppStore.getState();
    useAppStore.setState({ itemProcesses: { ...store.itemProcesses,
      "EX-24112": { ...store.itemProcesses["EX-24112"], revision: -1 } } });
    expect(queue()).toContain("Some items lack current routing metadata");
    expect(queue()).not.toContain('data-case-id="EX-24112"');
  });

  it("shows manual Tariff lookup and a mandatory human reason for Type 2", () => {
    useAppStore.getState().submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB" });
    useAppStore.getState().arriveInQueue("EX-24112");
    const html = casePack("EX-24112");
    expect(html).toContain("Tariff to look up unaided");
    expect(html).toContain('id="reason"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain("EPS claim message");
    expect(html).toContain("EPS has no image");
    expect(html).not.toContain("Prescription image");
    expect(html).toContain("NCSO initialled AB");
    expect(html).toContain("RB code list");
    expect(html).toContain("RB2B");
  });

  it("does not fabricate agent assembly controls for automatic items", () => {
    useAppStore.getState().setAgentEnabled(true);
    const html = casePack("EX-24107");
    expect(html).toContain("data-automatic-case");
    expect(html).not.toContain("Replay step by step");
    expect(html).not.toContain(">Record decision<");
  });

  it.each([false, true])("does not invent human gathering on automatic traces, agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    for (const id of ["EX-24107", "EX-24101"]) {
      const html = trace(id);
      expect(html).not.toContain("Manual gathering trace");
      expect(html).not.toContain("Replay step by step");
      expect(html).toContain("no person involved");
    }
  });

  it.each([false, true])("retains F's original reason and cited history in mode %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const original = before.records.find((entry) => entry.caseId === "EX-24088")!;
    const html = record("EX-24088");
    expect(html).toContain("Original decision history");
    expect(html).toContain(original.tariffVersion);
    expect(html).toContain(original.reason || original.overrideReason || "Not recorded");
    for (const source of original.sources) expect(html).toContain(source.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"));
    if (!enabled) expect(html).toContain("experience only, no rule recorded");
    expect(useAppStore.getState()).toBe(before);
  });

  it("does not invent a rule or approved draft when a manual record is viewed with assistance", () => {
    const store = useAppStore.getState();
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB" });
    store.arriveInQueue("EX-24112");
    store.recordType2Decision({ caseId: "EX-24112", decision: "REFER_BACK",
      reason: "Human found the dispensing date missing", rbCode: "SYN-NCSO" });
    const original = useAppStore.getState().records.at(-1)!;
    store.setAgentEnabled(true);
    const html = record("EX-24112");
    expect(html).toContain("Human found the dispensing date missing");
    expect(html).toContain("Not recorded together for this decision");
    expect(html).not.toContain("Operator-approved explanation");
    expect(original).toMatchObject({ tariffVersion: "n/a", recommendation: "NONE" });
    expect(original.approvedDraft).toBeUndefined();
    expect(useAppStore.getState().records.at(-1)).toBe(original);
  });

  it("keeps human-completed Type 2 decisions visible without moving them into the automatic aggregate", () => {
    const store = useAppStore.getState();
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB" });
    store.arriveInQueue("EX-24112");
    store.recordType2Decision({ caseId: "EX-24112", decision: "ACCEPT",
      reason: "Human completed the independent evidence review" });
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
    expect(html).toContain("Prescription image");
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
    const c = { ...CASES[1], epsPrescription: prescription };
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
});
