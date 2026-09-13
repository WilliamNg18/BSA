import type { Page } from "@playwright/test";
import { expect, navigatePrimary } from "./fixtures";
import { choosePerspective } from "./perspective-helpers";
import { chooseProcessChapter } from "./process-model-helpers";

export const PAPER_B = "EX-24112";
export const completePaperFields = {
  productCode: "SYN-AMLO10-28", quantity: 28,
  endorsementText: "NCSO RK 21/08/26", prescriber: "Dr Demo (synthetic)",
};
type UiAction<T> = (label: string, side: "Pharmacy" | "NHSBSA", perform: () => Promise<void>) => Promise<T>;

export async function submitCompletePaper<T>(page: Page, action: UiAction<T>) {
  await action("Choose B for a new complete paper submission", "Pharmacy", async () => {
    await page.getByRole("radio", { name: "Information missing", exact: true }).check();
  });
  await action("Explicitly choose Paper rather than EPS", "Pharmacy", async () => {
    await page.getByRole("radio", { name: "Paper", exact: true }).check();
  });
  for (const [name, value] of [
    ["Declared product code", completePaperFields.productCode],
    ["Declared quantity", String(completePaperFields.quantity)],
    ["Declared prescriber (synthetic)", completePaperFields.prescriber],
    ["Endorsement entered by the pharmacy", completePaperFields.endorsementText],
  ]) {
    await action(`Declare paper ${name}`, "Pharmacy", async () => {
      await page.getByRole(name === "Declared quantity" ? "spinbutton" : "textbox", { name, exact: true }).fill(value);
    });
  }
  return action("Submit complete paper without confirming its capture", "Pharmacy", async () => {
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText(PAPER_B);
  });
}

export async function confirmCompletePaper<T>(page: Page, enabled: boolean, action: UiAction<T>) {
  await action("Navigate to actual Type 1 work", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
  await action("Open B's pending capture", "NHSBSA", async () => {
    await page.locator(`[data-type1-case="${PAPER_B}"] > summary`).click();
  });
  const capture = page.getByRole("region", { name: `Type 1 capture for ${PAPER_B}`, exact: true });
  const confirm = capture.getByRole("button", { name: "Confirm capture and continue", exact: true });
  if (enabled) {
    await expect(capture).toContainText("declared by the pharmacy, not read from the form");
    await action("Reject declaration prefill without reconciliation", "NHSBSA", async () => {
      await confirm.click();
      await expect(capture.getByRole("alert")).toContainText("Reconcile the declaration with the paper");
    });
    await action("Explicitly reconcile B's complete declaration", "NHSBSA", async () => {
      await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the paper", exact: true }).check();
    });
  } else {
    for (const [name, value] of [
      ["Product code", completePaperFields.productCode], ["Quantity", String(completePaperFields.quantity)],
      ["Endorsement", completePaperFields.endorsementText], ["Prescriber", completePaperFields.prescriber],
    ]) {
      await expect(capture.getByRole("textbox", { name, exact: true })).toHaveValue("");
      await action(`Manually capture B ${name}`, "NHSBSA", async () => {
        await capture.getByRole("textbox", { name, exact: true }).fill(value);
      });
    }
  }
  return action("Confirm complete Type 1 evidence without Type 2 judgement", "NHSBSA", async () => {
    await confirm.click();
    await expect(page.getByRole("region", { name: "Completed Type 1 captures", exact: true })).toBeVisible();
    await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
  });
}

export async function openFourCases(page: Page) {
  const wasBoth = await page.getByRole("radio", { name: "Both", exact: true }).isChecked();
  await choosePerspective(page, "Both");
  await navigatePrimary(page, "Overview");
  await chooseProcessChapter(page, 4);
  if (!wasBoth) await choosePerspective(page, "NHSBSA");
}
