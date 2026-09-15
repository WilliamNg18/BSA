import { captureCheckpoint, expect, navigatePrimary, test } from "./fixtures";
import { choosePaperExample, choosePharmacyRadio, openPharmacyPrecheck, openPharmacyReceipt, startBReviewFromPharmacy } from "./pharmacy-scenario-helpers";
import { performDecision } from "./operator-action-helpers";

test("actual worklist hides advice without changing evidence, routing or human decisions", async ({ page }) => {
  await page.goto("/pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await startBReviewFromPharmacy(page);
  await page.getByRole("radio", { name: /^Refer back/ }).check();
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  await performDecision(page, "REFER_BACK");
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  const rows = page.locator("[data-case-id]");
  for (const id of ["EX-24112", "SYN-FQ123-MISMATCH"]) await expect(page.locator(`[data-case-id="${id}"]`)).toBeVisible();
  for (const id of ["EX-24107", "EX-24101", "EX-24123", "EX-24119", "EX-24088"]) await expect(page.locator(`[data-case-id="${id}"]`)).toHaveCount(0);
  await expect(page.locator('[data-type1-case="EX-24123"]')).toBeVisible();
  const evidence = () => rows.evaluateAll((items) => items.map((row) => ({
    id: row.getAttribute("data-case-id"),
    fields: Array.from(row.querySelectorAll("td")).slice(0, 5).map((cell) => cell.textContent),
  })));
  const originalEvidence = await evidence();
  await expect(page.locator('[data-case-id="EX-24112"]')).toContainText("rule and reason recorded");
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  expect(await evidence()).toEqual(originalEvidence);
  await expect(rows.locator('[aria-label="Agent work phases"]')).toHaveCount(0);
  for (const row of await rows.all()) await expect(row.locator("td").nth(5))
    .toContainText(/experience only|rule and reason recorded|Human reason retained/);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  expect(await evidence()).toEqual(originalEvidence);
  await page.locator("a[href='/case/EX-24112']").first().click();
  await expect(page.getByText("Read-only: not awaiting an operator decision", { exact: false })).toBeVisible();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("main")).toContainText("Reviewed the missing dispensing date");
});

for (const scenario of [
  { name: "Complete endorsement", ready: true, paper: false },
  { name: "NCSO missing date", ready: false, paper: false },
  { name: "Unreadable form", ready: true, paper: true },
  { name: "Wrong pack size", ready: true, paper: false },
]) for (const enabled of [true, false]) {
  test(`pharmacy ${scenario.name}: header=${enabled} remains advisory`, async ({ page }, info) => {
    await page.goto("/pharmacy");
    const flag = page.getByRole("banner").getByRole("switch");
    await flag.setChecked(true);
    if (scenario.paper) {
      await choosePaperExample(page);
      await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
    } else {
      await choosePharmacyRadio(page, "EPS");
      await choosePharmacyRadio(page, scenario.name);
    }
    const field = page.getByRole("textbox", { name: scenario.paper ? "Declared endorsement" : "Dispenser endorsement", exact: true });
    const endorsement = await field.inputValue();
    const precheck = await openPharmacyPrecheck(page);
    await expect(precheck.locator("[data-pharmacy-status]")).toHaveText(scenario.ready ? "Ready" : "Information missing");
    await expect(precheck).toContainText("2026-08");
    await expect(precheck.getByRole("list", { name: "Requirement checkboxes", exact: true })).toBeVisible();
    await flag.setChecked(enabled);
    await expect(page.getByRole("switch", { includeHidden: true })).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(enabled ? 1 : 0);
    if (!enabled) await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
    if (scenario.paper && !enabled) await expect(field).toHaveCount(0);
    else await expect(field).toHaveValue(endorsement);
    const submit = page.getByRole("button", { name: scenario.paper ? enabled ? "Post paper with declaration" : "Post paper" : "Send claim", exact: true });
    await expect(submit).toBeEnabled();
    await captureCheckpoint(page, info, "pharmacy-assistance-state");
    await submit.click();
    const receipt = await openPharmacyReceipt(page);
    await expect(receipt).toContainText(enabled ? scenario.ready ? "ready" : "missing" : "not_checked");
    if (scenario.name === "Complete endorsement") await expect(receipt).toContainText(enabled
      ? "released to existing pricing, no operator action" : "priced by NHSBSA's existing rules engine, no person involved");
    else {
      await expect(receipt).not.toContainText("no operator action");
      await expect(receipt).not.toContainText("no person involved");
    }
    if (scenario.name === "Wrong pack size" && enabled) {
      await expect(receipt.locator("dl").first()).toContainText("Gate 1pass");
      await expect(receipt.locator("dl").first()).toContainText("Gate 2fail");
    }
    const evidence = await receipt.innerText();
    await flag.setChecked(!enabled);
    await expect(receipt).toHaveText(evidence, { useInnerText: true });
  });
}

test("pharmacy keeps edits across header assistance changes and navigation", async ({ page }) => {
  await page.goto("/queue");
  await navigatePrimary(page, "Pharmacy check");
  const flag = page.getByRole("banner").getByRole("switch");
  const field = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
  await field.fill("NCSO RK 21/08/26");
  for (const enabled of [false, true, false, true]) {
    await flag.setChecked(enabled);
    await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(enabled ? 1 : 0);
    if (enabled) await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
    else await expect(page.getByRole("button", { name: "Manual: No advisory check; later correction is possible", exact: true })).toBeVisible();
    await expect(field).toHaveValue("NCSO RK 21/08/26");
    await expect(page.getByRole("button", { name: "Send claim", exact: true })).toBeEnabled();
  }
  await navigatePrimary(page, "NHSBSA queue");
  await navigatePrimary(page, "Pharmacy check");
  await expect(field).toHaveValue("NCSO RK 21/08/26");
});
