import { expect, type Locator } from "@playwright/test";

/** O/V call on the full-width mounted component at the approved desktop viewport. */
export async function expectReadableScannerComparison(comparison: Locator) {
  await expect(comparison).toBeVisible();
  const columns = comparison.locator("[data-paper-source]");
  await expect(columns).toHaveCount(3);
  await expect(columns.nth(0)).toHaveAccessibleName("Pharmacy's declaration (as typed)");
  await expect(columns.nth(1)).toHaveAccessibleName("Scan as the high-speed scanner sees it");
  await expect(columns.nth(2)).toHaveAccessibleName("Extracted by character recognition (hypothetical)");
  const bounds = await columns.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, right: box.right };
  }));
  expect(Math.max(...bounds.map((box) => box.y)) - Math.min(...bounds.map((box) => box.y))).toBeLessThanOrEqual(2);
  for (let i = 0; i < bounds.length; i++) {
    expect(bounds[i].width).toBeGreaterThanOrEqual(300);
    if (i > 0) expect(bounds[i].x).toBeGreaterThanOrEqual(bounds[i - 1].right);
  }
  const readable = await comparison.locator("dd, svg text").evaluateAll((elements) => elements.map((element) => {
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    const scale = element instanceof SVGGraphicsElement ? element.getScreenCTM()?.a ?? 1 : 1;
    return fontSize * scale;
  }));
  expect(readable.length).toBeGreaterThan(0);
  expect(Math.min(...readable)).toBeGreaterThanOrEqual(14);
  const overflow = await comparison.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(overflow).toBe(false);
  await expect(comparison.locator("input, button, select, textarea")).toHaveCount(0);
}
