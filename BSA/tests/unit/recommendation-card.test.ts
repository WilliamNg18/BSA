import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { RecommendationCard } from "../../src/components/demo/recommendation-card";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("always-visible shared recommendation", () => {
  it.each(PLAYABLE_CASE_IDS)("renders the full visible contract for %s without mount effects", (id) => {
    const before = getDomainSnapshot(), apply = vi.fn();
    const r = deriveRecommendation(useAppStore.getState(), id);
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation: r, onApply: apply, compact: true }));
    for (const text of ["Recommendation", "Clause", r.ruleAuthority === "proposed_cross_record_check" ? "Dispensing-month reference" : "Tariff version", "Requirement results", "Recommended outcome",
      "Confidence signals", "Kernel outcome and gate retained", "the agent verifies and advises; a person decides"]) expect(html).toContain(text);
    expect(html).toContain(`data-recommendation-case="${id}"`);
    expect(html).not.toMatch(/<details|\shidden(?:=|\s|>)|aria-expanded/);
    expect(apply).not.toHaveBeenCalled();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows the source-backed selected pack correction without changing the dispensing date", () => {
    const r = deriveRecommendation(useAppStore.getState(), "SYN-FQ123-MISMATCH");
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation: r, audience: "pharmacy" }));
    expect(html).toContain("Corrected preview");
    expect(html).toContain("Select Amlodipine 10mg tablets, 28");
    expect(html).toContain("Corrected claim line preview");
    expect(html).toContain("Not applicable: proposed matching check");
    expect(html).toContain("Not applicable: typed records");
    expect(html).toContain("Not applicable: no image");
    expect(html).not.toContain("SYN-EPS-STRENGTH");
    expect(html).not.toContain("3 of 3");
    expect(html).toContain("21/08/2026");
    expect(html).toContain("Not met");
  });

  it("complete preserves all fields and explicitly says nothing to add", () => {
    const r = deriveRecommendation(useAppStore.getState(), "EX-24107");
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation: r }));
    expect(html).toContain("Complete against Clause 9, Version August 2026; nothing to add.");
    expect(html).not.toContain("Missing or unresolved");
    expect(html).not.toContain("Suggested values");
  });

  it("recorded preview is visible but never gets an Apply button", () => {
    const r = deriveRecommendation(useAppStore.getState(), "EX-24112", { kind: "recorded", revision: 1 });
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation: r, audience: "pharmacy", onApply: () => { throw new Error("No historical writes"); } }));
    expect(html).toContain("Recorded");
    expect(html).toContain("NCSO RK 21/08/26");
    expect(html).not.toContain("<button");
  });

  it.each([2, 3, 4] as const)("preserves the containing page heading hierarchy at level %s", (headingLevel) => {
    const r = deriveRecommendation(useAppStore.getState(), "SYN-FQ123-MISMATCH");
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation: r, headingLevel }));
    expect(html).toContain(`</h${headingLevel}>`);
    expect(html).toContain(`<h${headingLevel + 1} class="font-medium">`);
  });
});
