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

describe("paper pharmacy and Type 1 surfaces", () => {
  it("has no declaration fields Off, with actual posting and truthful delayed manual-path narrative", () => {
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(PaperPharmacyCapture));
    expect(html).toContain("Post paper");
    expect(html).toContain("Type 1 keys by eye");
    expect(html).toContain("RB2B");
    expect(html).toContain("labels show read confidence");
    expect(html).toContain("Deliberately poor scan");
    expect(html).toContain("not this demo");
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
    expect(html).toContain("Load worked declaration");
    expect(html).toContain("Post paper with declaration");
    expect(html).toContain("image cannot be read");
    expect(html).toContain("Declared dispensing date");
    expect(html.match(/declared by the pharmacy, not read from the form/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).not.toContain("checked=");
    expect(getDomainSnapshot()).toEqual(before);
  });
  it("requires an unchecked human reconciliation and missing prescriber beside the exact retained JB example", () => {
    useAppStore.getState().setAgentEnabled(true);
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
    expect(html).toContain("NCSO JB 27/08/26");
    expect(html).toContain("Declared dispensing date");
    expect(html).toContain("Image agreement remains unknown");
    expect(html).toContain("separately established prescriber evidence");
    expect(html).toContain("Received declaration requirement checks");
    expect(html).toContain("Declaration requirements complete; not human-confirmed");
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain("checked=");
    expect(html).toContain("Confirm, not key");
  });
  it("preserves the ordinary paper variant without describing a readable image as unreadable", () => {
    const html = renderToStaticMarkup(createElement(PaperPharmacyCapture, { caseId: "EX-24112" }));
    expect(html).toContain("Code routes complete evidence to existing pricing");
    expect(html).toContain("Post a new synthetic attempt");
    expect(html).toContain("use its claim details and resubmit there");
    expect(html).not.toContain("image cannot be read");
    useAppStore.getState().setAgentEnabled(true);
    const assisted = renderToStaticMarkup(createElement(PaperPharmacyCapture, { caseId: "EX-24112" }));
    expect(assisted).toContain("Load complete paper declaration");
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
    expect(html).toContain("Playback never advances the claim");
    expect(getDomainSnapshot()).toEqual(before);
  });
});
