import { captureCheckpoint, expect, navigatePrimary, test } from "./fixtures";
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
  await expect(rows).toHaveCount(9);
  const states = rows.locator("[data-recorded-state]");
  const originalStates = await states.evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-recorded-state")));
  await expect(rows.filter({ hasText: "Model example only; no evidence or citation" })).not.toHaveCount(0);
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  expect(await states.evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-recorded-state")))).toEqual(originalStates);
  await expect(rows.locator('[aria-label="Agent work phases"]')).toHaveCount(0);
  await expect(rows.filter({ hasText: "nothing yet, operator to gather" })).not.toHaveCount(0);
  await page.getByRole("switch", { name: "Agent: Off", exact: true }).click();
  expect(await states.evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-recorded-state")))).toEqual(originalStates);
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
      test(`pharmacy ${scenario.name}: header=${globalEnabled} remains advisory`, async ({ page }, testInfo) => {
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
        const assistanceEnabled = globalEnabled;
        await expect(status).toHaveText(globalEnabled ? scenario.status : "Not checked: manual submission");
        await expect(field).toHaveValue(endorsement);
        if (assistanceEnabled && scenario.readable) await expect(checks).toBeVisible();
        else await expect(checks).toHaveCount(0);
        await expect(page.getByRole("switch")).toHaveCount(1);
        const rule = page.getByRole("heading", { name: /^Rule retrieved for/ });
        const reading = page.getByText(/^Reading of the note \(mocked interpretation\):/);
        if (assistanceEnabled && scenario.readable) {
          await expect(rule).toBeVisible();
          await expect(reading).toBeVisible();
        } else {
          await expect(rule).toHaveCount(0);
          await expect(reading).toHaveCount(0);
          if (!globalEnabled) await expect(page.getByText("Agent Off · No checks performed in this scenario; real pharmacy checks are unknown.", { exact: true })).toBeVisible();
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

test("pharmacy keeps edits across header assistance changes and navigation", async ({ page }) => {
  await page.goto("queue");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("region", { name: "Exception queue table", exact: true }).locator("tbody > tr")).toHaveCount(9);
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await navigatePrimary(page, "Pharmacy check");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await expect(page.getByRole("heading", { name: "Pharmacy pre-submission check", exact: true })).toBeVisible();
  const status = page.locator("[data-pharmacy-status]");
  const global = page.getByRole("switch", { name: /^Agent: (On|Off)$/ });
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  await expect(status).toHaveText("Not checked: manual submission");
  await expect(page.getByRole("switch")).toHaveCount(1);
  await field.fill("NCSO RK 21/08/26");
  await expect(status).toHaveText("Not checked: manual submission");
  await expect(page.getByRole("heading", { name: /^Rule retrieved for/ })).toHaveCount(0);
  await global.click();
  await expect(status).toHaveText("Ready to submit");
  await global.click();
  await expect(status).toHaveText("Not checked: manual submission");
  await global.click();
  await expect(status).toHaveText("Ready to submit");
  await expect(field).toHaveValue("NCSO RK 21/08/26");
  await expect(page.getByRole("radio", { name: "Information missing", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Continue with submission", exact: true })).toBeEnabled();
});