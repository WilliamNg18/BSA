import { describe, expect, it } from "vitest";
import { EPS_ERROR_EVIDENCE, EPS_MISMATCH_ESTIMATE, EPS_STRENGTH_COPY } from "../../src/lib/domain/eps-error-evidence";

describe("public evidence boundaries for wrong strength", () => {
  it("keeps the dispensing study separate from an NHSBSA claim statistic", () => {
    expect(EPS_ERROR_EVIDENCE.study).toMatchObject({
      doi: "10.1016/j.sapharm.2023.10.003", includedStudies: 62, pooledPrevalencePercent: 1.6,
      confidenceInterval95Percent: [1.2, 2.1], searchPeriod: "January 2010 to September 2023",
      label: "study on dispensing errors, used to make the scenario realistic; not an NHSBSA claim statistic",
      typeCountsVerified: false,
    });
    expect(EPS_ERROR_EVIDENCE.study.chapterOneLine).not.toMatch(/most reported|39|44|34/);
    expect(EPS_ERROR_EVIDENCE.study.context).toContain("not an NHSBSA or EPS claim-error rate");
  });

  it("cites the actual NHSBSA page, preserving the conditional pricing context", () => {
    expect(EPS_ERROR_EVIDENCE.nhsbsa).toMatchObject({
      url: "https://www.nhsbsa.nhs.uk/endorsing-correctly-eps-actual-medicinal-product-pack",
      label: "public, NHSBSA", quotation: "what you have endorsed and not what you have supplied",
      publicationDate: null,
    });
    expect(EPS_ERROR_EVIDENCE.nhsbsa.scope).toContain("When the selected actual medicinal product pack has a dm+d price");
    expect(EPS_ERROR_EVIDENCE.nhsbsa.location).toContain("unpaginated HTML");
  });

  it("labels matching as a proposed check, not an invented Tariff clause", () => {
    expect(EPS_STRENGTH_COPY.ruleLabel).toBe("Proposed matching check, informed by public NHSBSA endorsement guidance");
    expect(EPS_STRENGTH_COPY.authorityLabel).toBe("the agent verifies and advises; a person decides");
    expect(EPS_STRENGTH_COPY.proof).toBe("this is the proof the agent does not rubber-stamp");
    expect(EPS_STRENGTH_COPY.uncorrected).toContain("never automatically released");
  });

  it("uses a separate editable one-percent assumption rather than the study prevalence", () => {
    expect(EPS_MISMATCH_ESTIMATE).toMatchObject({
      defaultShare: 0.01, inputClassification: "assumption", todayLabel: "none", withClassification: "estimate",
    });
    expect(EPS_MISMATCH_ESTIMATE.defaultShare).not.toBe(EPS_ERROR_EVIDENCE.study.pooledPrevalencePercent / 100);
  });
});
