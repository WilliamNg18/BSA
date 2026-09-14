import type { Page } from "@playwright/test";
import { expect, navigatePrimary } from "./fixtures";
import { choosePaperExample, openPharmacyPrecheck, openPharmacyReceipt } from "./pharmacy-scenario-helpers";

export const DECLARATION_RECONCILIATION = "I have reconciled the declaration with the available evidence, including the dispensing date";
export const PAPER_D_CAPTURE_FIELDS = {
  "Product code": "SYN-COCOD-100",
  Quantity: "100",
  Endorsement: "NCSO JB 27/08/26",
  Prescriber: "Dr Demo (synthetic)",
} as const;

export async function postWorkedPaperDeclaration(page: Page) {
  await navigatePrimary(page, "Pharmacy check");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await choosePaperExample(page);
  await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
  await expect(page.getByLabel("Declared product", { exact: true })).toHaveValue("Co-codamol 30/500 tablets");
  await expect(page.getByLabel("Declared quantity", { exact: true })).toHaveValue("100");
  await expect(page.getByLabel("Declared endorsement", { exact: true })).toHaveValue("NCSO JB 27/08/26");
  await expect(page.getByLabel("Declared dispensing date", { exact: true })).toHaveValue("2026-08-27");
  const check = await openPharmacyPrecheck(page);
  await expect(check).toContainText("2026-08");
  await expect(check.getByRole("list", { name: "Requirement checkboxes", exact: true })).toContainText("Dated: met");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await expect(page.getByText("Case built, awaiting operator", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Post paper with declaration", exact: true }).click();
  const receipt = await openPharmacyReceipt(page);
  await expect(receipt).toContainText("EX-24123:2");
  await expect(receipt).toContainText("NCSO JB 27/08/26");
  await expect(receipt).not.toContainText("no person involved");
  await receipt.getByRole("link", { name: "Open shared queue", exact: true }).click();
  const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
  await expect(capture).toBeVisible();
  await expect(capture).toContainText("Image unreadable; agreement unknown.");
  await expect(capture).toContainText("declared by the pharmacy, not read from the form");
  await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toHaveValue("SYN-COCOD-100");
  await expect(capture.getByRole("textbox", { name: "Quantity", exact: true })).toHaveValue("100");
  await expect(capture.getByRole("textbox", { name: "Endorsement", exact: true })).toHaveValue("NCSO JB 27/08/26");
  await expect(capture.getByRole("textbox", { name: "Prescriber", exact: true })).toHaveValue("");
  await expect(capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true })).not.toBeChecked();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await expect(capture.getByRole("alert")).toContainText("Reconcile the declaration with the paper");
  await expect(page.locator('[data-case-id="EX-24123"]')).toHaveCount(0);
  return capture;
}
