import { audit, captureJson, test, timedTest } from "./fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS, PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { verifyRecommendationViews } from "../e2e/recommendation-view-helpers";
import { extendedRequirementTitle } from "./inventory";
import { verifyConcretePreviews } from "../e2e/concrete-preview-helpers";
import { PAPER_BRANCHES, REQUIRED_PERSPECTIVES, runExtendedPaperBranch } from "../e2e/extended-paper-helpers";
import { runTimedCaseJourney } from "../e2e/timed-journey-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(extendedRequirementTitle("recommendation", width, enabled), async ({ page }, info) => {
    test.setTimeout(240_000);
    await verifyRecommendationViews(page, info, width, enabled);
  });

  test(extendedRequirementTitle("preview", width, enabled), async ({ page }, info) => {
    test.setTimeout(120_000);
    await verifyConcretePreviews(page, width, enabled);
    await captureJson(info, "concrete-preview-scope", {
      verifiedUi: ["dispensing date", "brand or manufacturer", "pack size", "presentation", "operator draft", "referred-back correction", "required unsupported-input invoice focus"],
      invoice: "Required safe unsupported-input variant on existing B. No extra case, new provision, supported-coverage claim or invoice amount may be invented.",
    });
  });

  test(extendedRequirementTitle("paper", width, enabled), async ({ page }, info) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const branch of PAPER_BRANCHES) for (const perspective of REQUIRED_PERSPECTIVES) {
      await test.step(`${branch}: ${perspective}`, async () => {
        await runExtendedPaperBranch(page, info, enabled, perspective, branch);
        await audit(page, info, `extended-paper-${branch}-${perspective.toLowerCase()}-${width}`, enabled, width === 1440);
      });
    }
  });

  test(extendedRequirementTitle("guided", width, enabled), async ({ page }, info) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 1000 });
    await runExtendedPaperBranch(page, info, enabled, "Both", "missing", { guided: true });
    await audit(page, info, `extended-guided-paper-${width}`, enabled, width === 1440);
  });

  timedTest(extendedRequirementTitle("transition", width, enabled), async ({ page }, info) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const item of PLAYABLE_CYCLES) for (const perspective of REQUIRED_PERSPECTIVES) {
      await test.step(`${item.id}: ${perspective}`, () => runTimedCaseJourney(page, info, item, enabled, perspective));
    }
  });
}
