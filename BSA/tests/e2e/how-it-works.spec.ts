import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { DESIGN_LABELS, DESIGN_SECTIONS, DESIGN_TITLE } from "../../src/components/how-it-works/content";

for (const width of [1280, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Task37 reference sections, labels, diagrams and axe ${width} ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      const response = await page.goto("/architecture");
      expect(response?.headers()["content-security-policy"]).toContain("script-src 'self'");
      await expect(page.getByRole("heading", { level: 1, name: DESIGN_TITLE })).toBeVisible();
      const reference = page.locator("[data-system-design]");
      await expect(reference.locator("[data-design-section]")).toHaveCount(10);
      for (const section of DESIGN_SECTIONS) {
        await expect(reference.locator(`[data-design-section="${section.id}"]`)).toContainText(DESIGN_LABELS[section.status]);
      }
      const mapping = reference.locator("table[data-reference-mapping]");
      await expect(mapping).toHaveCount(1);
      await expect(mapping).toContainText("Reference mapping, one example");
      const otherCopy = await reference.evaluate((node) => {
        const copy = node.cloneNode(true) as HTMLElement;
        copy.querySelector("table[data-reference-mapping]")?.remove();
        return copy.textContent;
      });
      expect(otherCopy).not.toMatch(/\b(Azure|Microsoft|OpenAI|Foundry|Cosmos|Entra)\b/u);
      await expect(reference.getByRole("img")).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const prose = await reference.locator("[data-design-prose]").allTextContents();
      await captureJson(testInfo, "task37-prose-informational", prose.map((text) => ({ text, words: text.trim().split(/\s+/u).length })));
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(testInfo, "task37-axe", audit);
      expect(audit.violations).toEqual([]);
    });
  }

  test(`Task37 keyboard contents navigate and focus each section ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/architecture");
    const nav = page.getByRole("navigation", { name: "How it works contents" });
    for (const id of [...DESIGN_SECTIONS.map((section) => section.id), "reference-mapping"]) {
      const link = nav.locator(`a[href="#${id}"]`);
      await link.focus();
      await link.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/architecture#${id}$`));
      await expect(page.locator(`h2#${id}`)).toBeFocused();
      await expect(page.locator(`h2#${id}`)).toBeInViewport();
      const headingTop = await page.locator(`h2#${id}`).evaluate((node) => node.getBoundingClientRect().top);
      const chromeHeight = await page.evaluate(() => Number.parseFloat(document.documentElement.style.scrollPaddingTop) || 0);
      expect(headingTop, "Anchor heading must remain below the sticky application chrome").toBeGreaterThanOrEqual(chromeHeight);
    }
  });
}
