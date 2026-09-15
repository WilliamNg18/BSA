import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/lib/store";
import { projectEpsSubmissionDraft } from "@/lib/domain/eps-submission-draft";
import { checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import type { EpsPrescription } from "@/lib/domain/types";

const id = "EX-24107";
const store = () => useAppStore.getState();
function snapshot(source: EpsPrescription) {
  const s = store();
  const c = projectEpsSubmissionDraft(id, source, s.lifecycles, s.caseRevisions);
  return pharmacySnapshot(source.dispenserEndorsement, source.dispensingDate, "scripted", checkEpsPharmacy(c, source.dispenserEndorsement), "2026-09-13T12:00:00.000Z");
}
function sources() {
  const seed = store().caseRevisions[id][0].epsPrescription!;
  const before = structuredClone({ ...seed, dispenserEndorsement: "NCSO JB" });
  const after = { ...before, dispenserEndorsement: seed.dispenserEndorsement };
  return { before, after };
}
beforeEach(() => { store().resetDemo(); store().setAgentEnabled(true); });

it("records immutable EPS endorsement sources once without changing attempts or lifecycle", () => {
  const original = store(), pair = sources(), before = snapshot(pair.before), after = snapshot(pair.after);
  store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, pair);
  store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, pair);
  expect(store().pharmacyCorrections).toHaveLength(1);
  expect(store().pharmacyCorrections[0].epsSources).toEqual(pair);
  expect(Object.isFrozen(store().pharmacyCorrections[0].epsSources?.after.items[0])).toBe(true);
  pair.after.dispenserEndorsement = "Caller changed after recording";
  expect(store().pharmacyCorrections[0].epsSources?.after.dispenserEndorsement).toBe("NCSO JB 14/08/26");
  expect(store().lifecycles).toBe(original.lifecycles);
  expect(store().caseRevisions).toBe(original.caseRevisions);
  expect(store().records).toBe(original.records);
  store().setPerspective("pharmacy");
  expect(store().pharmacyCorrections).toHaveLength(1);
  store().resetDemo();
  expect(store().pharmacyCorrections).toEqual([]);
});

it("does not record partial multi-gap corrections, only the final ready transition", () => {
  const pair = sources();
  const incomplete = { ...pair.before, dispenserEndorsement: "NCSO" };
  expect(() => store().recordPharmacyCorrection(id, snapshot(incomplete), snapshot(pair.before), 2, { channel: "eps" }, { before: incomplete, after: pair.before })).toThrow();
  expect(store().pharmacyCorrections).toEqual([]);
  store().recordPharmacyCorrection(id, snapshot(pair.before), snapshot(pair.after), 2, { channel: "eps" }, pair);
  expect(store().pharmacyCorrections).toHaveLength(1);
});

it("rejects stale, Off, reversed or forged snapshot sources", () => {
  const pair = sources(), before = snapshot(pair.before), after = snapshot(pair.after);
  expect(() => store().recordPharmacyCorrection(id, before, after, 3, { channel: "eps" }, pair)).toThrow();
  store().setAgentEnabled(false);
  expect(() => store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, pair)).toThrow();
  store().setAgentEnabled(true);
  expect(() => store().recordPharmacyCorrection(id, after, before, 2, { channel: "eps" }, pair)).toThrow();
  expect(() => store().recordPharmacyCorrection(id, before, { ...after, checks: [] }, 2, { channel: "eps" }, pair)).toThrow();
  expect(() => store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, { before: pair.before, after: pair.before })).toThrow();
  expect(store().pharmacyCorrections).toEqual([]);
});

it("rejects identically invalid runtime message states before normalising validation copies", () => {
  const pair = sources(), before = snapshot(pair.before), after = snapshot(pair.after);
  Object.assign(pair.before, { claimMessageState: "invalid" });
  Object.assign(pair.after, { claimMessageState: "invalid" });
  expect(() => store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, pair)).toThrow();
  expect(store().pharmacyCorrections).toEqual([]);
});

it.each(["patientLabel", "dispensingDate", "prescriberEndorsement"] as const)("rejects changing identity field %s while recording a correction", (field) => {
  const pair = sources(), changed = { ...pair.after, [field]: field === "dispensingDate" ? "2026-08-12" : "Changed (synthetic)" };
  expect(() => store().recordPharmacyCorrection(id, snapshot(pair.before), snapshot(changed), 2, { channel: "eps" }, { before: pair.before, after: changed })).toThrow();
  expect(store().pharmacyCorrections).toEqual([]);
});
