import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EpsPharmacyCapture } from "../../src/components/demo/eps-pharmacy-capture";
import { RawCaseFields } from "../../src/components/demo/case-presentation";
import { HomePage } from "../../src/pages/home";
import { QueuePage } from "../../src/pages/queue";
import { PharmacyClaimsPage } from "../../src/pages/pharmacy-claims";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const render = (component: ComponentType, path = "/") =>
  renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(component)));
beforeEach(() => useAppStore.getState().resetDemo());

describe("four-case compatibility with operator and pharmacy panels", () => {
  it.each([false, true])("renders only supported EPS controls without absent-source crashes, enabled=%s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = getDomainSnapshot(), html = render(EpsPharmacyCapture);
    for (const label of ["Complete endorsement", "Wrong medication strength"]) expect(html).toContain(label);
    for (const retired of ["NCSO missing date", "Wrong pack size", "EX-24112"]) expect(html).not.toContain(retired);
    expect(html).not.toContain("SYN-FQ123-TYPE2");
    expect(html).not.toContain("Generic missing brand");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it.each([false, true])("keeps the ordinary case overview on the same four operational IDs, enabled=%s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = getDomainSnapshot(), html = render(HomePage, "/#cases");
    for (const id of PLAYABLE_CASE_IDS) expect(html).toContain(id);
    expect(html).not.toContain("Case evidence unavailable");
    expect(html).not.toContain("/case/EX-24119");
    expect(html).not.toContain("/case/EX-24088");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("shows C and F only as fixed, unlinked background in both lists", () => {
    for (const component of [QueuePage, PharmacyClaimsPage]) {
      const html = render(component);
      expect(html).toContain("Background");
      for (const id of ["EX-24119", "EX-24088"]) {
        expect(html).toContain(id);
        expect(html).not.toContain(`href="/case/${id}`);
        expect(html).not.toContain(`caseId=${id}`);
      }
    }
  });

  it("rejects a background pharmacy deep link without manufacturing a playable claim", () => {
    const html = render(PharmacyClaimsPage, "/pharmacy/claims?caseId=EX-24119");
    expect(html).toContain("Background only, not playable");
    expect(html).not.toContain("Corrected endorsement");
    expect(useAppStore.getState().lifecycles["EX-24119"]).toBeUndefined();
  });

  it("retains both evidence views with unique contextual EPS landmarks", () => {
    const c = sessionCase("SYN-FQ123-MISMATCH")!, before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement("div", null, createElement(RawCaseFields, { c }),
        createElement(RawCaseFields, { c, contextLabel: "Manual comparison" }))));
    const names = [...html.matchAll(/<section aria-label="([^"]+)"/g)].map((match) => match[1]);
    expect(names.length).toBeGreaterThanOrEqual(6);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain("Submitted electronic prescription, synthetic");
    expect(names).toContain("Manual comparison: Submitted electronic prescription, synthetic");
    expect(names).toContain("Manual comparison: Recorded dispenser claim");
    expect(getDomainSnapshot()).toEqual(before);
  });
});
