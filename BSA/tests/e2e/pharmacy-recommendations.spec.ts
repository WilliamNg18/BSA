import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { choosePharmacyRadio } from "./pharmacy-scenario-helpers";

for (const width of [1280, 1440]) {
  test.describe(`concrete pharmacy recommendations ${width}`, () => {
    test.use({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });

    test("all four source forms show concrete recommendations On and none Off", async ({ page }, info) => {
      for (const [caseId, channel] of [
        ["EX-24107", "eps"], ["EX-24112", "eps"], ["SYN-FQ123-MISMATCH", "eps"], ["EX-24123", "paper"],
      ]) {
        await page.goto(`/pharmacy?case=${caseId}&channel=${channel}`);
        const flag = page.getByRole("banner").getByRole("switch");
        await expect(flag).not.toBeChecked();
        await expect(page.locator("[data-recommendation-case]")).toHaveCount(0);
        await flag.setChecked(true);
        const card = page.getByRole("region", { name: "Recommendation", exact: true });
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute("data-recommendation-case", caseId);
        await expect(card.locator("xpath=ancestor::details")).toHaveCount(0);
        for (const label of ["Clause", "Tariff version", "Recommended outcome", "the agent verifies and advises; a person decides"]) {
          await expect(card).toContainText(label);
        }
        await expect(card.getByRole("list", { name: "Requirement results", exact: true })).toBeVisible();
        await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
        const audit = await new AxeBuilder({ page }).analyze();
        await captureJson(info, `${caseId}-recommendation-axe`, audit);
        expect(audit.violations).toEqual([]);
        await flag.setChecked(false);
        await expect(page.locator("[data-recommendation-case]")).toHaveCount(0);
      }
    });

    test("date and supply Apply write their exact previews and highlight actual changed fields", async ({ page }, info) => {
      await page.goto("/pharmacy?case=EX-24112&channel=eps");
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      const card = page.getByRole("region", { name: "Recommendation", exact: true });
      await expect(card).toContainText("21/08/2026");
      const preview = await card.getByRole("heading", { name: "Corrected preview", exact: true }).locator("+ p").innerText();
      expect(preview).toBe("NCSO RK 21/08/26");
      await card.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
      const endorsement = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
      await expect(endorsement).toHaveValue(preview);
      await expect(endorsement).toBeFocused();
      await expect(endorsement).toHaveClass(/ring-2/);
      await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
      await expect(card).toContainText("nothing to add");
      await choosePharmacyRadio(page, "Wrong pack size");
      await expect(card).toContainText("Pack size");
      await page.getByRole("button", { name: "Send claim", exact: true }).click();
      const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
      await expect(receipt).toContainText("Gate 1pass");
      await expect(receipt).toContainText("Gate 2fail");
      await expect(receipt).not.toContainText("no operator action");
      const retained = await receipt.innerText();
      await page.locator("#eps-manufacturer").fill("");
      await page.locator("#eps-form").fill("");
      const supplyPreview = card.getByRole("heading", { name: "Corrected preview", exact: true }).locator("..");
      await expect(supplyPreview).toContainText("Demo manufacturer (synthetic)");
      await expect(supplyPreview).toContainText("21");
      await expect(supplyPreview).toContainText("capsules");
      await card.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
      await expect(page.locator("#eps-manufacturer")).toHaveValue("Demo manufacturer (synthetic)");
      await expect(page.locator("#eps-pack")).toHaveValue("21");
      await expect(page.locator("#eps-form")).toHaveValue("capsules");
      for (const id of ["eps-manufacturer", "eps-pack", "eps-form"]) await expect(page.locator(`#${id}`)).toHaveClass(/ring-2/);
      await expect(receipt).toHaveText(retained, { useInnerText: true });
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "actual-preview-apply-axe", audit);
      expect(audit.violations).toEqual([]);
    });

    test("paper preparation and invoice focus are explicit human controls, not submission or invented evidence", async ({ page }, info) => {
      await page.goto("/pharmacy?case=EX-24123&channel=paper");
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      const card = page.getByRole("region", { name: "Recommendation", exact: true });
      await page.getByRole("button", { name: "Show the form as NHSBSA's scanner will see it", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "image cannot be read" })).toBeVisible();
      await page.getByRole("button", { name: "Declaration missing information", exact: true }).click();
      await expect(card).toContainText("27/08/2026");
      const preview = await card.getByRole("heading", { name: "Corrected preview", exact: true }).locator("+ p").innerText();
      const post = page.getByRole("button", { name: "Post paper with declaration", exact: true });
      await expect(post).toBeEnabled();
      await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
      await card.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
      await expect(page.getByRole("textbox", { name: "Declared endorsement", exact: true })).toHaveValue(preview);
      await page.getByRole("button", { name: "Declaration complete", exact: true }).click();
      await expect(card).toContainText("nothing to add");
      await expect(page.getByText("Dr Example (synthetic demo declaration)", { exact: true })).toBeVisible();
      await post.click();
      const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
      await expect(receipt).toContainText("Unreadable paper is never released automatically");
      await expect(receipt).not.toContainText("no operator action");
      await expect(receipt).not.toContainText("Paid on the normal schedule");
      await choosePharmacyRadio(page, "EPS");
      const endorsement = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
      await endorsement.fill("SP RK");
      await expect(card).toContainText("invoice price required; enter £x.xx");
      await expect(card).toContainText("outside validated coverage");
      await expect(card).toContainText("Needs human input");
      await card.getByRole("button", { name: "Enter invoice price", exact: true }).click();
      await expect(endorsement).toBeFocused();
      await expect(endorsement).toHaveValue("SP RK");
      await expect(card.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "paper-demo-and-invoice-focus-axe", audit);
      expect(audit.violations).toEqual([]);
    });
  });
}
