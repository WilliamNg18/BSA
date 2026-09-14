import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { useAppStore } from "@/lib/store";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { checkEpsFields, checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { projectEpsResubmissionDraft } from "@/lib/domain/eps-submission-draft";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { runAgent } from "@/lib/domain/agent";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const id = "SYN-FQ123-MISMATCH", store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());
function refer() {
  const source = store().caseRevisions[id][0].epsPrescription!;
  store().submitItem({ caseId: id, channel: "eps", endorsementText: source.dispenserEndorsement, epsPrescription: source });
  store().arriveInQueue(id);
  store().recordType2Decision({ caseId: id, decision: "REFER_BACK", reason: "Correct the pack against the original supply evidence.", rbCode: "RB2B" });
  return store().caseRevisions[id].at(-1)!;
}

it("exposes the actual generic supply correction controls on the referred item's claim", () => {
  refer();
  const s = store(), c = caseForLifecycle(id, s.lifecycles, s.caseRevisions, s.itemProcesses)!;
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ClaimDetail, { c, row: s.lifecycles[id] })));
  for (const label of ["Brand or manufacturer dispensed", "Pack size dispensed", "Form dispensed", "Resubmit blind"]) expect(html).toContain(label);
  expect(html).not.toContain("will flow to automated pricing");
});

it.each([false, true])("corrects the same generic item through explicit human recheck, Agent %s", (enabled) => {
  const revision = refer(), original = store(), source = revision.epsPrescription!;
  store().setAgentEnabled(enabled);
  const corrected = { ...source, supplyEvidence: { ...source.supplyEvidence!, brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21 } };
  const projected = projectEpsResubmissionDraft(id, corrected, store().lifecycles, store().caseRevisions);
  expect(projected.requiresHumanRecheck).toBe(true);
  const checked = checkEpsFields(projected, corrected.dispenserEndorsement);
  expect(checked.status).toBe("ready");
  expect(checkEpsPharmacy(projected, corrected.dispenserEndorsement).status).not.toBe("ready");
  const payload = { caseId: id, revision: revision.number, channel: "eps" as const,
    endorsementText: corrected.dispenserEndorsement, epsPrescription: corrected,
    precheck: pharmacySnapshot(corrected.dispenserEndorsement, corrected.dispensingDate, enabled ? "scripted" : "off",
      enabled ? checked : null, enabled ? "2026-09-13T12:00:00.000Z" : null) };
  store().resubmitItem(payload);
  const resubmitted = store();
  expect(resubmitted.lifecycles[id].state).toBe("resubmitted");
  expect(resubmitted.caseRevisions[id].slice(0, -1)).toEqual(original.caseRevisions[id]);
  expect(resubmitted.lifecycles[id].history.slice(0, original.lifecycles[id].history.length)).toEqual(original.lifecycles[id].history);
  expect(resubmitted.records).toEqual(original.records);
  expect(resubmitted.caseRevisions[id].at(-1)?.epsPrescription?.supplyEvidence?.brandManufacturer).toBe("Demo manufacturer (synthetic)");
  expect(resubmitted.caseRevisions[id].at(-1)?.epsPrescription?.supplyEvidence?.packSize).toBe(21);
  expect(source.supplyEvidence?.packSize).toBe(28);
  expect(() => store().resubmitItem(payload)).toThrow();
  store().arriveInQueue(id);
  const c = caseForLifecycle(id, store().lifecycles, store().caseRevisions, store().itemProcesses)!;
  if (enabled) expect(runAgent(c, { agentEnabled: true }).recommendation).toBe("SUFFICIENT");
  store().recordType2Decision({ caseId: id, decision: "ACCEPT", reason: "Human confirmed the dispensed manufacturer and presentation." });
  expect(store().lifecycles[id].state).toBe("paid");
  expect(store().lifecycles[id].history.filter((event) => event.revision === revision.number + 1).some((event) => event.processStep === "automatic_pricing")).toBe(false);
});

it.each(["brandManufacturer", "packSize", "form"] as const)("does not approve an incomplete corrected supply field: %s", (field) => {
  const revision = refer(), source = revision.epsPrescription!;
  const corrected = { ...source, supplyEvidence: { ...source.supplyEvidence!, brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21, [field]: field === "packSize" ? null : "" } };
  const projected = projectEpsResubmissionDraft(id, corrected, store().lifecycles, store().caseRevisions);
  expect(checkEpsFields(projected, corrected.dispenserEndorsement).status).toBe("missing");
  store().resubmitItem({ caseId: id, revision: revision.number, channel: "eps", endorsementText: corrected.dispenserEndorsement, epsPrescription: corrected });
  store().arriveInQueue(id);
  expect(() => store().recordType2Decision({ caseId: id, decision: "ACCEPT", reason: "Attempt to accept missing supply evidence." })).toThrow();
  expect(store().lifecycles[id].state).not.toBe("paid");
});
