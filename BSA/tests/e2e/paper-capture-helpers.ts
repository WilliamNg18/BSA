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
  await action("Explicitly choose Paper rather than EPS", "Pharmacy", async () => {
    await page.getByRole("radio", { name: "Paper", exact: true }).check();
  });
  await action("Choose B for a new ordinary complete-paper submission", "Pharmacy", async () => {
    await page.getByRole("radio", { name: "Complete paper", exact: true }).check();
  });
  const enabled = await page.getByRole("banner").getByRole("switch").isChecked();
  if (enabled) {
    await action("Load the complete ordinary-paper declaration explicitly", "Pharmacy", async () => {
      await page.getByRole("button", { name: "Load complete paper declaration", exact: true }).click();
    });
    await action("Declare the known complete endorsement without a prescriber claim", "Pharmacy", async () => {
      await page.getByRole("textbox", { name: "Declared endorsement", exact: true }).fill(completePaperFields.endorsementText);
    });
    await expect(page.getByRole("textbox", { name: "Declared quantity", exact: true })).toHaveValue(String(completePaperFields.quantity));
    await expect(page.getByLabel("Declared prescriber (synthetic)", { exact: true })).toHaveCount(0);
  } else {
    await expect(page.getByRole("textbox", { name: "Declared product", exact: true })).toHaveCount(0);
  }
  return action("Submit complete paper without confirming its capture", "Pharmacy", async () => {
    await page.getByRole("button", { name: enabled ? "Post paper with declaration" : "Post paper", exact: true }).click();
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
    await expect(capture.getByRole("textbox", { name: "Prescriber", exact: true })).toHaveValue("");
    await action("Reject declaration prefill without reconciliation", "NHSBSA", async () => {
      await confirm.click();
      await expect(capture.getByRole("alert")).toContainText("Reconcile the declaration with the paper");
    });
    await action("Supply separately established synthetic prescriber evidence", "NHSBSA", async () => {
      await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill(completePaperFields.prescriber);
    });
    await action("Explicitly reconcile B's complete declaration and human evidence", "NHSBSA", async () => {
      await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true }).check();
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
