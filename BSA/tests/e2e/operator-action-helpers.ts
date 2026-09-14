import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export type OperatorOutcome = "ACCEPT" | "REFER_BACK" | "REQUEST_INFORMATION" | "ESCALATE";
const actionNames = {
  ACCEPT: "Release to pricing",
  REFER_BACK: "Refer back",
  REQUEST_INFORMATION: "Request information",
  ESCALATE: "Escalate",
} as const;

export const operatorDecision = (page: Page) => page.getByRole("region", { name: "Operator decision", exact: true });
export const operatorAction = (page: Page, outcome: OperatorOutcome) =>
  operatorDecision(page).getByRole("button", { name: actionNames[outcome], exact: true });

export async function openAuditRecord(page: Page) {
  await operatorDecision(page).getByRole("link", { name: "Open audit record", exact: true }).click();
  await expect(page).toHaveURL(/\/record$/);
}

export async function performDecision(page: Page, outcome: OperatorOutcome, options: { openAudit?: boolean; releaseVerified?: boolean } = {}) {
  if (outcome === "ACCEPT") expect(typeof options.releaseVerified, "Specify the release revision's verification mode").toBe("boolean");
  const caseURL = page.url();
  await operatorAction(page, outcome).click();
  await expect(page).toHaveURL(caseURL);
  await expect(operatorDecision(page).getByRole("alert")).toHaveCount(0);
  if (outcome === "ACCEPT") {
    const release = page.getByRole("region", { name: "Release record", exact: true });
    await expect(release.getByRole("heading")).toHaveText(options.releaseVerified ? HUMAN_RELEASE_LABELS.nhsbsa : MANUAL_RELEASE_LABELS.nhsbsa);
    await expect(release.locator("dl > div").filter({ has: page.getByText("Released by", { exact: true }) }).getByRole("definition")).toHaveText("operator");
    await expect(release).not.toHaveAttribute("data-automatic-case");
    await expect(release).not.toContainText("no operator action");
    await expect(release).toContainText("No payment calculated.");
  }
  if (options.openAudit) await openAuditRecord(page);
}

export const HUMAN_RELEASE_LABELS = {
  pharmacy: "Verified and released to pricing after operator review (synthetic)",
  nhsbsa: "Verified and released to existing pricing after operator review",
} as const;
export const MANUAL_RELEASE_LABELS = {
  pharmacy: "Released to pricing after operator review (synthetic)",
  nhsbsa: "Released to existing pricing after operator review",
} as const;
