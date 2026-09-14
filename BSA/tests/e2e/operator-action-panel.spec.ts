import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function openReview(page: Page, enabled: boolean) {
  await page.goto("/case/EX-24112");
  await page.getByRole("banner").getByRole("switch").setChecked(enabled);
  await page.getByRole("link", { name: "Open pharmacy claim for another attempt", exact: true }).click();
  const detail = page.getByRole("region", { name: "Claim detail", exact: true });
  await detail.getByText("Demonstration replay", { exact: true }).click();
  await detail.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
}

for (const width of [1280, 1440]) {
  test(`operator Apply fills actual controls, preserves human draft Off, then explicitly refers at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openReview(page, true);
    const panel = page.getByRole("region", { name: "Operator decision", exact: true });
    const history = page.getByRole("region", { name: "Shared case history", exact: true });
    const initialStatus = await history.getByRole("status").textContent();
    await panel.getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await expect(panel.getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
    await expect(panel.getByLabel("RB code (required)", { exact: true })).toHaveValue("SYN-NCSO");
    const note = panel.getByRole("textbox", { name: "Reason (required)", exact: true });
    const appliedNote = await note.inputValue();
    expect(appliedNote.length).toBeGreaterThanOrEqual(8);
    await expect(note).toBeFocused();
    await expect(history.getByRole("status")).toHaveText(initialStatus!);
    await expect(panel.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    await page.getByRole("banner").getByRole("switch").setChecked(false);
    await expect(panel.getByRole("region", { name: "Suggestion", exact: true })).toHaveCount(0);
    await expect(note).toHaveValue(appliedNote);
    await expect(panel).toContainText("applied by the operator from the agent's suggestion");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await panel.getByRole("button", { name: "Refer back", exact: true }).click();
    await expect(history.getByRole("status")).toContainText(/Referred back/i);
    await expect(panel.getByRole("button", { name: "Refer back", exact: true })).toHaveCount(0);
    await panel.getByRole("link", { name: "Open audit record", exact: true }).click();
    await expect(page.getByText("rule and reason recorded", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("main")).toContainText(appliedNote);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test(`manual operator buttons validate reason and RB code without a suggestion at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openReview(page, false);
    const panel = page.getByRole("region", { name: "Operator decision", exact: true });
    await expect(panel).toContainText("experience only");
    await expect(panel.getByRole("textbox", { name: "Reason (required)", exact: true })).toHaveValue("");
    await panel.getByRole("button", { name: "Refer back", exact: true }).click();
    await expect(panel.getByRole("alert")).toHaveText("Enter a reason of at least eight characters.");
    await expect(panel.getByRole("alert")).toBeFocused();
    await panel.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("The dispensing date is missing.");
    await panel.getByRole("button", { name: "Refer back", exact: true }).click();
    await expect(panel.getByRole("alert")).toHaveText("Choose an RB code.");
    await panel.getByLabel("RB code (required)", { exact: true }).selectOption("SYN-NCSO");
    await expect(panel.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test(`Type 1 Correct focuses fields and invalidates reconciliation at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24123");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
    await expect(capture.getByRole("region", { name: "Original pharmacy declaration", exact: true })).toContainText("NCSO JB 27/08/26");
    await expect(capture.getByRole("textbox", { name: "Prescriber", exact: true })).toHaveValue("");
    const attestation = capture.getByRole("checkbox");
    await attestation.check();
    await capture.getByRole("button", { name: "Correct", exact: true }).click();
    await expect(capture).toHaveAttribute("data-type1-mode", "correcting");
    await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toBeFocused();
    await expect(attestation).not.toBeChecked();
    await attestation.check();
    await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Separately established synthetic prescriber");
    await expect(attestation).not.toBeChecked();
    await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    await expect(capture.getByRole("alert")).toBeVisible();
    await expect(capture.getByRole("alert")).toBeFocused();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

for (const outcome of ["Request information", "Escalate"] as const) {
  test(`operator ${outcome} appends a human event`, async ({ page }) => {
    await page.goto("/case/SYN-FQ123-TYPE2");
    const panel = page.getByRole("region", { name: "Operator decision", exact: true });
    await panel.getByRole("radio", { name: outcome, exact: true }).check();
    await panel.getByRole("textbox", { name: outcome === "Request information" ? "Question (required)" : "Reason (required)", exact: true })
      .fill(outcome === "Request information" ? "Please confirm the manufacturer supplied." : "Senior evidence review is required.");
    await panel.getByRole("button", { name: outcome, exact: true }).click();
    const history = page.getByRole("region", { name: "Shared case history", exact: true });
    await expect(history.getByRole("status")).toContainText(outcome === "Request information" ? /information/i : /escalated/i);
    await history.getByText(/^History and attempts/).click();
    await expect(history.getByRole("list", { name: "Lifecycle events", exact: true }).getByRole("listitem").last()).toContainText("operator");
  });
}

for (const enabled of [false, true]) {
  test(`valid recheck releases only after the operator action, Agent ${enabled}`, async ({ page }) => {
    await page.goto("/case/SYN-FQ123-RECHECK");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const panel = page.getByRole("region", { name: "Operator decision", exact: true });
    await panel.getByRole("button", { name: "Start review", exact: true }).click();
    if (enabled) await panel.getByRole("button", { name: "Apply suggestion", exact: true }).click();
    else await panel.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human reviewed the corrected endorsement date.");
    await expect(panel.getByRole("button", { name: "Release to pricing", exact: true })).toBeEnabled();
    await panel.getByRole("button", { name: "Release to pricing", exact: true }).click();
    const record = page.getByRole("region", { name: "Release record", exact: true });
    await expect(record).toContainText("after operator review");
    await expect(record).not.toContainText("no operator action");
    await expect(record).toContainText("operator");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
