import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RecommendationCard } from "../../src/components/demo/recommendation-card";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("always-visible shared recommendation", () => {
  it.each(PLAYABLE_CASE_IDS)("renders the full visible contract for %s without mount effects", (id) => {
    const before = getDomainSnapshot(), apply = vi.fn();
    const r = deriveRecommendation(useAppStore.getState(), id);
    const html = renderToStaticMarkup(<RecommendationCard recommendation={r} onApply={apply} compact />);
    for (const text of ["Recommendation", "Clause", "Tariff version", "Requirement results", "Recommended outcome",
      "Confidence signals", "Kernel outcome and gate retained", "the agent verifies and advises; a person decides"]) expect(html).toContain(text);
    expect(html).toContain(`data-recommendation-case="${id}"`);
    expect(html).not.toMatch(/<details|hidden=|aria-expanded/);
    expect(apply).not.toHaveBeenCalled();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows the exact missing date and corrected text, with no duplicate date narration", () => {
    const r = deriveRecommendation(useAppStore.getState(), "EX-24112");
    const html = renderToStaticMarkup(<RecommendationCard recommendation={r} />);
    expect(html).toContain("Corrected preview");
    expect(html).toContain("NCSO RK 21/08/26");
    expect(html).toContain("Add the dispensing date beside the initials");
    expect(html).toContain("21/08/2026");
    expect(html).toContain("Not met");
  });

  it("complete preserves all fields and explicitly says nothing to add", () => {
    const r = deriveRecommendation(useAppStore.getState(), "EX-24107");
    const html = renderToStaticMarkup(<RecommendationCard recommendation={r} />);
    expect(html).toContain("Complete against Clause 9, Version August 2026; nothing to add.");
    expect(html).not.toContain("Missing or unresolved");
    expect(html).not.toContain("Suggested values");
  });

  it("recorded preview is visible but never gets an Apply button", () => {
    const r = deriveRecommendation(useAppStore.getState(), "EX-24112", { kind: "recorded", revision: 1 });
    const html = renderToStaticMarkup(<RecommendationCard recommendation={r} onApply={() => { throw new Error("No historical writes"); }} />);
    expect(html).toContain("Recorded");
    expect(html).toContain("NCSO RK 21/08/26");
    expect(html).not.toContain("<button");
  });
});
