import { captureCheckpoint, expect, navigatePrimary, test } from "./fixtures";
import { QUEUE_FILLER } from "../../src/lib/domain/cases";
import { startDemonstrationReview } from "./lifecycle-helpers";

test("queue hides all filler recommendations without changing evidence, states or human decisions", async ({ page }) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  const rows = page.getByRole("region", { name: "Exception queue table", exact: true }).locator("tbody > tr");
  await expect(rows).toHaveCount(12);
  const states = rows.locator("td:nth-child(6)");
  const times = rows.locator("td:nth-child(7)");
  const recommendations = rows.locator("td:nth-child(4)");
  const originalStates = await states.allTextContents();
  const originalTimes = await times.allTextContents();
  const originalRecommendations = await recommendations.allTextContents();
  const fillerRows = rows.filter({ hasText: "Filler row" });
  await expect(fillerRows).toHaveCount(6);
  await expect(fillerRows.locator("td:nth-child(4)")).toHaveText(QUEUE_FILLER.map((f) => f.recommendation));

  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await expect(recommendations).toHaveText(Array<string>(12).fill("No recommendation"));
  await expect(states).toHaveText(originalStates);
  await expect(times).toHaveText(originalTimes);
  await expect(fillerRows.locator("td:nth-child(3)")).toHaveText(Array<string>(6).fill("Synthetic row"));
  await expect(rows.filter({ hasText: "Case pack" }).locator("td:nth-child(3)")).toHaveText(Array<string>(6).fill("Pre-checks only"));
  await page.getByRole("radio", { name: "Agent abstained", exact: true }).click();
  await expect(rows).toHaveCount(2);
  await expect(recommendations).toHaveText(Array<string>(2).fill("No recommendation"));
  await page.getByRole("radio", { name: "All", exact: true }).click();
  await expect(states).toHaveText(originalStates);

  await page.getByRole("switch", { name: "Agent: Off", exact: true }).click();
  await expect(recommendations).toHaveText(originalRecommendations);
  await expect(states).toHaveText(originalStates);
  await expect(times).toHaveText(originalTimes);
  await page.locator("a[href='/case/EX-24112']").first().click();
  await expect(page.getByText("Read-only: not awaiting an operator decision", { exact: false })).toBeVisible();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
});

for (const scenario of [
  { name: "Complete endorsement", status: "Ready to submit", readable: true },
  { name: "Information missing", status: "Information may be missing", readable: true },
  { name: "Unreadable form", status: "Agent unable to determine", readable: false },
]) {
  for (const globalEnabled of [true, false]) {
    for (const localAvailable of [true, false]) {
      test(`pharmacy ${scenario.name}: global=${globalEnabled}, local=${localAvailable} remains advisory`, async ({ page }, testInfo) => {
        await page.goto("pharmacy");
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        await page.getByRole("radio", { name: scenario.name, exact: true }).click();
        const status = page.locator("[data-pharmacy-status]");
        await expect(status).toHaveText(scenario.status);
        const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
        const endorsement = await field.inputValue();
        const checks = page.getByRole("list", { name: "Requirement checkboxes" });
        if (scenario.readable) await expect(checks).toBeVisible();
        else await expect(checks).toHaveCount(0);
        if (!globalEnabled) await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
        if (!localAvailable) await page.getByRole("switch", { name: "Agent available", exact: true }).click();
        const assistanceEnabled = globalEnabled && localAvailable;
        await expect(status).toHaveText(!globalEnabled ? "Not checked: manual submission"
          : !localAvailable ? "Agent unavailable: manual submission" : scenario.status);
        await expect(field).toHaveValue(endorsement);
        if (assistanceEnabled && scenario.readable) await expect(checks).toBeVisible();
        else await expect(checks).toHaveCount(0);
        await expect(page.getByRole("switch", { name: "Agent available", exact: true })).toBeChecked({ checked: localAvailable });
        const rule = page.getByRole("heading", { name: /^Rule retrieved for/ });
        const reading = page.getByText(/^Reading of the note \(mocked interpretation\):/);
        if (assistanceEnabled && scenario.readable) {
          await expect(rule).toBeVisible();
          await expect(reading).toBeVisible();
        } else {
          await expect(rule).toHaveCount(0);
          await expect(reading).toHaveCount(0);
          if (!globalEnabled) await expect(page.getByText("Agent Off · No checks performed in this scenario; real pharmacy checks are unknown.", { exact: true })).toBeVisible();
          else if (!localAvailable) await expect(page.getByText("Agent unavailable · No checks performed; manual submission remains available.", { exact: true })).toBeVisible();
          else await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toContainText("STOPPED");
        }
        const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
        await expect(submit).toBeEnabled();
        await captureCheckpoint(page, testInfo, "pharmacy-assistance-state");
        await submit.click();
        await expect(page.getByRole("status").filter({ hasText: "Submitted (synthetic)." })).toBeVisible();
        await expect(submit).toBeEnabled();
      });
    }
  }
}

test("pharmacy keeps edits and local availability across global assistance changes", async ({ page }) => {
  await page.goto("queue");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("region", { name: "Exception queue table", exact: true }).locator("tbody > tr")).toHaveCount(12);
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await navigatePrimary(page, "Pharmacy check");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await expect(page.getByRole("heading", { name: "Pharmacy pre-submission check", exact: true })).toBeVisible();
  const status = page.locator("[data-pharmacy-status]");
  const local = page.getByRole("switch", { name: "Agent available", exact: true });
  const global = page.getByRole("switch", { name: /^Agent: (On|Off)$/ });
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  await expect(status).toHaveText("Not checked: manual submission");
  await expect(local).toBeChecked();
  await field.fill("NCSO RK 21/08/26");
  await local.click();
  await expect(local).not.toBeChecked();
  await local.click();
  await expect(local).toBeChecked();
  await expect(status).toHaveText("Not checked: manual submission");
  await expect(page.getByRole("heading", { name: /^Rule retrieved for/ })).toHaveCount(0);
  await local.click();
  await expect(local).not.toBeChecked();
  await global.click();
  await expect(local).not.toBeChecked();
  await expect(status).toHaveText("Agent unavailable: manual submission");
  await expect(page.getByText("Agent unavailable · No checks performed; manual submission remains available.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Rule retrieved for/ })).toHaveCount(0);
  await local.click();
  await expect(status).toHaveText("Ready to submit");
  await global.click();
  await expect(status).toHaveText("Not checked: manual submission");
  await global.click();
  await expect(status).toHaveText("Ready to submit");
  await expect(field).toHaveValue("NCSO RK 21/08/26");
  await expect(page.getByRole("radio", { name: "Information missing", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Continue with submission", exact: true })).toBeEnabled();
});