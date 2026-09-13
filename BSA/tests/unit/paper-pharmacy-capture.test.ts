import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaperPharmacyCapture } from "../../src/components/demo/paper-pharmacy-capture";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

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
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain("checked=");
    expect(html).toContain("Confirm, not key");
  });
});
