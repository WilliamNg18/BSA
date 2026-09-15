import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { PharmacySubmissionReceipt } from "@/components/demo/pharmacy-submission-receipt";
import { caseById } from "@/lib/domain/cases";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { useAppStore } from "@/lib/store";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function renderClaim(caseId: string) {
  const store = useAppStore.getState();
  const c = caseForLifecycle(caseId, store.lifecycles, store.caseRevisions, store.itemProcesses)!;
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ClaimDetail, { c, row: store.lifecycles[caseId] })));
}

beforeEach(() => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setPerspective("both");
});

describe("process claim evidence", () => {
  for (const enabled of [false, true]) {
    it(`labels the retained declaration as seed D replay evidence, Agent ${enabled}`, () => {
      const store = useAppStore.getState();
      store.setAgentEnabled(enabled);
      const before = structuredClone(store.caseRevisions["EX-24123"]);
      const originalCase = structuredClone(caseById("EX-24123"));
      const markup = renderClaim("EX-24123");
      expect(before[0].endorsementText).toBe("NCSO JB 27/08/26");
      expect(before[0].declaration?.fields.endorsementText).toBe("NCSO JB 27/08/26");
      expect(markup).toContain("Replay the retained pharmacy declaration, not the scan reading.");
      expect(markup).toContain("Replay endorsement source</dt><dd>Retained pharmacy declaration</dd>");
      expect(markup).toContain("Replay endorsement</dt><dd>NCSO JB 27/08/26</dd>");
      expect(useAppStore.getState().caseRevisions["EX-24123"]).toEqual(before);
      expect(useAppStore.getState().itemProcesses["EX-24123"].capture).toBeNull();
      store.submitItem({ caseId: "EX-24123", channel: "paper",
        endorsementText: before[0].declaration!.fields.endorsementText, declaration: before[0].declaration });
      const after = useAppStore.getState();
      expect(after.caseRevisions["EX-24123"]).toHaveLength(2);
      expect(after.caseRevisions["EX-24123"][0]).toEqual(before[0]);
      expect(after.caseRevisions["EX-24123"][1]).toMatchObject({
        number: 2, endorsementText: "NCSO JB 27/08/26", declaration: before[0].declaration,
      });
      expect(after.itemProcesses["EX-24123"]).toMatchObject({ revision: 2, capture: null, routing: { outcome: "type1_capture" } });
      expect(caseById("EX-24123")).toEqual(originalCase);
    });
  }

  it("attributes automatic EPS pricing without inventing human review", () => {
    const store = useAppStore.getState();
    const c = caseForLifecycle("EX-24107", store.lifecycles, store.caseRevisions)!;
    store.submitItem({ caseId: c.id, channel: "eps", endorsementText: c.extracted.endorsementText });
    const before = useAppStore.getState().lifecycles;
    const markup = renderClaim(c.id);
    expect(markup).toContain("Paid on the normal schedule");
    expect(markup).toContain("priced by NHSBSA&#x27;s existing rules engine, no person involved");
    expect(markup).toContain("EPS typed message");
    expect(useAppStore.getState().lifecycles).toBe(before);
    expect(before[c.id].history.filter((entry) => entry.revision === 2).map((entry) => entry.actor)).toEqual(["pharmacy", "code"]);
  });

  for (const approve of [false, true]) {
    it(`distinguishes the recorded human reason from an approved referral note, approved=${approve}`, () => {
      const store = useAppStore.getState();
      const caseId = "EX-24112";
      const paperDeclaration = caseById(caseId)!.paperDeclaration!;
      store.submitItem({ caseId, channel: "paper", endorsementText: paperDeclaration.endorsementText, paperDeclaration });
      store.arriveInQueue(caseId);
      store.setAgentEnabled(true);
      store.recordType2Decision({
        caseId, decision: "REFER_BACK", rbCode: "SYN-NCSO",
        reason: "Raw operator reason retained exactly.",
        ...(approve ? { approvedDraft: "Confirm the brand or manufacturer supplied." } : {}),
      });
      const history = useAppStore.getState().lifecycles[caseId].history;
      const on = renderClaim(caseId);
      expect(on).toContain("RB code");
      expect(on).toContain("SYN-NCSO");
      expect(on.includes("Raw operator reason retained exactly.")).toBe(!approve);
      expect(on.includes("Confirm the brand or manufacturer supplied.")).toBe(approve);
      if (approve) {
        expect(on).toContain("Operator-approved note");
        expect(on).toContain("2026-08");
        expect(on).toContain("Exact fix");
      } else {
        expect(on).toContain("No operator-approved draft");
        expect(on).toContain('data-pharmacy-action="apply-correction"');
        expect(on).not.toContain("Operator-approved; the agent verified and advised.");
      }
      store.setAgentEnabled(false);
      const off = renderClaim(caseId);
      expect(off).toContain("Raw operator reason retained exactly.");
      expect(off).not.toContain("Confirm the brand or manufacturer supplied.");
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
    const markup = renderClaim(caseId);
    expect(markup).toContain("Immutable pharmacy declaration");
    expect(markup).toContain("Current endorsement</dt><dd>NCSO AB 27/08/26</dd>");
    expect(markup).toContain("declared by the pharmacy, not read from the form");
    expect(markup).toContain("SYN-COCOD-100");
    expect(markup).toContain("Dr Demo (synthetic)");
    expect(markup).toContain("2026-09-13T12:00:00Z");
    expect(markup).not.toContain("no person involved");
    expect(useAppStore.getState().itemProcesses[caseId].capture).toBeNull();
    const revision = useAppStore.getState().caseRevisions[caseId].at(-1)!;
    store.confirmType1({ caseId, revision: revision.number, fields: revision.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    const capture = useAppStore.getState().lifecycles[caseId].history.find((event) => event.capture)?.capture;
    expect(renderClaim(caseId)).toContain('aria-label="Type 1 capture for attempt 2"');
    store.submitItem({ caseId, channel: "paper", endorsementText: "" });
    expect(renderClaim(caseId)).toContain('aria-label="Type 1 capture for attempt 2"');
    expect(useAppStore.getState().lifecycles[caseId].history.find((event) => event.capture)?.capture).toEqual(capture);
    expect(useAppStore.getState().itemProcesses[caseId].capture).toBeNull();
  });

  it("does not describe human-released paper as no-person pricing", () => {
    const store = useAppStore.getState();
    const caseId = "EX-24112";
    const paperDeclaration = caseById(caseId)!.paperDeclaration!;
    store.submitItem({ caseId, channel: "paper", endorsementText: paperDeclaration.endorsementText, paperDeclaration });
    store.arriveInQueue(caseId);
    store.referBack(caseId, "RB2B", "Confirm the brand or manufacturer supplied.");
    const current = useAppStore.getState(), revision = current.caseRevisions[caseId].at(-1)!;
    const c = caseForLifecycle(caseId, current.lifecycles, current.caseRevisions, current.itemProcesses)!;
    const draft = initialisePharmacyDraft(c, revision);
    store.setPharmacyDraft(caseId, { ...draft, purpose: "correction", paperDeclaration: {
      ...draft.paperDeclaration!, brandManufacturer: caseById(caseId)!.pharmacySupplyRecord!.brandManufacturer,
    } });
    store.setCorrectionAcknowledgement(caseId, revision.number, true);
    store.resubmit(caseId);
    expect(useAppStore.getState().itemProcesses[caseId].readyToRelease).toBe(true);
    store.releaseToPricing(caseId, "Human reviewed the supplied synthetic evidence.");
    const markup = renderClaim(caseId);
    expect(markup).toContain("Paid on the normal schedule");
    expect(markup).not.toContain("no person involved");
    const receipt = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PharmacySubmissionReceipt, {
      caseId, revisionNumber: useAppStore.getState().caseRevisions[caseId].at(-1)!.number, compact: true,
    })));
    expect(receipt).toContain("after operator review");
    expect(receipt).not.toContain("no operator action");
    expect(useAppStore.getState().lifecycles[caseId].history.at(-1)).toMatchObject({ actor: "operator", releaseOrigin: "human_decision" });
  });

  it("shows blind paper submission without inventing a declaration", () => {
    const store = useAppStore.getState();
    const caseId = "EX-24123";
    store.submitItem({ caseId, channel: "paper", endorsementText: "" });
    const markup = renderClaim(caseId);
    expect(markup).toContain("Paper");
    expect(markup).not.toContain('aria-label="Declaration for attempt 2"');
    expect(markup).not.toContain("no person involved");
    expect(useAppStore.getState().itemProcesses[caseId].routing.outcome).toBe("type1_capture");
    expect(useAppStore.getState().caseRevisions[caseId].at(-1)?.endorsementText).toBe("");
    expect(useAppStore.getState().caseRevisions[caseId].at(-1)?.declaration).toBeUndefined();
  });
});
