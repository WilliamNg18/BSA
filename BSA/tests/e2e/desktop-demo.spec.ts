import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { assertDesktopHeader, enterDesktopDemo, walkDesktopSteps } from "./desktop-step-helpers";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(`desktop demo: eleven steps Back/Next, no extraneous controls, zero axe, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await enterDesktopDemo(page, enabled);
    await walkDesktopSteps(page, enabled, async (number, direction) => {
      await assertDesktopHeader(page, width);
      if (direction === "next") {
        const result = await new AxeBuilder({ page }).analyze();
        await captureJson(info, `step-${number}-axe`, {
          number, width, enabled, violations: result.violations, incomplete: result.incomplete,
          passes: result.passes.length,
        });
        expect(result.violations).toEqual([]);
      }
    });
  });
}
