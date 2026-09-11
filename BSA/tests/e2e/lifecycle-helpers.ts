import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

/** Public UI only. Seed dispositions are historical, not editable review states. */
export async function startDemonstrationReview(page: Page) {
  await page.getByRole("link", { name: "Open pharmacy claim for another attempt", exact: true }).click();
  const detail = page.getByRole("region", { name: "Claim detail", exact: true });
  await detail.getByText("Demonstration replay", { exact: true }).click();
  await detail.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shared case history", exact: true })).toContainText(/Awaiting operator|awaiting operator/);
}