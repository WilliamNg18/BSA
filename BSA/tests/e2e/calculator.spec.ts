import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { MONTH_MODEL_DEFAULTS, MONTH_FIELDS, MONTH_DETAIL_FIELDS, GATHERING_STEPS, monthSummary, monthModel, formatBaselineNumber as n, type MonthModelInputs } from "../../src/lib/domain/baseline";

const fields = [...MONTH_FIELDS.map((field) => ({ ...field, max: field.key === "volume" ? 1_000_000_000 : field.key === "todayMinutes" ? 15 : 12 })), ...MONTH_DETAIL_FIELDS];

async function expandDetail(page: Page) {
  const disclosure = page.locator("[data-month-detail]");
  if (await disclosure.getAttribute("open") === null) await disclosure.locator(":scope > summary").click();
}

async function expectHeadlines(page: Page, input = MONTH_MODEL_DEFAULTS, enabled = true) {
  const result = monthModel(input);
  await expect(page.locator("[data-month-hours]")).toHaveText(n(enabled ? result.withAgent.operatorHours : result.today.operatorHours, 1));
  await expect(page.locator("[data-month-capacity]")).toHaveText(n(enabled ? result.capacity.withAgent : result.capacity.today, 1));
  await expect(page.locator("[data-baseline-summary]")).toHaveText(monthSummary(result, enabled));
}

test("three prominent assumptions and two mode-switched tiles show total effort and built-case capacity", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await expect(page.locator("main input:visible")).toHaveCount(3);
  await expect(page.locator("[data-month-headlines] > section")).toHaveCount(2);
  await expect(page.locator("[data-month-detail]")).not.toHaveAttribute("open", "");
  const publicDefault = page.getByRole("button", { name: "About the public volume default", exact: true });
  await publicDefault.focus();
  await expect(page.getByRole("tooltip")).toContainText("not measured total queue arrivals");
  await page.keyboard.press("Escape");
  await expectHeadlines(page, MONTH_MODEL_DEFAULTS, false);
  await expect(page.getByText(/Manual-case capacity under these assumptions/).first()).toBeVisible();
  await expect(page.locator("[data-per-item-gathering]")).toHaveText("10 minutes");
  await expect(page.locator("[data-per-item-judging]")).toHaveText("2 minutes");
  for (const text of [
    "gathering the evidence and judging, with no guidance",
    "reading the built case and deciding",
    "Time is spent only where a person adds something: the judgement.",
    "Estimates from labelled assumptions; type NHSBSA's own figures above.",
    "Referral-subset proxy, not the real total exception queue",
  ]) await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expectHeadlines(page);
  await expect(page.locator("[data-month-mode]")).toHaveText(["With agent", "With agent"]);
  await expect(page.locator("[data-per-item-gathering]")).toHaveText("0 minutes");
  await expect(page.locator("[data-gathering-bar]")).toHaveAttribute("width", "0");
  await expect(page.getByText("gathering done by the agent and code in seconds", { exact: true })).toBeVisible();
  await expect(page.getByText(/Abstentions are worked as today: 12/)).toBeVisible();
  await expect(page.getByText(/Built-case capacity, not a mixed-cohort guarantee/)).toBeVisible();
  await captureCheckpoint(page, testInfo, "monthly-built-case-headlines");
});

test("three inputs and all seven weights propagate through calculator, scene and assumptions without changing history", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const edited: MonthModelInputs = { ...MONTH_MODEL_DEFAULTS };
  for (const { key, label } of MONTH_FIELDS) {
    edited[key] = key === "volume" ? 120 : key === "todayMinutes" ? 15 : 3;
    await page.getByLabel(label, { exact: true }).fill(String(edited[key]));
    await expectHeadlines(page, edited);
    await navigatePrimary(page, "Overview");
    await expect(page.locator("[data-scene-volume]")).toHaveText(n(edited.volume));
    await expect(page.locator("[data-scene-hours]")).toHaveText(n(monthModel(edited).withAgent.operatorHours, 1));
    await expect(page.locator("[data-scene-capacity]")).toHaveText(n(monthModel(edited).capacity.withAgent, 1));
    await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
  }
  await expandDetail(page);
  for (const { key } of GATHERING_STEPS) {
    edited[key] += 1;
    await page.locator(`#baseline-${key}`).fill(String(edited[key]));
    await expectHeadlines(page, edited);
    const result = monthModel(edited);
    for (const step of result.gatheringSteps) await expect(page.locator(`[data-gathering-step="${step.key}"]`)).toHaveText(`${n(step.minutes)} minutes`);
    await expect(page.locator("[data-gathering-total]")).toContainText("12 minutes");
  }
  for (const key of ["precheckPercent", "clearedPercent", "abstainPercent", "deficientBuiltPercent", "deficientAbstainPercent"] as const) {
    edited[key] = 25;
    await page.locator(`#baseline-${key}`).fill("25");
    await expectHeadlines(page, edited);
    await expect(page.locator("[data-risk-residual]")).toHaveText(n(monthModel(edited).referralRiskResidual, 0));
  }
  await captureJson(testInfo, "shared-month-model", { inputs: edited, result: monthModel(edited) });
  await page.getByText("Calculator assumptions and formula", { exact: true }).click();
  await page.getByRole("link", { name: "Open assumptions register" }).click();
  await page.getByText("Calculator assumptions and formula", { exact: true }).click();
  await expect(page.locator('[data-current-input="todayMinutes"]')).toHaveText("15");
  await expect(page.locator('[data-current-input="judgingMinutes"]')).toHaveText("3");
  await page.getByRole("link", { name: "Return to calculator" }).click();
  await expectHeadlines(page, edited);
  await navigatePrimary(page, "Exception queue");
  await page.locator('a[href="/case/EX-24088"]').first().click();
  await page.locator('a[href="/case/EX-24088/record"]').first().click();
  await expect(page.getByRole("main")).toContainText("DR-000871");
  await navigatePrimary(page, "Overview");
  await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Keep working" }).click();
  await expectHeadlines(page, edited);
  await confirmReset(page);
  await expectHeadlines(page, MONTH_MODEL_DEFAULTS, false);
  await expandDetail(page);
  for (const { key, label } of fields) await expect(page.getByLabel(label, { exact: true })).toHaveValue(String(MONTH_MODEL_DEFAULTS[key]));
});

test("invalid drafts remove all estimates across routes; zero volume and full abstention stay explicit", async ({ page }) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expandDetail(page);
  for (const { key, label, max } of fields) {
    const field = page.getByLabel(label, { exact: true });
    for (const value of ["", "-1", "NaN", "Infinity", "1e309", String(max + 1)]) {
      await field.fill(value);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("[data-month-headlines]")).toHaveCount(0);
      await expect(page.locator("[data-baseline-summary]")).toContainText("unavailable");
    }
    await field.fill(String(MONTH_MODEL_DEFAULTS[key]));
    await expect(field).toHaveAttribute("aria-invalid", "false");
  }
  await page.locator("#baseline-todayMinutes").fill("");
  await navigatePrimary(page, "Overview");
  await expect(page.locator("[data-scene-estimates]")).toContainText("unavailable");
  await expect(page.locator("[data-scene-hours]")).toHaveCount(0);
  await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
  await expect(page.locator("#baseline-todayMinutes")).toHaveValue("");
  await page.locator("#baseline-todayMinutes").fill("12");
  await page.locator("#baseline-volume").fill("0");
  await expectHeadlines(page, { ...MONTH_MODEL_DEFAULTS, volume: 0 });
  await expandDetail(page);
  for (const [key, value] of [["volume", 120], ["precheckPercent", 0], ["clearedPercent", 0], ["abstainPercent", 100]] as const) await page.locator(`#baseline-${key}`).fill(String(value));
  await expectHeadlines(page, { ...MONTH_MODEL_DEFAULTS, volume: 120, precheckPercent: 0, clearedPercent: 0, abstainPercent: 100 });
  await expect(page.locator("[data-month-hours]")).toHaveText("24");
  await page.locator("#baseline-abstainPercent").focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/#month$/);
  await page.reload();
  await expect(page.locator("#baseline-volume")).toHaveValue("85000");
});

for (const { key, label, max, integer } of fields) {
  test(`exact decimal boundary validation: ${key}`, async ({ page }) => {
    await page.goto("./#month");
    await expandDetail(page);
    const field = page.getByLabel(label, { exact: true });
    for (const raw of [`${max}.00000000000000001`, `000${max}.${"0".repeat(400)}1`]) {
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("[data-month-headlines]")).toHaveCount(0);
      await expect(page.locator(`#baseline-${key}-error`)).toBeVisible();
    }
    for (const raw of [String(max), ...(integer ? [] : [`${max}.00000000000000000`])]) {
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await expect(field).toHaveAttribute("aria-invalid", "false");
      await expect(page.locator("[data-month-headlines]")).toBeVisible();
    }
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 360, 768, 1024, 1440]) {
    test.describe(`monthly reflow ${colorScheme} ${width}`, () => {
      test.use({ colorScheme, viewport: { width, height: 1000 } });
      test("four disjoint ribbons conserve counts and expanded inputs pass axe", async ({ page }, testInfo) => {
        await page.goto("./#month");
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        await expandDetail(page);
        const image = page.getByRole("img", { name: /Proportional monthly scenario flow/ });
        for (const volume of [85000, 0, 1, 120, 1000000000]) {
          await page.locator("#baseline-volume").fill(String(volume));
          const result = monthModel({ ...MONTH_MODEL_DEFAULTS, volume });
          let total = 0;
          for (const [index, count] of [result.pharmacyCaught, result.cleared, result.abstained, result.built].entries()) {
            const path = image.locator("path").nth(index);
            await expect(path).toHaveAttribute("data-count", String(count));
            const thickness = Number(await path.getAttribute("data-thickness"));
            expect(thickness).toBe(volume === 0 ? 0 : count / volume * 240);
            total += thickness;
            await expect(path).toHaveAttribute("d", count === 0 ? "" : /Z$/);
          }
          expect(total).toBeCloseTo(volume === 0 ? 0 : 240, 10);
        }
        await page.locator("#baseline-precheckPercent").fill("100");
        await expect(image.locator("path").first()).toHaveAttribute("data-thickness", "240");
        await page.getByText("Calculator assumptions and formula", { exact: true }).click();
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/12");
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("3/10");
        await expect(page.getByRole("list", { name: "Synthetic default denominators" })).toContainText("2/7");
        await expect(page.locator("[data-baseline-assumptions]")).toContainText("83,333.33");
        for (const invalid of [false, true]) {
          if (invalid) for (const { key, label } of fields) {
            await page.getByLabel(label, { exact: true }).fill("9".repeat(400));
            await expect(page.locator(`#baseline-${key}-error`)).toBeVisible();
            await expect(page.locator(`[data-current-input="${key}"]`)).toContainText("display shortened; 400 characters");
          }
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          const audit = await new AxeBuilder({ page }).analyze();
          await captureJson(testInfo, `axe-month-invalid-${invalid}`, audit);
          expect(audit.violations).toEqual([]);
        }
        await page.getByRole("link", { name: "Open assumptions register" }).click();
        await page.getByText("Calculator assumptions and formula", { exact: true }).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        const audit = await new AxeBuilder({ page }).analyze();
        await captureJson(testInfo, "axe-register-invalid", audit);
        expect(audit.violations).toEqual([]);
        await captureCheckpoint(page, testInfo, "monthly-assumptions-invalid");
        await page.getByRole("link", { name: "Return to calculator" }).click();
        await expandDetail(page);
        for (const { label } of fields) await expect(page.getByLabel(label, { exact: true })).toHaveValue("9".repeat(400));
        await confirmReset(page);
        await expectHeadlines(page, MONTH_MODEL_DEFAULTS, false);
      });
    });
  }
}

test.describe("monthly count between modes", () => {
  test.use({ reducedMotion: "no-preference" });
  test("interpolates between targets, keeps accessible final values, and obeys live reduced motion", async ({ page }) => {
    await page.clock.install();
    await page.goto("./#month");
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await page.clock.runFor(1000);
    const hours = page.locator("[data-month-hours]");
    const result = monthModel(MONTH_MODEL_DEFAULTS);
    expect(Number((await hours.innerText()).replaceAll(",", ""))).toBeGreaterThan(result.withAgent.operatorHours);
    expect(Number((await hours.innerText()).replaceAll(",", ""))).toBeLessThan(result.today.operatorHours);
    await expect(hours.getByRole("img", { name: n(result.withAgent.operatorHours, 1), exact: true })).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectHeadlines(page);
    await page.getByRole("banner").getByRole("switch").setChecked(false);
    await expectHeadlines(page, MONTH_MODEL_DEFAULTS, false);
  });

  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    test.describe(`monthly exact count ${reducedMotion}`, () => {
      test.use({ reducedMotion });
      test("returns exactly from large valid capacities to the shared target", async ({ page }) => {
        await page.clock.install({ time: new Date("2026-09-12T12:00:00Z") });
        await page.goto("./#month");
        await page.clock.pauseAt(new Date("2026-09-12T12:00:10Z"));
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        for (const raw of ["0.0000000000001", "0.0000000000000001"]) {
          await page.locator("#baseline-judgingMinutes").fill(raw);
          if (reducedMotion === "no-preference") await page.clock.runFor(2016);
          await expectHeadlines(page, { ...MONTH_MODEL_DEFAULTS, judgingMinutes: Number(raw) });
          await page.locator("#baseline-judgingMinutes").fill("2");
          if (reducedMotion === "no-preference") await page.clock.runFor(2016);
          await expectHeadlines(page);
          await expect(page.locator("[data-month-capacity]").getByRole("img", { name: "3,780", exact: true })).toBeVisible();
          await navigatePrimary(page, "Overview");
          if (reducedMotion === "no-preference") await page.clock.runFor(2016);
          await expect(page.locator("[data-scene-capacity]")).toHaveText("3,780");
          await expect(page.locator("[data-scene-hours]")).toHaveText(n(monthModel(MONTH_MODEL_DEFAULTS).withAgent.operatorHours, 1));
          await page.getByRole("link", { name: "Edit scenario assumptions" }).click();
        }
      });
    });
  }
});
