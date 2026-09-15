import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";

for (const width of [1280, 1440]) {
  for (const id of PLAYABLE_CASE_IDS) {
    test(`recommendation trace ${id} at ${width}: visible On, absent Off, all-rule axe`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`case/${id}/trace`);
      const card = page.locator(`[data-recommendation-case="${id}"]`);
      await expect(card).toHaveCount(0);
      const toggle = page.getByRole("banner").getByRole("switch");
      await toggle.setChecked(true);
      await expect(card).toBeVisible();
      await expect(card.getByRole("heading", { name: "Recommendation", exact: true, level: 2 })).toBeVisible();
      await expect(card.getByRole("list", { name: "Requirement results" })).toBeVisible();
      await expect(card.getByRole("list", { name: "Confidence signals" }).locator(":scope > li")).toHaveCount(5);
      await expect(card).toContainText("the agent verifies and advises; a person decides");
      await expect(card).toHaveAttribute("data-recommendation-audience", "operator");
      await expect(card.getByRole("heading", { name: "Corrected preview", exact: true })).toHaveCount(0);
      await expect(card.getByRole("heading", { name: "Corrected claim line preview", exact: true })).toHaveCount(0);
      if (id === "EX-24107") await expect(card).toContainText("nothing to add");
      if (id === "EX-24112") await expect(card).toContainText("requires the operator's press because paper was scanned");
      if (id === "SYN-FQ123-MISMATCH") {
        await expect(card).toContainText("Amlodipine 10mg tablets, 28");
        await expect(card).toContainText("Amlodipine 5mg tablets, 28");
        await expect(card).not.toContainText("Select Amlodipine 10mg");
        await expect(card).toContainText("Not applicable: proposed matching check");
      }
      if (id === "EX-24123") await expect(card).toContainText("ABSTAIN");
      const axe = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "recommendation-trace-axe", axe);
      expect(axe.violations).toEqual([]);
      await toggle.setChecked(false);
      await expect(card).toHaveCount(0);
    });
  }
}
