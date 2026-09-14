import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, navigatePrimary, test } from "./fixtures";
import { DECLARATION_RECONCILIATION, PAPER_D_CAPTURE_FIELDS, postWorkedPaperDeclaration } from "./paper-declaration-helpers";
import { choosePaperExample } from "./pharmacy-scenario-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { operatorRadio, performDecision } from "./operator-action-helpers";

test("worked paper declaration reaches Sufficient only after explicit human evidence and confirmation", async ({ page }, info) => {
  await page.goto("/pharmacy");
  const capture = await postWorkedPaperDeclaration(page);
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await page.locator('[data-case-id="EX-24123"]').getByRole("link", { name: "Open EX-24123", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
  await expect(page.getByText("Gate: PASS", { exact: true })).toBeVisible();
  await expect(page.getByText("All mandatory fields supplied", { exact: true })).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText("All mandatory fields read");
  const decision = page.getByRole("region", { name: "Operator decision", exact: true });
  await expect(decision.getByRole("region", { name: "Suggestion", exact: true }).getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await expect(decision.getByRole("radio", { checked: true })).toHaveCount(0);
  await decision.getByRole("button", { name: "Apply suggestion", exact: true }).click();
  await expect(decision.getByRole("radio", { name: "Sufficient (human choice)", exact: true })).toBeChecked();
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
  await expect(page.getByRole("region", { name: "Operator decision", exact: true }).getByRole("button", { name: "Apply suggestion", exact: true })).toBeDisabled();
});

for (const enabled of [false, true]) {
  // Readable B is no longer playable. D retains the manual-capture and pricing proof with its required Type 2 review.
  test(`complete human evidence on D retains capture then explicit Type 2 pricing, Agent ${enabled}`, async ({ page }, info) => {
    await page.goto("/pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    if (enabled) await postWorkedPaperDeclaration(page);
    else {
      await choosePaperExample(page);
      await expect(page.getByLabel("Declared product", { exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: "Post paper", exact: true }).click();
      await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("EX-24123:2");
      await navigatePrimary(page, "NHSBSA queue");
    }
    const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
    for (const [name, value] of Object.entries(PAPER_D_CAPTURE_FIELDS)) {
      const field = capture.getByRole("textbox", { name, exact: true });
      if (!enabled || name === "Prescriber") {
        await expect(field).toHaveValue("");
        await field.fill(value);
      } else await expect(field).toHaveValue(value);
    }
    if (enabled) await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
    await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
    const row = page.getByRole("region", { name: "Type 2 worklist", exact: true }).locator('[data-case-id="EX-24123"]');
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Open EX-24123", exact: true }).click();
    await operatorRadio(page, "ACCEPT").check();
    await page.getByRole("textbox", { name: /^Reason/ }).fill("Human checked the captured product, quantity, endorsement and independently established prescriber.");
    await performDecision(page, "ACCEPT", { releaseVerified: enabled });
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    await expect(detail).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
    await expect(detail).toContainText("after operator review");
    await expect(detail).not.toContainText("no operator action");
    await expect(detail).not.toContainText("no person involved");
    await detail.getByText("History and attempts (2)", { exact: true }).click();
    await expect(detail.getByRole("region", { name: "Type 1 capture for attempt 2", exact: true })).toContainText("Dr Demo (synthetic)");
    await expect(detail.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li").last()).toContainText("operator");
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "four-case-paper-human-pricing-axe", audit);
    expect(audit.violations).toEqual([]);
  });
}
