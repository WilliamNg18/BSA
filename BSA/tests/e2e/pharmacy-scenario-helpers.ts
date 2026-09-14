import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

/** Selection can navigate; assert the fresh control after the route has settled. */
export async function choosePharmacyRadio(page: Page, name: string) {
  await page.getByRole("radio", { name, exact: true }).click();
  await expect(page.getByRole("radio", { name, exact: true })).toBeChecked();
}

export async function choosePaperExample(page: Page) {
  await choosePharmacyRadio(page, "Paper");
  await expect(page.getByRole("radio", { name: "Unreadable form", exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Complete paper", exact: true })).toHaveCount(0);
}
