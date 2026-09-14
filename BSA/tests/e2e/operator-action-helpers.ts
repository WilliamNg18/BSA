import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export const cases = [
  { id: "EX-24107", title: "Valid and complete" },
  { id: "EX-24112", title: "Missing or insufficient information" },
  { id: "SYN-FQ123-MISMATCH", title: "Complete format, wrong pack" },
  { id: "EX-24123", title: "Deliberate failure and abstention" },
];
export const automaticCaseIds = ["EX-24107"];
export type OperatorOutcome = "ACCEPT" | "REFER_BACK" | "REQUEST_INFORMATION" | "ESCALATE";
const labels = {
  ACCEPT: "Sufficient \\(human choice\\)",
  REFER_BACK: "Refer back",
  REQUEST_INFORMATION: "Request information",
  ESCALATE: "Escalate",
} as const;

// G-phase contract: the original panel has one submit control and help in radio names.
export const operatorDecision = (page: Page) => page.getByRole("radiogroup", { name: "Decision", exact: true });
export const operatorRadio = (page: Page, outcome: OperatorOutcome) =>
  operatorDecision(page).getByRole("radio", { name: new RegExp(`^${labels[outcome]} `) });
export const operatorAction = (page: Page) => page.getByRole("button", { name: "Record decision", exact: true });
export const decisionNote = (page: Page) => page.getByRole("textbox", { name: "Reason (required)", exact: true });
export const reasonError = "A reason of at least eight characters is required for this decision.";

export async function openAuditRecord(page: Page) {
  await page.getByRole("navigation", { name: "Case views", exact: true })
    .getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page).toHaveURL(/\/record$/);
}

export async function performDecision(page: Page) {
  await operatorAction(page).click();
  await expect(page).toHaveURL(/\/record$/);
  await expect(page.getByRole("heading", { name: /^Record DR-/ })).toBeVisible();
}

export async function selectEpsScenario(page: Page, id: string) {
  const name = id === "EX-24107" ? "Complete endorsement" : id === "EX-24112" ? "NCSO missing date" : "Wrong pack size";
  await page.getByRole("radio", { name: "EPS", exact: true }).click();
  await page.getByRole("radio", { name, exact: true }).click();
  await expect(page.getByRole("radio", { name, exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "EPS", exact: true })).toBeChecked();
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
  await operatorRadio(page, "REFER_BACK").check();
  await decisionNote(page).fill("Reviewed the missing dispensing date");
  await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
  await performDecision(page);
}

export async function prepareCorrectedBReview(page: Page, enabled: boolean) {
  await startDemonstrationReview(page, "EX-24112", enabled);
  await referMissingDate(page, enabled);
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  const detail = page.getByRole("region", { name: "Claim detail", exact: true });
  await detail.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
  await detail.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status"))
    .not.toContainText("no operator action");
}
