import type { Page } from "@playwright/test";
import { expect, navigatePrimary } from "./fixtures";

/** Selection can navigate; assert the fresh control after the route has settled. */
export async function choosePharmacyRadio(page: Page, name: string) {
  await page.getByRole("radio", { name, exact: true }).click();
  await expect(page.getByRole("radio", { name, exact: true })).toBeChecked();
}

export async function choosePaperExample(page: Page, caseId: "EX-24123" | "EX-24112" = "EX-24123") {
  await choosePharmacyRadio(page, "Paper");
  await choosePharmacyRadio(page, caseId === "EX-24123" ? "Unreadable paper" : "Brand missing on readable paper");
  await expect(page.getByRole("region", { name: "Paper pharmacy submission", exact: true })).toHaveAttribute("data-pharmacy-case", caseId);
  await expect(page.getByRole("radio", { name: "Unreadable form", exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Complete paper", exact: true })).toHaveCount(0);
}

export async function openPharmacyPrecheck(page: Page) {
  const check = page.getByRole("region", { name: "Claims precheck", exact: true });
  const summary = check.getByText("Precheck evidence", { exact: true });
  if (await summary.locator("..").getAttribute("open") === null) await summary.click();
  return check;
}

export async function openPharmacyReceipt(page: Page) {
  const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
  const summary = receipt.getByText("Recorded submission", { exact: true });
  if (await summary.locator("..").getAttribute("open") === null) await summary.click();
  return receipt;
}

/** A fresh attempt is an explicit pharmacy action, never a hidden seed or referral replacement. */
export async function startBReviewFromPharmacy(page: Page) {
  await navigatePrimary(page, "Pharmacy check");
  await choosePaperExample(page, "EX-24112");
  await page.getByRole("region", { name: "Paper pharmacy submission", exact: true })
    .locator('[data-pharmacy-action="submit"]').click();
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("EX-24112");
  await navigatePrimary(page, "NHSBSA queue");
  await page.locator('[data-case-id="EX-24112"]').getByRole("link", { name: "Open EX-24112", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shared case history", exact: true })).toContainText(/Awaiting operator|awaiting operator/);
}
