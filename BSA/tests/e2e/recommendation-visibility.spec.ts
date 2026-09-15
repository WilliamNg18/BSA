import { test } from "./fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";
import { verifyRecommendationViews } from "./recommendation-view-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(`recommendations: every actual item view and demo step, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(240_000);
    await verifyRecommendationViews(page, info, width, enabled);
  });
}
