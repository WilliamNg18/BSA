import { audit, test } from "./fixtures";
import { perspectiveRoundTrips } from "../e2e/perspective-helpers";
import { LIVE_CHECKS } from "./inventory";

test(LIVE_CHECKS.perspective, async ({ page }, info) => {
  await perspectiveRoundTrips(page, info);
  await audit(page, info, "perspective-round-trip", true);
});
