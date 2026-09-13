import { describe, expect, it } from "vitest";
import { MANUAL_LOOP_INPUT_METADATA, MANUAL_LOOP_MONTH_DEFAULTS } from "../../src/lib/domain/baseline";
import { CASES, QUEUE_FILLER } from "../../src/lib/domain/cases";
import { seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";
import { BACKGROUND_PHARMACIES, HILLCREST_PHARMACY, PHARMACIES } from "../../src/lib/domain/reference";
import type { EpsPrescription, PaperDeclaration } from "../../src/lib/domain/types";

describe("Tasks 25-30 frozen contracts", () => {
  it("has one operational pharmacy and keeps background pharmacies outside the session", () => {
    expect(PHARMACIES).toEqual([HILLCREST_PHARMACY]);
    expect(CASES.every((c) => c.pharmacy.contractorCode === "FQ123")).toBe(true);
    expect(QUEUE_FILLER.every((row) => row.pharmacy === HILLCREST_PHARMACY.name)).toBe(true);
    const codes = new Set(Object.values(seededLifecycleSession().lifecycles).map((row) => row.pharmacyCode));
    expect([...codes]).toEqual(["FQ123"]);
    expect(BACKGROUND_PHARMACIES.every((p) => !codes.has(p.contractorCode))).toBe(true);
  });

  it("freezes the new labelled referral-loop defaults without changing historical model defaults", () => {
    expect(MANUAL_LOOP_MONTH_DEFAULTS).toMatchObject({
      manualLoopItems: 85_000, gatheringMinutesToday: 10, judgingMinutesToday: 3,
      doubleCheckPercent: 25, builtJudgingMinutes: 3, preventionPercent: 80,
      clearancePercent: 70, abstentionPercent: 5, mysCompletionMinutes: 6,
    });
    expect(Object.isFrozen(MANUAL_LOOP_MONTH_DEFAULTS)).toBe(true);
    expect(Object.keys(MANUAL_LOOP_INPUT_METADATA).sort()).toEqual(Object.keys(MANUAL_LOOP_MONTH_DEFAULTS).sort());
    expect(MANUAL_LOOP_INPUT_METADATA.manualLoopItems.definition).toContain("not all staff work");
    expect(MANUAL_LOOP_INPUT_METADATA.abstentionPercent.provenance).toBe("assumption");
  });

  it("keeps digital prescription content separate from pharmacy-declared paper content", () => {
    const eps: EpsPrescription = {
      prescriber: { name: "Dr Demo (synthetic)", practice: "Synthetic practice" },
      patientLabel: "Synthetic patient", prescriptionDate: "2026-08-27", dispensingDate: "2026-08-27",
      items: [{ prescribedCode: "SYN-COCOD-100", product: "Co-codamol", strength: "30/500", form: "tablets",
        quantity: 100, dose: "Synthetic instruction, not prescribing advice", dispensedCode: "SYN-COCOD-100", dispensedName: "Co-codamol 30/500 tablets" }],
      prescriberEndorsement: "", dispenserEndorsement: "NCSO JB 27/08/26",
      exemptionStatus: "not_recorded", claimMessageState: "draft",
    };
    const paper: PaperDeclaration = {
      typedProduct: "Co-codamol 30/500 tablets", quantity: 100,
      endorsementText: "NCSO JB 27/08/26", dispensingDate: "2026-08-27", declaredByPharmacy: true,
    };
    expect(eps.claimMessageState).toBe("draft");
    expect(paper.declaredByPharmacy).toBe(true);
    expect(paper).not.toHaveProperty("declarationReconciled");
    expect(eps).not.toHaveProperty("image");
  });
});
