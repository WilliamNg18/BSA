import { test } from "./fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";
import { verifyRecommendationViews } from "../e2e/recommendation-view-helpers";
import { extendedRequirementTitle } from "./inventory";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(extendedRequirementTitle("recommendation", width, enabled), async ({ page }, info) => {
    test.setTimeout(240_000);
    await verifyRecommendationViews(page, info, width, enabled);
  });
}
