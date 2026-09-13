import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

// SSR normally reads Zustand's initial seed; render the real current store after submissions.
vi.mock("../../src/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/store")>();
  return {
    ...actual,
    useAppStore: Object.assign(
      <T,>(selector: (state: ReturnType<typeof actual.useAppStore.getState>) => T) => selector(actual.useAppStore.getState()),
      actual.useAppStore,
    ),
  };
});

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
    expect(html).toContain("The agent verifies and advises; a person decides.");
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

  it.each([false, true])("describes readable paper B without promising Type 2 or claiming an unreadable scan, Agent=%s", (agentEnabled) => {
    const store = useAppStore.getState();
    store.submitItem({ caseId: "EX-24112", channel: "paper", endorsementText: "NCSO AB 12/08/26" });
    store.setAgentEnabled(agentEnabled);
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24112" }));
    expect(html).toContain("Original paper image");
    expect(html).toContain("Confirm capture and continue</button>");
    expect(html).toContain("Code routes confirmed evidence to existing pricing or Type 2 judgement.");
    expect(html).not.toContain("Original poor paper image");
    expect(html).not.toContain("cannot read this scan");
    expect(html).not.toContain("Confirm capture and continue to Type 2");
    if (agentEnabled) expect(html).toContain("Human capture or confirmation is required");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("reports unavailable evidence instead of presenting a success-shaped form", () => {
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "not-a-case" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Current capture evidence is unavailable");
    expect(html).not.toContain("<form");
  });
});
