import { cases, expect, navigatePrimary, staticRoutes, test } from "./fixtures";

test("fresh Overview supports first visits to every route after disconnection", async ({ page, context }) => {
  // A fresh test context has never visited a secondary route. Routing disables
  // the HTTP cache, so previously cached route chunks cannot mask a regression.
  await context.route("**/*", (route) => route.continue());
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(staticRoutes[0].title);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  const offlineRequests: string[] = [];
  page.on("request", (request) => offlineRequests.push(request.url()));
  await context.setOffline(true);
  try {
    const labels = ["Overview", "Pharmacy check", "Exception queue", "Evaluation", "Boundary", "Assumptions", "Architecture"];
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Presenter mode|Discussion mode/ })).toHaveCount(0);
    for (const [index, label] of labels.entries()) {
      await navigatePrimary(page, label);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(staticRoutes[index].title);
    }
    await navigatePrimary(page, "Exception queue");
    for (const c of cases) {
      await page.locator(`a[href='/BSA/case/${c.id}']`).first().click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Operator case pack: ${c.title}`);
      const caseNav = page.getByRole("navigation", { name: "Case views" });
      await caseNav.getByRole("link", { name: "Case-building trace", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`How the case was built: ${c.title}`);
      await expect(page.getByRole("list", { name: "Agent trace" }).locator(":scope > li").first()).toBeVisible();
      await caseNav.getByRole("link", { name: "Decision and audit record", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Decision and audit record: ${c.title}`);
      await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    }
    expect(offlineRequests, "In-session route navigation must not request uncached assets").toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});