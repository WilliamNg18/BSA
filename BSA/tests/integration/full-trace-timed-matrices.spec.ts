import { test } from "../live/fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS, PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { extendedRequirementTitle } from "../live/inventory";
import { REQUIRED_PERSPECTIVES } from "../e2e/extended-paper-helpers";
import { runTimedCaseJourney } from "../e2e/timed-journey-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(extendedRequirementTitle("transition", width, enabled), async ({ page }, info) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const item of PLAYABLE_CYCLES) for (const perspective of REQUIRED_PERSPECTIVES) {
      await test.step(`${item.id}: ${perspective}`, () => runTimedCaseJourney(page, info, item, enabled, perspective));
    }
  });
}
