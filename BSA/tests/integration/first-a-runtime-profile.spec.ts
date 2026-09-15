import { test } from "../live/fixtures";
import { runTimedCaseJourney } from "../e2e/timed-journey-helpers";
import { PLAYABLE_CYCLES } from "../support/desktop-matrix";

test("Runtime profile: first A only, 1280 px, Agent On, Both, not acceptance", async ({ page }, info) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await runTimedCaseJourney(page, info, PLAYABLE_CYCLES[0], true, "Both");
});
