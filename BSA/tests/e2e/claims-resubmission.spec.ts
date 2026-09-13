import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

for (const [width, colorScheme] of [[360, "dark"], [1440, "light"]] as const) {
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
      await expect(comparison).toContainText("Synthetic assumption");
      await expect(comparison).toContainText("Real pharmacy checks are unknown");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(marker).toHaveText("Manual: No advisory sufficiency check · Assumption");
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
      await expect(page.getByRole("tooltip")).toHaveText("No advisory sufficiency check · Assumption");
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "manual-resubmission-axe", audit);
      expect(audit.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expect(marker).toBeFocused();
      await page.keyboard.press("Tab");
      const resubmit = page.getByRole("button", { name: "Resubmit claim", exact: true });
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
      await startDemonstrationReview(page);
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
      const originalHistory = await history.innerText();
      const recheck = page.getByRole("button", { name: "Re-check endorsement", exact: true });
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await recheck.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toContainText("Current correction remains incomplete");
      const apply = page.getByRole("button", { name: "Apply suggested correction", exact: true });
      await apply.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(marker).toContainText("Current correction not verified");
      await expect(page.getByRole("region", { name: "Claims precheck" })).toContainText("Not checked for this edit");
      await recheck.focus();
      await page.keyboard.press("Enter");
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      await expect(marker).toHaveText("Assisted: Current correction checked · Explicit resubmission required");
      await expect(comparison).toContainText("not payment");
      await flag.setChecked(false);
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await flag.setChecked(true);
      await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
      const field = page.getByRole("textbox", { name: "Corrected endorsement", exact: true });
      await field.focus();
      await field.press("End");
      await field.press("Backspace");
      await expect(marker).toHaveAttribute("data-pain-marker", "open");
      await expect(page.getByRole("region", { name: "Claims precheck" })).toContainText("Not checked for this edit");
      await expect(history.getByRole("status")).toHaveText(state);
      await expect(history).toHaveText(originalHistory, { useInnerText: true });
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "assisted-resubmission-axe", audit);
      expect(audit.violations).toEqual([]);
      await expect(page.getByRole("button", { name: "Resubmit claim", exact: true })).toBeEnabled();
    });
  });
}
