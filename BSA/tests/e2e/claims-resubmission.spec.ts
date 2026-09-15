import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { startBReviewFromPharmacy } from "./pharmacy-scenario-helpers";
import { decisionNote, operatorDecision, operatorRadio, performDecision } from "./operator-action-helpers";
import { caseById } from "../../src/lib/domain/cases";

function paperSupply() {
  const supplied = caseById("EX-24112")?.pharmacySupplyRecord;
  if (!supplied?.brandManufacturer || !supplied.form || supplied.packSize == null || !supplied.prescriber) {
    throw new Error("The canonical paper correction supply record is incomplete.");
  }
  return { brand: supplied.brandManufacturer, form: supplied.form, pack: supplied.packSize, prescriber: supplied.prescriber };
}

for (const [width, colorScheme] of [[1440, "light"]] as const) {
  test.describe(`claims resubmission comparison ${width} ${colorScheme}`, () => {
    test.use({ viewport: { width, height: 1000 }, colorScheme });

    test("Off keyboard resubmission stays unchecked without changing history on mode flips", async ({ page }, info) => {
      await page.goto("pharmacy/claims?caseId=EX-24112");
      await startBReviewFromPharmacy(page);
      await operatorRadio(page, "REFER_BACK").check();
      await decisionNote(page).fill("Please check the required manufacturer information against your records.");
      await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
      await performDecision(page, "REFER_BACK");
      await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
      const flag = page.getByRole("banner").getByRole("switch");
      const history = page.getByRole("region", { name: "Shared case history", exact: true });
      const comparison = page.getByRole("region", { name: "Resubmission comparison", exact: true });
      const marker = comparison.getByRole("button");
      await history.locator("summary").first().click();
      const originalHistory = await history.innerText();
      const attempts = history.getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li");
      const originalAttempts = await attempts.allTextContents();
      const acknowledgement = page.getByRole("checkbox", { name: "I confirm the corrected information is accurate", exact: true });
      const resubmit = page.getByRole("button", { name: "Resubmit", exact: true });
      await expect(acknowledgement).toHaveAttribute("required", "");
      await expect(acknowledgement).not.toBeChecked();
      await expect(resubmit).toBeDisabled();
      await expect(comparison).toContainText("Hypothetical repeat correction, not a prediction");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(marker).toHaveText("Manual: Hypothetical repeat correction, not a prediction");
      await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
      await flag.setChecked(true);
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(marker).toContainText("Current correction remains incomplete");
      await flag.setChecked(false);
      await expect(history).toHaveText(originalHistory, { useInnerText: true });

      const supply = paperSupply();
      await page.getByRole("textbox", { name: "Declared brand or manufacturer", exact: true }).fill(supply.brand);
      await page.getByRole("spinbutton", { name: "Declared pack size", exact: true }).fill(String(supply.pack));
      await page.getByRole("textbox", { name: "Declared form", exact: true }).fill(supply.form);
      await page.getByRole("textbox", { name: "Declared prescriber (synthetic)", exact: true }).fill(supply.prescriber);
      await expect(attempts).toHaveText(originalAttempts);
      await expect(resubmit).toBeDisabled();
      const field = page.getByRole("textbox", { name: "Corrected endorsement", exact: true });
      await field.focus();
      await page.keyboard.press("Tab");
      await expect(marker).toBeFocused();
      await expect(page.getByRole("tooltip")).toHaveText("Hypothetical repeat correction, not a prediction");
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "manual-resubmission-axe", audit);
      expect(audit.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expect(marker).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(acknowledgement).toBeFocused();
      await page.keyboard.press("Space");
      await expect(acknowledgement).toBeChecked();
      await expect(attempts).toHaveText(originalAttempts);
      await page.keyboard.press("Tab");
      await expect(resubmit).toBeFocused();
      await expect(resubmit).toBeEnabled();
      await page.keyboard.press("Enter");
      await expect(history.getByRole("status")).toHaveText("Resubmitted, ready to release");
      await expect(comparison).toHaveCount(0);
      await expect(attempts).toHaveCount(originalAttempts.length + 1);
      expect((await attempts.allTextContents()).slice(0, originalAttempts.length)).toEqual(originalAttempts);
      await expect(attempts.last()).toContainText("not_checked · off");
      await expect(attempts.last()).toContainText("NCSO RK 21/08/26");
      await attempts.last().getByText("Full advisory snapshot", { exact: true }).click();
      expect(JSON.parse(await attempts.last().locator("pre").innerText())).toMatchObject({
        mode: "off", status: "not_checked", facts: null, tariffVersion: null, clauseId: null, checkedAt: null, checks: [],
      });
      await captureJson(info, "unchecked-resubmission-history", await history.innerText());
    });

    test("On resolves only a current approved correction; keyboard edits invalidate it without changing lifecycle", async ({ page }, info) => {
      await page.goto("case/EX-24112");
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      await startBReviewFromPharmacy(page);
      const flag = page.getByRole("banner").getByRole("switch");
      await flag.setChecked(true);
      await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
      await expect(operatorRadio(page, "REFER_BACK")).toBeChecked();
      await expect(page.getByRole("combobox", { name: "RB code (required)", exact: true })).toHaveValue("RB2B");
      expect((await decisionNote(page).inputValue()).trim().length).toBeGreaterThanOrEqual(8);
      await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status")).toHaveText("Awaiting operator");
      await performDecision(page, "REFER_BACK");
      await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Claim detail: EX-24112", exact: true })).toBeVisible();
      const history = page.getByRole("region", { name: "Shared case history", exact: true });
      const comparison = page.getByRole("region", { name: "Resubmission comparison", exact: true });
      const marker = comparison.getByRole("button");
      const state = "Action needed: correction required";
      await expect(history.getByRole("status")).toHaveText(state);
      await history.locator("summary").first().click();
      const attempts = history.getByRole("list", { name: "Immutable pharmacy attempts", exact: true });
      const originalAttempts = await attempts.innerText();
      const events = history.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
      const originalEvents = await events.allTextContents();
      const recheck = page.getByRole("button", { name: "Re-check endorsement", exact: true });
      const acknowledgement = page.getByRole("checkbox", { name: "I confirm the corrected information is accurate", exact: true });
      const resubmit = page.getByRole("button", { name: "Resubmit", exact: true });
      await expect(resubmit).toBeDisabled();
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await recheck.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toContainText("Current correction remains incomplete");
      const apply = page.getByRole("button", { name: "Apply suggested correction", exact: true });
      await apply.focus();
      await page.keyboard.press("Enter");
      const field = page.getByRole("textbox", { name: "Declared brand or manufacturer", exact: true });
      await expect(field).toBeFocused();
      await expect(field).toHaveValue(paperSupply().brand);
      await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toHaveValue("NCSO RK 21/08/26");
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      await expect(page.getByRole("region", { name: "Claims precheck" })).toContainText("Ready");
      await recheck.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      await expect(marker).toHaveText("Assisted: Ready; explicit resubmission required");
      await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText("Highlighted; not sent.");
      await expect(acknowledgement).not.toBeChecked();
      await expect(resubmit).toBeDisabled();
      await acknowledgement.focus();
      await page.keyboard.press("Space");
      await expect(acknowledgement).toBeChecked();
      await expect(resubmit).toBeEnabled();
      await flag.setChecked(false);
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
      await expect(page.getByText("Ready", { exact: true })).toHaveCount(0);
      await flag.setChecked(true);
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      await expect(acknowledgement).toBeChecked();
      await field.focus();
      await field.press("ControlOrMeta+A");
      await field.press("Backspace");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(page.getByRole("region", { name: "Claims precheck" })).toContainText("Information missing");
      await expect(history.getByRole("status")).toHaveText(state);
      await expect(attempts).toHaveText(originalAttempts, { useInnerText: true });
      await expect(events).toHaveCount(originalEvents.length + 2);
      expect((await events.allTextContents()).slice(0, originalEvents.length)).toEqual(originalEvents);
      await expect(events.nth(originalEvents.length)).toContainText("Suggested correction applied by the pharmacy; not resubmitted.");
      await expect(events.last()).toContainText("Pharmacy confirmed the corrected information is accurate; not resubmitted.");
      await expect(events.last()).toContainText("pharmacy");
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "assisted-resubmission-axe", audit);
      expect(audit.violations).toEqual([]);
      await expect(acknowledgement).not.toBeChecked();
      await expect(resubmit).toBeDisabled();
    });
  });
}
