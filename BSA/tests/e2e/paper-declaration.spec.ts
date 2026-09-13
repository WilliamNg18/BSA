import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { DECLARATION_RECONCILIATION, postWorkedPaperDeclaration } from "./paper-declaration-helpers";
import { confirmCompletePaper, PAPER_B, submitCompletePaper } from "./paper-capture-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

test("worked paper declaration reaches Sufficient only after explicit human evidence and confirmation", async ({ page }, info) => {
  await page.goto("/pharmacy");
  const capture = await postWorkedPaperDeclaration(page);
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await page.locator('[data-case-id="EX-24123"]').getByRole("link", { name: "Open EX-24123", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
  await expect(page.getByText("Gate: PASS", { exact: true })).toBeVisible();
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Accept the recommendation \(as recommended\)/ })).toBeChecked();
  await expect(page.getByRole("main")).toContainText("declared by the pharmacy, not read from the form");
  const audit = await new AxeBuilder({ page }).analyze();
  await captureJson(info, "worked-declaration-built-case-axe", audit);
  expect(audit.violations).toEqual([]);
});

test("a contradictory human capture does not turn a complete declaration into source agreement", async ({ page }) => {
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
});

for (const enabled of [false, true]) {
  test(`ordinary complete paper retains human capture then existing pricing, Agent ${enabled}`, async ({ page }) => {
    await page.goto("/pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const action = async (label: string, _side: "Pharmacy" | "NHSBSA", perform: () => Promise<void>) => {
      await test.step(label, perform);
    };
    await submitCompletePaper(page, action);
    await confirmCompletePaper(page, enabled, action);
    await expect(page.locator(`[data-case-id="${PAPER_B}"]`)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
    await expect(page.getByRole("region", { name: `Type 1 capture for ${PAPER_B}`, exact: true })).toContainText("Human capture confirmed");
    await expect(page.getByRole("region", { name: "Type 2 worklist", exact: true }).locator(`[data-case-id="${PAPER_B}"]`)).toHaveCount(0);
  });
}
