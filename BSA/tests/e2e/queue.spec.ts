import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { automaticCaseIds, captureJson, confirmReset, expect, test } from "./fixtures";

const worklist = (page: Page) => page.getByRole("region", { name: "Type 2 worklist", exact: true });
const captureLane = (page: Page) => page.getByRole("region", { name: "Type 1 capture lane", exact: true });
const counts = (page: Page) => page.getByRole("region", { name: "Actual session work counts", exact: true });
const modeLabels = {
  off: ["Type 1 capture lane", "Type 2 worklist", "Referred back", "Decided"],
  on: ["Type 1 capture lane", "Type 2 worklist", "Referred back", "Decided"],
};
const rowIds = async (page: Page) => page.locator("[data-case-id], [data-type1-case]").evaluateAll((rows) =>
  rows.map((row) => row.getAttribute("data-case-id") ?? row.getAttribute("data-type1-case")).sort());

for (const enabled of [false, true]) {
  test(`Task22 actual staff lanes exclude all automatic items, Agent ${enabled}`, async ({ page }) => {
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect(worklist(page).locator("thead th")).toHaveText([
      "Reference", "Pharmacy", "Channel", "State", "Reason it is here", "Advice and record", "Open",
    ]);
    for (const id of [...automaticCaseIds, "EX-24098"]) {
      await expect(page.locator(`[data-case-id="${id}"], [data-type1-case="${id}"]`)).toHaveCount(0);
    }
    for (const id of ["EX-24119", "SYN-FQ123-TYPE2", "SYN-FQ123-RECHECK"]) await expect(worklist(page).locator(`[data-case-id="${id}"]`)).toBeVisible();
    await expect(page.getByRole("region", { name: "Referred back", exact: true }).locator('[data-case-id="EX-24112"]')).toBeVisible();
    await expect(page.getByRole("region", { name: "Decided", exact: true }).locator('[data-case-id="EX-24088"]')).toBeVisible();
    await expect(captureLane(page).locator('[data-type1-case="EX-24123"]')).toBeVisible();
    await expect(worklist(page).locator('[data-case-id="EX-24123"]')).toHaveCount(0);
    await expect(page.locator("[data-month-row], [data-queue-seed], [data-compare-seed]")).toHaveCount(0);
    for (const name of ["Compare", "Run one hour", "Run to end of day", "Next 50", "Jump"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
    await expect(page.getByRole("region", { name: "Automatic pricing monthly aggregate", exact: true }))
      .toContainText("Whole-service context, not session completions or a projection of this pharmacy's activity.");
    await expect(page.locator("[data-queue-month-summary]")).toContainText("Rule-record coverage is a synthetic comparison assumption, not evidence of real staff records or a retrieved clause on every case.");
    const ids = await rowIds(page);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    await page.getByRole("banner").getByRole("switch").setChecked(!enabled);
    expect(await rowIds(page), "Agent mode cannot move items between authoritative capture and work streams").toEqual(ids);
  });

  test(`Task22 every counted filter matches actual rendered work, Agent ${enabled}`, async ({ page }) => {
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const initial = await rowIds(page);
    const labels = modeLabels[enabled ? "on" : "off"];
    let total = 0;
    for (const label of labels) {
      const tile = counts(page).getByRole("button").filter({ has: page.locator("span").filter({ hasText: new RegExp(`^${label.replace(/[()]/g, "\\$&")}$`) }) });
      const count = Number(await tile.locator("span").last().innerText());
      expect(Number.isInteger(count)).toBe(true);
      total += count;
      await tile.click();
      await expect(tile).toHaveAttribute("aria-pressed", "true");
      expect((await rowIds(page)).length, label).toBe(count);
      if (!count) await expect(page.getByRole("region", { name: label, exact: true }).getByRole("status")).toBeVisible();
    }
    expect(total).toBe(initial.length);
    await counts(page).getByRole("button", { name: /^All staff items/ }).click();
    expect(await rowIds(page)).toEqual(initial);
    const fresh = counts(page).getByRole("button", { name: "New submissions (2)", exact: true });
    await fresh.click();
    await expect(fresh).toHaveAttribute("aria-pressed", "true");
    expect(await rowIds(page)).toEqual(["EX-24088", "SYN-FQ123-RECHECK"]);
    await confirmReset(page);
    await expect(counts(page).getByRole("button", { name: /^All staff items/ })).toHaveAttribute("aria-pressed", "true");
    expect(await rowIds(page)).toEqual(initial);
  });
}

test("Task22 an explicit incomplete submission becomes New and opens the same case before human review", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "Open shared queue", exact: true }).click();
  const fresh = counts(page).getByRole("button", { name: "New submissions (3)", exact: true });
  await fresh.click();
  const row = worklist(page).locator('[data-case-id="EX-24112"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText("New submission");
  await expect(row).toContainText("EPS");
  expect(await rowIds(page)).toEqual(["EX-24088", "EX-24112", "SYN-FQ123-RECHECK"]);
  await row.getByRole("link", { name: "Open EX-24112", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112$/);
  await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toBeVisible();
});

for (const width of [360, 1440]) for (const colorScheme of ["light", "dark"] as const) for (const enabled of [false, true]) {
  test(`Task22 staff lanes and capture controls axe ${width} ${colorScheme} agent=${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("queue");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect(worklist(page).getByRole("heading", { name: "Type 2 worklist", exact: true })).toBeVisible();
    await expect(captureLane(page).getByRole("heading", { name: "Type 1 capture lane", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "staff-lanes-axe", audit);
    expect(audit.violations).toEqual([]);
    const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
    await capture.getByRole("textbox", { name: "Product code", exact: true }).focus();
    await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toBeFocused();
    await page.screenshot({ path: info.outputPath(`staff-lanes-${width}-${colorScheme}-${enabled}.png`), fullPage: true });
  });
}
