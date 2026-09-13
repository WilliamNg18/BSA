import { afterEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "../../src/pages/home";
import { useAppStore } from "../../src/lib/store";
import { selectManualLoopMonth } from "../../src/lib/domain/manual-loop-month-model";

vi.mock("../../src/hooks/use-manual-loop-month", () => ({
  useManualLoopMonth: () => selectManualLoopMonth(useAppStore.getState().manualLoopInputs),
}));

afterEach(() => useAppStore.getState().resetDemo());

const renderClose = () => renderToStaticMarkup(createElement(MemoryRouter,
  { initialEntries: ["/#close"] }, createElement(HomePage)));

it("chapter six uses the edited prevention assumption and preserves its stop criterion", () => {
  useAppStore.getState().resetDemo();
  expect(renderClose()).toContain("pharmacy checks prevent 80%");
  useAppStore.getState().setManualLoopInput("preventionPercent", "40");
  const html = renderClose();
  expect(html).toContain('data-tour-chapter="6"');
  expect(html).toContain("pharmacy checks prevent 40%");
  expect(html).not.toContain("pharmacy checks prevent 80%");
  expect(html).toContain("If measured prevention is substantially lower, the estimate fails.");
  expect(html).toContain('href="/#month"');
  expect(html).toContain("The agent verifies and advises; a person decides.");
});

it("invalid assumptions cannot retain a stale central bet", () => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setManualLoopInput("preventionPercent", "");
  const html = renderClose();
  expect(html).toContain('role="alert"');
  expect(html).toContain("Central bet unavailable");
  expect(html).not.toContain("pharmacy checks prevent 80%");
});
