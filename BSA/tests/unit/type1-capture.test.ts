import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Type1Capture, Type1CaptureEvidence } from "../../src/components/demo/type1-capture";
import { SubmittedCaseEvidence } from "../../src/components/demo/as-submitted-evidence";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { caseById } from "../../src/lib/domain/cases";

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
  it("keeps externally placed compact evidence read-only and renders exactly one human form", () => {
    useAppStore.getState().setAgentEnabled(true);
    const before = getDomainSnapshot();
    const evidence = renderToStaticMarkup(createElement(Type1CaptureEvidence, { caseId: "EX-24123" }));
    expect(evidence).toContain("Read-only source comparison");
    expect(evidence).toContain("Original poor paper image");
    expect(evidence).toContain("NCSO JB 27/08/26");
    expect(evidence).toContain("2026-08-27");
    expect(evidence).not.toMatch(/<(?:form|input|button|textarea)\b/);
    const form = renderToStaticMarkup(createElement(Type1Capture, {
      caseId: "EX-24123", compact: true, evidencePlacement: "external",
    }));
    expect(form.match(/<form\b/g)).toHaveLength(1);
    expect(form).not.toContain('role="img"');
    expect(form).not.toContain('aria-label="Original pharmacy declaration"');
    expect(form).toContain("Confirm capture and continue to Type 2");
    expect(form).toContain(">Correct</button>");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("ignores external placement for the ordinary capture panel", () => {
    useAppStore.getState().setAgentEnabled(true);
    const ordinary = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
    const requested = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123", evidencePlacement: "external" }));
    expect(requested).toBe(ordinary);
  });

  it("places the compact editor after both immutable sources rather than inside their side column", () => {
    useAppStore.getState().setAgentEnabled(true);
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123", compact: true }));
    expect(html.indexOf('data-capture-source="image"')).toBeLessThan(html.indexOf("<form"));
    expect(html.indexOf('data-capture-source="declaration"')).toBeLessThan(html.indexOf("<form"));
    expect(html).toContain('data-capture-editor="true"');
    expect(html).toContain("col-span-2");
  });

  it("renders the actual poor form, empty human fields and labelled assumed stopwatch without changing state", () => {
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
    expect(html).toContain('aria-label="Type 1 capture for EX-24123"');
    expect(html).toContain("Proposed: paper declaration support");
    expect(html).toContain('aria-label="Paper scanner comparison"');
    expect(html).toContain("Synthetic submitted paper scan: EX-24123");
    expect(html).toContain("blur(0.3px)");
    expect(html).toContain("Illegible");
    expect(html.match(/data-paper-scanner-columns/g)).toHaveLength(1);
    for (const source of ["declaration", "scan", "character-recognition"]) {
      const index = html.indexOf(`data-paper-source="${source}"`);
      expect(index).toBeGreaterThan(-1);
      expect(index).toBeLessThan(html.indexOf("<form"));
    }
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

  it.each([false, true])("describes readable paper B without offering unnecessary capture or claiming an unreadable scan, Agent=%s", (agentEnabled) => {
    const store = useAppStore.getState();
    store.setAgentEnabled(agentEnabled);
    const paperDeclaration = caseById("EX-24112")!.paperDeclaration!;
    store.submitItem({ caseId: "EX-24112", channel: "paper", endorsementText: paperDeclaration.endorsementText, paperDeclaration });
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(SubmittedCaseEvidence, { caseId: "EX-24112" }),
      createElement(Type1Capture, { caseId: "EX-24112" })));
    expect(html).toContain("Synthetic submitted paper scan: EX-24112");
    expect(html).toContain("Readable source");
    expect(html).toContain("This item is not awaiting Type 1 capture.");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Original poor paper image");
    expect(html).not.toContain("cannot read this scan");
    expect(html).not.toContain("Confirm capture and continue to Type 2");
    expect(before.itemProcesses["EX-24112"].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(before.itemVerification["EX-24112"].released).toBe(false);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("reports unavailable evidence instead of presenting a success-shaped form", () => {
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "not-a-case" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Current capture evidence is unavailable");
    expect(html).not.toContain("<form");
  });
});
