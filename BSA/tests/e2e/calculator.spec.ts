import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { BASELINE_DEFAULTS, BASELINE_FIELDS, GATHERING_STEPS, baselineSummary, calculateBaseline, formatBaselineNumber as n } from "../../src/lib/domain/baseline";

async function expandSteps(page: Page) {
  const disclosure = page.locator("[data-gathering-breakdown]");
  if (await disclosure.getAttribute("open") === null) await disclosure.locator("summary").click();
}

test("all seven live steps, review, judging and deficiency edits drive the same scene model", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-gathering-breakdown]")).not.toHaveAttribute("open", "");
  await expandSteps(page);
  const edited = { ...BASELINE_DEFAULTS, volume: 120 };
  await page.getByLabel("Monthly volume proxy", { exact: true }).fill("120");
  for (const { key, label } of GATHERING_STEPS) {
    edited[key] += 1;
    await page.getByLabel(label, { exact: true }).fill(String(edited[key]));
    const result = calculateBaseline(edited);
    await expect(page.locator("[data-gathering-total]")).toContainText(`${n(result.manualGatheringMinutes, 1)} minutes`);
    await expect(page.locator("[data-baseline-today] dl > div").filter({ has: page.locator("dt", { hasText: /^Gathering$/ }) })).toHaveText(`Gathering${n(result.today.gatheringMinutes / 60, 1)} hours`);
    await expect(page.locator("[data-baseline-with] dl > div").filter({ has: page.locator("dt", { hasText: /^Gathering$/ }) })).toHaveText(`Gathering${n(result.withAgent.gatheringMinutes / 60, 1)} hours`);
    await navigatePrimary(page, "Overview");
    await expect(page.locator("[data-scene-volume]")).toHaveText("120");
    await expect(page.locator("[data-scene-gathering]")).toHaveText(n(result.today.gatheringMinutes / 60, 1));
    await expect(page.locator("[data-scene-with-gathering]")).toHaveText(n(result.withAgent.gatheringMinutes / 60, 1));
    await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
    await expandSteps(page);
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(String(edited[key]));
  }
  for (const { key, label, value } of [
    { key: "builtReviewMinutes", label: "Built case review minutes / item", value: 2.5 },
    { key: "judgingMinutes", label: "Judging minutes / item", value: 3.5 },
    { key: "deficientBuiltPercent", label: "Deficient built share %", value: 75 },
    { key: "deficientAbstainPercent", label: "Deficient abstained share %", value: 100 },
  ] as const) {
    edited[key] = value;
    await page.getByLabel(label, { exact: true }).fill(String(value));
    const result = calculateBaseline(edited);
    await expect(page.locator("[data-referrals-today]")).toHaveText("120");
    await expect(page.locator("[data-referrals-with]")).toHaveText(String(result.referrals.withAgent));
    for (const side of ["today", "with"]) {
      await expect(page.locator(`[data-baseline-${side}] dl > div`).filter({ has: page.locator("dt", { hasText: /^Judging$/ }) })).toHaveText(`Judging${n(result.today.judgingMinutes / 60, 1)} hours`);
    }
    await navigatePrimary(page, "Overview");
    await expect(page.locator("[data-scene-judging]")).toHaveText(n(result.today.judgingMinutes / 60, 1));
    await expect(page.locator("[data-scene-with-gathering]")).toHaveText(n(result.withAgent.gatheringMinutes / 60, 1));
    await expect(page.locator("[data-scene-referrals]")).toHaveText(String(result.referrals.withAgent));
    await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
  }
  await captureJson(testInfo, "shared-scenario", { inputs: edited, result: calculateBaseline(edited) });
  console.info("Advisory word count / budget 25:", (await page.locator("[data-baseline-summary]").innerText()).split(/\s+/).length);
  await page.getByLabel("Built case review minutes / item", { exact: true }).fill("");
  await navigatePrimary(page, "Overview");
  await expect(page.locator("[data-scene-estimates]")).toContainText("unavailable");
  await expect(page.locator("[data-scene-gathering]")).toHaveCount(0);
  await confirmReset(page);
  const defaults = calculateBaseline(BASELINE_DEFAULTS);
  await expect(page.locator("[data-scene-gathering]")).toHaveText(n(defaults.today.gatheringMinutes / 60, 1));
});

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 360, 768, 1024, 1440]) {
    test.describe(`proportional flow ${colorScheme} ${width}`, () => {
      test.use({ colorScheme, viewport: { width, height: 1000 } });
      test("accessible four-cohort ribbons conserve width including empty paths and reflow", async ({ page }, testInfo) => {
        await page.goto("./#month");
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        const image = page.getByRole("img", { name: /Proportional monthly scenario flow/ });
        await expect(image).toBeVisible();
        for (const volume of [85000, 0, 1, 120, 1000000000]) {
          await page.getByLabel("Monthly volume proxy", { exact: true }).fill(String(volume));
          const result = calculateBaseline({ ...BASELINE_DEFAULTS, volume });
          const counts = [result.pharmacyCaught, result.cleared, result.abstained, result.built];
          const paths = image.locator("path");
          await expect(paths).toHaveCount(4);
          let total = 0;
          for (const [index, count] of counts.entries()) {
            const path = paths.nth(index);
            await expect(path).toHaveAttribute("data-count", String(count));
            const thickness = Number(await path.getAttribute("data-thickness"));
            expect(thickness).toBe(volume === 0 ? 0 : count / volume * 240);
            total += thickness;
            if (count === 0) await expect(path).toHaveAttribute("d", "");
            else await expect(path).toHaveAttribute("d", /Z$/);
          }
          expect(total).toBeCloseTo(volume === 0 ? 0 : 240, 10);
          await expect(page.getByRole("list", { name: "Flow counts in top-to-bottom order" }).locator("li")).toHaveCount(4);
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        }
        await page.getByLabel("Monthly volume proxy", { exact: true }).fill("120");
        await page.getByLabel("Pharmacy pre-check %", { exact: true }).fill("100");
        await expect(image.locator("path").first()).toHaveAttribute("data-thickness", "240");
        for (let index = 1; index < 4; index++) await expect(image.locator("path").nth(index)).toHaveAttribute("d", "");
        await confirmReset(page);
        await captureCheckpoint(page, testInfo, "scenario-flow");
      });
    });
  }
}

test("calculator live edits, flag, route persistence, history, reset and rail", async ({ page }) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expandSteps(page);
  const summary = page.locator("[data-baseline-summary]");
  await expect(summary).toHaveText(baselineSummary(calculateBaseline(BASELINE_DEFAULTS), true));
  await page.getByLabel("Monthly volume proxy", { exact: true }).fill("12");
  await page.getByLabel("Find form minutes / item", { exact: true }).fill("3.5");
  const edited = { ...BASELINE_DEFAULTS, volume: 12, findFormMinutes: 3.5 };
  await expect(summary).toHaveText(baselineSummary(calculateBaseline(edited), true));
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await expect(summary).toHaveText(baselineSummary(calculateBaseline(edited), false));
  await expect(page.locator("[data-cohort]")).toHaveCount(0);
  await expect(page.locator("[data-baseline-today]")).toHaveClass(/ring-2/);
  await page.getByText("Calculator assumptions and formula", { exact: true }).click();
  await page.getByRole("link", { name: "Open assumptions register" }).click();
  await page.getByText("Calculator assumptions and formula", { exact: true }).click();
  await expect(page.getByRole("list", { name: "Calculator defaults and current inputs" })).toContainText("Current: 3.5");
  await page.getByRole("link", { name: "Return to calculator" }).click();
  await expect(page.getByLabel("Monthly volume proxy", { exact: true })).toHaveValue("12");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-cohort]")).toHaveText(["2", "2", "2", "6"]);
  // Calculator editing never appends or replaces historical human records.
  await navigatePrimary(page, "Exception queue");
  await page.locator('a[href="/case/EX-24088"]').first().click();
  await page.locator('a[href="/case/EX-24088/record"]').first().click();
  await expect(page.getByRole("main")).toContainText("DR-000871");
  await navigatePrimary(page, "Overview");
  await page.getByRole("navigation", { name: "Guided tour" }).getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Find form minutes / item", { exact: true })).toHaveValue("3.5");
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Keep working" }).click();
  await expect(page.getByLabel("Monthly volume proxy", { exact: true })).toHaveValue("12");
  await confirmReset(page);
  await expect(page).toHaveURL(/#month$/);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  for (const { key, label } of BASELINE_FIELDS) await expect(page.getByLabel(label, { exact: true })).toHaveValue(String(BASELINE_DEFAULTS[key]));
  const rail = page.getByRole("navigation", { name: "Guided tour" });
  await rail.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/#cases$/);
  await rail.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/#month$/);
});

test("invalid input is retained, labelled and suppresses results; zero and 100% work", async ({ page }) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expandSteps(page);
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
  await page.getByText("Calculator assumptions and formula", { exact: true }).click();
  await page.getByRole("link", { name: "Return to calculator" }).click();
  await expandSteps(page);
  await expect(volume).toHaveValue("");
  await volume.fill("0");
  await expect(page.locator("[data-cohort]")).toHaveText(["0", "0", "0", "0"]);
  for (const label of [...GATHERING_STEPS.map(({ label }) => label), "Judging minutes / item"]) await page.getByLabel(label, { exact: true }).fill("0");
  await expect(page.locator("[data-baseline-today]")).toContainText("0 reference operator hours");
  await volume.fill("1000000000");
  await page.getByLabel("Pharmacy pre-check %", { exact: true }).fill("100");
  await expect(page.locator("[data-cohort]")).toHaveText(["1,000,000,000", "0", "0", "0"]);
  await page.getByLabel("Pharmacy pre-check %", { exact: true }).focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/#month$/);
  // Router home links omit the base's trailing slash. Vite preview does not
  // serve /BSA itself; test reload at the supported production entry /.
  await page.goto("./#month");
  await volume.fill("42");
  await page.reload();
  await expect(volume).toHaveValue("85000");
});

for (const { key, label, max, integer } of BASELINE_FIELDS) {
  test(`exact decimal boundary validation: ${key}`, async ({ page }) => {
    await page.goto("./#month");
    await expandSteps(page);
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
        await expandSteps(page);
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
          // Both routes contain this disclosure. Wait for navigation to commit
          // before opening it, rather than clicking the outgoing route's node.
          await expect(page).toHaveURL(surface === "calculator" ? /#month$/ : /\/assumptions$/);
          if (surface === "register") await expect(page.getByRole("heading", { level: 1 })).toHaveText("The assumptions that decide whether an agent is needed");
          const disclosure = page.locator("[data-baseline-assumptions]");
          await expect(disclosure).not.toHaveAttribute("open", "");
          await disclosure.locator("summary").first().click();
          await expect(disclosure).toHaveAttribute("open", "");
          await expect(disclosure).not.toContainText(/\.pdf|\.docx|source:/i);
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
        await expect(page.locator("[data-baseline-summary]")).toHaveText(baselineSummary(calculateBaseline(BASELINE_DEFAULTS), false));
      });
    });
  }
  for (const enabled of [true, false]) {
    test.describe(`calculator ${colorScheme} ${enabled ? "on" : "off"}`, () => {
      test.use({ colorScheme, viewport: { width: 1440, height: 1000 } });
      test("expanded provenance and invalid inputs pass axe; selected responsive captures", async ({ page }, testInfo) => {
        await page.goto("./#month");
        await expandSteps(page);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        for (const width of [1440, 360]) {
          await page.setViewportSize({ width, height: 1000 });
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          await captureCheckpoint(page, testInfo, `month-${width}-${colorScheme}-${enabled ? "on" : "off"}`);
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByText("Calculator assumptions and formula", { exact: true }).click();
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/12");
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/10");
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/8");
        await expect(page.locator("[data-baseline-assumptions]")).toContainText("83,333.33");
        await expect(page.locator("[data-baseline-assumptions]")).not.toContainText(/\.pdf|\.docx|source:/i);
        for (const invalid of [false, true]) {
          if (invalid) await page.getByLabel("Find form minutes / item", { exact: true }).fill("");
          const results = await new AxeBuilder({ page }).analyze();
          await captureJson(testInfo, `axe-expanded-invalid-${invalid}`, results);
          expect(results.violations).toEqual([]);
        }
      });
    });
  }
}