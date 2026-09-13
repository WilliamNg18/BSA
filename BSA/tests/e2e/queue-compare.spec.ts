import { expect, test } from "./fixtures";
import { PROCESS_MONTH_DEFAULTS, formatProcessHours, formatProcessItems, monthModel } from "../../src/lib/domain/baseline";

for (const enabled of [false, true]) {
  test(`Task22 shared monthly comparison is model-only and survives header mode changes, Agent ${enabled}`, async ({ page }) => {
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const model = monthModel(PROCESS_MONTH_DEFAULTS);
    const summary = page.locator("[data-queue-month-summary]");
    for (const [label, key] of [
      ["Type 2 operator hours", "type2OperatorHours"],
      ["Referred-back operator hours", "referralOperatorHours"],
      ["Pharmacy completion hours", "pharmacyCompletionHours"],
      ["Items referred back", "referredBackItems"],
    ] as const) {
      await expect(summary.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd"))
        .toHaveText(`${(key === "referredBackItems" ? formatProcessItems : formatProcessHours)(model.today[key])} / ${(key === "referredBackItems" ? formatProcessItems : formatProcessHours)(model.withAgent[key])}`);
    }
    await expect(page.locator("[data-auto-priced-count]"))
      .toHaveText(`${formatProcessItems(model.counts.autoPricedItems)} priced automatically this month, no person involved`);
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
