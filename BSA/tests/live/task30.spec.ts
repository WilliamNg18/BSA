import { audit, captureView, expect, test } from "./fixtures";
import { navigatePrimary } from "../e2e/fixtures";
import { DECLARATION_RECONCILIATION, postWorkedPaperDeclaration } from "../e2e/paper-declaration-helpers";
import { expandProcessInputs } from "../e2e/process-model-helpers";
import { LIVE_CHECKS } from "./inventory";

test(LIVE_CHECKS.hillcrest, async ({ page }, info) => {
  await page.goto("/pharmacy");
  await expect(page.getByRole("main")).toContainText("Hillcrest Pharmacy (FQ123)");
  await expect(page.getByRole("combobox", { name: "Pharmacy", exact: true })).toHaveCount(0);
  await navigatePrimary(page, "Pharmacy claims");
  await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
  const rows = page.getByRole("table", { name: "Pharmacy claims", exact: true }).locator("tbody tr");
  await expect(rows).toHaveCount(4);
  for (const id of ["EX-24107", "EX-24112", "EX-24123", "SYN-FQ123-MISMATCH"]) {
    await expect(rows.filter({ hasText: id })).toHaveCount(1);
  }
  await navigatePrimary(page, "NHSBSA queue");
  const background = page.getByRole("region", { name: "Other pharmacies, background", exact: true });
  await expect(background.getByRole("listitem")).not.toHaveCount(0);
  await expect(background.locator("a, button, input, select, [tabindex]")).toHaveCount(0);
  await expect(background).toContainText("excluded from Hillcrest's items and counts");
  for (const row of await page.locator("[data-case-id], [data-type1-case]").all()) {
    await expect(row).toContainText("Hillcrest Pharmacy");
  }
  for (const id of ["EX-24107", "EX-24101", "EX-24119", "EX-24088", "SYN-FQ123-READABLE", "SYN-FQ123-RECHECK", "SYN-FQ123-TYPE2"]) {
    await expect(page.locator(`[data-case-id="${id}"], [data-type1-case="${id}"]`)).toHaveCount(0);
  }
  await captureView(page, info, "hillcrest-only-operational-work");
});

test(LIVE_CHECKS.visibleEps, async ({ page }, info) => {
  for (const scenario of [
    { label: "Complete endorsement", id: "EX-24107", fix: null },
    { label: "NCSO missing date", id: "EX-24112", fix: "Add today's date beside the initials" },
    { label: "Generic missing brand", id: "SYN-FQ123-TYPE2", fix: "Add the brand or manufacturer dispensed" },
  ]) {
    for (const enabled of [false, true]) {
      await page.goto("/pharmacy");
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await page.getByRole("radio", { name: scenario.label, exact: true }).check();
      await expect(page.getByRole("region", { name: "Draft electronic prescription, synthetic", exact: true })).toBeVisible();
      await expect(page.getByRole("region", { name: "Dispenser's part", exact: true })).toBeVisible();
      await expect(page.getByRole("main").locator("figure")).toHaveCount(0);
      await expect(page.getByRole("main")).toContainText("no Type 1");
      await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
      const endorsement = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
      const original = await endorsement.inputValue();
      if (enabled && scenario.fix) {
        await expect(page.getByRole("heading", { name: scenario.fix, exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Apply correction", exact: true }).click();
        await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
      }
      await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled
        ? "Complete: will flow to automated pricing, no person involved" : "Not checked: manual submission");
      await page.getByRole("button", { name: "Send claim", exact: true }).click();
      const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
      await expect(receipt).toContainText(`${scenario.id}:2`);
      if (!enabled) await expect(receipt).toContainText(original);
      if (enabled || !scenario.fix) await expect(receipt).toContainText("priced by NHSBSA's existing rules engine, no person involved");
      else await expect(receipt).toContainText("Awaiting Type 2 judgement");
      await captureView(page, info, `visible-eps-${scenario.id}-${enabled ? "on" : "off"}`);
    }
  }
});

test(LIVE_CHECKS.declaredPaper, async ({ page }, info) => {
  await page.goto("/pharmacy");
  const capture = await postWorkedPaperDeclaration(page);
  await audit(page, info, "worked-declaration-unconfirmed", true);
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await page.locator('[data-case-id="EX-24123"]').getByRole("link", { name: "Open EX-24123", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await expect(page.getByText("Gate: PASS", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Accept the recommendation \(as recommended\)/ })).toBeChecked();
  await audit(page, info, "worked-declaration-human-confirmed", true);
});

test(LIVE_CHECKS.paperConflict, async ({ page }, info) => {
  await page.goto("/pharmacy");
  const capture = await postWorkedPaperDeclaration(page);
  const reconcile = capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true });
  await reconcile.check();
  await capture.getByRole("textbox", { name: "Product code", exact: true }).fill("SYN-AMLO10-28");
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await expect(reconcile).not.toBeChecked();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await expect(capture.getByRole("alert")).toContainText("Reconcile the declaration with the paper");
  await reconcile.check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await page.locator('[data-case-id="EX-24123"]').getByRole("link", { name: "Open EX-24123", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" })).toBeVisible();
  await expect(page.getByText("The sources agree.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).toHaveCount(0);
  await captureView(page, info, "declared-paper-unreconciled-evidence-abstains");
});

test(LIVE_CHECKS.sixChapters, async ({ page }, info) => {
  await page.goto("/#scene");
  const rail = page.getByRole("navigation", { name: "Guided tour", exact: true });
  const stops = ["/#scene", "/#month", "/#pipeline", "/#cases", "/#two-places", "/pharmacy", "/queue", "/pharmacy/claims", "/#close"];
  for (const [index, path] of stops.entries()) {
    if (index) await rail.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await expect(rail).toContainText("6/6");
  await expect(page.locator("[data-central-bet]")).toContainText("80%");
  await page.getByRole("link", { name: "Inspect the editable prevention assumption", exact: true }).click();
  await expandProcessInputs(page);
  await page.locator("#process-preventionPercent").fill("40");
  await rail.getByRole("button", { name: "Choose tour chapter", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(6);
  await page.getByRole("menuitem", { name: "6. The central bet", exact: true }).click();
  await expect(page.locator("[data-central-bet]")).toContainText("40%");
  await expect(page.locator("[data-central-bet]")).not.toContainText("80%");
  await captureView(page, info, "central-bet-follows-edited-assumption");
});
