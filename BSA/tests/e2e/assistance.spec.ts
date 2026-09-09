import { expect, test } from "./fixtures";
import { QUEUE_FILLER } from "../../src/lib/domain/cases";

test("queue hides all filler recommendations without changing evidence, states or human decisions", async ({ page }) => {
  await page.goto("case/EX-24112");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  const rows = page.locator("tbody > tr");
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

  await page.getByRole("switch", { name: "Agent recommendations on", exact: true }).click();
  await expect(recommendations).toHaveText(Array<string>(12).fill("No recommendation (agent not run)"));
  await expect(states).toHaveText(originalStates);
  await expect(times).toHaveText(originalTimes);
  await expect(fillerRows.locator("td:nth-child(3)")).toHaveText(Array<string>(6).fill("Synthetic row"));
  await expect(rows.filter({ hasText: "Case pack" }).locator("td:nth-child(3)")).toHaveText(Array<string>(6).fill("Pre-checks only"));
  await page.getByRole("radio", { name: "Agent abstained", exact: true }).click();
  await expect(rows).toHaveCount(2);
  await expect(recommendations).toHaveText(Array<string>(2).fill("No recommendation (agent not run)"));
  await page.getByRole("radio", { name: "All", exact: true }).click();
  await expect(states).toHaveText(originalStates);

  await page.getByRole("switch", { name: "Agent recommendations off", exact: true }).click();
  await expect(recommendations).toHaveText(originalRecommendations);
  await expect(states).toHaveText(originalStates);
  await expect(times).toHaveText(originalTimes);
  await page.locator("a[href='/BSA/case/EX-24112']").first().click();
  await expect(page.getByText("Decision already recorded for this case", { exact: false })).toBeVisible();
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
      test(`pharmacy ${scenario.name}: global=${globalEnabled}, local=${localAvailable} remains advisory`, async ({ page }) => {
        await page.goto("pharmacy");
        await page.getByRole("radio", { name: scenario.name, exact: true }).click();
        const status = page.getByRole("status").filter({ hasText: /^(Information may be missing|Ready to submit|Agent unable to determine)$/ });
        await expect(status).toHaveText(scenario.status);
        const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
        const endorsement = await field.inputValue();
        const checks = page.getByRole("heading", { name: /^Deterministic checks/ }).locator("..");
        const evidence = await checks.innerText();
        if (!globalEnabled) await page.getByRole("switch", { name: "Agent recommendations on", exact: true }).click();
        if (!localAvailable) await page.getByRole("switch", { name: "Agent available", exact: true }).click();
        const assistanceEnabled = globalEnabled && localAvailable;
        await expect(status).toHaveText(assistanceEnabled ? scenario.status : "Agent unable to determine");
        await expect(field).toHaveValue(endorsement);
        await expect(checks).toHaveText(evidence, { useInnerText: true });
        await expect(page.getByRole("switch", { name: "Agent available", exact: true })).toBeChecked({ checked: localAvailable });
        const rule = page.getByRole("heading", { name: /^Rule retrieved for/ });
        const reading = page.getByText(/^Reading of the note \(mocked interpretation\):/);
        if (assistanceEnabled && scenario.readable) {
          await expect(rule).toBeVisible();
          await expect(reading).toBeVisible();
        } else {
          await expect(rule).toHaveCount(0);
          await expect(reading).toHaveCount(0);
          await expect(page.getByText(/Continue with submission as normal;/)).toBeVisible();
          if (!globalEnabled) await expect(page.getByText(/Agent recommendations are switched off\./)).toBeVisible();
          else if (!localAvailable) await expect(page.getByText(/The agent is not available\./)).toBeVisible();
        }
        const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
        await expect(submit).toBeEnabled();
        await submit.click();
        await expect(page.getByRole("status").filter({ hasText: "Submitted (synthetic)." })).toBeVisible();
        await expect(submit).toBeEnabled();
      });
    }
  }
}

test("pharmacy keeps edits and local availability across global assistance changes", async ({ page }) => {
  await page.goto("queue");
  await expect(page.locator("tbody > tr")).toHaveCount(12);
  await page.getByRole("switch", { name: "Agent recommendations on", exact: true }).click();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pharmacy check", exact: true }).click();
  const status = page.getByRole("status").filter({ hasText: /^(Information may be missing|Ready to submit|Agent unable to determine)$/ });
  const local = page.getByRole("switch", { name: "Agent available", exact: true });
  const global = page.getByRole("switch", { name: /^Agent recommendations (on|off)$/ });
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  await expect(status).toHaveText("Agent unable to determine");
  await expect(local).toBeChecked();
  await field.fill("NCSO RK 21/08/26");
  await local.click();
  await local.click();
  await expect(status).toHaveText("Agent unable to determine");
  await expect(page.getByRole("heading", { name: /^Rule retrieved for/ })).toHaveCount(0);
  await local.click();
  await global.click();
  await expect(local).not.toBeChecked();
  await expect(status).toHaveText("Agent unable to determine");
  await expect(page.getByText(/The agent is not available\./)).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Rule retrieved for/ })).toHaveCount(0);
  await local.click();
  await expect(status).toHaveText("Ready to submit");
  await global.click();
  await expect(status).toHaveText("Agent unable to determine");
  await global.click();
  await expect(status).toHaveText("Ready to submit");
  await expect(field).toHaveValue("NCSO RK 21/08/26");
  await expect(page.getByRole("radio", { name: "Information missing", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Continue with submission", exact: true })).toBeEnabled();
});