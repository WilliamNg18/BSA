import AxeBuilder from "@axe-core/playwright";
import { test, expect, confirmReset, captureJson, captureCheckpoint } from "./fixtures";
import { choosePerspective } from "./perspective-helpers";
import { expandProcessInputs, expectProcessMetrics } from "./process-model-helpers";
import { EPS_ERROR_EVIDENCE, EPS_MISMATCH_ESTIMATE } from "../../src/lib/domain/eps-error-evidence";

for (const width of [1280, 1440]) {
  test.describe(`Task39 optional numbers ${width}`, () => {
    test.use({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });

    test("study provenance and optional comparison agree across both modes and every perspective", async ({ page }, info) => {
      await page.goto("/#scene");
      await expect(page.locator("[data-dispensing-error-study]")).toContainText(EPS_ERROR_EVIDENCE.study.chapterOneLine);
      await expect(page.locator("[data-dispensing-error-study]")).toContainText(EPS_ERROR_EVIDENCE.study.label);
      await expect(page.locator("[data-dispensing-error-study]")).not.toContainText("wrong strength among the most reported");
      await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
      const optional = page.locator("[data-mismatch-estimate]");
      await expect(optional).not.toHaveAttribute("open", "");
      await optional.locator("summary").click();
      const share = page.getByRole("textbox", { name: `${EPS_MISMATCH_ESTIMATE.inputLabel} (%)`, exact: true });
      await expect(share).toHaveValue("1");
      for (const perspective of ["Both", "Pharmacy", "NHSBSA"] as const) {
        await choosePerspective(page, perspective);
        for (const enabled of [false, true]) {
          await page.getByRole("banner").getByRole("switch").setChecked(enabled);
          await expect(optional.locator("[data-mismatch-today]")).toHaveText("none");
          await expect(optional.locator("[data-mismatch-with]")).toHaveText("1,000,000 (estimate)");
          await expect(optional).toContainText(EPS_MISMATCH_ESTIMATE.todayBasis);
          await expect(optional).toContainText("Separate, non-additive estimate");
          await expect(page.locator('[data-process-metric="withAgent-operatorHours"]')).toHaveText("297.5estimate");
          await expect(page.locator('[data-process-metric="withAgent-referredBackItems"]')).toHaveText("5,100estimate");
        }
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const audit = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "optional-mismatch-axe", audit);
      expect(audit.violations).toEqual([]);
      if (width === 1440) await captureCheckpoint(page, info, "optional-mismatch-estimate");
    });

    test("edits use submitted volume, invalid drafts never leak stale estimates, and Reset restores the assumption", async ({ page }) => {
      await page.goto("/#month");
      const optional = page.locator("[data-mismatch-estimate]");
      await optional.locator("summary").click();
      const share = optional.getByRole("textbox");
      await share.fill("2.5");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("2,500,000 (estimate)");
      await expectProcessMetrics(page);
      await expandProcessInputs(page);
      await page.locator("#process-monthlyItems").fill("120000000");
      await expect(optional.locator("[data-mismatch-volume]")).toContainText("120,000,000");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("3,000,000 (estimate)");
      await page.locator("#process-manualLoopItems").fill("42");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("3,000,000 (estimate)");
      await share.fill("0");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("0 (estimate)");
      await share.fill("100");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("120,000,000 (estimate)");
      await share.fill(".00000000001");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("1.2E-5 (estimate)");
      for (const invalid of ["", "-1", "100.00000000000000001", "1e2"]) {
        await share.fill(invalid);
        await expect(share).toHaveAttribute("aria-invalid", "true");
        await expect(optional.locator("[data-mismatch-with]")).toHaveCount(0);
        await expect(optional).toContainText("Mismatch estimate unavailable");
        await expect(page.locator('[data-process-metric="withAgent-operatorHours"]')).toBeVisible();
      }
      await share.fill("1");
      await page.locator("#process-monthlyItems").fill("");
      await expect(optional.locator("[data-mismatch-with]")).toHaveCount(0);
      await expect(optional).toContainText("Correct the shared monthly inputs");
      await confirmReset(page);
      if (await optional.getAttribute("open") === null) await optional.locator("summary").click();
      await expect(share).toHaveValue("1");
      await expect(optional.locator("[data-mismatch-with]")).toHaveText("1,000,000 (estimate)");
      await expectProcessMetrics(page);
    });
  });
}
