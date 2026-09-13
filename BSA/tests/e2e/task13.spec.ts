import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, confirmReset, expect, test } from "./fixtures";
import { LIFECYCLE_LABELS, type LifecycleState } from "../../src/lib/domain/lifecycle";

const B = "EX-24112";
const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
const detail = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });
const followed = (page: Page) => page.getByRole("region", { name: "Followed item", exact: true });
async function openReview(page: Page) {
  await history(page).getByRole("link", { name: "Open shared queue", exact: true }).click();
  await page.locator(`[data-case-id="${B}"]`).getByRole("link", { name: `Open ${B}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/case/${B}$`));
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Start review", exact: true }).click();
}
async function decide(page: Page, reason: string) {
  await page.getByRole("textbox", { name: /^Reason/ }).fill(reason);
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/record$/);
}

for (const enabled of [false, true]) {
  test(`Task13 complete same-case roundtrip Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.submitted.pharmacy);
    await history(page).getByRole("button", { name: "Follow this case", exact: true }).click();
    await followed(page).getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${B}$`));
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
    await followed(page).getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
    await expect(detail(page)).toContainText(B);
    await openReview(page);
    await page.getByRole("radio", { name: /^Refer back / }).check();
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
    if (enabled) {
      const approval = page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true });
      await expect(approval).not.toBeChecked();
      await approval.check();
    }
    await decide(page, "Please add the dispensing date beside the initials");
    await followed(page).getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
    if (enabled) {
      await expect(detail(page)).not.toContainText("Please add the dispensing date beside the initials");
      await expect(detail(page).getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
      await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
      await expect(detail(page)).toContainText("Not checked for this edit");
      await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      await expect(detail(page)).toContainText("Ready to resubmit");
    } else {
      await expect(detail(page)).toContainText("Please add the dispensing date beside the initials");
      await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
      await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
    }
    await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
    await followed(page).getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    await expect(history(page)).toContainText(LIFECYCLE_LABELS.paid.nhsbsa.on);
    for (const side of ["Pharmacy", "NHSBSA"] as const) {
      await followed(page).getByRole("link", { name: `Switch side: ${side}`, exact: true }).click();
      await history(page).locator("summary").first().click();
      const attempts = history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li");
      await expect(attempts).toHaveCount(3);
      await expect(attempts.nth(1)).toContainText("NCSO  RK");
      await expect(attempts.nth(1)).not.toContainText("NCSO  RK 21/08/26");
      await expect(attempts.nth(2)).toContainText("NCSO  RK 21/08/26");
      await expect(attempts.nth(2)).toContainText(enabled ? "ready · scripted" : "not_checked · off");
      const events = history(page).getByRole("list", { name: "Lifecycle events" });
      await expect(events.getByText("Human decision recorded (synthetic).", { exact: true })).toHaveCount(1);
      await expect(events).toContainText("Priced by NHSBSA's existing rules engine; no person involved.");
    }
    await captureJson(info, "roundtrip-history", await history(page).innerText());
    await confirmReset(page);
    await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
    await expect(followed(page)).toHaveCount(0);
    await expect(history(page)).toContainText(LIFECYCLE_LABELS.referred_back.nhsbsa.off);
    await history(page).locator("summary").first().click();
    await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li")).toHaveCount(1);
    await expect(history(page)).not.toContainText("Human reviewed the corrected date");
  });
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const enabled of [false, true]) {
    for (const state of Object.keys(LIFECYCLE_LABELS) as LifecycleState[]) {
      test.describe(`Task13 claims ${state} Agent=${enabled} motion=${reducedMotion}`, () => {
        test.use({ reducedMotion, viewport: { width: reducedMotion === "reduce" ? 360 : 1440, height: 900 }, colorScheme: reducedMotion === "reduce" ? "dark" : "light" });
        test("list and expanded detail unrestricted axe", async ({ page }, info) => {
          await page.goto("pharmacy/claims");
          await page.getByRole("banner").getByRole("switch").setChecked(enabled);
          await page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / }).click();
          const rows = page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row").filter({ has: page.getByRole("cell", { name: LIFECYCLE_LABELS[state].pharmacy, exact: true }) });
          expect(await rows.count()).toBeGreaterThan(0);
          for (const text of await rows.allTextContents()) expect(text).toContain(LIFECYCLE_LABELS[state].pharmacy);
          const listAudit = await new AxeBuilder({ page }).analyze();
          await captureJson(info, "claims-list-axe", listAudit);
          expect(listAudit.violations).toEqual([]);
          await rows.first().getByRole("button").click();
          await expect(detail(page).getByRole("status").first()).toHaveText(LIFECYCLE_LABELS[state].pharmacy);
          await history(page).locator("summary").first().click();
          if (state === "referred_back" && enabled) await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
          const detailAudit = await new AxeBuilder({ page }).analyze();
          await captureJson(info, "claims-detail-axe", detailAudit);
          expect(detailAudit.violations).toEqual([]);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          await page.screenshot({ path: info.outputPath("claims-detail.png"), fullPage: true });
        });
      });
    }
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`Task13 Radix menu and compact tooltip ${colorScheme}`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme });
    test("menu keyboard, focus restoration, outside dismissal and tooltip accessibility", async ({ page }, info) => {
      await page.goto("./#scene");
      const trigger = page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("button", { name: "Operations", exact: true });
      await trigger.focus();
      await trigger.press("ArrowDown");
      const menu = page.getByRole("menu");
      const items = menu.getByRole("menuitem");
      await expect(items).toHaveText(["Pharmacy check", "Pharmacy claims", "NHSBSA queue"]);
      await expect(items.first()).toBeFocused();
      await page.keyboard.press("End"); await expect(items.last()).toBeFocused();
      // Radix's proven default does not wrap focus at the menu boundaries.
      await page.keyboard.press("ArrowDown"); await expect(items.last()).toBeFocused();
      await page.keyboard.press("ArrowUp"); await expect(items.nth(1)).toBeFocused();
      await page.keyboard.press("Home"); await expect(items.first()).toBeFocused();
      await page.keyboard.press("ArrowUp"); await expect(items.first()).toBeFocused();
      await page.keyboard.press("n"); await expect(items.last()).toBeFocused();
      const menuAudit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "radix-menu-axe", menuAudit);
      expect(menuAudit.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0); await expect(trigger).toBeFocused();
      await trigger.press("ArrowDown"); await expect(items.first()).toBeFocused();
      await page.keyboard.press("End"); await expect(items.last()).toBeFocused();
      await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
      await trigger.press("Space"); await expect(items.first()).toBeFocused();
      const outside = page.getByRole("button", { name: /Synthetic demonstration data throughout/ });
      await outside.click();
      await expect(menu).toHaveCount(0);
      // Non-modal navigation must preserve the outside control's action/focus.
      await expect(outside).toBeFocused();
      await expect(outside).toHaveAttribute("aria-expanded", "false");
      await trigger.press("Enter"); await expect(items.first()).toBeFocused();
      await items.first().press("Enter");
      await expect(page).toHaveURL(/\/pharmacy$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      await page.getByRole("link", { name: "Skip to main content", exact: true }).focus();
      await page.keyboard.press("Enter"); await expect(page.getByRole("main")).toBeFocused();
      const flag = page.getByRole("banner").getByRole("switch");
      await flag.focus();
      const tooltip = page.getByRole("tooltip");
      await expect(tooltip).toContainText("Off withholds recommendations");
      const tooltipAudit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "compact-tooltip-axe", tooltipAudit);
      expect(tooltipAudit.violations).toEqual([]);
      await tooltip.hover(); await expect(tooltip).toBeVisible();
      await page.keyboard.press("Escape"); await expect(tooltip).toHaveCount(0); await expect(flag).toBeFocused();
      const header = await page.getByRole("banner").boundingBox();
      expect(header!.height).toBeLessThan(64);
      await page.getByRole("button", { name: "Reset demo", exact: true }).press("Enter");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Reset demo", exact: true })).toBeFocused();
    });
  });
}