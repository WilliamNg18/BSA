import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowBanner } from "../../src/components/demo/follow-banner";
import { FollowItem } from "../../src/components/demo/case-links";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { itemStateLabel } from "../../src/lib/domain/lifecycle";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const store = () => useAppStore.getState();
const render = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FollowBanner)));
beforeEach(() => store().resetDemo());

describe("persistent followed item banner", () => {
  it.each(["pharmacy", "nhsbsa", "both"] as const)("shows both buttons and actual perspective words in %s with and without demo mode", (perspective) => {
    store().followCase("EX-24123");
    store().setPerspective(perspective);
    for (const enabled of [false, true]) for (const step of [null, 10]) {
      store().setAgentEnabled(enabled);
      store().setDemoStep(step);
      const before = getDomainSnapshot();
      const html = render();
      expect(html).toContain('aria-label="Followed item"');
      expect(html).toContain("Following EX-24123 | Paper");
      expect(html).toContain('aria-label="Followed item views"');
      expect(html).toMatch(/<button[^>]*>Pharmacy view<\/button>/);
      expect(html).toMatch(/<button[^>]*>NHSBSA view<\/button>/);
      expect(html).toContain(itemStateLabel(store().lifecycles["EX-24123"], perspective, enabled));
      expect(html).toContain("Type 1: capture");
      expect(html).toContain("1 September (synthetic)");
      expect(html).not.toContain("Switch side");
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("uses actual submitted history and exposes Follow in restricted perspectives", () => {
    store().submitItem({ caseId: "EX-24123", channel: "paper", endorsementText: "NCSO JB 27/08/26" });
    store().followCase("EX-24123");
    store().setPerspective("pharmacy");
    expect(render()).toContain("Pharmacy submitted item");
    const html = renderToStaticMarkup(createElement(FollowItem, { id: "EX-24123" }));
    expect(html).toContain("Stop following this item");
  });

  it("renders no banner without Follow and no control for an unknown item", () => {
    expect(render()).toBe("");
    expect(renderToStaticMarkup(createElement(FollowItem, { id: "unknown" }))).toBe("");
  });
});
