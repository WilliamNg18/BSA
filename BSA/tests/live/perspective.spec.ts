import { audit, test } from "./fixtures";
import { perspectiveRoundTrips } from "../e2e/perspective-helpers";

test("14 Perspectives preserve the same submitted item and human decision Off then On without Reset", async ({ page }, info) => {
  await perspectiveRoundTrips(page, info);
  await audit(page, info, "perspective-round-trip", true);
});
