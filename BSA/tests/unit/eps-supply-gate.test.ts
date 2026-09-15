import { describe, expect, it } from "vitest";
import { runAgent } from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { createEpsPrescription, EPS_SUPPLY_RULE } from "../../src/lib/domain/eps-check";
import { complianceGate, evaluateRequirements } from "../../src/lib/domain/rules";
import { TARIFF_VERSIONS } from "../../src/lib/domain/tariff";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";
import type { ExceptionCase } from "../../src/lib/domain/types";

function generic(): ExceptionCase {
  const c = structuredClone(CASES[4]);
  c.id = "SYN-FQ123-TYPE2";
  c.extracted.productCode = EPS_SUPPLY_RULE.productCode;
  c.extracted.productText = "Amoxicillin 500mg capsules (generic synthetic)";
  c.extracted.quantity = 21;
  c.claim.productCode = EPS_SUPPLY_RULE.productCode;
  c.claim.quantity = 21;
  return { ...c, epsPrescription: createEpsPrescription(c) };
}

describe("registered generic supply compliance boundary", () => {
  it("never recommends Sufficient or clears a registered generic when the optional supply object is omitted", () => {
    const result = runAgent(generic());
    expect(result.recommendation).not.toBe("SUFFICIENT");
    expect(result.state).not.toBe("cleared_by_rules");
    expect(result.clause?.id).toBe("SYN-EPS-SUPPLY");
    expect(result.requirementResults.every((entry) => entry.met === false)).toBe(true);
  });
  it("retrieves the synthetic clause and recommends the exact missing supply fix, not an NCSO date", () => {
    const original = generic();
    const c = { ...original, epsPrescription: { ...original.epsPrescription!, supplyEvidence: {
      ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: "", packSize: 21, form: "capsules",
    } } };
    const result = runAgent(c);
    expect(result).toMatchObject({ recommendation: "REFER_BACK", gate: { result: "PASS" }, clause: { id: "SYN-EPS-SUPPLY" } });
    expect(result.draftToPharmacy).toBe(buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
    expect(result.draftToPharmacy).not.toContain(EPS_SUPPLY_RULE.brandManufacturer);
    expect(result.draftToPharmacy).not.toContain("initials");
    expect(result.trace.flatMap((step) => step.toolCalls).some((call) => call.tool === "read_image_region")).toBe(false);
  });
  it("does not manufacture supply evidence when the entire EPS source is absent", () => {
    const c = { ...generic(), epsPrescription: undefined };
    const result = runAgent(c);
    expect(result.state).not.toBe("cleared_by_rules");
    expect(result.recommendation).not.toBe("SUFFICIENT");
  });
  it.each(TARIFF_VERSIONS)("keeps $version generic requirements fail-closed in the pure gate", (version) => {
    const clause = version.clauses.find((entry) => entry.id === EPS_SUPPLY_RULE.id)!;
    expect(clause.text).toBe(EPS_SUPPLY_RULE.text);
    const results = evaluateRequirements(clause, null, generic().extracted);
    expect(results).toHaveLength(3);
    expect(complianceGate("SUFFICIENT", results, [], [{ name: "Known", pass: true, detail: "Synthetic" }], true, true).result).toBe("FAIL");
  });
  it("preserves canonical E no-model clearance and canonical D stop reasons", () => {
    expect(runAgent(CASES[4])).toMatchObject({ state: "cleared_by_rules", agentInvoked: false });
    expect(runAgent(CASES[3]).abstainReasons).toEqual([
      "No governing provision could be retrieved for this endorsement type and date",
      "Image quality 0.31 is below the 0.60 threshold",
      "Only 1 of 3 readings agree",
    ]);
  });
});
