import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";

// Every existing audit surface, both themes and both assistance states.
// No tag filter: landmark and other best-practice rules must run as well as WCAG.
const surfaces = [
  ...["scene", "month", "pipeline", "cases", "two-places", "close"].map((chapter) => [`Overview ${chapter}`, `./#${chapter}`]),
  ["Pharmacy", "pharmacy"], ["Queue", "queue"],
  ["Case pack", "case/EX-24112"], ["Trace", "case/EX-24112/trace"],
  ["Decision record", "case/EX-24088/record"],
];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibility ${colorScheme}`, () => {
    test.use({ colorScheme, viewport: { width: 1440, height: 1000 } });
    for (const enabled of [true, false]) {
    for (const [name, route] of surfaces) {
      test(`axe all rules ${name} agent=${enabled}`, { tag: ["@hosted-qa", "@axe-all", enabled ? "@agent-on" : "@agent-off"] }, async ({ page }, testInfo) => {
        await page.goto(route);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const scope = page.getByRole("region", { name: "Demonstration scope and governing principle" });
        await expect(scope.locator("#synthetic-disclaimer")).toBeVisible();
        await expect(scope.locator("[data-principle]")).toBeVisible();
        const results = await new AxeBuilder({ page }).analyze();
        await captureJson(testInfo, "axe-results", results);
        expect(results.violations, JSON.stringify(results.violations.map((v) => ({
          id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })), null, 2)).toEqual([]);
      });
    }
    }
  });
}