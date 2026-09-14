import type { Page } from "@playwright/test";
import { expect, navigatePrimary } from "./fixtures";
import { LIFECYCLE_LABELS, type LifecycleState } from "../../src/lib/domain/lifecycle";
import { performDecision } from "./operator-action-helpers";

// Historical paid seeds remain distinct from new verification-gated releases.
export const DEMONSTRABLE_LIFECYCLE_STATES: LifecycleState[] = [
  "in_review", "information_requested", "referred_back", "resubmitted", "paid", "submitted", "escalated",
];

/** Keep coverage of valid states which are deliberately absent from the eight-item seed. */
export async function prepareUnseededState(page: Page, state: LifecycleState) {
  if (state === "submitted") {
    await navigatePrimary(page, "Pharmacy claims");
    await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
    await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
      .filter({ hasText: "EX-24112" }).getByRole("button").click();
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    await detail.getByText("Demonstration replay", { exact: true }).click();
    await detail.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
    await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await navigatePrimary(page, "Pharmacy claims");
  } else if (state === "escalated") {
    await navigatePrimary(page, "NHSBSA queue");
    await page.getByRole("link", { name: "Open SYN-FQ123-TYPE2", exact: true }).click();
    await page.getByRole("radio", { name: "Escalate", exact: true }).check();
    await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human requests senior review of this synthetic supply evidence");
    await performDecision(page, "ESCALATE");
    await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status")).toHaveText(LIFECYCLE_LABELS.escalated.nhsbsa.off);
    await navigatePrimary(page, "Pharmacy claims");
  }
}

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