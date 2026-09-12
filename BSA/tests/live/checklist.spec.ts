import type { Page } from "@playwright/test";
import { audit, captureJson, expect, test } from "./fixtures";
import { cases, captureCheckpoint, confirmReset, navigatePrimary, staticRoutes } from "../e2e/fixtures";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";
import { MONTH_MODEL_DEFAULTS, monthModel, formatBaselineNumber } from "../../src/lib/domain/baseline";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { startDemonstrationReview } from "../e2e/lifecycle-helpers";

const flag = (page: Page) => page.getByRole("banner").getByRole("switch");
const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
const detail = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });
const followed = (page: Page) => page.getByRole("region", { name: "Followed item", exact: true });
const B = "EX-24112";
const routes = [...new Set([
  ...staticRoutes.map((route) => `/${route.path}`),
  ...TOUR_STOPS.map((stop) => stop.to),
  ...cases.flatMap((c) => [`/case/${c.id}`, `/case/${c.id}/trace`, `/case/${c.id}/record`]),
])];

test("01 Root Overview starts Agent Off and serves the approved build", async ({ page }, info) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "The referred-back subset", exact: true })).toBeVisible();
  await expect(flag(page)).not.toBeChecked();
  await expect(page.locator("[data-key-figure]")).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "Guided tour" })).toContainText("1/8");
  await expect(page.locator("[data-principle]")).toContainText("A human decides");
  await audit(page, info, "overview", false);
  await captureCheckpoint(page, info, "overview-off");
});

test("02 Every current route toggles On and back Off without errors", async ({ page }, info) => {
  for (const route of routes) {
    await test.step(route, async () => {
      await page.goto(route);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
      for (const enabled of [true, false]) {
        await flag(page).setChecked(enabled);
        await expect(flag(page)).toBeChecked({ checked: enabled });
        await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator("[data-principle]")).toContainText("A human decides");
      }
    });
  }
  await captureJson(info, "routes-visited", routes);
  await page.goto("/");
  await flag(page).setChecked(true);
  await audit(page, info, "overview", true);
});

test("03 Three monthly inputs update both headline tiles and shared Scene figures", async ({ page }, info) => {
  await page.goto("/#month");
  await page.getByLabel("Items reaching the exception queue each month", { exact: true }).fill("120");
  await page.getByLabel("Minutes an operator spends per item today", { exact: true }).fill("15");
  await page.getByLabel("Minutes an operator spends judging a case the agent has built", { exact: true }).fill("3");
  const input = { ...MONTH_MODEL_DEFAULTS, volume: 120, todayMinutes: 15, judgingMinutes: 3 };
  const expected = monthModel(input);
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    const hours = formatBaselineNumber(enabled ? expected.withAgent.operatorHours : expected.today.operatorHours, 1);
    const capacity = formatBaselineNumber(enabled ? expected.capacity.withAgent : expected.capacity.today, 1);
    await expect(page.locator("[data-month-hours]")).toHaveText(hours);
    await expect(page.locator("[data-month-capacity]")).toHaveText(capacity);
    await navigatePrimary(page, "Overview");
    await expect(page.locator("[data-scene-volume]")).toHaveText("120");
    await expect(page.locator("[data-scene-hours]")).toHaveText(hours);
    await expect(page.locator("[data-scene-capacity]")).toHaveText(capacity);
    await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
  }
  await captureJson(info, "shared-month-inputs", { input, expected });
});

test("04 Four case cards open their matching case packs and traces", async ({ page }) => {
  for (const [index, scenario] of ["A", "B", "C", "D"].entries()) {
    await page.goto("/#cases");
    await flag(page).setChecked(true);
    const cards = page.getByRole("list", { name: "Four canonical synthetic cases" });
    await expect(cards.locator(":scope > li")).toHaveCount(4);
    await expect(cards.locator("[data-outcome]")).toHaveText(["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION", "ABSTAIN"]);
    await cards.getByRole("link", { name: `Open case ${scenario}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${cases[index].id}$`));
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Case-building trace", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${cases[index].id}/trace$`));
    await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toBeVisible();
  }
});

test("05 Three pharmacy scenarios remain advisory in both modes", async ({ page }, info) => {
  const scenarios = [
    { label: "Complete endorsement", status: "Ready to submit" },
    { label: "Information missing", status: "Information may be missing" },
    { label: "Unreadable form", status: "Agent unable to determine" },
  ];
  await page.goto("/pharmacy");
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    for (const scenario of scenarios) {
      await page.getByRole("radio", { name: scenario.label, exact: true }).click();
      await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled ? scenario.status : "Not checked: manual submission");
      await expect(page.getByRole("button", { name: "Continue with submission", exact: true })).toBeEnabled();
    }
    await audit(page, info, "pharmacy", enabled);
  }
});

test("06 Claims seed list opens a matching seeded claim and history", async ({ page }, info) => {
  await page.goto("/pharmacy/claims");
  const list = page.getByRole("table", { name: "Pharmacy claims", exact: true });
  await expect(list.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true })).toBeVisible();
  await list.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true }).click();
  await expect(detail(page).getByRole("heading", { name: `Claim detail: ${B}`, exact: true })).toBeVisible();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
  await expect(history(page)).toBeVisible();
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
    await audit(page, info, "claims", enabled);
  }
});

test("07 Queue bounded window and one-hour comparison preserve recorded states", async ({ page }) => {
  await page.goto("/queue");
  const table = page.getByRole("region", { name: "Exception queue table", exact: true });
  await expect(table.locator("thead th")).toHaveCount(6);
  await expect(table.locator("tbody tr")).toHaveCount(50);
  const counter = page.locator("[data-queue-counter]");
  await expect(counter).toContainText("showing 1 to 50 of ");
  const states = await table.locator("[data-recorded-state]").evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-recorded-state")));
  await page.getByRole("button", { name: "Next 50", exact: true }).click();
  await expect(counter).toContainText("showing 51 to 100 of ");
  await expect(table.locator("tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: "First items", exact: true }).click();
  await flag(page).setChecked(true);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "Run one hour", exact: true }).click();
  await expect(page.locator("[data-comparison-clock]")).toHaveText("60 synthetic minutes · Stopped", { timeout: 15_000 });
  const today = Number(await page.locator('[data-comparison-summary="today"] dd').nth(1).innerText());
  const assisted = Number(await page.locator('[data-comparison-summary="assisted"] dd').nth(1).innerText());
  expect(assisted).toBeGreaterThan(today);
  await page.getByRole("button", { name: "Close comparison", exact: true }).click();
  await flag(page).setChecked(false);
  expect(await table.locator("[data-recorded-state]").evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-recorded-state")))).toEqual(states);
});

test("08 Full Off then On round trips retain Follow and Switch side", async ({ page }, info) => {
  for (const enabled of [false, true]) {
    await test.step(`Agent ${enabled ? "On" : "Off"}`, async () => {
      await page.goto("/pharmacy");
      await flag(page).setChecked(enabled);
      await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
      await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.submitted.pharmacy);
      await history(page).getByRole("button", { name: "Follow this case", exact: true }).click();
      await followed(page).getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
      await page.getByRole("button", { name: "Start review", exact: true }).click();
      await page.getByRole("radio", { name: /^Refer back / }).check();
      if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
      await page.getByRole("textbox", { name: /^Reason/ }).fill("Please add the dispensing date beside the initials");
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await followed(page).getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
      if (enabled) {
        await expect(detail(page).getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
        await expect(detail(page)).not.toContainText("Please add the dispensing date beside the initials");
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        await expect(detail(page)).toContainText("Ready to resubmit");
      } else {
        await expect(detail(page)).toContainText("Please add the dispensing date beside the initials");
        await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
      }
      await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.resubmitted.pharmacy);
      await followed(page).getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
      await page.getByRole("button", { name: "Start review", exact: true }).click();
      if (!enabled) await page.getByRole("radio", { name: /^Sufficient \(human choice\)/ }).check();
      else await expect(page.getByRole("radio", { name: /^Accept / })).toBeChecked();
      await page.getByRole("textbox", { name: /^Reason/ }).fill("Human reviewed the corrected date and complete evidence");
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await expect(history(page)).toContainText(LIFECYCLE_LABELS.paid.nhsbsa.on);
      await followed(page).getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
      await history(page).locator("summary").first().click();
      const attempts = history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li");
      await expect(attempts).toHaveCount(3);
      await expect(attempts.nth(1)).not.toContainText("NCSO  RK 21/08/26");
      await expect(attempts.nth(2)).toContainText("NCSO  RK 21/08/26");
      await expect(attempts.nth(2)).toContainText(enabled ? "ready · scripted" : "not_checked · off");
      await captureJson(info, `roundtrip-${enabled ? "on" : "off"}`, { url: page.url(), history: await history(page).innerText() });
      await confirmReset(page);
      await expect(flag(page)).not.toBeChecked();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
    });
  }
});

test("09 Case D retains three abstention reasons and gate NOT RUN", async ({ page }) => {
  await page.goto("/case/EX-24123");
  await flag(page).setChecked(true);
  const reasons = page.getByRole("alert").filter({ hasText: "The agent abstained" }).locator("li");
  await expect(reasons).toHaveCount(3);
  await expect(reasons).toHaveText(runAgent(CASES[3], { agentEnabled: true }).abstainReasons);
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  const signals = page.getByRole("list", { name: "Confidence signals", exact: true });
  await expect(signals.locator(":scope > li")).toHaveCount(5);
  await expect(signals.locator(".sr-only").filter({ hasText: ", failed" })).toHaveCount(4);
});

test("10 Case E remains deterministic without an agent call", async ({ page }) => {
  await page.goto("/case/EX-24101/trace");
  await flag(page).setChecked(true);
  const trace = page.getByRole("list", { name: "Agent trace", exact: true });
  await expect(trace.locator(":scope > li")).toHaveCount(2);
  await expect(page.getByText("Cleared by rules; agent not invoked", { exact: true })).toBeVisible();
  await expect(trace).not.toContainText("run_endorsement_checks");
});

test("11 Case B July replay is Sufficient while August refers back", async ({ page }) => {
  await page.goto("/case/EX-24112");
  await startDemonstrationReview(page);
  await flag(page).setChecked(true);
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
  const replay = page.getByRole("combobox", { name: "Replay with", exact: true });
  await replay.selectOption("2026-07");
  await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText("Sufficient: release to pricing once confirmed");
  await replay.selectOption("2026-08");
  await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText("Refer back with the exact fix");
});

test("12 Six root deep links return the application with strict headers", async ({ page }, info) => {
  const links = ["/pharmacy", "/pharmacy/claims", "/queue", "/case/EX-24112", "/case/EX-24112/trace", "/case/EX-24112/record"];
  const evidence = [];
  for (const path of links) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const headers = response!.headers();
    expect(headers["content-type"]).toContain("text/html");
    expect(headers["cache-control"]).toContain("no-store");
    expect(headers["content-security-policy"]).toContain("script-src 'self'");
    expect(headers["content-security-policy"]).not.toContain("'unsafe-inline'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    await expect(page).toHaveURL((url) => url.pathname === path);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    evidence.push({ path, url: page.url(), status: response!.status(), checkedAt: new Date().toISOString(), headers });
  }
  await captureJson(info, "six-root-deep-links", evidence);
});

test("13 Reset restores seeded claims, calculator and Agent Off", async ({ page }) => {
  await page.goto("/#month");
  await page.getByLabel("Items reaching the exception queue each month", { exact: true }).fill("120");
  await flag(page).setChecked(true);
  await navigatePrimary(page, "Pharmacy claims");
  await page.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true }).click();
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
  await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.resubmitted.pharmacy);
  await confirmReset(page);
  await expect(flag(page)).not.toBeChecked();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
  await history(page).locator("summary").first().click();
  await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li")).toHaveCount(1);
  await navigatePrimary(page, "Overview");
  await page.getByRole("link", { name: "Edit scenario assumptions", exact: true }).click();
  await expect(page.getByLabel("Items reaching the exception queue each month", { exact: true })).toHaveValue(String(MONTH_MODEL_DEFAULTS.volume));
});
