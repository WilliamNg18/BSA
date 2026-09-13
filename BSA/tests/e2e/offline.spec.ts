import { automaticCaseIds, cases, expect, navigatePrimary, openCaseFromQueueOrClaim, staticRoutes, test } from "./fixtures";

for (const reducedMotion of ["reduce", "no-preference"] as const) for (const enabled of [false, true]) {
test(`fresh Overview supports first visits to every route after immediate disconnection ${reducedMotion} agent=${enabled}`, async ({ page, context }) => {
  // A fresh test context has never visited a secondary route. Routing disables
  // the HTTP cache, so previously cached route chunks cannot mask a regression.
  await context.route("**/*", (route) => route.continue());
  await page.emulateMedia({ reducedMotion });
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(staticRoutes[0].title);
  const offlineRequests: string[] = [];
  page.on("request", (request) => offlineRequests.push(request.url()));
  await context.setOffline(true);
  try {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const labels = ["Overview", "Pharmacy check", "Exception queue", "Evaluation", "Boundary", "Assumptions", "Architecture"];
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Presenter mode|Discussion mode/ })).toHaveCount(0);
    for (const [index, label] of labels.entries()) {
      await navigatePrimary(page, label);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(staticRoutes[index].title);
    }
    await navigatePrimary(page, "Exception queue");
    for (const c of cases) {
      await openCaseFromQueueOrClaim(page, c.id);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Operator case pack: ${c.title}`);
      const caseNav = page.getByRole("navigation", { name: "Case views" });
      await caseNav.getByRole("link", { name: "Case-building trace", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`How the case was built: ${c.title}`);
      if (!enabled) {
        await expect(page.getByRole("list", { name: "Manual gathering trace" }).locator(":scope > li")).toHaveCount(7);
        await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
        if (automaticCaseIds.includes(c.id)) await expect(page.getByRole("list", { name: "Deterministic clearance trace" }).locator(":scope > li")).toHaveCount(2);
      } else if ([...automaticCaseIds, "EX-24088"].includes(c.id)) {
        await expect(page.getByRole("list", { name: "Deterministic clearance trace" }).locator(":scope > li")).toHaveCount(2);
        await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Show all", exact: true })).toHaveCount(0);
      } else {
        await page.getByRole("button", { name: "Show all", exact: true }).click();
        await expect(page.getByRole("list", { name: "Agent trace", exact: true }).locator(":scope > li")).toHaveCount(9);
      }
      await caseNav.getByRole("link", { name: "Decision and audit record", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Decision and audit record: ${c.title}`);
      await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    }
    // These current destinations have no primary link before Stream D. Exercise
    // the router's browser-history surface, not a reload or preloaded route.
    for (const path of ["#scene", "#month", "#pipeline", "#cases", "#two-places", "#close", "pharmacy/claims", "missing-page"]) {
      await page.evaluate((destination) => {
        history.pushState(null, "", `/${destination}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, path);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("This view could not be loaded", { exact: true })).toHaveCount(0);
    }
    expect(offlineRequests, "In-session route navigation must not request uncached assets").toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});
}