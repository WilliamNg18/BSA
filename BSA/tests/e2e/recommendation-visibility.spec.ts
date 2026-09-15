import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { DEMO_MODES, DESKTOP_WIDTHS, PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { assertVisibleRecommendation } from "./recommendation-contract-helpers";
import { enterDesktopDemo } from "./desktop-step-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(`recommendations: every actual item view and demo step, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height: 1000 });
    const audits: { url: string; caseId: string | null; violations: unknown[]; incomplete: unknown[] }[] = [];
    for (const item of PLAYABLE_CYCLES) {
      for (const route of [
        `/pharmacy?case=${item.id}&channel=${item.channel}`,
        `/pharmacy/claims?caseId=${item.id}`,
        `/case/${item.id}`, `/case/${item.id}/trace`, `/case/${item.id}/record`,
      ]) {
        await page.goto(route);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await assertVisibleRecommendation(page, item.id, enabled);
        const result = await new AxeBuilder({ page }).analyze();
        audits.push({ url: page.url(), caseId: item.id, violations: result.violations, incomplete: result.incomplete });
        expect(result.violations).toEqual([]);
      }
    }
    await enterDesktopDemo(page, enabled);
    for (const step of DEMO_STEPS) {
      if (step.number > 1) await page.getByTestId("demo-strip").getByRole("button", { name: "Next", exact: true }).click();
      if (step.caseId) await assertVisibleRecommendation(page, step.caseId, enabled);
      else await expect(page.getByRole("region", { name: "Recommendation", exact: true })).toHaveCount(0);
      const result = await new AxeBuilder({ page }).analyze();
      audits.push({ url: page.url(), caseId: step.caseId, violations: result.violations, incomplete: result.incomplete });
      expect(result.violations).toEqual([]);
    }
    await captureJson(info, "recommendation-visibility-and-axe", { width, enabled, audits, imageReview: "not performed by this test" });
  });
}
