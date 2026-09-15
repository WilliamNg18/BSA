import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, expect, test } from "./fixtures";
import { expectReadableScannerComparison } from "./paper-scanner-contract";

for (const width of [1280, 1440]) {
  for (const caseId of ["EX-24112", "EX-24123"]) {
    test(`paper scanner source columns remain legible and independent for ${caseId} at ${width}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/case/${caseId}`);
      const comparison = page.getByRole("region", { name: "Paper scanner comparison", exact: true });
      const header = page.getByRole("banner");
      const toggle = header.getByRole("switch", { name: /^Agent: (On|Off)$/ });
      const rawSources = () => comparison.locator("[data-paper-source]").allTextContents();
      let initial: string[] | null = null;
      for (const enabled of [false, true]) {
        await toggle.setChecked(enabled);
        await expectReadableScannerComparison(comparison);
        await expect(comparison.locator('[data-paper-source="character-recognition"]'))
          .toContainText("synthetic; illustrates what NHSBSA's capture would produce");
        const sources = await rawSources();
        if (initial) expect(sources).toEqual(initial);
        else initial = sources;
        const audit = await new AxeBuilder({ page }).include('[aria-label="Paper scanner comparison"]').analyze();
        await captureJson(info, `scanner-${caseId}-${width}-${enabled ? "on" : "off"}-axe`, audit);
        expect(audit.violations).toEqual([]);
      }
      if (caseId === "EX-24123") {
        const capture = page.getByRole("region", { name: `Type 1 capture for ${caseId}`, exact: true });
        await capture.getByRole("checkbox", {
          name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true,
        }).check();
        await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
        await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
        await expect(comparison.getByRole("region", { name: "Human-confirmed effective evidence", exact: true })).toBeVisible();
        expect(await rawSources()).toEqual(initial);
        await expectReadableScannerComparison(comparison);
      } else {
        await expect(comparison.locator('[data-paper-source="scan"]')).toContainText("Brand or manufacturer");
        await expect(comparison.locator('[data-paper-source="scan"]')).toContainText("Pack size");
        await expect(comparison.locator('[data-paper-source="scan"]')).toContainText("Explicit pharmacy amendment");
      }
      await captureCheckpoint(page, info, `scanner-${caseId}-${width}`);
    });
  }
}
