import { cases, expect, navigatePrimary, staticRoutes, test } from "./fixtures";

const caseRoutes = cases.flatMap((c) => [
  { path: `case/${c.id}`, title: `Operator case pack: ${c.title}` },
  { path: `case/${c.id}/trace`, title: `How the case was built: ${c.title}` },
  { path: `case/${c.id}/record`, title: `Decision and audit record: ${c.title}` },
]);

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [360, 768, 1024, 1440]) {
    test.describe(`${width}px ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });
      for (const route of [...staticRoutes, ...caseRoutes]) {
        test(`deep link ${route.path || "overview"}`, async ({ page }, testInfo) => {
          await page.goto(route.path || "./");
          await expect(page.getByRole("heading", { level: 1, name: route.title, exact: true })).toBeVisible();
          await expect(page.locator("[data-disclaimer]")).toContainText("Synthetic demonstration data throughout.");
          await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
          await expect(page.getByRole("button", { name: /Presenter mode|Discussion mode/ })).toHaveCount(0);
          await expect(page.getByRole("complementary", { name: "Presenter walkthrough" })).toHaveCount(0);
          await expect(page.getByRole("dialog", { name: "Discussion mode", exact: true })).toHaveCount(0);
          await expect(page.locator("a[href$='/notes']")).toHaveCount(0);
          await expect(page.getByText("NHSBSA capability demonstration · synthetic data", { exact: true })).toHaveCount(0);
          await expect(page.getByText("This view could not be loaded", { exact: true })).toHaveCount(0);
          expect(new URL(page.url()).pathname).toMatch(/^\/BSA\//);
          // Wait for fonts and the entrance animation before checking overflow.
          await page.evaluate(() => document.fonts.ready);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          expect(overflow, "Page must not overflow horizontally").toBeLessThanOrEqual(1);
          await page.screenshot({ path: testInfo.outputPath("after.png"), fullPage: true });
          await testInfo.attach("after", { path: testInfo.outputPath("after.png"), contentType: "image/png" });
        });
      }
    });
  }
}

for (const suffix of ["", "/trace", "/record"]) {
  for (const id of ["invalid", "EX-99999", "%3Cinvalid%3E"]) {
    test(`invalid case ${id}${suffix} retains shell and queue recovery`, async ({ page }) => {
      await page.goto(`case/${id}${suffix}`);
      await expect(page.getByText("Case not found", { exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Go to the queue" }).click();
      await expect(page.getByRole("heading", { name: "NHSBSA exception queue", exact: true })).toBeVisible();
    });
  }
}

test("shared filler EX-24104 has real pack, trace, record and pharmacy deep links", async ({ page }) => {
  for (const suffix of ["", "/trace", "/record"]) {
    await page.goto(`case/EX-24104${suffix}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Case not found", { exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Claim detail: EX-24104", exact: true })).toBeVisible();
  }
});

for (const path of ["missing-page", "notes"]) {
  test(`${path} is not found and has a working home link`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByText("This view could not be loaded", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-disclaimer]")).toContainText("Synthetic demonstration data throughout.");
    await page.screenshot({ path: testInfo.outputPath("not-found.png"), fullPage: true });
    await page.getByRole("link", { name: "Go home" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(staticRoutes[0].title);
  });
}

test("primary links navigate within the Pages base and keyboard skip link reaches main", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  for (const [index, label] of ["Overview", "Pharmacy check", "Exception queue", "Evaluation", "Boundary", "Assumptions", "Architecture"].entries()) {
    await navigatePrimary(page, label);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(staticRoutes[index].title);
  }
});

test("all case views can be revisited without unstable snapshots", async ({ page }) => {
  await page.goto("queue");
  for (const c of cases) {
    await page.locator(`a[href='/BSA/case/${c.id}']`).first().click();
    const nav = page.getByRole("navigation", { name: "Case views" });
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const label of ["Decision and audit record", "Case-building trace", "Operator case pack"]) {
        await nav.getByRole("link", { name: label, exact: true }).click();
        await expect(page.getByRole("heading", { level: 1 })).toContainText(c.title);
      }
    }
    await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  }
});