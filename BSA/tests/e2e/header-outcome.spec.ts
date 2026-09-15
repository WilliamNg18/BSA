import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { captureCheckpoint, captureJson, confirmReset, expect, test } from "./fixtures";
import { agentRoutes, perspectiveNames } from "./header-agent-helpers";
import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { expectHeaderOutcomeSettled } from "./header-outcome-helpers";

const outcomeText = "Outcome: the agent gathers evidence and recommends. Deterministic code validates and calculates. A person decides.";
const ordinaryRoutes = [...new Set([...agentRoutes, "/pharmacy/claims", "/missing-page"])];

test.use({ screenshot: "off" });

async function assertNoticePolicy(page: Page, enabled: boolean) {
  const line = page.locator("[data-agent-outcome]");
  await expect(page.locator("[data-disclaimer], #synthetic-disclaimer, [data-principle]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Synthetic demonstration data throughout/ })).toHaveCount(0);
  await expect(page.getByText("All data is synthetic", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("contentinfo").getByText("All data is synthetic", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).not.toContainText("Synthetic cases");
  await expect(page.getByRole("contentinfo")).toContainText("No payments calculated or approved");
  await expect(page.getByRole("switch", { includeHidden: true })).toHaveCount(1);
  await expectHeaderOutcomeSettled(page, enabled);
  if (!enabled) {
    const height = await page.getByRole("banner").evaluate((header) => {
      const next = header.nextElementSibling;
      if (!next) throw new Error("The sticky stack must retain its demo controls.");
      return next.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    });
    expect(height, "Agent Off leaves no reserved Outcome space").toBe(0);
    return;
  }
  await expect(line).toHaveText(outcomeText);
  const geometry = await page.locator("[data-outcome-text]").evaluate((text) => {
    const heading = [...document.querySelectorAll("main h1")].find((element) => element.getClientRects().length > 0);
    const content = heading?.closest(".mx-auto") ?? heading?.parentElement;
    const header = document.querySelector("header");
    if (!content || !header || !text.parentElement) throw new Error("Missing real page content or header bounds.");
    const range = document.createRange();
    range.selectNodeContents(text);
    const rect = range.getBoundingClientRect();
    const column = content.getBoundingClientRect();
    const line = text.parentElement.getBoundingClientRect();
    const style = getComputedStyle(text);
    return {
      centerDifference: Math.abs(rect.x + rect.width / 2 - column.x - column.width / 2),
      topGap: line.top - header.getBoundingClientRect().bottom,
      lines: range.getClientRects().length,
      fontSize: Number.parseFloat(style.fontSize),
      width: rect.width,
      availableWidth: line.width - 48,
      clipped: text.scrollWidth > text.clientWidth,
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      transform: style.transform,
    };
  });
  expect(geometry.centerDifference, "Actual readable text must centre on the rendered page content").toBeLessThanOrEqual(2);
  expect(geometry.topGap, "Outcome is directly below the header, before Follow and demo controls").toBe(0);
  expect(geometry.lines).toBe(1);
  expect(geometry.fontSize).toBeGreaterThanOrEqual(16);
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.width).toBeLessThanOrEqual(geometry.availableWidth);
  expect(geometry.clipped).toBe(false);
  expect(geometry.overflow).toBe("visible");
  expect(geometry.textOverflow).toBe("clip");
  expect(geometry.transform).toBe("none");
  return geometry;
}

async function audit(page: Page, info: TestInfo, name: string) {
  const result = await new AxeBuilder({ page }).analyze();
  await captureJson(info, name, { violations: result.violations, incomplete: result.incomplete });
  expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
}

for (const width of [1280, 1440]) {
  for (const perspective of Object.values(perspectiveNames)) {
    test.describe(`${width}px ${perspective} global Outcome`, () => {
      test.use({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      for (const route of ordinaryRoutes) test(`ordinary route ${route}`, async ({ page }, info) => {
        const measurements = [];
        await page.goto(route);
        await page.getByRole("banner").getByRole("radio", { name: perspective, exact: true }).check();
        await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
        const flag = page.getByRole("banner").getByRole("switch");
        for (const enabled of [true, false]) {
          await flag.setChecked(enabled);
          measurements.push({ route, enabled, geometry: await assertNoticePolicy(page, enabled) });
          await audit(page, info, `route-${ordinaryRoutes.indexOf(route)}-${enabled}-axe`);
        }
        await captureJson(info, "actual-content-bounds", measurements);
      });

      test("all eleven demo states without Reset", async ({ page }, info) => {
        test.setTimeout(180_000);
        await page.goto("/");
        await page.getByRole("banner").getByRole("radio", { name: perspective, exact: true }).check();
        await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
        const measurements = [];
        for (const step of DEMO_STEPS) {
          await page.getByRole("combobox", { name: "Jump to demo step" }).selectOption(String(step.number));
          await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", String(step.number));
          const flag = page.getByRole("banner").getByRole("switch");
          for (const enabled of [true, false]) {
            await flag.setChecked(enabled);
            measurements.push({ step: step.number, enabled, geometry: await assertNoticePolicy(page, enabled) });
            await audit(page, info, `step-${step.number}-${enabled}-axe`);
          }
        }
        await captureJson(info, "actual-demo-content-bounds", measurements);
      });
    });
  }
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`Outcome fades both ways with ${reducedMotion}, rapid toggle and Reset`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const flag = page.getByRole("banner").getByRole("switch");
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      const samples = await page.evaluate(async () => {
        const control = document.querySelector<HTMLButtonElement>("#agent-flag");
        if (!control) throw new Error("Missing header Agent control.");
        const observed: { present: boolean; opacity: number; transform: string }[][] = [];
        for (let toggle = 0; toggle < 2; toggle++) {
          control.click();
          const frames = [];
          const start = performance.now();
          while (performance.now() - start < 300) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const line = document.querySelector("[data-agent-outcome]");
            const style = line ? getComputedStyle(line) : null;
            frames.push({ present: !!line, opacity: Number(style?.opacity ?? 0), transform: style?.transform ?? "none" });
          }
          observed.push(frames);
        }
        return observed;
      });
      for (const frames of samples) {
        expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1), "Both directions have an actual opacity fade").toBe(true);
        expect(frames.every((frame) => frame.transform === "none"), "Reduced motion crossfades without movement").toBe(true);
      }
      expect(samples[1].at(-1)?.present).toBe(false);
      await flag.setChecked(true);
      await assertNoticePolicy(page, true);
      await audit(page, info, `${colorScheme}-${reducedMotion}-on-axe`);
      await captureCheckpoint(page, info, `${colorScheme}-${reducedMotion}-outcome`);
      await flag.setChecked(false);
      await flag.setChecked(true);
      await assertNoticePolicy(page, true);
      await confirmReset(page);
      await assertNoticePolicy(page, false);
      await expect(page.getByRole("button", { name: "Reset demo", exact: true })).toBeFocused();
      await audit(page, info, `${colorScheme}-${reducedMotion}-off-axe`);
      await captureJson(info, `${colorScheme}-opacity-frames`, samples);
    }
  });
}
