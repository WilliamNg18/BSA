import { test } from "../e2e/fixtures";
import { verifyRecommendationViews } from "../e2e/recommendation-view-helpers";
import { verifyConcretePreviews } from "../e2e/concrete-preview-helpers";
import { runExtendedPaperBranch } from "../e2e/extended-paper-helpers";
import { runTimedCaseJourney } from "../e2e/timed-journey-helpers";
import { PLAYABLE_CYCLES } from "../support/desktop-matrix";

test("Req38 smoke: visible item recommendations, On, 1440", async ({ page }, info) => {
  await verifyRecommendationViews(page, info, 1440, true);
});
test("Req38 smoke: concrete previews and safe invoice focus, On, 1440", async ({ page }) => {
  await verifyConcretePreviews(page, 1440, true);
});
test("Req38 smoke: missing paper complete round trip, Both, On", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await runExtendedPaperBranch(page, info, true, "Both", "missing");
});
test("Req38 smoke: actual B one-second actions, Both, On", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const item = PLAYABLE_CYCLES.find((entry) => entry.id === "EX-24112");
  if (!item) throw new Error("The B timing fixture must remain one of the four playable cases.");
  await runTimedCaseJourney(page, info, item, true, "Both");
});
