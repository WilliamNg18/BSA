import { beforeEach, describe, expect, it } from "vitest";
import { checkPharmacyCorrection, initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { pharmacySnapshot } from "../../src/lib/domain/pharmacy-check";
import { validatePrecheck } from "../../src/lib/domain/lifecycle-model";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { sessionCase, useAppStore } from "../../src/lib/store";

const id = "EX-24112";
const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

describe("unsupported pharmacy precheck submission", () => {
  it.each(["SP RK", "SP RK £3.41", "unrecognised endorsement"])("serialises %s as unable and permits explicit Send without release", (text) => {
    store().setAgentEnabled(true);
    const revision = store().caseRevisions[id][0], current = sessionCase(id)!;
    const initial = initialisePharmacyDraft(current, revision);
    const draft = { ...initial, endorsementText: text,
      epsPrescription: { ...initial.epsPrescription!, dispenserEndorsement: text } };
    const result = checkPharmacyCorrection(current, revision, draft);
    expect(result).toMatchObject({ status: "unable", clause: null, version: "2026-08", facts: { type: "UNKNOWN" },
      stages: ["PASS", "STOPPED", "NOT RUN", "NOT RUN", "NOT RUN"] });
    expect(result.checks.some((entry) => !entry.met)).toBe(true);
    const precheck = pharmacySnapshot(text, draft.epsPrescription.dispensingDate, "scripted", result, "2026-09-15T02:00:00.000Z");
    expect(() => validatePrecheck(precheck, text, draft.epsPrescription.dispensingDate)).not.toThrow();
    store().submitItem({ ...draft, caseId: id, channel: "eps", precheck });
    expect(store().caseRevisions[id][0]).toEqual(revision);
    expect(store().caseRevisions[id].at(-1)).toMatchObject({ number: 2, endorsementText: text, precheck: { status: "unable", clauseId: null } });
    expect(store().lifecycles[id].state).toBe("submitted");
    expect(store().itemVerification[id]).toMatchObject({ gate1: "fail", released: false });
    expect(deriveRecommendation(store(), id)).toMatchObject({ kernelRecommendation: "ABSTAIN", kernelGate: "NOT_RUN", operatorApplyAllowed: false });
  });

  it("keeps unavailable dated provisions unable without inventing a citation", () => {
    const revision = store().caseRevisions[id][0], current = sessionCase(id)!;
    const initial = initialisePharmacyDraft(current, revision);
    const draft = { ...initial, epsPrescription: { ...initial.epsPrescription!, dispensingDate: "2027-01-21" } };
    const result = checkPharmacyCorrection(current, revision, draft);
    expect(result).toMatchObject({ status: "unable", version: null, clause: null,
      stages: ["PASS", "PASS", "STOPPED", "NOT RUN", "NOT RUN"] });
    const snapshot = pharmacySnapshot(draft.endorsementText, "2027-01-21", "scripted", result, "2026-09-15T02:00:00.000Z");
    expect(() => validatePrecheck(snapshot, draft.endorsementText, "2027-01-21")).not.toThrow();
  });

  it("retains missing-date classification and strict rejection of the old malformed snapshot", () => {
    const revision = store().caseRevisions[id][0], current = sessionCase(id)!;
    const draft = initialisePharmacyDraft(current, revision);
    const result = checkPharmacyCorrection(current, revision, draft);
    expect(result).toMatchObject({ status: "missing", clause: { id: "P2-C9" } });
    const snapshot = pharmacySnapshot(draft.endorsementText, draft.epsPrescription!.dispensingDate, "scripted", result, "2026-09-15T02:00:00.000Z");
    expect(() => validatePrecheck({ ...snapshot, clauseId: null }, draft.endorsementText, draft.epsPrescription!.dispensingDate)).toThrow("Invalid or stale");
  });
});
