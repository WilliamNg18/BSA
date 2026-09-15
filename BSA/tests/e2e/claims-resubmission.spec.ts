import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { startBReviewFromPharmacy } from "./pharmacy-scenario-helpers";

for (const [width, colorScheme] of [[1440, "light"]] as const) {
  test.describe(`claims resubmission comparison ${width} ${colorScheme}`, () => {
    test.use({ viewport: { width, height: 1000 }, colorScheme });

    test("Off keyboard resubmission stays unchecked without changing history on mode flips", async ({ page }, info) => {
      await page.goto("pharmacy/claims?caseId=EX-24112");
      const flag = page.getByRole("banner").getByRole("switch");
      const history = page.getByRole("region", { name: "Shared case history", exact: true });
      const comparison = page.getByRole("region", { name: "Resubmission comparison", exact: true });
      const marker = comparison.getByRole("button");
      await history.locator("summary").first().click();
      const originalHistory = await history.innerText();
      await expect(comparison).toContainText("Hypothetical repeat correction, not a prediction");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(marker).toHaveText("Manual: Hypothetical repeat correction, not a prediction");
      await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
      await flag.setChecked(true);
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(marker).toContainText("No operator-approved correction");
      await flag.setChecked(false);
      await expect(history).toHaveText(originalHistory, { useInnerText: true });

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
      const resubmit = page.getByRole("button", { name: "Resubmit blind", exact: true });
      await expect(resubmit).toBeFocused();
      await expect(resubmit).toBeEnabled();
      await page.keyboard.press("Enter");
      await expect(history.getByRole("status")).toHaveText("Resubmitted, awaiting re-check");
      await expect(comparison).toHaveCount(0);
      const attempts = history.getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li");
      await expect(attempts).toHaveCount(2);
      await expect(attempts.last()).toContainText("not_checked · off");
      await expect(attempts.last()).toContainText("NCSO  RK");
      await attempts.last().getByText("Full advisory snapshot", { exact: true }).click();
      expect(JSON.parse(await attempts.last().locator("pre").innerText())).toMatchObject({
        mode: "off", status: "not_checked", facts: null, tariffVersion: null, clauseId: null, checkedAt: null, checks: [],
      });
      await captureJson(info, "unchecked-resubmission-history", await history.innerText());
    });

    test("On resolves only a current approved correction; keyboard edits invalidate it without changing lifecycle", async ({ page }, info) => {
      await page.goto("case/EX-24112");
      await startBReviewFromPharmacy(page);
      const flag = page.getByRole("banner").getByRole("switch");
      await flag.setChecked(true);
      await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
      await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
      await page.getByRole("textbox", { name: /^Reason/ }).fill("Human reviewed and approved the dispensing-date instruction");
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
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
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await recheck.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toContainText("Current correction remains incomplete");
      const apply = page.getByRole("button", { name: "Apply suggested correction", exact: true });
      await apply.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toBeFocused();
      await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toHaveValue("NCSO RK 21/08/26");
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      await expect(page.getByRole("region", { name: "Claims precheck" })).toContainText("Ready");
      await recheck.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      await expect(marker).toHaveText("Assisted: Ready; explicit resubmission required");
      await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText("Highlighted; not sent.");
      await flag.setChecked(false);
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
      await expect(page.getByText("Ready", { exact: true })).toHaveCount(0);
      await flag.setChecked(true);
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      const field = page.getByRole("textbox", { name: "Corrected endorsement", exact: true });
      await field.focus();
      await field.press("End");
      await field.press("Backspace");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(page.getByRole("region", { name: "Claims precheck" })).toContainText("Information missing");
      await expect(history.getByRole("status")).toHaveText(state);
      await expect(attempts).toHaveText(originalAttempts, { useInnerText: true });
      await expect(events).toHaveCount(originalEvents.length + 1);
      expect((await events.allTextContents()).slice(0, originalEvents.length)).toEqual(originalEvents);
      await expect(events.last()).toContainText("Suggested correction applied by the pharmacy; not resubmitted.");
      await expect(events.last()).toContainText("pharmacy");
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "assisted-resubmission-axe", audit);
      expect(audit.violations).toEqual([]);
      await expect(page.getByRole("button", { name: "Resubmit", exact: true })).toBeEnabled();
    });
  });
}
