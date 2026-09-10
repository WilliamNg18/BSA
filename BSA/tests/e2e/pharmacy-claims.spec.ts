import { expect, test } from "./fixtures";

// Task 9: pharmacy claims view. Own test file for Stream C; does not modify
// shared fixtures.ts or routes.spec.ts.
test.describe("pharmacy claims view", () => {
  test("lists claims for the selected pharmacy and shows detail on selection", async ({ page }) => {
    await page.goto("pharmacy/claims");
    await expect(page.getByRole("heading", { level: 1, name: "Pharmacy claims", exact: true })).toBeVisible();

    const select = page.getByLabel("Pharmacy", { exact: true });
    await expect(select).toBeVisible();

    await select.selectOption({ label: "Hillcrest Pharmacy (FQ123)" });
    await expect(page.getByRole("button", { name: "EX-24112", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "EX-24140", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "EX-24107", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "EX-24112", exact: true }).click();
    await expect(page.getByText("EX-24112 · Missing or insufficient information", { exact: true })).toBeVisible();
    await expect(page.getByText("Referred back by the operator", { exact: false })).toBeVisible();
  });

  test("offers the resubmit action only for a referred-back claim, and never changes its state", async ({ page }) => {
    await page.goto("pharmacy/claims");
    await page.getByLabel("Pharmacy", { exact: true }).selectOption({ label: "Hillcrest Pharmacy (FQ123)" });
    await page.getByRole("button", { name: "EX-24112", exact: true }).click();

    const action = page.getByRole("button", { name: "Resubmit with correction", exact: true });
    await expect(action).toBeVisible();
    await page.getByLabel("Resubmit with correction", { exact: true }).fill("NCSO RK 21/08/26");
    await action.click();

    await expect(page.getByText("Recorded for this session only", { exact: true })).toBeVisible();
    // The claim's lifecycle badge and history reason must not change; no
    // lifecycle stub is invoked by this pharmacy-side action.
    await expect(page.getByText("Referred back by the operator", { exact: false })).toBeVisible();
  });

  test("shows an operator-approved draft label when assistance is on, and manual context when off", async ({ page }) => {
    await page.goto("pharmacy/claims");
    await page.getByLabel("Pharmacy", { exact: true }).selectOption({ label: "Oakfield Pharmacy (FM208)" });
    await page.getByRole("button", { name: "EX-24119", exact: true }).click();
    await expect(page.getByText("Information requested by the operator", { exact: false })).toBeVisible();
    await expect(page.getByText("Operator-approved draft", { exact: true })).toHaveCount(0);

    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await expect(page.getByText("Operator-approved draft", { exact: true })).toBeVisible();
    await expect(page.getByText("confirm the dispensed quantity of 56", { exact: false })).toBeVisible();
  });

  test("has no action for a claim awaiting processing", async ({ page }) => {
    await page.goto("pharmacy/claims");
    await page.getByLabel("Pharmacy", { exact: true }).selectOption({ label: "Riverside Chemist (FH774)" });
    await page.getByRole("button", { name: "EX-24071", exact: true }).click();
    await expect(page.getByText("No pharmacy action is available", { exact: false })).toBeVisible();
  });
});
