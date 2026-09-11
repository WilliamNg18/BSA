import { expect, test } from "./fixtures";

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`Task7 keyboard scroll ${colorScheme}`, () => {
    test.use({ viewport: { width: 360, height: 1000 }, colorScheme });

    test("named regions scroll their actual table and architecture flow", async ({ page }) => {
      let scrolled = 0;
      for (const route of ["evaluation", "boundary", "architecture", "queue", "case/EX-24112/trace"]) {
        await page.goto(route);
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        if (route.endsWith("/trace")) await page.getByRole("button", { name: "Show all", exact: true }).click();
        const tables = page.locator('table[data-slot="table"]');
        await expect(tables.first()).toBeVisible();
        for (const table of await tables.all()) {
          const region = table.locator("..");
          await expect(region).toHaveAttribute("role", "region");
          await expect(region).toHaveAttribute("aria-label", /\S/);
          await expect(region).toHaveAttribute("tabindex", "0");
          await expect(region.locator('table[data-slot="table"]')).toHaveCount(1);
          if (await region.evaluate((element) => element.scrollWidth > element.clientWidth)) {
            await region.focus();
            await expect(region).toBeFocused();
            await page.keyboard.press("ArrowRight");
            await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
            scrolled++;
          }
        }
        if (route === "architecture") {
          const flow = page.getByRole("region", { name: "Architecture flow", exact: true });
          await flow.focus();
          await expect(flow).toBeFocused();
          await page.keyboard.press("ArrowRight");
          await expect.poll(() => flow.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
      expect(scrolled).toBeGreaterThan(0);
    });
  });
}