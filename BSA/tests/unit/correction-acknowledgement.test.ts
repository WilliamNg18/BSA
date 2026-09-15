import { expect, it } from "vitest";
import { assertCorrectionAcknowledged, correctionFingerprint, type CorrectionPayload } from "../../src/lib/domain/correction-acknowledgement";
import { seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";

const draft = (): CorrectionPayload => ({
  revision: 2, channel: "paper", endorsementText: "NCSO JB 27/08/26",
  paperDeclaration: { typedProduct: "Co-codamol 30/500 tablets", quantity: 100,
    endorsementText: "NCSO JB 27/08/26", dispensingDate: "2026-08-27", declaredByPharmacy: true },
});

it("requires explicit current-payload acknowledgement, independently of the agent mode", () => {
  const value = draft();
  expect(() => assertCorrectionAcknowledged(value, 2)).toThrow(/must be checked/);
  const acknowledgement = { revision: 2, fingerprint: correctionFingerprint(value) };
  expect(() => assertCorrectionAcknowledged(value, 2, acknowledgement)).not.toThrow();
  expect(() => assertCorrectionAcknowledged(value, 3, acknowledgement)).toThrow(/stale/);
  expect(() => assertCorrectionAcknowledged(value, 2, { ...acknowledgement, revision: 1 })).toThrow(/confirm its accuracy again/);
});

it.each(["endorsement", "quantity", "date", "confirmation", "channel", "declaration"] as const)("rejects an acknowledgement after %s changes", (field) => {
  const value = draft(), acknowledgement = { revision: 2, fingerprint: correctionFingerprint(value) };
  const changed: CorrectionPayload = {
    ...value,
    ...(field === "endorsement" ? { endorsementText: "NCSO JB 27/08/26 updated" } : {}),
    ...(field === "quantity" ? { paperDeclaration: { ...value.paperDeclaration!, quantity: 28 } } : {}),
    ...(field === "date" ? { paperDeclaration: { ...value.paperDeclaration!, dispensingDate: "2026-08-28" } } : {}),
    ...(field === "confirmation" ? { confirmation: "Different information" } : {}),
    ...(field === "channel" ? { channel: "eps" } : {}),
    ...(field === "declaration" ? { declaration: { fields: { productCode: null, quantity: 100, endorsementText: value.endorsementText },
      declaredAt: "2026-09-01T09:00:00.000Z", provenance: "pharmacy_declaration" } } : {}),
  };
  expect(() => assertCorrectionAcknowledged(changed, 2, acknowledgement)).toThrow(/confirm its accuracy again/);
});

it("binds every EPS claim field while ignoring property order and Apply metadata", () => {
  const revision = seededLifecycleSession().caseRevisions["EX-24107"][0];
  const value = { revision: 2, channel: "eps" as const, endorsementText: revision.endorsementText, epsPrescription: revision.epsPrescription! };
  const before = correctionFingerprint(value);
  expect(correctionFingerprint({ ...value, epsPrescription: { ...value.epsPrescription, exemptionStatus: "chargeable" } })).not.toBe(before);
  expect(correctionFingerprint({ endorsementText: value.endorsementText, epsPrescription: value.epsPrescription, channel: value.channel, revision: 2 })).toBe(before);
  const withMetadata = { ...value, appliedSuggestion: true, correctionAcknowledgement: { revision: 2, fingerprint: "old" } };
  expect(correctionFingerprint(withMetadata)).toBe(before);
});

it("rejects invalid revisions and unsupported numeric payload values", () => {
  expect(() => correctionFingerprint({ ...draft(), revision: 0 })).toThrow(/current correction revision/);
  expect(() => correctionFingerprint({ ...draft(), paperDeclaration: { ...draft().paperDeclaration!, quantity: Number.NaN } })).toThrow(/unsupported payload/);
});
