import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";
import { PAPER_BRANCHES, REQUIRED_PERSPECTIVES, runExtendedPaperBranch } from "./extended-paper-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(`extended paper branches and human-only release, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const branch of PAPER_BRANCHES) for (const perspective of REQUIRED_PERSPECTIVES) {
      await test.step(`${branch}: ${perspective}`, async () => {
        await runExtendedPaperBranch(page, info, enabled, perspective, branch);
        const result = await new AxeBuilder({ page }).analyze();
        await captureJson(info, `axe-paper-${branch}-${perspective.toLowerCase()}`, {
          width, enabled, branch, perspective, url: page.url(), violations: result.violations, incomplete: result.incomplete,
        });
        expect(result.violations).toEqual([]);
      });
    }
  });

  test(`extended guided paper story through steps seven to ten, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 1000 });
    await runExtendedPaperBranch(page, info, enabled, "Both", "missing", { guided: true });
    const result = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "axe-guided-paper", { width, enabled, url: page.url(), violations: result.violations, incomplete: result.incomplete });
    expect(result.violations).toEqual([]);
  });
}
