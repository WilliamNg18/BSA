import { expect, navigatePrimary, test } from "./fixtures";
import { postWorkedPaperDeclaration, DECLARATION_RECONCILIATION } from "./paper-declaration-helpers";
import { startDemonstrationReview } from "./lifecycle-helpers";

test("mobile navigation keeps real active classes and a visible keyboard focus indicator", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/pharmacy/claims");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  for (let step = 0; step < 3; step++) await page.keyboard.press("Tab");
  const current = dialog.getByRole("link", { name: "Pharmacy claims", exact: true });
  await expect(current).toBeFocused();
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toHaveClass(/\bbg-accent\b/);
  await expect(current).toHaveClass(/focus-visible:outline-2/);
  expect(await current.getAttribute("class")).not.toMatch(/isActive|=>|\(\{/);
  const focus = await current.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, top: rect.top, bottom: rect.bottom, width: rect.width };
  });
  expect(focus.outlineWidth).toBe("2px");
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.top).toBeGreaterThanOrEqual(0);
  expect(focus.bottom).toBeLessThanOrEqual(900);
  expect(focus.width).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/\/pharmacy\/claims$/);
});

test("complete EPS Off describes hypothetical risk without running a hidden check", async ({ page }) => {
  await page.goto("/pharmacy");
  await page.getByRole("radio", { name: "Complete endorsement", exact: true }).check();
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Not checked: manual submission");
  await expect(page.getByRole("button", { name: "Manual: If incomplete, problems may be found at NHSBSA weeks later", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Requirement checkboxes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
  await expect(receipt).toContainText("no person involved");
  await expect(receipt).toContainText("not_checked");
  await expect(page.getByRole("button", { name: "Manual: If incomplete, problems may be found at NHSBSA weeks later", exact: true })).toBeVisible();
});

test("confirmed conflicted paper records an attestation without claiming agreement or machine reading", async ({ page }) => {
  await page.goto("/pharmacy");
  const capture = await postWorkedPaperDeclaration(page);
  await capture.getByRole("textbox", { name: "Product code", exact: true }).fill("SYN-AMLO10-28");
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await page.getByRole("link", { name: "Open EX-24123", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("The operator attested reconciliation; this does not prove source agreement.");
  await expect(page.getByRole("main")).not.toContainText("declaration and paper explicitly reconciled");
  await expect(page.getByRole("main")).not.toContainText("All mandatory fields read");
  await navigatePrimary(page, "Overview");
  await page.getByRole("button", { name: "Choose tour chapter", exact: true }).click();
  await page.getByRole("menuitem", { name: "4. Cases and boundaries", exact: true }).click();
  await expect(page.locator('[data-case="C"] [data-outcome]')).toHaveText("Request information from the pharmacy");
  await expect(page.locator('[data-case="C"]')).not.toContainText("REQUEST_INFORMATION");
});

for (const enabled of [false, true]) {
  test(`operator errors keep complete guidance under 25 words without losing controls, Agent ${enabled}`, async ({ page }) => {
    await page.goto("/case/EX-24112");
    await startDemonstrationReview(page);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const referral = page.getByRole("radio", { name: /^Refer back(?: |$)/ });
    await referral.check();
    const record = page.getByRole("button", { name: "Record decision", exact: true });
    const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
    const panel = page.locator('section[data-prose="panel"]').filter({ has: page.getByRole("heading", { name: "Operator decision", exact: true }) });
    for (const message of ["A reason of at least eight characters", "Choose an RB code"]) {
      await record.click();
      const error = page.getByRole("alert").filter({ hasText: message });
      await expect(error).toBeFocused();
      const prose = [...await panel.locator("p").allTextContents(), ...await panel.locator("label span.text-xs").allTextContents(), await error.innerText()].join(" ");
      expect(prose.trim().split(/\s+/).length, prose).toBeLessThan(25);
      await expect(panel.getByRole("radio")).toHaveCount(enabled ? 5 : 4);
      await expect(referral).toBeChecked();
      await expect(record).toBeEnabled();
      await expect(page.getByRole("combobox", { name: "RB code (required)", exact: true })).toBeVisible();
      if (enabled) await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).not.toBeChecked();
      await reason.fill("Human review needs the dispensing date beside the initials");
      await expect(reason).toHaveValue("Human review needs the dispensing date beside the initials");
    }
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
    await record.press("Enter");
    await expect(page).toHaveURL(/\/record$/);
    await expect(page.getByRole("main")).toContainText("Human review needs the dispensing date beside the initials");
  });
}
