import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaperPharmacyCapture } from "../../src/components/demo/paper-pharmacy-capture";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/store")>();
  return { ...actual, useAppStore: Object.assign(
    <T,>(selector: (state: ReturnType<typeof actual.useAppStore.getState>) => T) => selector(actual.useAppStore.getState()),
    actual.useAppStore,
  ) };
});
beforeEach(() => useAppStore.getState().resetDemo());
const renderPaper = (caseId: string, compact = false) => renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(PaperPharmacyCapture, { caseId, compact })));

describe("paper pharmacy and Type 1 surfaces", () => {
  it("has no declaration fields Off, with actual posting and truthful delayed manual-path narrative", () => {
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(PaperPharmacyCapture));
    expect(html).toContain("Post paper");
    expect(html).toContain("Type 1 keys");
    expect(html).toContain("RB2B");
    expect(html).toContain("labels show read confidence");
    expect(html).toContain("Deliberately poor scan");
    expect(html).toContain("read 0.");
    expect(html).toContain('stroke-dasharray="1.2 0.6"');
    expect(html).toContain("delays are illustrative");
    expect(html).not.toContain("Load worked declaration");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Declared product");
    expect(getDomainSnapshot()).toEqual(before);
  });
  it("labels all four proposed fields and shows the poor image without automatic confirmation", () => {
    useAppStore.getState().setAgentEnabled(true);
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(PaperPharmacyCapture));
    expect(html).toContain("Proposed: paper form and declaration");
    expect(html).toContain("Declaration complete");
    expect(html).toContain("Declaration missing information");
    expect(html).toContain("Post paper with declaration");
    expect(html).toContain("Deliberately poor scan");
    expect(html).toContain("Declared dispensing date");
    expect(html).toContain("declared by the pharmacy, not read from the form");
    expect(html.match(/aria-describedby="[^"]*-origin"/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).not.toContain("checked=");
    expect(getDomainSnapshot()).toEqual(before);
  });
  it("requires unchecked human reconciliation beside the retained JB declaration and its declared prescriber", () => {
    useAppStore.getState().setAgentEnabled(true);
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
    expect(html).toContain("NCSO JB 27/08/26");
    expect(html).toContain("Declared dispensing date");
    expect(html).toMatch(/Image (?:agreement remains unknown|unreadable; agreement unknown)/);
    expect(html).toContain("Received declaration requirement checks");
    expect(html).toContain("not read from the form");
    expect(html).toContain("Dr Example (synthetic demo declaration)");
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain("checked=");
    expect(html).toContain("Confirm, not key");
  });
  it("preserves the ordinary paper variant without describing a readable image as unreadable", () => {
    const html = renderPaper("EX-24112");
    expect(html).toContain("Readable paper still requires operator review and release");
    expect(html).not.toContain("image cannot be read");
    useAppStore.getState().setAgentEnabled(true);
    const assisted = renderPaper("EX-24112");
    expect(assisted).toContain("Declaration complete");
    expect(assisted).toContain("Declared brand or manufacturer");
    expect(assisted).toContain("Declared pack size");
    expect(assisted).toContain("New demonstration attempt; history retained.");
    expect(assisted).not.toContain("Load worked declaration");
  });
  it("retains an immutable receipt, claim link and recorded timeline after actual posting", () => {
    useAppStore.getState().submitItem({ caseId: "EX-24123", channel: "paper", endorsementText: "Original unreadable paper" });
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PaperPharmacyCapture)));
    expect(html).toContain('aria-label="Submission receipt"');
    expect(html).toContain("Original unreadable paper");
    expect(html).toContain("View submitted claim");
    expect(html).toContain("Submission timeline");
    expect(html).toContain("playback changes nothing and calculates no payment");
    expect(html).toContain("Humans decide referrals.");
    expect(getDomainSnapshot()).toEqual(before);
  });
  it.each([false, true])("keeps explanatory submission and declaration-check panels below 25 words, agent=%s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    for (const caseId of ["EX-24123", "EX-24112"]) {
      const html = renderPaper(caseId);
      const compact = renderPaper(caseId, true);
      const receiptStart = compact.indexOf('<section aria-label="Submission receipt"');
      const panels = receiptStart < 0 ? [compact] : [compact.slice(0, receiptStart), compact.slice(receiptStart)];
      for (const panel of panels) {
        const paragraphs = [...panel.matchAll(/<p[^>]*>(.*?)<\/p>/g)];
        const prose = paragraphs.map((paragraph) => paragraph[1].replace(/<[^>]+>/g, "")).join(" ");
        expect(prose.trim().split(/\s+/).length).toBeLessThan(25);
      }
      expect(html).not.toContain("will release");
    }
  });
});
