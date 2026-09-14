import type { Page } from "@playwright/test";
import { confirmReset, expect, navigatePrimary } from "./fixtures";
import { decisionNote, operatorRadio, performDecision, selectEpsScenario, startDemonstrationReview } from "./operator-action-helpers";
import { LIFECYCLE_LABELS, type LifecycleState } from "../../src/lib/domain/lifecycle";

export const DEMONSTRABLE_LIFECYCLE_STATES: LifecycleState[] = [
  "in_review", "information_requested", "referred_back", "resubmitted",
  "paid", "submitted", "escalated", "released_to_pricing",
];

async function openClaim(page: Page, id: string) {
  await navigatePrimary(page, "Pharmacy claims");
  await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
  await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
    .filter({ hasText: id }).getByRole("button").click();
}

/** Independent UI fixtures, not resets inside the continuous-cycle proofs. */
export async function prepareUnseededState(page: Page, state: LifecycleState) {
  const flag = page.getByRole("banner").getByRole("switch");
  const enabled = await flag.isChecked();
  await confirmReset(page);
  await flag.setChecked(enabled);
  const id = state === "paid" || state === "released_to_pricing" ? "EX-24107"
    : state === "in_review" ? "SYN-FQ123-MISMATCH" : "EX-24112";
  if (state === "submitted" || state === "released_to_pricing") {
    await navigatePrimary(page, "Pharmacy check");
    await selectEpsScenario(page, id);
    if (state === "released_to_pricing") await flag.setChecked(true);
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    await flag.setChecked(enabled);
  } else if (state === "resubmitted") {
    await openClaim(page, id);
    await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
    await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
  } else if (state === "information_requested" || state === "escalated") {
    await startDemonstrationReview(page, id, enabled);
    const outcome = state === "information_requested" ? "REQUEST_INFORMATION" : "ESCALATE";
    await operatorRadio(page, outcome).check();
    await decisionNote(page, outcome).fill(state === "information_requested"
      ? "Please confirm the dispensing date beside the initials."
      : "Human requests senior review of the synthetic evidence.");
    await performDecision(page, outcome);
  }
  await openClaim(page, id);
  await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status"))
    .toHaveText(LIFECYCLE_LABELS[state].pharmacy);
  await expect(flag).toBeChecked({ checked: enabled });
  return id;
}
