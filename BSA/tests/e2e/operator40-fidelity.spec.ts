import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

for (const width of [1280, 1440]) {
  test(`Task40 explicit later audit retains the exact submitted EPS message at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24107");
    const source = page.locator("[data-submitted-record]");
    await source.locator("summary").click();
    await expect(source.locator("pre")).toBeVisible();
    const original = await source.locator("pre").innerText();
    const audit = page.getByRole("region", { name: "Later audit or query", exact: true });
    await expect(audit.getByRole("button", { name: "Open later audit or query", exact: true })).toBeDisabled();
    await audit.getByRole("textbox", { name: "Audit or later-query reason (at least eight characters)", exact: true })
      .fill("Later query requires comparison with the original submitted record.");
    await audit.getByRole("button", { name: "Open later audit or query", exact: true }).click();
    await expect(page.getByRole("region", { name: "Operator decision", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refer back", exact: true })).toBeVisible();
    await expect(audit).toHaveCount(0);
    await expect(source.locator("pre")).toHaveText(original);
    await expect(page.getByRole("region", { name: "Shared case history", exact: true }))
      .toContainText("Operator opened a later audit or query");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test(`Task40 ready paper uses its actual prepared decision and one operator Release at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24112");
    const source = page.locator("[data-submitted-record]");
    await source.locator("summary").click();
    const original = await source.locator("pre").innerText();
    const panel = page.getByRole("region", { name: "Operator decision", exact: true });
    await expect(panel).toContainText("Resubmitted, ready to release");
    await expect(panel.getByRole("textbox", { name: "Reason (required)", exact: true })).not.toHaveValue("");
    await expect(panel.getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    const release = panel.getByRole("button", { name: "Release to pricing", exact: true });
    await expect(release).toBeEnabled();
    await release.click();
    const record = page.getByRole("region", { name: "Release record", exact: true });
    await expect(record).toBeVisible();
    await expect(record.getByRole("term").filter({ hasText: /^Released by$/ }).locator("+ dd")).toHaveText("operator");
    await expect(record).not.toHaveAttribute("data-automatic-case");
    await expect(page.getByRole("button", { name: "Release to pricing", exact: true })).toHaveCount(0);
    await expect(source.locator("pre")).toHaveText(original);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
