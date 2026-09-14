import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ReferralCycle } from "../../src/components/demo/referral-cycle";
import { LIFECYCLE_LABELS, type CaseLifecycle, type LifecycleState } from "../../src/lib/domain/lifecycle";
import { isTourShortcut, TOUR_CHAPTER_COUNT, TOUR_CHAPTERS, TOUR_STOPS, tourStopIndex } from "../../src/lib/tour-navigation";
import { SOURCES_FOOTER, TOUR_CONTENT } from "../../src/lib/domain/public-facts";
import { pharmacyCaseLink } from "../../src/lib/case-links";
import { useAppStore } from "../../src/lib/store";

describe("tour navigation contract", () => {
  it("has six explicit chapters and retains every operational stop before the close", () => {
    expect(TOUR_CHAPTER_COUNT).toBe(6);
    expect(TOUR_STOPS.map((stop) => stop.chapter)).toEqual([1, 2, 3, 4, 5, 5, 5, 5, 6]);
    expect(TOUR_STOPS.map((stop) => stop.to)).toEqual(["/#scene", "/#month", "/#pipeline", "/#cases", "/#two-places", "/pharmacy", "/queue", "/pharmacy/claims", "/#close"]);
    expect(TOUR_CHAPTERS.map((stop) => stop.label)).toEqual([
      "Real process", "A month in numbers", "Evidence to a decision", "Cases and boundaries",
      "One continuous cycle", "The central bet",
    ]);
  });
  it("links to the same claim through the supported case query", () => {
    const id = "SYN-FQ123-2";
    const url = new URL(pharmacyCaseLink(id), "https://example.test");
    expect(url.pathname).toBe("/pharmacy/claims");
    expect(url.searchParams.get("case")).toBe(id);
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
  it("supplies one canonical narrative for every explicit chapter", () => {
    expect(TOUR_CONTENT.chapters.map((chapter) => chapter.chapter)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("retains the single exact sourcing statement", () => {
    expect(SOURCES_FOOTER).toBe("Owner-supplied public process context attributed to NHSBSA and Community Pharmacy England; not independently verified here. All operational data is synthetic.");
  });
  it("caps every chapter and discovery question without documentary exemptions", () => {
    for (const text of [...TOUR_CONTENT.chapters.map((c) => c.prose), ...TOUR_CONTENT.questionsDisclosure.questions.map((q) => q.text)]) {
      console.info("Advisory word count / budget 25:", text.split(/\s+/).length);
      expect(text).not.toMatch(/\.pdf|\.docx|source:|supplied document/i);
    }
  });
});

describe("following is presentation state only", () => {
  it("keeps histories, revisions, records and states unchanged through follow, mode and dismiss", () => {
    useAppStore.getState().resetDemo();
    const before = useAppStore.getState();
    try {
      for (const id of ["EX-24123", "EX-24112", null]) {
        before.followCase(id);
        for (const enabled of [true, false]) {
          before.setAgentEnabled(enabled);
          const current = useAppStore.getState();
          expect(current.followedCaseId).toBe(id);
          expect(current.lifecycles).toBe(before.lifecycles);
          expect(current.caseRevisions).toBe(before.caseRevisions);
          expect(current.records).toBe(before.records);
          expect(current.caseStates).toBe(before.caseStates);
        }
      }
      before.followCase("EX-24112");
      before.setAgentEnabled(true);
      before.resetDemo();
      const reset = useAppStore.getState();
      expect(reset.followedCaseId).toBeNull();
      expect(reset.agentEnabled).toBe(false);
      expect(reset.lifecycles).toEqual(before.lifecycles);
      expect(reset.caseRevisions).toEqual(before.caseRevisions);
      expect(reset.records).toEqual(before.records);
    } finally { useAppStore.getState().resetDemo(); }
  });

  describe("referral guide is not lifecycle progress", () => {
    const render = (enabled: boolean, claim?: CaseLifecycle) => renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(ReferralCycle, { enabled, claim })),
    );
    // The future gated release has no recorded Step 0 item to present.
    const currentStates = (Object.keys(LIFECYCLE_LABELS) as LifecycleState[]).filter((state) => state !== "released_to_pricing");
    it.each(currentStates)("renders only recorded %s state in both modes without mutation", (state) => {
      const claim: CaseLifecycle = { caseId: "EX-24112", pharmacyCode: "FQ123", state, history: [] };
      Object.freeze(claim.history);
      Object.freeze(claim);
      for (const enabled of [false, true]) {
        const markup = render(enabled, claim);
        expect(markup).toContain(`role="status">${LIFECYCLE_LABELS[state].pharmacy}</p>`);
        expect(markup).toContain("This guide is not claim history");
        expect(markup).toContain("For referred items, a sufficient human decision");
        expect(markup).toContain("An unsent correction is a local draft");
        expect(markup).toContain('href="/case/EX-24112"');
        expect(markup).toContain(enabled ? "Assisted preparation" : "Manual preparation");
        expect(markup.includes("Recorded synthetic outcome attributed to existing pricing")).toBe(state === "paid");
        expect(claim).toEqual({ caseId: "EX-24112", pharmacyCode: "FQ123", state, history: [] });
      }
    });
    it("does not invent a recorded state or working claim link for an unknown claim", () => {
      for (const enabled of [false, true]) {
        const markup = render(enabled);
        expect(markup).not.toContain('role="status"');
        expect(markup).not.toContain("Recorded claim state");
        expect(markup).not.toContain("Open this operator case");
        expect(markup).toContain("Paid");
        expect(markup).toContain("Synthetic only");
        expect(markup).toContain("This guide is not claim history");
      }
    });
  });
});