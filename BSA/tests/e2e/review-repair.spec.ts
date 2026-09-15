import { expect, navigatePrimary, test } from "./fixtures";
import { postWorkedPaperDeclaration, DECLARATION_RECONCILIATION } from "./paper-declaration-helpers";
import { startDemonstrationReview } from "./lifecycle-helpers";
import { choosePharmacyRadio, openPharmacyReceipt } from "./pharmacy-scenario-helpers";
import { openAuditRecord, operatorAction, operatorDecision } from "./operator-action-helpers";

test("complete EPS Off describes hypothetical risk without running a hidden check", async ({ page }) => {
  await page.goto("/pharmacy");
  await choosePharmacyRadio(page, "Complete endorsement");
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Manual: No advisory check; later correction is possible", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Requirement checkboxes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  const receipt = await openPharmacyReceipt(page);
  await expect(receipt).toContainText("no person involved");
  await expect(receipt).toContainText("not_checked");
  await expect(page.getByRole("button", { name: "Manual: No advisory check; later correction is possible", exact: true })).toBeVisible();
});

test("confirmed conflicted paper records an attestation without claiming agreement or machine reading", async ({ page }) => {
  await page.goto("/pharmacy");
  const capture = await postWorkedPaperDeclaration(page);
  await capture.getByRole("textbox", { name: "Product code", exact: true }).fill("SYN-AMLO10-28");
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await page.getByRole("link", { name: "Open EX-24123", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("The operator attested reconciliation; this does not prove source agreement.");
  await expect(page.getByRole("main")).not.toContainText("declaration and paper explicitly reconciled");
  await expect(page.getByRole("main")).not.toContainText("All mandatory fields read");
  await navigatePrimary(page, "Overview");
  await page.getByRole("button", { name: "Choose tour chapter", exact: true }).click();
  await page.getByRole("menuitem", { name: "4. Cases and boundaries", exact: true }).click();
  await expect(page.locator('[data-case="C"]')).toHaveCount(0);
  const currentB = page.locator("[data-case]").filter({ hasText: "EX-24112" });
  await expect(currentB.locator("[data-outcome]")).toHaveText("Refer back with the exact fix");
  await expect(currentB).not.toContainText("REFER_BACK");
});

for (const enabled of [false, true]) {
  test(`operator errors keep complete guidance under 25 words without losing controls, Agent ${enabled}`, async ({ page }) => {
    await page.goto("/case/EX-24112");
    await startDemonstrationReview(page);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const referral = page.getByRole("radio", { name: "Refer back", exact: true });
    await referral.check();
    const record = operatorAction(page, "REFER_BACK");
    const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
    const panel = operatorDecision(page);
    for (const message of ["Enter a reason of at least eight characters", "Choose an RB code"]) {
      await record.click();
      const error = page.getByRole("alert").filter({ hasText: message });
      await expect(error).toBeFocused();
      const prose = (await panel.locator(":scope > p, :scope > div > p").allTextContents()).join(" ");
      expect(prose.trim().split(/\s+/).length, prose).toBeLessThan(25);
      await expect(panel.getByRole("radio")).toHaveCount(4);
      await expect(referral).toBeChecked();
      await expect(record).toBeEnabled();
      await expect(page.getByRole("combobox", { name: "RB code (required)", exact: true })).toBeVisible();
      if (enabled) await expect(panel.locator("[data-suggestion-applied]")).toHaveCount(0);
      await reason.fill("Human review needs the dispensing date beside the initials");
      await expect(reason).toHaveValue("Human review needs the dispensing date beside the initials");
    }
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
    await record.press("Enter");
    await expect(page).toHaveURL(/\/case\/EX-24112$/);
    await openAuditRecord(page);
    await expect(page).toHaveURL(/\/record$/);
    await expect(page.getByRole("main")).toContainText("Human review needs the dispensing date beside the initials");
  });
}
