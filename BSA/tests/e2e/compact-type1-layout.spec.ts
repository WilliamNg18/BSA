import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { captureJson, expect, test } from "./fixtures";

test.use({ screenshot: "off" });

async function openCapture(page: Page, enabled: boolean) {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await page.getByRole("combobox", { name: "Jump to demo step", exact: true }).selectOption("7");
  await page.getByRole("banner").getByRole("switch").setChecked(enabled);
  await expect(page.locator('[data-demo-step="7"]')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  return page.locator('[data-compact-capture="true"]');
}

async function measureCapture(page: Page, capture: Locator, info: TestInfo, state: string, enabled: boolean) {
  const controls = [
    ...["Product code", "Quantity", "Endorsement", "Prescriber"].map((name) => ({
      name, locator: capture.getByRole("textbox", { name, exact: true }),
    })),
    { name: "Confirm", locator: capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }) },
    ...(enabled ? [
      { name: "Correct", locator: capture.getByRole("button", { name: "Correct", exact: true }) },
      { name: "Reconciliation", locator: capture.getByRole("checkbox") },
    ] : []),
  ];
  const boxes = await Promise.all(controls.map(async ({ name, locator }) => ({ name, box: await locator.boundingBox() })));
  const pageMetrics = await page.evaluate(() => {
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, label: element.getAttribute("aria-label"), testId: element.getAttribute("data-testid"),
        x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const root = document.querySelector("[data-compact-capture]")!;
    const ancestors = [];
    for (let parent = root.parentElement; parent && parent.tagName !== "BODY"; parent = parent.parentElement) ancestors.push(box(parent));
    const live = root.closest("[data-demo-live-case]")!;
    return {
      viewport: { width: innerWidth, height: innerHeight }, scrollY,
      scrollWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight,
      chromeHeight: getComputedStyle(document.documentElement).getPropertyValue("--app-chrome-height"),
      ancestors,
      liveSections: Array.from(live.children).map((element) => ({ ...box(element), text: element.textContent?.slice(0, 200) })),
    };
  });
  await captureJson(info, `compact-type1-${state}`, { ...pageMetrics, capture: await capture.boundingBox(), controls: boxes });
  expect(pageMetrics.scrollY, "Measure the first viewport, not a scrolled workaround").toBe(0);
  expect(pageMetrics.scrollWidth).toBeLessThanOrEqual(pageMetrics.viewport.width);
  for (const { name, box } of boxes) {
    expect(box, `${name} is rendered`).not.toBeNull();
    expect(box!.y, `${name} starts inside the viewport`).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height, `${name} fits within the first 1000px viewport`).toBeLessThanOrEqual(1000);
    expect(box!.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, `${name} right edge`).toBeLessThanOrEqual(pageMetrics.viewport.width);
  }
}

for (const width of [1280, 1440]) {
  for (const enabled of [false, true]) {
    test(`compact Type 1 keeps evidence and required controls in the first viewport at ${width}, Agent ${enabled}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      const capture = await openCapture(page, enabled);
      await expect(capture).toBeVisible();
      await measureCapture(page, capture, info, "initial", enabled);

      const panel = await capture.boundingBox();
      const editor = await capture.locator("form").boundingBox();
      expect(editor!.width).toBeGreaterThan(panel!.width * 0.9);
      await expect(capture.getByRole("img")).toBeVisible();
      if (enabled) {
        const declaration = capture.getByRole("region", { name: "Original pharmacy declaration", exact: true });
        await expect(declaration).toContainText("declared by the pharmacy, not read from the form");
        for (const value of ["Co-codamol 30/500 tablets", "100", "NCSO JB 27/08/26", "2026-08-27", "Not supplied"]) {
          await expect(declaration).toContainText(value);
        }
        const imageBox = await capture.locator('[data-capture-source="image"]').boundingBox();
        const declarationBox = await declaration.boundingBox();
        expect(Math.abs(imageBox!.y - declarationBox!.y)).toBeLessThan(2);
        expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(declarationBox!.x);
        await expect(capture.getByRole("textbox", { name: "Prescriber", exact: true })).toHaveValue("");
      } else {
        for (const name of ["Product code", "Quantity", "Endorsement", "Prescriber"]) {
          await expect(capture.getByRole("textbox", { name, exact: true })).toHaveValue("");
        }
        await expect(capture.getByRole("region", { name: "Original pharmacy declaration", exact: true })).toHaveCount(0);
      }

      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (width === 1440 && enabled) {
        await page.screenshot({ path: info.outputPath("compact-type1-step7-on-1440.png"), fullPage: true });
      }
      if (enabled) {
        const attestation = capture.getByRole("checkbox");
        await attestation.check();
        await capture.getByRole("button", { name: "Correct", exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toBeFocused();
        await expect(attestation).not.toBeChecked();
        await attestation.check();
        await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Independently established prescriber (synthetic)");
        await expect(attestation).not.toBeChecked();
        await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
        await expect(capture.getByRole("alert")).toBeFocused();
        await measureCapture(page, capture, info, "reconciliation-error", true);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
    });
  }
}
