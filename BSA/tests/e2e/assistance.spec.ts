import { captureCheckpoint, expect, navigatePrimary, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

test("actual worklist hides advice without changing evidence, routing or human decisions", async ({ page }) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  await expect(page.getByRole("region", { name: "Type 2 worklist", exact: true })).toBeVisible();
  const rows = page.locator("[data-case-id]");
  for (const id of ["EX-24112", "EX-24119", "EX-24088"]) await expect(page.locator(`[data-case-id="${id}"]`)).toBeVisible();
  for (const id of ["EX-24107", "EX-24101", "EX-24123"]) await expect(page.locator(`[data-case-id="${id}"]`)).toHaveCount(0);
  await expect(page.locator('[data-type1-case="EX-24123"]')).toBeVisible();
  const evidence = () => rows.evaluateAll((items) => items.map((row) => ({
    id: row.getAttribute("data-case-id"),
    fields: Array.from(row.querySelectorAll("td")).slice(0, 4).map((cell) => cell.textContent),
  })));
  const originalEvidence = await evidence();
  await expect(page.locator('[data-case-id="EX-24112"]')).toContainText("No approved draft; human reason retained");
  await expect(rows.filter({ hasText: "Model example only; no evidence or citation" })).toHaveCount(0);
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  expect(await evidence()).toEqual(originalEvidence);
  await expect(rows.locator('[aria-label="Agent work phases"]')).toHaveCount(0);
  for (const row of await rows.all()) await expect(row.locator("td").nth(4)).toHaveText("Not invoked; experience only");
  await page.getByRole("switch", { name: "Agent: Off", exact: true }).click();
  expect(await evidence()).toEqual(originalEvidence);
  await page.locator("a[href='/case/EX-24112']").first().click();
  await expect(page.getByText("Read-only: not awaiting an operator decision", { exact: false })).toBeVisible();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
});

for (const scenario of [
  { name: "Complete endorsement", status: "Complete: will flow to automated pricing, no person involved", readable: true },
  { name: "NCSO missing date", status: "Information missing", readable: true },
  { name: "Unreadable form", status: "Declaration complete, not capture confirmed", readable: false },
  { name: "Generic missing brand", status: "Information missing", readable: true },
]) {
  for (const globalEnabled of [true, false]) {
      test(`pharmacy ${scenario.name}: header=${globalEnabled} remains advisory`, async ({ page }, testInfo) => {
        await page.goto("pharmacy");
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        await page.getByRole("radio", { name: scenario.readable ? "EPS" : "Paper", exact: true }).click();
        await page.getByRole("radio", { name: scenario.name, exact: true }).click();
        await expect(page.getByRole("radio", { name: scenario.readable ? "EPS" : "Paper", exact: true })).toBeChecked();
        const status = page.locator("[data-pharmacy-status]");
        if (!scenario.readable) await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
        if (scenario.readable) await expect(status).toHaveText(scenario.status);
        else await expect(page.locator("[data-declaration-advice]")).toContainText(scenario.status);
        const field = page.getByRole("textbox", { name: scenario.readable ? "Dispenser endorsement" : "Declared endorsement", exact: true });
        const endorsement = await field.inputValue();
        if (!scenario.readable) await expect(field).toHaveValue("NCSO JB 27/08/26");
        const checks = page.getByRole("list", { name: "Requirement checkboxes" });
        if (scenario.readable) await expect(checks).toBeVisible();
        else await expect(checks).toHaveCount(0);
        if (!globalEnabled) await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
        const assistanceEnabled = globalEnabled;
        if (scenario.readable) await expect(status).toHaveText(globalEnabled ? scenario.status : "Not checked: manual submission");
        if (scenario.readable || globalEnabled) await expect(field).toHaveValue(endorsement);
        else await expect(field).toHaveCount(0);
        if (assistanceEnabled && scenario.readable) await expect(checks).toBeVisible();
        else await expect(checks).toHaveCount(0);
        await expect(page.getByRole("switch")).toHaveCount(1);
        const rule = page.getByRole("heading", { name: /^Retrieved clause:/ });
        const reading = page.getByText("Endorsement type recognised", { exact: true });
        if (assistanceEnabled && scenario.readable) {
          await expect(rule).toBeVisible();
          await expect(reading).toBeVisible();
        } else {
          await expect(rule).toHaveCount(0);
          await expect(reading).toHaveCount(0);
          if (!globalEnabled && scenario.readable) await expect(page.getByText("Not retrieved", { exact: true })).toBeVisible();
          else if (!globalEnabled) await expect(page.locator("[data-paper-narrative]")).toHaveText("Image cannot be read. No declaration; Type 1 keys, Type 2 judges. RB2B delays are illustrative; posting never confirms.");
          else await expect(page.getByRole("list", { name: "Declaration requirement checks" })).toContainText("Met: Dated");
        }
        const submit = page.getByRole("button", { name: scenario.readable ? "Send claim" : globalEnabled ? "Post paper with declaration" : "Post paper", exact: true });
        await expect(submit).toBeEnabled();
        await captureCheckpoint(page, testInfo, "pharmacy-assistance-state");
        await submit.click();
        if (scenario.readable) await expect(page.getByRole("status").filter({ hasText: "Submitted (synthetic)." })).toBeVisible();
        const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
        await expect(receipt).toContainText(globalEnabled ? scenario.readable ? scenario.name === "Complete endorsement" ? "ready" : "missing" : "ready" : "not_checked");
        if (scenario.name === "Complete endorsement") {
          await expect(receipt).toContainText("priced by NHSBSA's existing rules engine, no person involved");
        } else {
          await expect(receipt).not.toContainText("no person involved");
          await expect(receipt).not.toContainText("Operator-approved note");
        }
        const evidence = await receipt.locator(":scope > dl").first().innerText();
        await page.getByRole("banner").getByRole("switch").setChecked(!globalEnabled);
        await expect(receipt.locator(":scope > dl").first()).toHaveText(evidence, { useInnerText: true });
        await expect(page.getByRole("button", { name: scenario.readable ? "Send claim" : globalEnabled ? "Post paper" : "Post paper with declaration", exact: true })).toBeEnabled();
      });
  }
}

test("pharmacy keeps edits across header assistance changes and navigation", async ({ page }) => {
  await page.goto("queue");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("region", { name: "Type 2 worklist", exact: true })).toBeVisible();
  await expect(page.locator('[data-case-id="EX-24112"]')).toBeVisible();
  await expect(page.locator('[data-type1-case="EX-24123"]')).toBeVisible();
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await navigatePrimary(page, "Pharmacy check");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await expect(page.getByRole("heading", { name: "Pharmacy pre-submission check", exact: true })).toBeVisible();
  const status = page.locator("[data-pharmacy-status]");
  const global = page.getByRole("switch", { name: /^Agent: (On|Off)$/ });
  const field = page.getByRole("textbox", { name: "Dispenser endorsement" });
  await expect(status).toHaveText("Not checked: manual submission");
  await expect(page.getByRole("switch")).toHaveCount(1);
  await field.fill("NCSO RK 21/08/26");
  await expect(status).toHaveText("Not checked: manual submission");
  await expect(page.getByRole("heading", { name: /^Rule retrieved for/ })).toHaveCount(0);
  await global.click();
  await expect(status).toHaveText("Complete: will flow to automated pricing, no person involved");
  await global.click();
  await expect(status).toHaveText("Not checked: manual submission");
  await global.click();
  await expect(status).toHaveText("Complete: will flow to automated pricing, no person involved");
  await expect(field).toHaveValue("NCSO RK 21/08/26");
  await expect(page.getByRole("radio", { name: "NCSO missing date", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Send claim", exact: true })).toBeEnabled();
});