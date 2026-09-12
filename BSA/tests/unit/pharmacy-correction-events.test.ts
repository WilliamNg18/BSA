import { beforeEach, describe, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { checkPharmacy, pharmacyDateCorrection, pharmacySnapshot } from "../../src/lib/domain/pharmacy-check";
import { useAppStore } from "../../src/lib/store";

const B = CASES[1];
const raw = B.extracted.endorsementText;
const corrected = pharmacyDateCorrection(B, raw);
const snapshot = (text: string) => pharmacySnapshot(text, B.extracted.dispensingDate, "scripted", checkPharmacy(B, text), "2026-09-12T12:00:00.000Z");
const store = () => useAppStore.getState();
beforeEach(() => {
  store().resetDemo();
  store().setAgentEnabled(true);
});

describe("human-applied pre-submission correction evidence", () => {
  it("records one immutable event without submitting, deciding or changing any lifecycle", () => {
    const original = store();
    const before = snapshot(raw), after = snapshot(corrected);
    const revision = original.caseRevisions[B.id].at(-1)!.number + 1;
    store().recordPharmacyCorrection(B.id, before, after, revision);
    store().recordPharmacyCorrection(B.id, before, after, revision);
    const current = store();
    expect(current.pharmacyCorrections).toHaveLength(1);
    expect(current.pharmacyCorrections[0]).toMatchObject({ caseId: B.id, pharmacyCode: original.lifecycles[B.id].pharmacyCode, revision, before, after });
    expect(Object.isFrozen(current.pharmacyCorrections[0].before)).toBe(true);
    expect(current.lifecycles).toBe(original.lifecycles);
    expect(current.caseRevisions).toBe(original.caseRevisions);
    expect(current.caseStates).toBe(original.caseStates);
    expect(current.records).toBe(original.records);
    expect(CASES[1].extracted.endorsementText).toBe(raw);
  });

  it("does not infer a caught gap from a ready submission", () => {
    store().submitFromPharmacy(B.id, corrected, snapshot(corrected));
    expect(store().pharmacyCorrections).toEqual([]);
  });

  it("retains evidence across Agent/perspective changes and clears it only on Reset", () => {
    store().recordPharmacyCorrection(B.id, snapshot(raw), snapshot(corrected), 2);
    const events = store().pharmacyCorrections;
    store().setAgentEnabled(false);
    store().setPerspective("pharmacy");
    expect(store().pharmacyCorrections).toBe(events);
    store().resetDemo();
    expect(store().pharmacyCorrections).toEqual([]);
    expect(store().perspective).toBe("pharmacy");
    store().setPerspective("both");
  });

  it("rejects Off, stale, reversed or fabricated ready evidence", () => {
    const before = snapshot(raw), after = snapshot(corrected);
    store().setAgentEnabled(false);
    expect(() => store().recordPharmacyCorrection(B.id, before, after, 2)).toThrow(/correction/);
    store().setAgentEnabled(true);
    expect(() => store().recordPharmacyCorrection(B.id, before, after, 3)).toThrow(/correction/);
    expect(() => store().recordPharmacyCorrection(B.id, after, before, 2)).toThrow(/correction/);
    expect(() => store().recordPharmacyCorrection(B.id, before, { ...after, checkedAt: "2026-09-11T12:00:00.000Z" }, 2)).toThrow(/correction/);
    const forged = { ...after, typedText: raw, facts: { ...after.facts!, quotedText: raw } };
    expect(() => store().recordPharmacyCorrection(B.id, before, forged, 2)).toThrow(/correction/);
    expect(store().pharmacyCorrections).toEqual([]);
  });
});
