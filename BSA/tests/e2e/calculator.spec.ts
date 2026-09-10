import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { BASELINE_DEFAULTS } from "../../src/lib/domain/baseline-defaults";
import { BASELINE_FIELDS, baselineSummary, calculateBaseline } from "../../src/lib/domain/baseline";

test("calculator live edits, flag, route persistence, history, reset and rail", async ({ page }) => {
  await page.goto("./#month");
  const summary = page.locator("[data-baseline-summary]");
  await expect(summary).toHaveText(baselineSummary(calculateBaseline(BASELINE_DEFAULTS), true));
  await page.getByLabel("Monthly volume proxy", { exact: true }).fill("12");
  await page.getByLabel("Gathering minutes / item", { exact: true }).fill("3.5");
  const edited = { ...BASELINE_DEFAULTS, volume: 12, gatheringMinutes: 3.5 };
  await expect(summary).toHaveText(baselineSummary(calculateBaseline(edited), true));
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await expect(summary).toHaveText(baselineSummary(calculateBaseline(edited), false));
  await expect(page.locator("[data-cohort]")).toHaveCount(0);
  await expect(page.locator("[data-baseline-today]")).toHaveClass(/ring-2/);
  await page.getByText("Calculator assumptions, sources and formula", { exact: true }).click();
  await page.getByRole("link", { name: "Open assumptions register" }).click();
  await page.getByText("Calculator assumptions, sources and formula", { exact: true }).click();
  await expect(page.getByRole("list", { name: "Calculator defaults and current inputs" })).toContainText("Current: 3.5");
  await page.getByRole("link", { name: "Return to calculator" }).click();
  await expect(page.getByLabel("Monthly volume proxy", { exact: true })).toHaveValue("12");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-cohort]")).toHaveText(["2", "2", "2", "6"]);
  // Calculator editing never appends or replaces historical human records.
  await navigatePrimary(page, "Exception queue");
  await page.locator('a[href="/BSA/case/EX-24088"]').first().click();
  await page.locator('a[href="/BSA/case/EX-24088/record"]').first().click();
  await expect(page.getByRole("main")).toContainText("DR-000871");
  await navigatePrimary(page, "Overview");
  await page.getByRole("navigation", { name: "Guided tour" }).getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Gathering minutes / item", { exact: true })).toHaveValue("3.5");
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Keep working" }).click();
  await expect(page.getByLabel("Monthly volume proxy", { exact: true })).toHaveValue("12");
  await confirmReset(page);
  await expect(page).toHaveURL(/#month$/);
  await expect(page.getByRole("banner").getByRole("switch")).toBeChecked();
  for (const { key, label } of BASELINE_FIELDS) await expect(page.getByLabel(label, { exact: true })).toHaveValue(String(BASELINE_DEFAULTS[key]));
  const rail = page.getByRole("navigation", { name: "Guided tour" });
  await rail.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/#cases$/);
  await rail.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/#month$/);
});

test("invalid input is retained, labelled and suppresses results; zero and 100% work", async ({ page }) => {
  await page.goto("./#month");
  for (const { key, label, max } of BASELINE_FIELDS) {
    const field = page.getByLabel(label, { exact: true });
    for (const value of ["", "-1", "NaN", "Infinity", "1e309", String(max + 1)]) {
      await field.fill(value);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("[data-baseline-today]")).toHaveCount(0);
      await expect(page.locator("[data-baseline-summary]")).toContainText("unavailable");
    }
    await field.fill(String(BASELINE_DEFAULTS[key]));
    await expect(field).toHaveAttribute("aria-invalid", "false");
  }
  const volume = page.getByLabel("Monthly volume proxy", { exact: true });
  await volume.fill("1.5");
  await expect(volume).toHaveAttribute("aria-invalid", "true");
  await volume.fill("");
  await navigatePrimary(page, "Assumptions");
  await page.getByText("Calculator assumptions, sources and formula", { exact: true }).click();
  await page.getByRole("link", { name: "Return to calculator" }).click();
  await expect(volume).toHaveValue("");
  await volume.fill("0");
  await expect(page.locator("[data-cohort]")).toHaveText(["0", "0", "0", "0"]);
  for (const label of ["Gathering minutes / item", "Judging minutes / item"]) await page.getByLabel(label, { exact: true }).fill("0");
  await expect(page.locator("[data-baseline-today]")).toContainText("0 operator hours");
  await volume.fill("1000000000");
  await page.getByLabel("Pharmacy pre-check %", { exact: true }).fill("100");
  await expect(page.locator("[data-cohort]")).toHaveText(["1,000,000,000", "0", "0", "0"]);
  await page.getByLabel("Pharmacy pre-check %", { exact: true }).focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/#month$/);
  // Router home links omit the base's trailing slash. Vite preview does not
  // serve /BSA itself; test reload at the supported production entry /BSA/.
  await page.goto("./#month");
  await volume.fill("42");
  await page.reload();
  await expect(volume).toHaveValue("85000");
});

for (const { key, label, max, integer } of BASELINE_FIELDS) {
  test(`exact decimal boundary validation: ${key}`, async ({ page }) => {
    await page.goto("./#month");
    const field = page.getByLabel(label, { exact: true });
    for (const raw of [`${max}.00000000000000001`, `000${max}.${"0".repeat(400)}1`]) {
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveAccessibleDescription(new RegExp(`Enter ${integer ? "a whole number" : "a number"} from 0 to`));
      await expect(page.locator("[data-baseline-today], [data-baseline-with], [data-cohort]")).toHaveCount(0);
      await expect(page.locator("[data-baseline-summary]")).toContainText("unavailable");
    }
    for (const raw of [String(max), ...(integer ? [] : [`${max}.00000000000000000`, `${max - 1}.99999999999999999`, "60.00000000000000001"])]) {
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await expect(field).toHaveAttribute("aria-invalid", "false");
      await expect(page.locator("[data-baseline-today]")).toBeVisible();
    }
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 360, 768, 960, 1024, 1440]) {
    test.describe(`long calculator disclosure ${colorScheme} ${width}`, () => {
      test.use({ colorScheme, viewport: { width, height: 1000 } });
      test("all raw fields remain invalid and both expanded disclosures reflow", async ({ page }, testInfo) => {
        await page.goto("./#month");
        const raw = "9".repeat(400);
        for (const { key, label } of BASELINE_FIELDS) {
          const field = page.getByLabel(label, { exact: true });
          await field.fill(raw);
          await expect(field).toHaveValue(raw);
          await expect(field).toHaveAttribute("aria-invalid", "true");
          await expect(field).toHaveAttribute("aria-describedby", new RegExp(`baseline-${key}-error`));
          await expect(page.locator(`#baseline-${key}-error`)).toBeVisible();
        }
        await expect(page.locator("[data-baseline-today], [data-cohort]")).toHaveCount(0);
        for (const surface of ["calculator", "register"]) {
          const disclosure = page.locator("[data-baseline-assumptions]");
          await disclosure.locator("summary").first().click();
          await expect(disclosure).toHaveAttribute("open", "");
          await disclosure.getByText("Calculator documentary sources", { exact: true }).click();
          await expect(disclosure.locator('[data-claim-id="O23"]')).toBeVisible();
          for (const { key } of BASELINE_FIELDS) {
            const current = disclosure.locator(`[data-current-input="${key}"]`);
            await expect(current).toContainText("display shortened; 400 characters");
            expect((await current.textContent())!.length).toBeLessThan(200);
          }
          await page.evaluate(() => document.fonts.ready);
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          const reflow = await disclosure.evaluate((element) => ({
            viewport: innerWidth,
            pageWidth: document.documentElement.scrollWidth,
            overflow: element.scrollWidth - element.clientWidth,
            right: element.getBoundingClientRect().right,
            left: element.getBoundingClientRect().left,
          }));
          expect(reflow.overflow).toBeLessThanOrEqual(1);
          expect(reflow.left).toBeGreaterThanOrEqual(0);
          expect(reflow.right).toBeLessThanOrEqual(width);
          await captureJson(testInfo, `reflow-${surface}`, reflow);
          await captureCheckpoint(page, testInfo, `long-input-${surface}`);
          if (surface === "calculator") await page.getByRole("link", { name: "Open assumptions register" }).click();
        }
        await page.getByRole("link", { name: "Return to calculator" }).click();
        for (const { label } of BASELINE_FIELDS) {
          const field = page.getByLabel(label, { exact: true });
          await expect(field).toHaveValue(raw);
          await expect(field).toHaveAttribute("aria-invalid", "true");
        }
        await expect(page.locator("[data-baseline-today], [data-cohort]")).toHaveCount(0);
        await confirmReset(page);
        for (const { key, label } of BASELINE_FIELDS) await expect(page.getByLabel(label, { exact: true })).toHaveValue(String(BASELINE_DEFAULTS[key]));
        await expect(page.locator("[data-baseline-summary]")).toHaveText(baselineSummary(calculateBaseline(BASELINE_DEFAULTS), true));
      });
    });
  }
  for (const enabled of [true, false]) {
    test.describe(`calculator ${colorScheme} ${enabled ? "on" : "off"}`, () => {
      test.use({ colorScheme, viewport: { width: 1440, height: 1000 } });
      test("expanded provenance and invalid inputs pass axe; selected responsive captures", async ({ page }, testInfo) => {
        await page.goto("./#month");
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        for (const width of [1440, 360]) {
          await page.setViewportSize({ width, height: 1000 });
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          await page.screenshot({ path: `docs/qa/calculator/month-${width}-${colorScheme}-${enabled ? "on" : "off"}.png`, fullPage: true });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByText("Calculator assumptions, sources and formula", { exact: true }).click();
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/12");
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/10");
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/8");
        await page.getByText("Calculator documentary sources", { exact: true }).click();
        await expect(page.locator('[data-claim-id="O23"]')).toContainText("Community Pharmacy England");
        await expect(page.locator('[data-claim-id="O23"]')).toContainText("P0694–P0695");
        for (const invalid of [false, true]) {
          if (invalid) await page.getByLabel("Gathering minutes / item", { exact: true }).fill("");
          const results = await new AxeBuilder({ page }).analyze();
          await captureJson(testInfo, `axe-expanded-invalid-${invalid}`, results);
          expect(results.violations).toEqual([]);
        }
      });
    });
  }
}