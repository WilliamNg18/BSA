import { timedTest as test } from "./fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS, PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { REQUIRED_PERSPECTIVES } from "./extended-paper-helpers";
import { runTimedCaseJourney } from "./timed-journey-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(`all four cases visibly cross sides within one second, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const item of PLAYABLE_CYCLES) for (const perspective of REQUIRED_PERSPECTIVES) {
      await test.step(`${item.id}: ${perspective}`, () => runTimedCaseJourney(page, info, item, enabled, perspective));
    }
  });
}
