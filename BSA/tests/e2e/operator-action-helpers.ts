import type { Locator, Page } from "@playwright/test";
import { expect } from "./fixtures";

export { cases } from "../support/case-view-catalog";
export const automaticCaseIds = ["EX-24107"];
export type OperatorOutcome = "ACCEPT" | "REFER_BACK" | "REQUEST_INFORMATION" | "ESCALATE";
const labels = {
  ACCEPT: "Sufficient (human choice)",
  REFER_BACK: "Refer back",
  REQUEST_INFORMATION: "Request information",
  ESCALATE: "Escalate",
} as const;

// O-phase contract: exact current controls; never detect or fall back to the old panel.
export const operatorDecision = (page: Page) => page.getByRole("region", { name: "Operator decision", exact: true });
export const operatorAdvice = (scope: Page | Locator) =>
  scope.locator('[data-operator-workspace] > [data-recommendation-case][data-recommendation-audience="operator"]');
export const operatorActionButtons = (page: Page) => operatorDecision(page).getByRole("button", {
  name: /^(Release to pricing|Refer back|Request information|Escalate)$/,
});
export const operatorRadio = (page: Page, outcome: OperatorOutcome) =>
  operatorDecision(page).getByRole("radio", { name: labels[outcome], exact: true });
export const operatorAction = (page: Page, outcome: OperatorOutcome) =>
  operatorDecision(page).getByRole("button", { name: outcome === "ACCEPT" ? "Release to pricing" : labels[outcome], exact: true });
export const decisionNote = (page: Page, outcome: OperatorOutcome = "ESCALATE") =>
  operatorDecision(page).getByRole("textbox", { name: outcome === "REQUEST_INFORMATION" ? "Question (required)" : "Reason (required)", exact: true });
export const reasonError = "Enter a reason of at least eight characters.";
export const humanReleaseLabel = (verified: boolean, side: "pharmacy" | "nhsbsa") =>
  side === "pharmacy"
    ? `${verified ? "Verified and released" : "Released"} to pricing after operator review (synthetic)`
    : `${verified ? "Verified and released" : "Released"} to existing pricing after operator review`;

export async function openAuditRecord(page: Page) {
  await page.getByRole("navigation", { name: "Case views", exact: true })
    .getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page).toHaveURL(/\/record$/);
}

export async function performDecision(page: Page, outcome: OperatorOutcome, options: { releaseVerified?: boolean } = {}) {
  const caseURL = page.url();
  await operatorAction(page, outcome).click();
  await expect(page).toHaveURL(caseURL);
  await expect(operatorDecision(page).getByRole("alert")).toHaveCount(0);
  if (outcome === "ACCEPT") {
    expect(typeof options.releaseVerified, "Specify the revision's verification mode").toBe("boolean");
    const release = page.getByRole("region", { name: "Release record", exact: true });
    await expect(release.getByRole("heading")).toHaveText(options.releaseVerified
      ? "Verified and released to existing pricing after operator review"
      : "Released to existing pricing after operator review");
    await expect(release.locator("dl > div").filter({ has: page.getByText("Released by", { exact: true }) }).getByRole("definition")).toHaveText("operator");
    await expect(release).not.toHaveAttribute("data-automatic-case");
    await expect(release).not.toContainText("no operator action");
    await expect(release).toContainText("No payment calculated.");
  }
  await openAuditRecord(page);
  await expect(page.getByRole("heading", { name: /^Record DR-/ })).toBeVisible();
}

export async function selectEpsScenario(page: Page, id: string) {
  const name = id === "EX-24107" ? "Complete endorsement" : id === "EX-24112" ? "NCSO missing date" : "Wrong pack size";
  await page.getByRole("radio", { name: "EPS", exact: true }).click();
  if (id === "EX-24112") {
    await page.getByRole("radio", { name: "Complete endorsement", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Complete endorsement", exact: true })).toBeChecked();
    await expect(page).toHaveURL(/case=EX-24107&channel=eps$/);
    await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24107");
  }
  await page.getByRole("radio", { name, exact: true }).click();
  await expect(page.getByRole("radio", { name, exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "EPS", exact: true })).toBeChecked();
  await expect(page).toHaveURL(new RegExp(`case=${id}&channel=eps$`));
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", id);
}

/** A new public submission, not a historical seed disposition or a fabricated review. */
export async function startDemonstrationReview(page: Page, id = "EX-24112", enabled = false) {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(enabled);
  await selectEpsScenario(page, id);
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("radiogroup", { name: "Decision", exact: true })).toBeVisible();
}

export async function referMissingDate(page: Page, enabled: boolean) {
  let appliedNote: string | undefined;
  if (enabled) {
    const status = page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status");
    const before = await status.innerText();
    await operatorAdvice(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await expect(operatorRadio(page, "REFER_BACK")).toBeChecked();
    await expect(page.getByLabel("RB code (required)", { exact: true })).toHaveValue("SYN-NCSO");
    appliedNote = await decisionNote(page).inputValue();
    expect(appliedNote.trim().length).toBeGreaterThanOrEqual(8);
    await expect(status).toHaveText(before);
    await expect(operatorAction(page, "ACCEPT")).toBeDisabled();
    await openAuditRecord(page);
    await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Case views", exact: true }).getByRole("link", { name: "Operator case pack", exact: true }).click();
    await expect(decisionNote(page)).toHaveValue(appliedNote);
  } else {
    await operatorRadio(page, "REFER_BACK").check();
    await decisionNote(page).fill("Reviewed the missing dispensing date");
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  }
  await performDecision(page, "REFER_BACK");
  if (appliedNote) {
    await expect(page.locator("dl > div").filter({ has: page.getByText("Operator-approved explanation", { exact: true }) }).getByRole("definition")).toHaveText(appliedNote);
  }
}

export async function prepareCorrectedBReview(page: Page, enabled: boolean) {
  await startDemonstrationReview(page, "EX-24112", enabled);
  await referMissingDate(page, enabled);
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  const detail = page.getByRole("region", { name: "Claim detail", exact: true });
  if (enabled) await detail.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  else await detail.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
  await detail.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status"))
    .not.toContainText("no operator action");
}
