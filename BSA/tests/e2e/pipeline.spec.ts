import AxeBuilder from "@axe-core/playwright";
import { expectHeaderOutcomeSettled } from "./header-outcome-helpers";
import { captureCheckpoint, captureJson, confirmReset, expect, test } from "./fixtures";
import { formatProcessItems } from "../../src/lib/domain/baseline";
import {
  PROCESS_MONTH_DEFAULTS, calculateProcessMonth, chooseProcessChapter, expandProcessInputs,
  expectProcessMetrics, expectSceneMetrics, fillProcessInputs, type ProcessMonthInputs,
} from "./process-model-helpers";

test("conditional processing paths retain automatic bypass and human capture, judgement and resubmission", async ({ page }) => {
  await page.goto("./#pipeline");
  const pipeline = page.getByRole("region", { name: "Prescription processing paths", exact: true });
  const stages = pipeline.locator("[data-pipeline-stage]");
  await expect(stages).toHaveCount(7);
  expect(await stages.evaluateAll((els) => els.map((el) => el.getAttribute("data-pipeline-stage")))).toEqual(
    ["channels", "rules", "type1", "type2", "referred-back", "mys", "resubmit"],
  );
  const channels = await pipeline.locator('[data-pipeline-stage="channels"]').innerText();
  const rules = await pipeline.locator('[data-pipeline-stage="rules"]').innerText();
  const bypass = pipeline.locator("[data-auto-bypass]");
  await expect(bypass).toContainText("No Type 1 or Type 2 queue row");
  await expect(bypass).toContainText("no person involved");
  await expect(pipeline.locator("[data-agent-kernel]")).toHaveCount(0);
  await expect(pipeline.locator('[data-pipeline-stage="type1"]')).toContainText("Poor paper: key manually from the image");
  await expect(pipeline.locator('[data-pipeline-stage="type2"]')).toContainText("Typed EPS endorsements can arrive directly");
  await expect(pipeline.locator('[data-pipeline-stage="referred-back"]')).toContainText("Only that item's payment is delayed");
  await expect(pipeline.locator('[data-pipeline-stage="mys"]')).toContainText("NHSmail email");
  await expect(pipeline.locator('[data-pipeline-stage="resubmit"]')).toContainText("Code routes the revised facts again");
  for (const enabled of [true, false, true]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect(pipeline.locator('[data-pipeline-stage="channels"]')).toHaveText(channels, { useInnerText: true });
    await expect(pipeline.locator('[data-pipeline-stage="rules"]')).toHaveText(rules, { useInnerText: true });
    await expect(pipeline.locator("[data-agent-kernel]")).toHaveCount(enabled ? 3 : 0);
    if (enabled) {
      await expect(pipeline.locator('[data-agent-kernel="pharmacy"]')).toContainText("never submit or pay");
      await expect(pipeline.locator('[data-agent-kernel="type1"]')).toContainText("not read from the form");
      await expect(pipeline.locator('[data-agent-kernel="type1"]')).toContainText("A person confirms or corrects");
      await expect(pipeline.locator('[data-agent-kernel="type2"]')).toContainText("Code validates; a person decides");
      await expect(pipeline.locator('[data-pipeline-stage="referred-back"]')).toContainText("The agent does not send or approve it");
    }
  }
  await expect(pipeline.locator("[data-kernel-phase], [data-gathering-step], [data-referral-proxy]")).toHaveCount(0);
  await expect(pipeline).not.toContainText(/Sources:|\.pdf|\.docx/);
});

const processScenarios: { name: string; input: ProcessMonthInputs }[] = [
  { name: "defaults", input: { ...PROCESS_MONTH_DEFAULTS } },
  { name: "small monthly volume", input: { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 120, manualLoopItems: 2 } },
  { name: "all would-be referrals caught", input: { ...PROCESS_MONTH_DEFAULTS, preventionPercent: 100 } },
  { name: "all remaining items abstained", input: { ...PROCESS_MONTH_DEFAULTS, preventionPercent: 0, abstentionPercent: 100 } },
  { name: "zero items", input: { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 0, manualLoopItems: 0 } },
  { name: "billion items and small referral effort", input: { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1_000_000_000, manualLoopItems: 1, gatheringMinutesToday: 0.1 } },
];

for (const { name, input } of processScenarios) {
test(`pipeline, scene and calculator share counts and recover invalid inputs: ${name}`, async ({ page }, testInfo) => {
  await page.goto("./#month");
    await fillProcessInputs(page, input);
    const result = calculateProcessMonth(input);
    for (const enabled of [true, false]) {
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await expectProcessMetrics(page, input, enabled);
      await chooseProcessChapter(page, 1);
      await expectSceneMetrics(page, input, enabled);
      await expect(page.locator('[data-key-figure="monthly-referrals"]')).toContainText("Approximately 85,000");
      await expect(page.locator('[data-key-figure="staff-touch"]')).toContainText("Approximately 4%");
      await chooseProcessChapter(page, 3);
      const column = enabled ? result.withAgent : result.today;
      await expect(page.locator("[data-pipeline-referrals]")).toHaveText(formatProcessItems(column.referredBackItems));
      await expect(page.locator("[data-pipeline-pharmacy]")).toHaveCount(enabled ? 1 : 0);
      if (enabled) await expect(page.locator("[data-pipeline-pharmacy]")).toHaveText(formatProcessItems(result.cohorts.prevented));
      await expect(page.locator("[data-auto-bypass]")).toBeVisible();
      await chooseProcessChapter(page, 2);
  }
  await expandProcessInputs(page);
  await page.locator("#process-monthlyItems").fill("");
  await chooseProcessChapter(page, 3);
  await expect(page.locator("[data-pipeline]")).toContainText("Scenario estimates unavailable");
  await expect(page.locator("[data-pipeline-referrals], [data-pipeline-pharmacy]")).toHaveCount(0);
  await expect(page.locator("[data-pipeline-stage]")).toHaveCount(7);
  await expect(page.locator("[data-auto-bypass]")).toBeVisible();
  await confirmReset(page);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.locator("[data-agent-kernel]")).toHaveCount(0);
  await expect(page.locator("[data-pipeline-referrals]")).toHaveText(formatProcessItems(calculateProcessMonth(PROCESS_MONTH_DEFAULTS).today.referredBackItems));
  await captureJson(testInfo, "shared-process-path-scenario", { name, input, result });
});
}

test("mode changes and reset cancel referral interpolation without inventing kernel countdowns or decisions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") });
  await page.goto("./#pipeline");
  await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.setChecked(true);
  await expect(page.locator("[data-agent-kernel]")).toHaveCount(3);
  await expect(page.locator("[data-kernel-phase]")).toHaveCount(0);
  await page.clock.runFor(500);
  await flag.setChecked(false);
  await expect(page.locator("[data-agent-kernel]")).toHaveCount(0);
  await page.clock.runFor(2016);
  await expect(page.locator("[data-pipeline-referrals]")).toHaveText(formatProcessItems(calculateProcessMonth(PROCESS_MONTH_DEFAULTS).today.referredBackItems));
  await flag.setChecked(true);
  await page.clock.runFor(500);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-pipeline-referrals]")).toHaveText(formatProcessItems(calculateProcessMonth(PROCESS_MONTH_DEFAULTS).withAgent.referredBackItems));
  await chooseProcessChapter(page, 4);
  const d = page.locator('[data-case="D"]');
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await expect(d).toContainText("Unreconciled evidence still abstains");
  await expect(d.locator("[data-outcome]")).toHaveCount(0);
  await page.clock.runFor(3000);
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await confirmReset(page);
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await expect(d).toContainText("Key product, quantity and endorsement from the image.");
  await expect(d).toContainText("Type 2 judgement follows only when required.");
});

test("path links and figure context remain keyboard accessible; reset describes Off", async ({ page }) => {
  await page.goto("./#pipeline");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  const figure = page.locator('[data-pipeline-stage="referred-back"]').getByRole("button", { name: "Monthly referrals: figure context", exact: true });
  await figure.focus();
  await expect(figure).toBeFocused();
  await expect(page.getByRole("tooltip")).toContainText("after sequential pharmacy prevention and code clearance; all remaining queued items are assumed referred back");
  await page.keyboard.press("Escape");
  for (const [name, url] of [
    ["Try the pharmacy check", /\/pharmacy$/], ["Read the proposed paper boundary", /\/boundary$/],
    ["Review the Type 2 queue", /\/queue$/], ["Open pharmacy claims", /\/pharmacy\/claims$/],
  ] as const) {
    const link = page.getByRole("link", { name, exact: true });
    await link.focus();
    await expect(link).toBeFocused();
    await link.press("Enter");
    await expect(page).toHaveURL(url);
    await chooseProcessChapter(page, 3);
  }
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("turn Agent Off");
  await expect(page.getByRole("alertdialog")).not.toContainText("turn Agent on");
});

for (const { width, colorScheme } of [{ width: 1440, colorScheme: "light" }] as const) {
  for (const enabled of [false, true]) {
    test(`pipeline selected ${width} ${colorScheme} ${enabled ? "on" : "off"}: reflow and all-rules axe`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await page.goto("./#pipeline");
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await expect(page.getByRole("region", { name: "Prescription processing paths", exact: true })).toBeVisible();
      await expect(page.locator("[data-pipeline-stage]")).toHaveCount(7);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await expectHeaderOutcomeSettled(page, enabled);
      const axe = await new AxeBuilder({ page }).analyze();
      await captureJson(testInfo, "axe-pipeline", axe);
      expect(axe.violations).toEqual([]);
      await captureCheckpoint(page, testInfo, `pipeline-${width}-${colorScheme}-${enabled ? "on" : "off"}`);
      for (const nextWidth of [1280, 1440]) {
        await page.setViewportSize({ width: nextWidth, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
    });
  }
}
