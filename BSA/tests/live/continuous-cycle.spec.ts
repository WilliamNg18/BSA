import { captureJson, captureView, expect, test } from "./fixtures";
import { navigatePrimary } from "../e2e/fixtures";
import { choosePerspective, openHistory } from "../e2e/perspective-helpers";
import { DECLARATION_RECONCILIATION } from "../e2e/paper-declaration-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { LIVE_CYCLE_MODES, wholeCycleTitle } from "./legacy-inventory";

const D = "EX-24123";
for (const enabled of [false, true]) for (const mode of LIVE_CYCLE_MODES) {
  test(wholeCycleTitle(enabled, mode), async ({ page }, info) => {
    await page.goto("/pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const steps: { label: string; url: string; mainText: string }[] = [];
    const side = async (label: string, target: "Pharmacy" | "NHSBSA", perform: () => Promise<void>) => {
      if (mode === "switched") {
        await choosePerspective(page, target === "Pharmacy" ? "NHSBSA" : "Pharmacy");
        await choosePerspective(page, target);
      }
      await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      await perform();
      steps.push({ label, url: page.url(), mainText: await page.getByRole("main").innerText() });
    };
    const capture = page.getByRole("region", { name: `Type 1 capture for ${D}`, exact: true });
    const history = page.getByRole("region", { name: "Shared case history", exact: true });
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    const captureCurrent = async (label: string) => {
      await side(`${label}: open capture`, "NHSBSA", async () => {
        await navigatePrimary(page, "NHSBSA queue");
        await expect(capture).toBeVisible();
      });
      for (const [name, value] of [
        ["Product code", "SYN-COCOD-100"], ["Quantity", "100"],
        ["Endorsement", "NCSO JB 27/08/26"], ["Prescriber", "Dr Demo (synthetic)"],
      ]) await side(`${label}: human ${name}`, "NHSBSA", async () => {
        await capture.getByRole("textbox", { name, exact: true }).fill(value);
      });
      if (enabled) await side(`${label}: human reconciliation`, "NHSBSA", async () => {
        await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
      });
      await side(`${label}: confirm capture`, "NHSBSA", async () => {
        await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
        await expect(page.locator(`[data-case-id="${D}"]`)).toBeVisible();
      });
      await side(`${label}: read Type 2`, "NHSBSA", async () => {
        await page.locator(`[data-case-id="${D}"]`).getByRole("link", { name: `Open ${D}`, exact: true }).click();
        await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
      });
    };
    try {
      await side("Read Hillcrest paper seed", "Pharmacy", async () => {
        await navigatePrimary(page, "Pharmacy claims");
        await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^Waiting on NHSBSA/ }).click();
        await page.getByRole("button", { name: `View ${D}`, exact: true }).click();
        await detail.getByText("Demonstration replay", { exact: true }).click();
      });
      await side("Submit the same D item", "Pharmacy", async () => {
        await detail.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
        await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
      });
      await captureCurrent("Initial submission");
      await side("Choose human RB2B referral", "NHSBSA", async () => {
        await page.getByRole("radio", { name: /^Refer back / }).check();
        await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Please confirm the product presentation and prescriber evidence.");
      });
      await side("Record human referral", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Record decision", exact: true }).click();
        await expect(page).toHaveURL(/\/EX-24123\/record$/);
      });
      await side("Return to the same pharmacy item", "Pharmacy", async () => {
        await navigatePrimary(page, "Pharmacy claims");
        await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^Action needed/ }).click();
        await page.getByRole("button", { name: `Correct and resubmit ${D}`, exact: true }).click();
        await expect(detail).toContainText("RB2B");
        await openHistory(page);
      });
      const beforeAttempts = await history.getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).locator(":scope > li").allTextContents();
      await side("Correct declared fields without sending", "Pharmacy", async () => {
        await page.getByRole("textbox", { name: "Declared product code", exact: true }).fill("SYN-COCOD-100");
        await page.getByRole("spinbutton", { name: "Declared quantity", exact: true }).fill("100");
        await page.getByRole("textbox", { name: "Declared prescriber (synthetic)", exact: true }).fill("Dr Demo (synthetic)");
        await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO JB 27/08/26");
        await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
      });
      await side("Explicitly resubmit D", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
        await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
      });
      await captureCurrent("Corrected revision");
      await side("Human accepts corrected evidence", "NHSBSA", async () => {
        if (enabled) await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
        await page.getByRole("radio", { name: enabled ? /^Accept the recommendation/ : /^Sufficient \(human choice\)/ }).check();
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human recheck confirms the corrected presentation, prescriber and endorsement.");
        await page.getByRole("button", { name: "Record decision", exact: true }).click();
        await expect(page).toHaveURL(/\/EX-24123\/record$/);
      });
      await side("Verify paid state and immutable attempts on the pharmacy side", "Pharmacy", async () => {
        await navigatePrimary(page, "Pharmacy claims");
        await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^Paid this month/ }).click();
        await page.getByRole("button", { name: `View ${D}`, exact: true }).click();
        await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
        await openHistory(page);
        const attempts = await history.getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).locator(":scope > li").allTextContents();
        expect(attempts.slice(0, beforeAttempts.length)).toEqual(beforeAttempts);
        expect(attempts).toHaveLength(3);
        await expect(history.getByRole("list", { name: "Lifecycle events", exact: true })).toContainText("RB2B");
      });
      await captureView(page, info, `same-d-completed-${enabled ? "on" : "off"}-${mode}`);
    } finally {
      await captureJson(info, "same-item-visible-action-checkpoints", { caseId: D, enabled, mode, observerUsed: false, steps });
    }
  });
}
