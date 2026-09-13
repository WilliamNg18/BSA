import { expect, test } from "./fixtures";
import { MANUAL_LOOP_MONTH_DEFAULTS, formatProcessItems, monthModel } from "../../src/lib/domain/baseline";
import { MANUAL_LOOP_METRICS } from "../../src/lib/domain/manual-loop-presentation";

for (const enabled of [false, true]) {
  test(`Task22 shared monthly comparison is model-only and survives header mode changes, Agent ${enabled}`, async ({ page }) => {
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const model = monthModel(MANUAL_LOOP_MONTH_DEFAULTS);
    const summary = page.getByRole("region", { name: "Shared monthly model", exact: true });
    for (const { key, label, format } of MANUAL_LOOP_METRICS) {
      await expect(summary.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd"))
        .toHaveText(`${format(model.today[key])} / ${format(model.withAgent[key])} (estimate)`);
    }
    await expect(page.locator("[data-auto-priced-count]"))
      .toHaveText(`Priced automatically this month, no person involved: ${formatProcessItems(model.counts.autoPricedItems)}${enabled ? " (estimate)" : ""}`);
    const before = await summary.innerText();
    const ids = await page.locator("[data-case-id], [data-type1-case]").evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-case-id") ?? row.getAttribute("data-type1-case")));
    await page.getByRole("banner").getByRole("switch").setChecked(!enabled);
    await expect(summary).toHaveText(before, { useInnerText: true });
    expect(await page.locator("[data-case-id], [data-type1-case]").evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-case-id") ?? row.getAttribute("data-type1-case")))).toEqual(ids);
    await expect(page.getByRole("button", { name: "Compare", exact: true })).toHaveCount(0);
    await expect(page.locator("[data-comparison-clock], [data-compare-seed]")).toHaveCount(0);
  });
}
