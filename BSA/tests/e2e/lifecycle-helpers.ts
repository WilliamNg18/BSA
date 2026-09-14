import type { Page } from "@playwright/test";
import { expect, navigatePrimary } from "./fixtures";
import { LIFECYCLE_LABELS, type LifecycleState } from "../../src/lib/domain/lifecycle";

export const DEMONSTRABLE_LIFECYCLE_STATES: LifecycleState[] = [
  "in_review", "information_requested", "referred_back", "resubmitted", "paid", "submitted", "escalated", "released_to_pricing",
];

async function allClaims(page: Page) {
  await navigatePrimary(page, "Pharmacy claims");
  await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
}

async function submitReviewableB(page: Page) {
  await navigatePrimary(page, "Pharmacy check");
  await page.getByRole("radio", { name: "EPS", exact: true }).check();
  await page.getByRole("radio", { name: "NCSO missing date", exact: true }).check();
  await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO  RK");
  if (await page.getByRole("banner").getByRole("switch").isChecked()) {
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
  }
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await expect(page.getByRole("region", { name: "Claim detail", exact: true }).getByRole("status").first())
    .toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
}

async function recordBDecision(page: Page, decision: "Refer back" | "Request information" | "Escalate") {
  await submitReviewableB(page);
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await page.getByRole("radio", { name: new RegExp(`^${decision} `) }).check();
  if (decision === "Refer back") await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  await page.getByRole("textbox", { name: "Reason (required)", exact: true })
    .fill(`${decision}: human review of the missing dispensing date.`);
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
}

/** An audit page needs an actual human record, not a retired operational F seed. */
export async function prepareDecisionRecord(page: Page) {
  await recordBDecision(page, "Refer back");
}

/** Reach absent states through actual four-case UI actions, never injected store fixtures. */
export async function prepareUnseededState(page: Page, state: LifecycleState) {
  await allClaims(page);
  const existing = page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
    .filter({ has: page.getByRole("cell", { name: LIFECYCLE_LABELS[state].pharmacy, exact: true }) });
  if (await existing.count()) return;
  if (state === "released_to_pricing") {
    const enabled = await page.getByRole("banner").getByRole("switch").isChecked();
    await navigatePrimary(page, "Pharmacy check");
    await page.getByRole("radio", { name: "EPS", exact: true }).check();
    await page.getByRole("radio", { name: "Complete endorsement", exact: true }).check();
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing, no person involved");
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
    await expect(receipt).toContainText("released to existing pricing, no operator action");
    await expect(receipt).not.toContainText("Awaiting Type 2 judgement");
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await expect(page.getByRole("region", { name: "Claim detail", exact: true }).getByRole("status").first())
      .toHaveText(LIFECYCLE_LABELS.released_to_pricing.pharmacy);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
  } else if (state === "submitted" || state === "in_review") {
    await submitReviewableB(page);
    if (state === "in_review") {
      await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
      await page.getByRole("button", { name: "Start review", exact: true }).click();
    }
  } else if (state === "information_requested" || state === "escalated" || state === "referred_back") {
    await recordBDecision(page, state === "information_requested" ? "Request information" : state === "escalated" ? "Escalate" : "Refer back");
  } else if (state === "resubmitted") {
    await recordBDecision(page, "Refer back");
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    await detail.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
    if (await page.getByRole("banner").getByRole("switch").isChecked()) {
      await detail.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      await expect(detail).toContainText("Ready to resubmit");
    }
    await detail.getByRole("button", { name: "Resubmit claim", exact: true }).click();
    await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
  } else {
    throw new Error(`No public UI preparation is configured for missing state ${state}.`);
  }
  await allClaims(page);
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