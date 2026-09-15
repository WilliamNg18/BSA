import type { Page } from "@playwright/test";
import { expect } from "./fixtures";
import { EPS_SUPPLY_RULE } from "../../src/lib/domain/eps-check";
import { applyPreviewedDate, assertVisibleRecommendation } from "./recommendation-contract-helpers";
import { operatorDecision, operatorRadio, performDecision, startDemonstrationReview } from "./operator-action-helpers";

export async function verifyConcretePreviews(page: Page, width: number, enabled: boolean) {
  await page.setViewportSize({ width, height: 1000 });
  const flag = () => page.getByRole("banner").getByRole("switch");
  const card = () => page.getByRole("region", { name: "Recommendation", exact: true });
  await page.goto("/pharmacy?case=EX-24112&channel=eps");
  await flag().setChecked(enabled);
  await assertVisibleRecommendation(page, "EX-24112", enabled);
  if (enabled) await applyPreviewedDate(page, "EX-24112", "Dispenser endorsement");
  else await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);

  await page.goto("/pharmacy?case=SYN-FQ123-MISMATCH&channel=eps");
  await flag().setChecked(enabled);
  const brand = page.getByRole("textbox", { name: "Brand or manufacturer dispensed", exact: true });
  const pack = page.getByRole("spinbutton", { name: "Pack size dispensed", exact: true });
  const form = page.getByRole("textbox", { name: "Form dispensed", exact: true });
  await brand.fill("");
  await form.fill("");
  await assertVisibleRecommendation(page, "SYN-FQ123-MISMATCH", enabled);
  if (enabled) {
    const preview = card().getByRole("heading", { name: "Corrected preview", exact: true }).locator("..");
    await expect(preview).toContainText(EPS_SUPPLY_RULE.brandManufacturer);
    await expect(preview).toContainText(String(EPS_SUPPLY_RULE.packSize));
    await expect(preview).toContainText(EPS_SUPPLY_RULE.form);
    await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
    await expect(brand).toHaveValue(EPS_SUPPLY_RULE.brandManufacturer);
    await expect(pack).toHaveValue(String(EPS_SUPPLY_RULE.packSize));
    await expect(form).toHaveValue(EPS_SUPPLY_RULE.form);
    for (const field of [brand, pack, form]) await expect(field).toHaveClass(/ring-2/);
  } else await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);

  await page.goto("/pharmacy?case=EX-24112&channel=eps");
  await flag().setChecked(enabled);
  const endorsement = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
  await endorsement.fill("BB RK");
  if (enabled) {
    await expect(card()).toContainText("invoice price required; enter £x.xx");
    await expect(card()).toContainText("claim amount is not invoice evidence");
    const suggested = card().getByRole("heading", { name: "Suggested values", exact: true }).locator("..");
    await expect(suggested).not.toContainText(/£\s*\d/);
    await card().getByRole("button", { name: "Enter invoice price", exact: true }).click();
    await expect(endorsement).toBeFocused();
    await expect(endorsement).toHaveValue("BB RK");
  } else await expect(page.getByRole("button", { name: "Enter invoice price", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);

  await startDemonstrationReview(page, "EX-24112", enabled);
  const history = page.getByRole("region", { name: "Shared case history", exact: true });
  const before = await history.getByRole("status").innerText();
  if (enabled) {
    await assertVisibleRecommendation(page, "EX-24112", true);
    const note = await card().getByText("Note", { exact: true }).locator("xpath=following-sibling::dd[1]").innerText();
    await expect(card().getByText("Operator draft preview", { exact: true })).toBeVisible();
    await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await expect(operatorRadio(page, "REFER_BACK")).toBeChecked();
    await expect(operatorDecision(page).getByRole("combobox", { name: "RB code (required)", exact: true })).toHaveValue("SYN-NCSO");
    await expect(operatorDecision(page).getByRole("textbox", { name: "Reason (required)", exact: true })).toHaveValue(note);
    await expect(history.getByRole("status")).toHaveText(before);
    await performDecision(page, "REFER_BACK");
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await applyPreviewedDate(page, "EX-24112", "Corrected endorsement");
    await expect(history.getByRole("status")).toHaveText("Action needed: correction required");
    await expect(page.getByRole("button", { name: "Resubmit", exact: true })).toBeVisible();
  } else {
    await expect(card()).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    await expect(history.getByRole("status")).toHaveText(before);
  }
}
