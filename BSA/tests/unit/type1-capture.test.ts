import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("Type 1 capture initial presentation", () => {
  it("renders the actual poor form, empty human fields and labelled assumed stopwatch without changing state", () => {
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
    expect(html).toContain('aria-label="Type 1 capture for EX-24123"');
    expect(html).toContain("Proposed: paper declaration support");
    expect(html).toContain("Original poor paper image");
    expect(html).toContain("blur(0.35px)");
    expect(html).toContain("Illegible");
    expect(html).toContain("No guidance, experience only");
    expect(html).toContain('aria-label="Assumed manual keying time"');
    expect(html).toContain("Illustration, not elapsed work");
    expect(html).toContain("Confirm capture and continue to Type 2");
    expect(html).toContain("the agent verifies the submission and advises; a person decides");
    expect([...html.matchAll(/<input[^>]*value=""/g)]).toHaveLength(3);
    expect(html).toMatch(/<textarea[^>]*><\/textarea>/);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("never renders a capture action for an automatically priced item", () => {
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24107" }));
    expect(html).toContain("not awaiting Type 1 capture");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Confirm capture");
  });

  it("reports unavailable evidence instead of presenting a success-shaped form", () => {
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "not-a-case" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Current capture evidence is unavailable");
    expect(html).not.toContain("<form");
  });
});
