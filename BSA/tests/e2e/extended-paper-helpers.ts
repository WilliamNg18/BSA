import type { Page, TestInfo } from "@playwright/test";
import { captureJson, expect, navigatePrimary } from "./fixtures";
import { choosePerspective } from "./perspective-helpers";
import { choosePaperExample } from "./pharmacy-scenario-helpers";
import { DECLARATION_RECONCILIATION } from "./paper-declaration-helpers";
import { assertVisibleRecommendation } from "./recommendation-contract-helpers";
import { operatorDecision, operatorRadio, decisionNote } from "./operator-action-helpers";
import { HUMAN_RELEASE_LABELS, MANUAL_RELEASE_LABELS } from "../support/release-labels";
import { enterDesktopDemo } from "./desktop-step-helpers";

export const PAPER_BRANCHES = ["complete", "missing", "unreconciled-referral", "unattested-information"] as const;
export const REQUIRED_PERSPECTIVES = ["Both", "Pharmacy", "NHSBSA"] as const;

export async function runExtendedPaperBranch(
  page: Page, info: TestInfo, enabled: boolean,
  perspective: typeof REQUIRED_PERSPECTIVES[number],
  branch: typeof PAPER_BRANCHES[number],
  options: { guided?: boolean } = {},
) {
  const id = "EX-24123";
  const follow = () => page.getByRole("region", { name: "Followed item", exact: true });
  const history = () => page.getByRole("region", { name: "Shared case history", exact: true });
  const state = () => options.guided
    ? page.locator(`[data-demo-live-case="${id}"] [data-item-state]`).first()
    : history().getByRole("status");
  const card = () => page.getByRole("region", { name: "Recommendation", exact: true }).and(page.locator(`[data-recommendation-case="${id}"]`));
  const checkpoints: { action: string; url: string; follow: string }[] = [];
  async function nextStep(number: number) {
    await page.getByTestId("demo-strip").getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", String(number));
    await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-case", id);
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  }
  async function visit(side: "Pharmacy" | "NHSBSA") {
    await choosePerspective(page, perspective);
    await follow().getByRole("button", { name: `${side} view`, exact: true }).click();
    await expect(follow()).toContainText(id);
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  }
  async function both(action: string) {
    for (const side of ["Pharmacy", "NHSBSA"] as const) {
      await visit(side);
      checkpoints.push({ action: `${action}: ${side}`, url: page.url(), follow: await follow().innerText() });
    }
  }
  async function capture(quantity: number, endorsement: string, unattested = false) {
    const panel = page.getByRole("region", { name: `Type 1 capture for ${id}`, exact: true });
    await expect(panel).toBeVisible();
    if (enabled && unattested) await panel.getByRole("button", { name: "Key fields manually", exact: true }).click();
    else if (enabled && quantity !== 100) await panel.getByRole("button", { name: "Correct", exact: true }).click();
    for (const [name, value] of [
      ["Product code", "SYN-COCOD-100"], ["Quantity", String(quantity)],
      ["Endorsement", endorsement], ["Prescriber", enabled ? "Dr Example (synthetic demo declaration)" : "Dr Demo (synthetic)"],
    ]) await panel.getByRole("textbox", { name, exact: true }).fill(value);
    if (enabled && !unattested) await panel.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
    await panel.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    await expect(operatorDecision(page)).toBeVisible();
    await both("Human capture recorded");
  }
  try {
    if (options.guided) {
      await enterDesktopDemo(page, enabled);
      await page.getByTestId("demo-strip").getByRole("combobox", { name: "Jump to demo step", exact: true }).selectOption("7");
      await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-case", id);
    } else {
      await page.goto(`/pharmacy/claims?caseId=${id}`);
      await choosePerspective(page, "Both");
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await history().getByRole("button", { name: "Follow this case", exact: true }).click();
      await visit("Pharmacy");
      await navigatePrimary(page, "Pharmacy check");
      await choosePaperExample(page);
    }
    const scanner = page.getByRole("button", { name: "Show the form as NHSBSA's scanner will see it", exact: true });
    await scanner.click();
    await expect(scanner).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: "Paper pharmacy submission", exact: true })
      .getByText("image cannot be read", { exact: true })).toBeVisible();
    if (enabled) {
      await page.getByRole("button", { name: branch === "missing" ? "Declaration missing information" : "Declaration complete", exact: true }).click();
      await assertVisibleRecommendation(page, id, true);
      if (branch === "missing") {
        await expect(card()).toContainText("27/08/2026");
        await expect(card()).toContainText("NCSO JB 27/08/26");
        await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
        await expect(page.getByRole("textbox", { name: "Declared endorsement", exact: true })).toHaveValue("NCSO JB 27/08/26");
        await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
        await page.getByRole("button", { name: "Declaration missing information", exact: true }).click();
      } else {
        await expect(card()).toContainText("Complete against Clause 9");
        await expect(card()).toContainText("declared by the pharmacy, not read from the form");
      }
    } else await assertVisibleRecommendation(page, id, false);
    const post = page.locator('[data-pharmacy-action="submit"]');
    await expect(post).toBeEnabled();
    await post.click();
    const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
    await expect(receipt).toContainText(`${id}:2`);
    await expect(receipt).toContainText(/unreadable paper is never released automatically/i);
    if (options.guided) await nextStep(8);
    await both("Posted without automatic release");
    await capture(branch === "unreconciled-referral" ? 50 : 100, branch === "missing" ? "NCSO JB" : "NCSO JB 27/08/26", branch === "unattested-information");

    if (branch !== "complete") {
      const information = branch === "unattested-information";
      const outcome = information ? "REQUEST_INFORMATION" : "REFER_BACK";
      if (enabled || !information) {
        await expect(operatorDecision(page).getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
      }
      const priorState = await state().innerText();
      if (enabled) {
        await assertVisibleRecommendation(page, id, true);
        if (branch !== "missing") await expect(card()).toContainText("ABSTAIN");
        await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
        await expect(operatorRadio(page, outcome)).toBeChecked();
        await expect(state()).toHaveText(priorState);
        await expect(operatorDecision(page).getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
      } else {
        await operatorRadio(page, outcome).check();
        await decisionNote(page, outcome).fill(information ? "Please confirm the declaration against the available source evidence." : "Please confirm the quantity and complete the dispensing-date endorsement.");
        if (!information) await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
      }
      const reason = await decisionNote(page, outcome).inputValue();
      expect(reason.trim().length).toBeGreaterThanOrEqual(8);
      await operatorDecision(page).getByRole("button", { name: information ? "Request information" : "Refer back", exact: true }).click();
      await both(information ? "Operator requested information" : "Operator referred back");
      if (options.guided) await nextStep(9);
      await visit("Pharmacy");
      await expect(page.getByRole("region", { name: "Operator response", exact: true })).toContainText(reason);
      if (information) {
        const answer = "The pharmacy confirms 100 tablets and the dispensing date 27 August 2026 from its records.";
        await page.getByRole("textbox", { name: "Confirm", exact: true }).fill(answer);
        await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
        await both("Pharmacy supplied confirmation, not a release");
        await expect(page.getByRole("region", { name: "Pharmacy confirmation", exact: true })).toContainText(answer);
      } else {
        await expect(page.getByRole("region", { name: "Operator response", exact: true })).toContainText("RB2B");
        if (enabled && branch === "missing") {
          await expect(card()).toContainText("NCSO JB 27/08/26");
          await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
          await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toHaveValue("NCSO JB 27/08/26");
        } else {
          await page.getByRole("textbox", { name: "Declared product", exact: true }).fill("Co-codamol 30/500 tablets");
          await page.getByRole("spinbutton", { name: "Declared quantity", exact: true }).fill("100");
          await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO JB 27/08/26");
        }
        await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
        await both("Explicit pharmacy resubmission");
        await expect(state()).toHaveText("Resubmitted, awaiting re-check");
      }
      if (options.guided) await nextStep(10);
      await capture(100, "NCSO JB 27/08/26");
    }
    if (enabled) {
      await assertVisibleRecommendation(page, id, true);
      await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
      await expect(operatorRadio(page, "ACCEPT")).toBeChecked();
    } else await operatorRadio(page, "ACCEPT").check();
    await decisionNote(page).fill("The operator confirms the current source facts and releases this synthetic item to existing pricing.");
    await expect(operatorDecision(page).getByRole("button", { name: "Release to pricing", exact: true })).toBeEnabled();
    await operatorDecision(page).getByRole("button", { name: "Release to pricing", exact: true }).click();
    await both("Explicit operator release");
    await expect(follow()).not.toContainText("no operator action");
    await visit("Pharmacy");
    await expect(state()).toHaveText(enabled ? HUMAN_RELEASE_LABELS.pharmacy : MANUAL_RELEASE_LABELS.pharmacy);
    await expect(page.locator(`[data-pharmacy-case="${id}"]`)).toContainText("Paid on the normal schedule");
  } finally {
    await captureJson(info, `paper-${branch}-${perspective.toLowerCase()}-${enabled ? "on" : "off"}`, { caseId: id, branch, perspective, enabled, guided: options.guided === true, checkpoints, timed: false });
  }
}
