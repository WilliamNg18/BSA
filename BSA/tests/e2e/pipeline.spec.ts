import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";
import { BASELINE_DEFAULTS, MONTH_MODEL_DEFAULTS, monthModel, GATHERING_STEPS, calculateBaseline, referralFreeProxyDisplay, formatBaselineNumber, type BaselineInputs } from "../../src/lib/domain/baseline";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { ASSISTANCE_DURATION_MS, ASSISTANCE_PHASES } from "../../src/hooks/use-assistance-presentation";

const expectedGatheringPhases = [0, 1, 1, 1, 2, 3, 4];
async function expectGathering(page: Page, completedPhase: number, built = true) {
  const steps = page.locator('[data-pipeline-stage="4"] [data-gathering-step]');
  await expect(steps).toHaveCount(7);
  await expect(steps.locator("[data-pain-marker]")).toHaveCount(7);
  for (const [index, { key, label }] of GATHERING_STEPS.entries()) {
    const step = steps.nth(index);
    await expect(step).toHaveAttribute("data-gathering-step", key);
    await expect(step).toHaveAttribute("data-gathering-phase", String(expectedGatheringPhases[index]));
    await expect(step.locator("[data-pain-marker]")).toHaveAttribute("data-pain-marker", built && completedPhase > expectedGatheringPhases[index] ? "resolved" : "open");
    await expect(step.locator("[data-pain-marker]")).toContainText(label.replace(" minutes / item", ""));
  }
}

async function expectReferralMarkers(page: Page, ready: boolean) {
  const stage = page.locator('[data-pipeline-stage="6"]');
  await expect(stage.locator("[data-pain-marker]")).toHaveCount(2);
  await expect(stage.locator("[data-exact-fix-marker] [data-pain-marker]")).toHaveAttribute("data-pain-marker", ready ? "resolved" : "open");
  await expect(stage.locator(":scope > [data-pain-marker]")).toHaveAttribute("data-pain-marker", "open");
  await expect(stage.locator(":scope > [data-pain-marker]")).toContainText("Referral risk remains");
  await expect(page.locator("[data-pipeline-correction]")).toHaveCount(ready ? 1 : 0);
}

async function pipeline(page: Page) {
  await page.getByRole("button", { name: "Choose tour chapter" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(8);
  await page.getByRole("menuitem", { name: "3. What exists today and what changes", exact: true }).click();
  await expect(page).toHaveURL(/#pipeline$/);
}

async function expectCaseDThroughPhases(page: Page) {
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.setChecked(false);
  await page.getByRole("navigation", { name: "Guided tour" }).getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/#cases$/);
  await flag.setChecked(true);
  const marker = page.locator('[data-case="D"] [data-pain-marker]');
  for (let phase = 0; phase <= ASSISTANCE_PHASES.length; phase++) {
    await expect(marker).toHaveCount(1);
    await expect(marker).toHaveAttribute("data-pain-marker", "open");
    if (phase < ASSISTANCE_PHASES.length) await page.clock.runFor(ASSISTANCE_DURATION_MS / ASSISTANCE_PHASES.length);
  }
  await expect(page.locator('[data-case="D"]')).toContainText("Gate: NOT RUN");
  await expect(page.locator('[data-case="D"] [data-outcome]')).toHaveText("ABSTAIN");
}

test("six ordered stages preserve existing capture/pricing, assumptions and built-only assistance", async ({ page }) => {
  await page.goto("./#pipeline");
  const stages = page.locator("[data-pipeline-stage]");
  await expect(stages).toHaveCount(6);
  expect(await stages.evaluateAll((els) => els.map((el) => el.getAttribute("data-pipeline-stage")))).toEqual(["1", "2", "3", "4", "5", "6"]);
  const before = await stages.allTextContents();
  expect(await page.locator("[data-pharmacy-exit]").evaluate((el) => Boolean(el.compareDocumentPosition(document.querySelector('[data-pipeline-stage="1"]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(page.getByRole("region", { name: "Seven gathering steps", exact: true }).locator("li")).toHaveCount(7);
  await expect(page.locator("[data-kernel-phase], [data-pipeline-proposals], [data-pipeline-correction]")).toHaveCount(0);
  await expect(stages.nth(4)).toContainText("Assumption · Validate current practice");
  await expect(stages.nth(5)).toContainText("Assumption · Validate cycle time");
  await expectGathering(page, 0, false);
  await expectReferralMarkers(page, false);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  expect((await stages.allTextContents()).slice(0, 3)).toEqual(before.slice(0, 3));
  await expect(page.locator('[data-pipeline-stage="2"] [data-pain-marker]')).toHaveAttribute("data-pain-marker", "open");
  await expectGathering(page, ASSISTANCE_PHASES.length);
  await expect(page.locator('[data-kernel] [data-pain-marker]')).toHaveAttribute("data-pain-marker", "open");
  await expect(stages.nth(4)).toContainText("Built exceptions only · Proposed record");
  await expect(stages.nth(4)).toContainText("Case D has no proposed rule or recommendation");
  await expect(page.locator("[data-pipeline-correction]")).toHaveText(runAgent(CASES[1]).draftToPharmacy!);
  await expectReferralMarkers(page, true);
  await expect(page.locator("[data-pipeline]")).not.toContainText(/Sources:|\.pdf|\.docx|First-time endorsement accuracy/);
  await page.getByRole("navigation", { name: "Guided tour" }).getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/#cases$/);
  await expect(page.locator('[data-case="D"]')).toContainText("Gate: NOT RUN");
  await expect(page.locator('[data-case="D"] [data-pain-marker]')).toHaveAttribute("data-pain-marker", "open");
});

test("pipeline, scene and calculator share live counts, residuals and invalid/zero handling", async ({ page }, testInfo) => {
  await page.goto("./#month");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const scenarios: BaselineInputs[] = [
    { ...BASELINE_DEFAULTS, volume: 12 },
    { ...BASELINE_DEFAULTS, volume: 120, deficientBuiltPercent: 75, deficientAbstainPercent: 100 },
    { ...BASELINE_DEFAULTS, volume: 120, precheckPercent: 100 },
    { ...BASELINE_DEFAULTS, volume: 120, abstainPercent: 100 },
    { ...BASELINE_DEFAULTS, volume: 0 },
    { ...BASELINE_DEFAULTS, volume: 1_000_000_000, precheckPercent: 0, clearedPercent: 0, abstainPercent: 0, deficientBuiltPercent: 0.0000001 },
  ];
  const results = [];
  for (const input of scenarios) {
    await page.locator("[data-month-detail] > summary").click();
    for (const key of ["volume", "precheckPercent", "clearedPercent", "abstainPercent", "deficientBuiltPercent", "deficientAbstainPercent"] as const) await page.locator(`#baseline-${key}`).fill(input[key].toLocaleString("en-GB", { useGrouping: false, maximumFractionDigits: 12 }));
    const result = monthModel({ ...input, todayMinutes: MONTH_MODEL_DEFAULTS.todayMinutes });
    results.push(result);
    await expect(page.locator("[data-referrals-with]")).toHaveText(formatBaselineNumber(result.referrals.withAgent, 1));
    await expect(page.locator("[data-referral-proxy]")).toHaveText(referralFreeProxyDisplay(result));
    await navigatePrimary(page, "Overview");
    await expect(page.locator('[data-key-figure="annual-items"]')).toContainText("Approximately 1.1 billion");
    await expect(page.locator('[data-key-figure="monthly-referrals"]')).toContainText("Approximately 85,000");
    await expect(page.locator("[data-key-figure]")).toHaveCount(3);
    await expect(page.locator('[data-key-figure="rulebook-publication"]')).toContainText("Monthly");
    await expect(page.locator('[data-key-figure="accuracy-target"]')).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Public context figures" })).not.toContainText(/99\.85|100%/);
    await expect(page.getByRole("region", { name: "Rulebook context" })).toContainText("Monthly publication");
    await expect(page.locator("[data-scene-volume]")).toHaveText(formatBaselineNumber(result.volume, 0));
    await expect(page.locator("[data-scene-hours]")).toHaveText(formatBaselineNumber(result.withAgent.operatorHours, 1));
    await expect(page.locator("[data-scene-capacity]")).toHaveText(formatBaselineNumber(result.capacity.withAgent, 1));
    await expect(page.locator("[data-referral-proxy]")).toHaveCount(0);
    await pipeline(page);
    for (const [attr, value] of [["pharmacy", result.pharmacyCaught], ["built", result.built], ["abstained", result.abstained], ["proposals", result.built], ["referrals", result.referrals.withAgent], ["risk", result.referralRiskResidual]] as const) await expect(page.locator(`[data-pipeline-${attr}]`)).toHaveText(formatBaselineNumber(value, 1));
    await expect(page.locator("[data-referral-proxy]")).toHaveText(referralFreeProxyDisplay(result));
    await expectGathering(page, ASSISTANCE_PHASES.length, result.built > 0);
    await expectReferralMarkers(page, result.built > 0);
    await expect(page.locator('[data-kernel] [data-pain-marker]')).toHaveAttribute("data-pain-marker", "open");
    await page.getByRole("link", { name: "Edit shared gathering assumptions" }).click();
  }
  await page.locator("#baseline-volume").fill("");
  await pipeline(page);
  await expect(page.locator("[data-pipeline]")).toContainText("Scenario estimates unavailable");
  await expect(page.locator("[data-pipeline-referrals], [data-referral-proxy]")).toHaveCount(0);
  await expectGathering(page, ASSISTANCE_PHASES.length, false);
  await expectReferralMarkers(page, false);
  await confirmReset(page);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.locator("[data-pipeline-referrals]")).toHaveCount(0);
  await expectGathering(page, 0, false);
  await expectReferralMarkers(page, false);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-pipeline-referrals]")).toHaveText(formatBaselineNumber(calculateBaseline(BASELINE_DEFAULTS).referrals.withAgent, 0));
  await captureJson(testInfo, "shared-pipeline-scenarios", results);
});

test("shared two-second clock sequences kernel phases, resolves built pain only, and cancels safely", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("queue");
  await expect(page.locator("tbody tr")).toHaveCount(50);
  const states = await page.locator("[data-queue-state]").allTextContents();
  await pipeline(page);
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  const flag = page.getByRole("banner").getByRole("switch");
  const status = page.locator("[data-kernel-status]");
  await flag.setChecked(true);
  expect(ASSISTANCE_PHASES).toEqual(["Plan", "Gather evidence", "Retrieve rule", "Reconcile and assess", "Propose reason"]);
  for (const [index, name] of ASSISTANCE_PHASES.entries()) {
    await expect(status).toHaveText(`Preparing assistance · ${name}`);
    await expect(page.locator("[data-kernel-phase=active]")).toHaveCount(1);
    await expect(page.locator("[data-kernel-phase=complete]")).toHaveCount(index);
    await expectGathering(page, index);
    await expectReferralMarkers(page, false);
    await expect(page.locator('[data-kernel] [data-pain-marker]')).toHaveCount(1);
    await expect(page.locator('[data-kernel] [data-pain-marker]')).toHaveAttribute("data-pain-marker", "open");
    await page.clock.runFor(ASSISTANCE_DURATION_MS / ASSISTANCE_PHASES.length - (index === ASSISTANCE_PHASES.length - 1 ? 1 : 0));
  }
  await expect(page.locator("[data-assistance-host]")).toHaveAttribute("data-phase", "preparing");
  await page.clock.runFor(1);
  await expect(status).toContainText("Evidence presentation ready");
  await expectGathering(page, ASSISTANCE_PHASES.length);
  await expectReferralMarkers(page, true);
  await expect(page.locator('[data-kernel] [data-pain-marker]')).toHaveAttribute("data-pain-marker", "open");
  await flag.setChecked(false);
  await expect(page.locator("[data-kernel-phase]")).toHaveCount(0);
  await expectGathering(page, 0, false);
  await expectReferralMarkers(page, false);
  await page.clock.runFor(2000);
  await flag.setChecked(true);
  await page.clock.runFor(500);
  await flag.setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.locator("[data-assistance-host]")).toHaveAttribute("data-phase", "manual");
  await expect(page.locator("[data-pipeline-proposals]")).toHaveCount(0);
  await expectGathering(page, 0, false);
  await expectReferralMarkers(page, false);
  await expectCaseDThroughPhases(page);
  await flag.setChecked(false);
  await navigatePrimary(page, "Exception queue");
  await expect(page.locator("[data-queue-state]")).toHaveText(states);
});

test("all-abstained cohort never resolves a gathering or exact-fix marker during any phase", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./#month");
  await page.locator("[data-month-detail] > summary").click();
  await page.locator("#baseline-abstainPercent").fill("100");
  await pipeline(page);
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  for (let phase = 0; phase <= ASSISTANCE_PHASES.length; phase++) {
    await expectGathering(page, phase, false);
    await expectReferralMarkers(page, false);
    await expect(page.locator('[data-pipeline] [data-pain-marker="resolved"]')).toHaveCount(0);
    if (phase < ASSISTANCE_PHASES.length) await page.clock.runFor(ASSISTANCE_DURATION_MS / ASSISTANCE_PHASES.length);
  }
  await expectCaseDThroughPhases(page);
});

test("live reduced-motion changes finish presentation immediately without autonomous decisions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./#pipeline");
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-kernel-status]")).toContainText("Preparing assistance");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-kernel-status]")).toContainText("Evidence presentation ready");
  await expect(page.locator("[data-kernel-phase=complete]")).toHaveCount(5);
  await expectGathering(page, 5);
  await expectReferralMarkers(page, true);
  await page.getByRole("link", { name: "Review case B and decide" }).click();
  await startDemonstrationReview(page);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toBeVisible();
});

test("pipeline links and pain tooltips are keyboard accessible; Reset describes Off", async ({ page }) => {
  await page.goto("./#pipeline");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  const marker = page.locator('[data-pipeline-stage="2"] [data-pain-marker]');
  await marker.scrollIntoViewIfNeeded();
  await marker.focus();
  await expect(marker).toBeFocused();
  await expect(page.getByRole("tooltip")).toContainText("Handwriting uncertainty");
  for (const { key, label } of GATHERING_STEPS) {
    const stepMarker = page.locator(`[data-gathering-step="${key}"] [data-pain-marker]`);
    await stepMarker.scrollIntoViewIfNeeded();
    await stepMarker.focus();
    await expect(stepMarker).toBeFocused();
    // Radix retains the previous tooltip during its exit animation. Match the
    // focused marker's exact accessible name, not every closing tooltip.
    const tooltip = page.getByRole("tooltip", { name: label.replace(" minutes / item", ""), exact: true });
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(label.replace(" minutes / item", ""));
  }
  for (const [name, url] of [["Try the pharmacy check", /\/pharmacy$/], ["Review the exception queue", /\/queue$/], ["Review case B and decide", /\/case\/EX-24112$/]] as const) {
    const link = page.getByRole("link", { name, exact: true });
    await link.focus();
    await link.press("Enter");
    await expect(page).toHaveURL(url);
    await pipeline(page);
  }
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("turn Agent Off");
  await expect(page.getByRole("alertdialog")).not.toContainText("turn Agent on");
});

for (const { width, colorScheme } of [{ width: 360, colorScheme: "dark" }, { width: 1440, colorScheme: "light" }] as const) {
  for (const enabled of [false, true]) {
    test(`pipeline selected ${width} ${colorScheme} ${enabled ? "on" : "off"}: reflow and all-rules axe`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await page.goto("./#pipeline");
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await page.locator("main details").evaluateAll((els) => els.forEach((el) => el.setAttribute("open", "")));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const axe = await new AxeBuilder({ page }).analyze();
      await captureJson(testInfo, "axe-pipeline", axe);
      expect(axe.violations).toEqual([]);
      await captureCheckpoint(page, testInfo, `pipeline-${width}-${colorScheme}-${enabled ? "on" : "off"}`);
      await page.screenshot({ path: testInfo.outputPath(`pipeline-${width}-${colorScheme}-${enabled ? "on" : "off"}.png`), fullPage: true });
      for (const nextWidth of [320, 768, 1024]) {
        await page.setViewportSize({ width: nextWidth, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
    });
  }
}