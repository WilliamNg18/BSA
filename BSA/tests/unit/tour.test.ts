import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isTourShortcut, TOUR_STOPS, tourStopIndex } from "../../src/lib/tour-navigation";
import { SourceDisclosure } from "../../src/components/demo/source-disclosure";

describe("tour navigation contract", () => {
  it("has six chapters and a reversible pharmacy substop", () => {
    expect(TOUR_STOPS.map((stop) => stop.chapter)).toEqual([1, 2, 3, 4, 4, 5, 6]);
    expect(TOUR_STOPS.map((stop) => stop.to)).toEqual(["/#scene", "/#month", "/#cases", "/#two-places", "/pharmacy", "/queue", "/#close"]);
  });
  it.each(TOUR_STOPS.map((stop, index) => ({ ...stop, index })))("resolves $to", ({ to, index }) => {
    const url = new URL(to, "https://example.test");
    expect(tourStopIndex(url.pathname, url.hash)).toBe(index);
  });
  it.each(["", "#main-content", "#unknown"])("uses scene for the home fragment %s", (hash) => {
    expect(tourStopIndex("/", hash)).toBe(0);
  });
  it.each(["/missing-page", "/case/invalid", "/case/EX-24112", "/architecture"])("does not invent a chapter for %s", (path) => {
    expect(tourStopIndex(path, "#scene")).toBe(-1);
  });
  const shortcut = { key: "ArrowRight", altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, defaultPrevented: false, isComposing: false };
  it("accepts only the two intended Alt shortcuts", () => {
    expect(isTourShortcut(shortcut)).toBe(true);
    expect(isTourShortcut({ ...shortcut, key: "ArrowLeft" })).toBe(true);
    expect(isTourShortcut({ ...shortcut, key: "ArrowUp" })).toBe(false);
    expect(isTourShortcut({ ...shortcut, altKey: false })).toBe(false);
  });
  it.each(["ctrlKey", "metaKey", "shiftKey", "repeat", "defaultPrevented", "isComposing"] as const)("excludes %s conflicts", (key) => {
    expect(isTourShortcut({ ...shortcut, [key]: true })).toBe(false);
  });
});

describe("source disclosure boundary", () => {
  it("names class, source document, attribution and paragraph without raw source prose", () => {
    const html = renderToStaticMarkup(createElement(SourceDisclosure, { claimIds: ["O02", "O02", "PDF-A01"] }));
    expect(html.match(/data-claim-id="O02"/g)).toHaveLength(1);
    expect(html).toContain("Document-attributed public fact");
    expect(html).toContain("NHSBSA, How we process prescriptions");
    expect(html).toContain("nhsbsa-FINAL-complete-pack-v5.docx");
    expect(html).toContain("P0686–P0687");
    expect(html).toContain("PDF page 1");
    expect(html).not.toContain("~1.1bn prescription items processed");
  });
  it("withholds unknown, personal, contradictory and reference-only claims", () => {
    const html = renderToStaticMarkup(createElement(SourceDisclosure, { claimIds: ["missing", "PERSONAL01", "X02", "D-SHARED"] }));
    expect(html).not.toContain("data-claim-id");
    expect(html).not.toContain("ACCENTURE");
    expect(html).not.toContain("priced correctly");
  });
});