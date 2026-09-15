import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { captureJson, expect } from "./fixtures";
import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { cases, caseViewRoutes } from "../support/case-view-catalog";
import { assertVisibleRecommendation } from "./recommendation-contract-helpers";
import { enterDesktopDemo } from "./desktop-step-helpers";

export async function verifyRecommendationViews(page: Page, info: TestInfo, width: number, enabled: boolean) {
  await page.setViewportSize({ width, height: 1000 });
  let auditNumber = 0;
  const audit = async (caseId: string | null) => {
    const result = await new AxeBuilder({ page }).analyze();
    await captureJson(info, `axe-recommendation-${++auditNumber}`, {
      url: page.url(), caseId, width, enabled,
      violations: result.violations, incomplete: result.incomplete, passes: result.passes.length,
    });
    expect(result.violations).toEqual([]);
  };
  for (const item of cases) {
    for (const route of caseViewRoutes(item.id)) {
      await page.goto(route);
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await assertVisibleRecommendation(page, item.id, enabled);
      await audit(item.id);
    }
  }
  await enterDesktopDemo(page, enabled);
  for (const step of DEMO_STEPS) {
    if (step.number > 1) await page.getByTestId("demo-strip").getByRole("button", { name: "Next", exact: true }).click();
    if (step.caseId) await assertVisibleRecommendation(page, step.caseId, enabled);
    else await expect(page.getByRole("region", { name: "Recommendation", exact: true })).toHaveCount(0);
    await audit(step.caseId);
  }
}
