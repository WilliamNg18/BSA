import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/lib/store";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import type { EpsPrescription } from "@/lib/domain/types";

const id = "SYN-FQ123-TYPE2";
const store = () => useAppStore.getState();
function snapshot(source: EpsPrescription) {
  const s = store(), latest = s.caseRevisions[id].at(-1)!;
  const c = caseForLifecycle(id, s.lifecycles, { ...s.caseRevisions, [id]: [
    ...s.caseRevisions[id].slice(0, -1), { ...latest, epsPrescription: source, endorsementText: source.dispenserEndorsement },
  ] })!;
  return pharmacySnapshot(source.dispenserEndorsement, source.dispensingDate, "scripted", checkEpsPharmacy(c, source.dispenserEndorsement), "2026-09-13T12:00:00.000Z");
}
function sources() {
  const before = structuredClone(store().caseRevisions[id][0].epsPrescription!);
  const after = { ...before, supplyEvidence: { ...before.supplyEvidence!, brandManufacturer: "Demo manufacturer (synthetic)" } };
  return { before, after };
}
beforeEach(() => { store().resetDemo(); store().setAgentEnabled(true); });

it("records immutable generic sources once without changing attempts or lifecycle", () => {
  const original = store(), pair = sources(), before = snapshot(pair.before), after = snapshot(pair.after);
  store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, pair);
  store().recordPharmacyCorrection(id, before, after, 2, { channel: "eps" }, pair);
  expect(store().pharmacyCorrections).toHaveLength(1);
  expect(store().pharmacyCorrections[0].epsSources).toEqual(pair);
  expect(Object.isFrozen(store().pharmacyCorrections[0].epsSources?.after.supplyEvidence)).toBe(true);
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
  const incomplete = { ...pair.before, supplyEvidence: { ...pair.before.supplyEvidence!, packSize: null } };
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

it.each(["patientLabel", "dispensingDate", "prescriberEndorsement"] as const)("rejects changing identity field %s while recording a correction", (field) => {
  const pair = sources(), changed = { ...pair.after, [field]: field === "dispensingDate" ? "2026-08-12" : "Changed (synthetic)" };
  expect(() => store().recordPharmacyCorrection(id, snapshot(pair.before), snapshot(changed), 2, { channel: "eps" }, { before: pair.before, after: changed })).toThrow();
  expect(store().pharmacyCorrections).toEqual([]);
});
