import { expect, navigatePrimary, test } from "./fixtures";

// Stream D: navigation, case header and tour-chapter rail. These tests are
// new and cover only files this stream owns (header, routes, rail/content,
// case header, shared link/banner components); they do not touch or assume
// any Stream A/B/C page internals.

for (const width of [360, 1024, 1440]) {
  test(`header stays one row with the claims Operations entry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    const header = page.getByRole("banner");
    const box = await header.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(64);
    await navigatePrimary(page, "Pharmacy claims");
    await expect(page).toHaveURL(/\/pharmacy\/claims$/);
    const boxAfter = await page.getByRole("banner").boundingBox();
    expect(boxAfter?.height).toBeLessThanOrEqual(64);
  });
}

test("mobile navigation sheet lists the claims entry under Operations", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("./");
  await page.getByRole("banner").getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(dialog.getByRole("link", { name: "Pharmacy claims", exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Pharmacy check", exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Exception queue", exact: true })).toBeVisible();
});

for (const caseId of ["EX-24107", "EX-24112"]) {
  test(`case header Pharmacy view link keeps the existing back-to-queue and tab destinations: ${caseId}`, async ({ page }) => {
    await page.goto(`case/${caseId}`);
    const pharmacyView = page.getByRole("link", { name: "Pharmacy view", exact: true });
    await expect(pharmacyView).toBeVisible();
    await expect(pharmacyView).toHaveAttribute("href", `/BSA/pharmacy/claims?case=${caseId}`);
    await expect(page.getByRole("link", { name: "Back to queue", exact: true })).toHaveAttribute("href", "/BSA/queue");
    await expect(page.getByRole("link", { name: "Case-building trace", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Operator case pack", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Decision and audit record", exact: true })).toBeVisible();
    await pharmacyView.focus();
    await expect(pharmacyView).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/pharmacy/claims\\?case=${caseId}$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/case/${caseId}$`));
  });
}

test("Follow this item banner shell reads followedCaseId and stays inert before the round trip lands", async ({ page }) => {
  await page.goto("case/EX-24112");
  const banner = page.getByRole("group", { name: "Follow this item", exact: true });
  await expect(banner).toBeVisible();
  const toggle = banner.getByRole("switch");
  await expect(toggle).toBeDisabled();
  await expect(toggle).not.toBeChecked();
  await expect(banner.getByText("Switch side")).toBeVisible();
});

test("reduced motion keeps the case header, Pharmacy view link and Follow banner visible and reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("case/EX-24088/trace");
  await expect(page.getByRole("link", { name: "Pharmacy view", exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Follow this item", exact: true })).toBeVisible();
});

test("what the pharmacy sees chapter follows the queue and is reversible", async ({ page }) => {
  await page.goto("./#scene");
  const rail = page.getByRole("navigation", { name: "Guided tour" });
  await rail.getByRole("button", { name: "Choose tour chapter" }).click();
  await page.getByRole("menuitem", { name: "5. The queue", exact: true }).click();
  await expect(page).toHaveURL(/\/queue$/);
  await rail.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\/pharmacy\/claims$/);
  await expect(rail).toContainText("6/7 · What the pharmacy sees");
  await rail.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/queue$/);
});
