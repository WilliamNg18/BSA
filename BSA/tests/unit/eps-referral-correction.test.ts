import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { getCorrectionAcknowledgementValid, getDomainSnapshot, useAppStore } from "@/lib/store";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { checkEpsFields, checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { projectEpsResubmissionDraft } from "@/lib/domain/eps-submission-draft";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";
import { EPS_SUPPLY_RULE } from "@/lib/domain/eps-check";
import { buildReferralNote } from "@/lib/domain/referral-wording";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const id = "SYN-FQ123-MISMATCH", store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());
function refer(enabled = false) {
  store().setAgentEnabled(enabled);
  const source = store().caseRevisions[id][0].epsPrescription!;
  store().submitItem({ caseId: id, channel: "eps", endorsementText: source.dispenserEndorsement, epsPrescription: source });
  const revision = store().caseRevisions[id].at(-1)!;
  if (enabled) store().arriveInQueue(id);
  else {
    expect(store().lifecycles[id].state).toBe("paid");
    expect(store().itemVerification[id]).toMatchObject({ gate1: "none", gate2: "none" });
    const history = structuredClone(store().lifecycles[id].history);
    store().reopenForAudit(id, revision.number, "Later audit queries the selected product against supply records.");
    expect(store().lifecycles[id].history.slice(0, -1)).toEqual(history);
    expect(store().lifecycles[id].history.at(-1)?.actor).toBe("operator");
  }
  store().referBack(id, "RB2B", buildReferralNote([{ rule: "strength_matches_prescription" }]));
  return store().caseRevisions[id].at(-1)!;
}

it("exposes the actual selected-strength and accuracy controls on the referred item's claim", () => {
  refer();
  const s = store(), c = caseForLifecycle(id, s.lifecycles, s.caseRevisions, s.itemProcesses)!;
  const before = getDomainSnapshot();
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ClaimDetail, { c, row: s.lifecycles[id] })));
  for (const label of ['id="eps-selected-pack"', "I confirm the corrected information is accurate", "Resubmit"]) expect(html).toContain(label);
  expect(html).toMatch(/<button(?=[^>]*data-pharmacy-action="resubmit")(?=[^>]*disabled)[^>]*>/);
  expect(html).not.toContain("will flow to automated pricing");
  expect(getDomainSnapshot()).toEqual(before);
});

it.each([false, true])("rechecks the same acknowledged strength correction without a second operator press, Agent %s", (enabled) => {
  const revision = refer(enabled), original = store(), source = revision.epsPrescription!;
  const corrected = { ...source, items: source.items.map((item) => ({
    ...item, dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets",
  })) };
  const projected = projectEpsResubmissionDraft(id, corrected, store().lifecycles, store().caseRevisions);
  // The old draft-only projection is conservative; the acknowledged store action owns recheck routing.
  expect(projected.epsPrescription?.supplyRecord).toEqual(source.supplyRecord);
  const checked = checkEpsFields(projected, corrected.dispenserEndorsement);
  expect(checked.status).toBe("ready");
  expect(checkEpsPharmacy(projected, corrected.dispenserEndorsement).status).not.toBe("ready");
  const c = caseForLifecycle(id, original.lifecycles, original.caseRevisions, original.itemProcesses)!;
  store().setPharmacyDraft(id, { ...initialisePharmacyDraft(c, revision), purpose: "correction", epsPrescription: corrected });
  expect(store().caseRevisions[id]).toBe(original.caseRevisions[id]);
  expect(store().lifecycles[id].history).toBe(original.lifecycles[id].history);
  expect(() => store().resubmit(id)).toThrow("must be checked");
  store().setCorrectionAcknowledgement(id, revision.number, true);
  expect(getCorrectionAcknowledgementValid(id)).toBe(true);
  expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "pharmacy", processStep: "correction_acknowledged" });
  expect(store().caseRevisions[id]).toBe(original.caseRevisions[id]);
  const acknowledged = store();
  store().resubmit(id);
  const resubmitted = store();
  expect(resubmitted.lifecycles[id].state).toBe(enabled ? "released_to_pricing" : "paid");
  expect(resubmitted.caseRevisions[id].slice(0, -1)).toEqual(original.caseRevisions[id]);
  expect(resubmitted.lifecycles[id].history.slice(0, acknowledged.lifecycles[id].history.length)).toEqual(acknowledged.lifecycles[id].history);
  expect(resubmitted.records).toEqual(original.records);
  expect(resubmitted.caseRevisions[id].at(-1)?.epsPrescription).toEqual(corrected);
  expect(source.items[0].dispensedCode).toBe("SYN-AMLO5-28");
  expect(source.supplyRecord).toEqual(corrected.supplyRecord);
  expect(resubmitted.itemProcesses[id].routing.requiresHuman).toBe(false);
  const events = resubmitted.lifecycles[id].history.filter((event) => event.revision === revision.number + 1);
  expect(events.map((event) => event.actor)).toEqual(["pharmacy", "code"]);
  expect(() => store().resubmit(id)).toThrow();
});

it.each(["brandManufacturer", "packSize", "form"] as const)("retains isolated historical generic-supply validation for incomplete %s without activating a fifth case", (field) => {
  const source = store().caseRevisions[id][0].epsPrescription!;
  const corrected = { ...source, supplyRecord: undefined,
    items: source.items.map((item) => ({ ...item, prescribedCode: EPS_SUPPLY_RULE.productCode, dispensedCode: EPS_SUPPLY_RULE.productCode,
      product: "Amoxicillin 500mg capsules (generic synthetic)", dispensedName: "Amoxicillin 500mg capsules (generic synthetic)" })),
    supplyEvidence: { ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer,
      packSize: EPS_SUPPLY_RULE.packSize, form: EPS_SUPPLY_RULE.form, [field]: field === "packSize" ? null : "" } };
  const before = getDomainSnapshot();
  const projected = projectEpsResubmissionDraft(id, corrected, store().lifecycles, store().caseRevisions);
  expect(checkEpsFields(projected, corrected.dispenserEndorsement).status).toBe("missing");
  expect(checkEpsPharmacy(projected, corrected.dispenserEndorsement).status).not.toBe("ready");
  expect(getDomainSnapshot()).toEqual(before);
});

it.each([false, true])("does not release an acknowledged but unchanged strength error with proposed verification, initially On=%s", (initiallyEnabled) => {
  const revision = refer(initiallyEnabled);
  store().setAgentEnabled(true);
  const s = store(), c = caseForLifecycle(id, s.lifecycles, s.caseRevisions, s.itemProcesses)!;
  s.setPharmacyDraft(id, { ...initialisePharmacyDraft(c, revision), purpose: "correction" });
  s.setCorrectionAcknowledgement(id, revision.number, true);
  s.resubmit(id);
  expect(store().caseRevisions[id].at(-1)?.epsPrescription).toEqual(revision.epsPrescription);
  expect(store().itemVerification[id]).toMatchObject({ gate1: "fail", gate2: "fail", released: false });
  store().arriveInQueue(id);
  expect(() => store().releaseToPricing(id, "Attempt to accept the unchanged known mismatch.")).toThrow();
  expect(store().lifecycles[id].state).not.toBe("paid");
});
