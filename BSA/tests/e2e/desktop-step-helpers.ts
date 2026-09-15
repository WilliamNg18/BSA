import type { Page } from "@playwright/test";
import { expect } from "./fixtures";
import { DEMO_ALLOWED_CONTROLS, DEMO_CONTROL_SELECTORS, DEMO_STEPS } from "../../src/lib/domain/demo-steps";

export { DESKTOP_WIDTHS, DEMO_MODES } from "../support/desktop-matrix";

export async function enterDesktopDemo(page: Page, enabled: boolean) {
  await page.goto("/");
  await page.getByRole("banner").getByRole("radio", { name: "Both", exact: true }).check();
  await page.getByRole("banner").getByRole("switch").setChecked(enabled);
  await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await expect(page.getByTestId("demo-strip")).toBeVisible();
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
}

export async function assertDesktopHeader(page: Page, width: number) {
  const header = page.getByRole("banner");
  const box = await header.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("The desktop header has no rendered bounds.");
  const controls = [
    header.getByRole("link", { name: "Prescription Exception Case Builder", exact: true }),
    header.getByRole("group", { name: "Perspective", exact: true }),
    header.getByRole("switch"),
  ];
  const centres: number[] = [];
  for (const control of controls) {
    await expect(control).toBeVisible();
    const bounds = await control.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) throw new Error("A header control has no rendered bounds.");
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(box.y);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(box.y + box.height);
    centres.push(bounds.y + bounds.height / 2);
  }
  expect(Math.max(...centres) - Math.min(...centres), "All desktop header controls occupy one row").toBeLessThanOrEqual(1);
  await expect(page.getByRole("switch", { includeHidden: true })).toHaveCount(1);
  await expect(header.getByRole("navigation", { name: "Primary", exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Reset demo", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

export async function assertDesktopStep(page: Page, number: number, enabled: boolean) {
  const step = DEMO_STEPS.find((entry) => entry.number === number);
  if (!step) throw new Error(`No declared demo step ${number}.`);
  const screen = page.getByTestId("demo-step-screen");
  const strip = page.getByTestId("demo-strip");
  await expect(screen).toHaveCount(1);
  await expect(screen).toHaveAttribute("data-demo-step", String(number));
  await expect(strip).toContainText(step.title);
  if (step.caseId) await expect(strip).toContainText(step.caseId);
  if (step.channel) await expect(strip).toContainText(step.channel === "eps" ? "EPS" : /paper/i);
  await expect(page.getByTestId("demo-today")).toBeVisible();
  await expect(page.getByTestId("demo-assisted")).toBeVisible();
  await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  await expect(page.getByRole("navigation", { name: "Guided tour", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Switch side", exact: true })).toHaveCount(0);
  const inactive = enabled ? page.getByTestId("demo-today") : page.getByTestId("demo-assisted");
  await expect(inactive).toHaveAttribute("data-readonly", "true");
  await expect(inactive).toContainText("Read-only scenario projection");
  await expect(inactive.locator("button, input, select, textarea, a[href], [role=button], [role=radio], [role=switch]"))
    .toHaveCount(0);
  const allowed = DEMO_ALLOWED_CONTROLS[number];
  expect(allowed, "Each step declares its permitted action families").toBeDefined();
  for (const [control, selector] of Object.entries(DEMO_CONTROL_SELECTORS)) {
    if (!allowed.some((entry) => entry === control)) {
      await expect(screen.locator(selector), `Step ${number} must not include ${control}, even hidden`).toHaveCount(0);
    }
  }
  await expect(screen.getByRole("group", { name: "Claim filters", exact: true })).toHaveCount(0);
  await expect(screen.getByRole("region", { name: "Actual session work counts", exact: true })).toHaveCount(0);
  await expect(screen.getByRole("table")).toHaveCount(number === 8 ? 1 : 0);
  if ([1, 11].includes(number)) {
    await expect(screen.locator("button, input, select, textarea, a[href], summary, [role=button]")).toHaveCount(0);
  }
  if (number === 2) {
    const detail = screen.locator('[data-demo-control="month-detail"] details').first();
    await expect(detail).toHaveCount(1);
    await expect(detail).not.toHaveAttribute("open");
  }
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
  const location = new URL(page.url());
  const expected = new URL(step.path, location);
  expect(`${location.pathname}${location.hash}`).toBe(`${expected.pathname}${expected.hash}`);
}

export async function walkDesktopSteps(page: Page, enabled: boolean, visit: (number: number, direction: "next" | "back") => Promise<void>) {
  const strip = page.getByTestId("demo-strip");
  await expect(strip.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
  for (const step of DEMO_STEPS) {
    if (step.number > 1) await strip.getByRole("button", { name: "Next", exact: true }).click();
    await assertDesktopStep(page, step.number, enabled);
    await visit(step.number, "next");
  }
  await expect(strip.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  for (const step of [...DEMO_STEPS].reverse().slice(1)) {
    await strip.getByRole("button", { name: "Back", exact: true }).click();
    await assertDesktopStep(page, step.number, enabled);
    await visit(step.number, "back");
  }
}
