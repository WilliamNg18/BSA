import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Five primary audit surfaces plus the seeded decision record, in both themes.
const surfaces = [
  ["Overview", "./"], ["Pharmacy", "pharmacy"], ["Queue", "queue"],
  ["Case pack", "case/EX-24112"], ["Trace", "case/EX-24112/trace"],
  ["Decision record", "case/EX-24088/record"],
];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibility ${colorScheme}`, () => {
    test.use({ colorScheme, viewport: { width: 1440, height: 1000 } });
    for (const [name, route] of surfaces) {
      test(`axe ${name}`, async ({ page }, testInfo) => {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        await testInfo.attach("axe-results", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
        expect(results.violations, JSON.stringify(results.violations.map((v) => ({
          id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })), null, 2)).toEqual([]);
      });
    }
  });
}