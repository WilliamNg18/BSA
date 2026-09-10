import { describe, expect, it } from "vitest";
import { isTourShortcut, TOUR_STOPS, tourStopIndex } from "../../src/lib/tour-navigation";
import { SOURCES_FOOTER, TOUR_CONTENT } from "../../src/lib/domain/public-facts";

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

describe("curated display boundary", () => {
  it("retains the single exact sourcing statement", () => {
    expect(SOURCES_FOOTER).toBe("Public information (NHSBSA and Community Pharmacy England publications) and stated assumptions. All operational data on this site is synthetic.");
  });
  it("caps every chapter and discovery question without documentary exemptions", () => {
    for (const text of [...TOUR_CONTENT.chapters.map((c) => c.prose), ...TOUR_CONTENT.questionsDisclosure.questions.map((q) => q.text)]) {
      expect(text.split(/\s+/).length).toBeLessThanOrEqual(25);
      expect(text).not.toMatch(/\.pdf|\.docx|source:|supplied document/i);
    }
  });
});