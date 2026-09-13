import type { Page } from "@playwright/test";
import { audit, captureJson, captureView as captureCheckpoint, expect, test } from "./fixtures";
import { cases, confirmReset, navigatePrimary, staticRoutes } from "../e2e/fixtures";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";
import { MANUAL_LOOP_MONTH_DEFAULTS as PROCESS_MONTH_DEFAULTS, monthModel, formatProcessHours, formatProcessItems } from "../../src/lib/domain/baseline";
import { MANUAL_LOOP_METRICS } from "../../src/lib/domain/manual-loop-presentation";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { startDemonstrationReview } from "../e2e/lifecycle-helpers";
import { chooseProcessChapter, expandProcessInputs, expectProcessMetrics, expectSceneMetrics } from "../e2e/process-model-helpers";
import { confirmCompletePaper, openFourCases, submitCompletePaper } from "../e2e/paper-capture-helpers";
import { LIVE_CHECKS } from "./inventory";

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

async function expectUnconfirmedPaperEvidence(page: Page) {
  const reconciliation = page.getByRole("list", { name: "Confidence signals", exact: true })
    .getByRole("listitem").filter({ hasText: "Sources reconcile" });
  await expect(reconciliation).toBeVisible();
  await expect(reconciliation).toContainText("Not established");
  await expect(reconciliation).not.toContainText("Agree");
  await expect(reconciliation).not.toContainText(", satisfied");
  await expect(page.getByText("Reconciliation not established.", { exact: true })).toBeVisible();
  await expect(page.getByText("No detected conflict does not establish agreement. Missing, unreadable or unconfirmed fields still need evidence.", { exact: true })).toBeVisible();
  await expect(page.getByText("The sources agree.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Case built, awaiting operator", { exact: true })).toHaveCount(0);
}

test(LIVE_CHECKS.root, async ({ page }, info) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Most items need no person", exact: true })).toBeVisible();
  await expect(flag(page)).not.toBeChecked();
  await expect(page.locator("[data-key-figure]")).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "Guided tour" })).toContainText("1/8");
  await expect(page.locator("[data-principle]")).toContainText("A human decides");
  await audit(page, info, "overview", false);
  await captureCheckpoint(page, info, "overview-off");
});

test(LIVE_CHECKS.routes, async ({ page }, info) => {
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

test(LIVE_CHECKS.model, async ({ page }, info) => {
  await page.goto("/#month");
  await expandProcessInputs(page);
  await page.getByRole("textbox", { name: "Items in the monthly referral loop", exact: true }).fill("120");
  await page.getByRole("textbox", { name: "Today gathering minutes per item", exact: true }).fill("5");
  await page.getByRole("textbox", { name: "Pharmacy MYS minutes per referral", exact: true }).fill("7");
  const input = { ...PROCESS_MONTH_DEFAULTS, manualLoopItems: 120, gatheringMinutesToday: 5, mysCompletionMinutes: 7 };
  const expected = monthModel(input);
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    await expectProcessMetrics(page, input, enabled);
    await audit(page, info, "edited-process-model", enabled);
    await chooseProcessChapter(page, 1);
    await expectSceneMetrics(page, input, enabled);
    await chooseProcessChapter(page, 2);
  }
  await navigatePrimary(page, "NHSBSA queue");
  for (const { key, format } of MANUAL_LOOP_METRICS) {
    await expect(page.locator(`[data-projection-metric="${key}"]`))
      .toHaveText(`${format(expected.today[key])} / ${format(expected.withAgent[key])} (estimate)`);
  }
  await navigatePrimary(page, "Pharmacy claims");
  const projection = page.getByRole("region", { name: "Shared monthly process projection", exact: true });
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    for (const key of ["referredBackItems", "operatorHours", "pharmacyCompletionHours"] as const) {
      await expect(projection.locator(`[data-pharmacy-model="${key}"]`))
        .toHaveText(`${(key.endsWith("Hours") ? formatProcessHours : formatProcessItems)(expected[enabled ? "withAgent" : "today"][key])}${enabled ? " (estimate)" : ""}`);
    }
    await expect(projection.locator('[data-pharmacy-model="prevented"]')).toHaveText(enabled ? `${formatProcessItems(expected.cohorts.prevented)} (estimate)` : "0");
  }
  await captureJson(info, "shared-month-inputs", { input, expected });
});

test(LIVE_CHECKS.cards, async ({ page }, info) => {
  for (const [index, scenario] of ["A", "B", "C", "D"].entries()) {
    await page.goto("/#cases");
    await flag(page).setChecked(true);
    const cards = page.getByRole("list", { name: "Four canonical synthetic cases" });
    await expect(cards.locator(":scope > li")).toHaveCount(4);
    const card = cards.locator(`[data-case="${scenario}"]`);
    await expect(card).toHaveAttribute("data-case-routing",
      scenario === "A" ? "auto_priced" : scenario === "B" ? "referred_back" : scenario === "C" ? "type2_endorsement" : "type1_capture");
    if (scenario === "A") await audit(page, info, "canonical-case-cards", true);
    if (scenario === "A") {
      await expect(card.locator("[data-outcome], [data-manual-tasks]")).toHaveCount(0);
      await card.getByRole("link", { name: "View automatically priced claim", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
      await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
      await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    } else {
      if (scenario === "D") await expect(card.locator("[data-outcome]")).toHaveCount(0);
      else await expect(card.locator("[data-outcome]")).toHaveText(scenario === "B" ? "REFER_BACK" : "REQUEST_INFORMATION");
      await card.getByRole("link", { name: `Open case ${scenario}`, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(`/case/${cases[index].id}$`));
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Case-building trace", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${cases[index].id}/trace$`));
    if (scenario === "A") {
      await expect(page.getByRole("list", { name: "Deterministic clearance trace", exact: true }).locator(":scope > li")).toHaveCount(2);
      await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
    } else {
      await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toBeVisible();
    }
  }
});

test(LIVE_CHECKS.pharmacy, async ({ page }, info) => {
  const scenarios = [
    { label: "Complete endorsement", status: "Complete: will flow to automated pricing" },
    { label: "Information missing", status: "Information may be missing" },
    { label: "Unreadable form", status: "Agent unable to determine" },
  ];
  await page.goto("/pharmacy");
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    for (const scenario of scenarios) {
      await page.getByRole("radio", { name: scenario.label, exact: true }).click();
      await expect(page.getByRole("radio", { name: scenario.label === "Unreadable form" ? "Paper" : "EPS", exact: true })).toBeChecked();
      await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled ? scenario.status : "Not checked: manual submission");
      await expect(page.getByRole("button", { name: "Continue with submission", exact: true })).toBeEnabled();
      await captureCheckpoint(page, info, `pharmacy-${scenario.label.replaceAll(" ", "-")}-${enabled ? "on" : "off"}`);
    }
    await audit(page, info, "pharmacy", enabled);
  }
});

test(LIVE_CHECKS.claims, async ({ page }, info) => {
  await page.goto("/pharmacy/claims");
  const list = page.getByRole("table", { name: "Pharmacy claims", exact: true });
  await expect(list.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true })).toBeVisible();
  await list.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true }).click();
  await expect(detail(page).getByRole("heading", { name: `Claim detail: ${B}`, exact: true })).toBeVisible();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
  await expect(history(page)).toBeVisible();
  for (const enabled of [false, true]) {
    await flag(page).setChecked(enabled);
    await expect(page.getByRole("group", { name: "Claim filters", exact: true })).toBeVisible();
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
    await audit(page, info, "claims", enabled);
  }
});

test(LIVE_CHECKS.queue, async ({ page }, info) => {
  await page.goto("/queue");
  const table = page.getByRole("region", { name: "Type 2 items", exact: true });
  await expect(table.locator("thead th")).toHaveCount(6);
  const rows = page.locator("[data-case-id]");
  const recorded = () => rows.evaluateAll((items) => items.map((row) => ({
    id: row.getAttribute("data-case-id"), evidence: Array.from(row.querySelectorAll("td")).slice(0, 4).map((cell) => cell.textContent),
  })));
  const before = await recorded();
  expect(before.length).toBeGreaterThan(0);
  const model = monthModel(PROCESS_MONTH_DEFAULTS);
  const summary = page.locator("[data-queue-month-summary]");
  for (const enabled of [true, false]) {
    await flag(page).setChecked(enabled);
    expect(await recorded()).toEqual(before);
    for (const id of ["EX-24107", "EX-24101", "EX-24123"]) await expect(page.locator(`[data-case-id="${id}"]`)).toHaveCount(0);
    await expect(page.locator('[data-type1-case="EX-24123"]')).toBeVisible();
    for (const [label, key] of [
      ["Type 2 operator hours", "type2OperatorHours"], ["Referred-back operator hours", "referralOperatorHours"],
      ["Pharmacy completion hours", "pharmacyCompletionHours"], ["Items referred back", "referredBackItems"],
    ] as const) {
      const format = key === "referredBackItems" ? formatProcessItems : formatProcessHours;
      await expect(summary.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd"))
        .toHaveText(`${format(model.today[key])} / ${format(model.withAgent[key])}`);
    }
    await audit(page, info, "actual-worklist", enabled);
  }
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toHaveCount(0);
  await expect(page.locator("[data-comparison-clock]")).toHaveCount(0);
});

test(LIVE_CHECKS.roundtrip, async ({ page }, info) => {
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
      await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
      if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
      await page.getByRole("textbox", { name: /^Reason/ }).fill("Please add the dispensing date beside the initials");
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await audit(page, info, "human-referral-record", enabled);
      await followed(page).getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
      const originalEvents = await history(page).locator('ol[aria-label="Lifecycle events"] > li').allTextContents();
      expect(originalEvents.length).toBeGreaterThan(0);
      if (enabled) {
        await expect(detail(page).getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
        await expect(detail(page).getByRole("region", { name: "Operator-approved pharmacy note" }))
          .not.toContainText("Please add the dispensing date beside the initials");
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        await expect(detail(page)).toContainText("Ready to resubmit");
      } else {
        await expect(detail(page)).toContainText("Please add the dispensing date beside the initials");
        await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
      }
      await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
      await followed(page).getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
      await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
      await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).toHaveCount(0);
      await expect(history(page)).toContainText(LIFECYCLE_LABELS.paid.nhsbsa.on);
      await followed(page).getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
      await history(page).locator("summary").first().click();
      const attempts = history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li");
      await expect(attempts).toHaveCount(3);
      await expect(attempts.nth(1)).not.toContainText("NCSO  RK 21/08/26");
      await expect(attempts.nth(2)).toContainText("NCSO  RK 21/08/26");
      await expect(attempts.nth(2)).toContainText(enabled ? "ready · scripted" : "not_checked · off");
      const events = history(page).getByRole("list", { name: "Lifecycle events", exact: true });
      expect((await events.locator(":scope > li").allTextContents()).slice(0, originalEvents.length)).toEqual(originalEvents);
      await expect(events.getByText("Human decision recorded (synthetic).", { exact: true })).toHaveCount(1);
      await audit(page, info, "corrected-eps-paid-history", enabled);
      await captureJson(info, `roundtrip-${enabled ? "on" : "off"}`, { url: page.url(), history: await history(page).innerText() });
      await confirmReset(page);
      await expect(flag(page)).not.toBeChecked();
      await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
    });
  }
});

test(LIVE_CHECKS.paper, async ({ page }, info) => {
  for (const enabled of [false, true]) {
    await page.goto("/case/EX-24123");
    await flag(page).setChecked(enabled);
    const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
    await expect(capture).toBeVisible();
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    if (enabled) {
      const reasons = page.getByRole("alert").filter({ hasText: "The agent abstained" }).locator("li");
      await expect(reasons).toHaveText(runAgent(CASES[3], { agentEnabled: true }).abstainReasons);
      await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
      await expect(capture).toContainText("declared by the pharmacy, not read from the form");
      await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
      await expect(capture.getByRole("alert")).toContainText("Reconcile the declaration with the paper");
      await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the paper", exact: true }).check();
    } else {
      for (const name of ["Product code", "Quantity", "Endorsement", "Prescriber"]) {
        await expect(capture.getByRole("textbox", { name, exact: true })).toHaveValue("");
      }
    }
    if (enabled) await expectUnconfirmedPaperEvidence(page);
    await audit(page, info, "unconfirmed-capture", enabled);
    await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: /^Refer back / }).check();
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
    await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human requests pharmacy confirmation of the product presentation");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/EX-24123\/record$/);
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(detail(page)).toContainText("RB2B");
    await history(page).locator("summary").first().click();
    const attempts = history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).locator(":scope > li");
    const events = history(page).getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
    const originalAttempts = await attempts.allTextContents();
    const originalEvents = await events.allTextContents();
    expect(originalAttempts).toHaveLength(1);
    for (const [name, value] of [
      ["Declared product code", "SYN-COCOD-100"], ["Declared quantity", "100"],
      ["Declared prescriber (synthetic)", "Dr Demo (synthetic)"], ["Corrected endorsement", "NCSO AB 27/08/26"],
    ]) {
      await page.getByRole(name === "Declared quantity" ? "spinbutton" : "textbox", { name, exact: true }).fill(value);
    }
    await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    await expect(attempts).toHaveCount(2);
    expect((await attempts.allTextContents()).slice(0, originalAttempts.length)).toEqual(originalAttempts);
    expect((await events.allTextContents()).slice(0, originalEvents.length)).toEqual(originalEvents);
    await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(capture).toBeVisible();
    await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    if (enabled) {
      await expect(capture.getByRole("checkbox", { name: "I have reconciled the declaration with the paper", exact: true })).not.toBeChecked();
      await expectUnconfirmedPaperEvidence(page);
    }
    await captureCheckpoint(page, info, `d-fresh-capture-after-referral-${enabled ? "on" : "off"}`);
  }
});

test(LIVE_CHECKS.deterministic, async ({ page }, info) => {
  await page.goto("/case/EX-24101/trace");
  await flag(page).setChecked(true);
  const trace = page.getByRole("list", { name: "Deterministic clearance trace", exact: true });
  await expect(trace.locator(":scope > li")).toHaveCount(2);
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
  await expect(page.getByText("Cleared by rules; agent not invoked", { exact: true })).toBeVisible();
  await expect(page.getByText("Priced by NHSBSA's existing rules engine; no person involved. The agent was not invoked.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open case evidence", exact: true })).toHaveAttribute("href", "/case/EX-24101");
  await expect(page.getByText("The agent's part is over. The rest is a person.", { exact: true })).toHaveCount(0);
  await expect(trace).not.toContainText("run_endorsement_checks");
  await audit(page, info, "deterministic-e-trace", true);
});

test(LIVE_CHECKS.replay, async ({ page }, info) => {
  await page.goto("/case/EX-24112");
  await startDemonstrationReview(page);
  await flag(page).setChecked(true);
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
  await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
  const replay = page.getByRole("combobox", { name: "Replay with", exact: true });
  await replay.selectOption("2026-07");
  await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText("Sufficient: release to pricing once confirmed");
  await captureCheckpoint(page, info, "b-july-replay");
  await replay.selectOption("2026-08");
  await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText("Refer back with the exact fix");
  await captureCheckpoint(page, info, "b-august-replay");
});

test(LIVE_CHECKS.deepLinks, async ({ page }, info) => {
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

test(LIVE_CHECKS.reset, async ({ page }) => {
  await page.goto("/#month");
  await expandProcessInputs(page);
  await page.getByRole("textbox", { name: "Items in the monthly referral loop", exact: true }).fill("120");
  await flag(page).setChecked(true);
  await navigatePrimary(page, "Pharmacy claims");
  await page.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true }).click();
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
  await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
  await confirmReset(page);
  await expect(flag(page)).not.toBeChecked();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
  await history(page).locator("summary").first().click();
  await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li")).toHaveCount(1);
  await navigatePrimary(page, "Overview");
  await chooseProcessChapter(page, 2);
  await expandProcessInputs(page);
  await expect(page.getByRole("textbox", { name: "Items in the monthly referral loop", exact: true })).toHaveValue(String(PROCESS_MONTH_DEFAULTS.manualLoopItems));
  await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, false);
});

test(LIVE_CHECKS.conflict, async ({ page }, info) => {
  for (const enabled of [false, true]) {
    await page.goto("/case/EX-24119");
    await flag(page).setChecked(enabled);
    await startDemonstrationReview(page);
    await page.getByRole("radio", { name: /^Request information / }).check();
    await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Please confirm both conflicting quantities against the synthetic form");
    if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/EX-24119\/record$/);
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    const confirmation = page.getByRole("region", { name: "Requested confirmation", exact: true });
    for (const [label, value] of [["Captured form quantity", "56"], ["Claim ledger quantity", "84"]]) {
      await expect(confirmation.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd")).toHaveText(value);
    }
    await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Pharmacy text is required" })).toBeVisible();
    const text = "The form says 56 while the claim ledger says 84; please review both values";
    await page.getByRole("textbox", { name: "Pharmacy confirmation", exact: true }).fill(text);
    await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    await history(page).locator("summary").first().click();
    await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true })).toContainText(text);
    await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
    await expect(history(page)).toContainText(LIFECYCLE_LABELS.resubmitted.nhsbsa[enabled ? "on" : "off"]);
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    await expect(page.getByRole("main")).toContainText("56");
    await expect(page.getByRole("main")).toContainText("84");
    if (enabled) await expect(page.getByRole("radio", { name: /^Request information \(as recommended\)/ })).toBeChecked();
    await captureCheckpoint(page, info, `c-confirmation-still-conflicted-${enabled ? "on" : "off"}`);
  }
});

test(LIVE_CHECKS.historical, async ({ page }, info) => {
  await page.goto("/case/EX-24088/record");
  await expect(page.getByRole("heading", { name: "Record DR-000871", exact: true })).toBeVisible();
  const records = page.locator("[data-original-records]");
  await records.locator("summary").click();
  const original = await records.innerText();
  expect(original).toContain("DR-000871");
  expect(original).toContain("2026-08");
  const replay = page.getByRole("combobox", { name: "Replay with", exact: true });
  for (const enabled of [true, false, true]) {
    await flag(page).setChecked(enabled);
    await expect(records).toHaveText(original, { useInnerText: true });
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    if (enabled) {
      for (const month of ["2026-07", "2026-08"]) {
        await replay.selectOption(month);
        await expect(records).toHaveText(original, { useInnerText: true });
        await expect(page.getByRole("heading", { name: "Record DR-000871", exact: true })).toBeVisible();
      }
    } else {
      await expect(replay).toBeDisabled();
      await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveCount(0);
    }
  }
  await captureJson(info, "f-original-record-retained", { record: original, url: page.url() });
  await audit(page, info, "historical-f-record", true);
});

test(LIVE_CHECKS.completedCapture, async ({ page }, info) => {
  const action = async (_label: string, _side: "Pharmacy" | "NHSBSA", perform: () => Promise<void>) => perform();
  for (const enabled of [false, true]) {
    await page.goto("/pharmacy");
    await flag(page).setChecked(enabled);
    await submitCompletePaper(page, action);
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await history(page).locator("summary").first().click();
    const attempts = history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).locator(":scope > li");
    const events = history(page).getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
    const originalAttempts = await attempts.allTextContents();
    const originalEvents = await events.allTextContents();
    expect(originalAttempts).toHaveLength(2);

    await confirmCompletePaper(page, enabled, action);
    await page.getByRole("button", { name: /^Decided/ }).click();
    await expect(page.getByRole("region", { name: "Completed Type 1 captures", exact: true })).toContainText("Human capture confirmed");
    await expect(page.getByRole("region", { name: "Type 2 items", exact: true })).not.toContainText(B);
    for (const id of [B, "EX-24107", "EX-24101"]) {
      await expect(page.locator(`[data-case-id="${id}"]`)).toHaveCount(0);
    }
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    await audit(page, info, "completed-type1-queue", enabled);
    await captureCheckpoint(page, info, `completed-type1-queue-${enabled ? "on" : "off"}`);

    await openFourCases(page);
    const card = page.locator('[data-case="B"]');
    for (const current of [!enabled, enabled]) {
      await flag(page).setChecked(current);
      await expect(card).toHaveAttribute("data-case-routing", "type1_capture");
      await expect(card).toHaveAttribute("data-case-capture", "complete");
      await expect(card.getByRole("region", { name: "Completed Type 1 capture", exact: true })).toContainText("Capture complete · Existing pricing");
      await expect(card).toContainText("A person confirmed the captured fields");
      await expect(card).not.toContainText("Awaiting Type 1 capture");
      await expect(card).not.toContainText("no person involved");
      await expect(card.getByRole("link", { name: "Open case", exact: true })).toHaveCount(0);
    }
    await audit(page, info, "completed-type1-card", enabled);
    await captureCheckpoint(page, info, `completed-type1-card-${enabled ? "on" : "off"}`);
    await card.getByRole("link", { name: "View priced claim", exact: true }).click();
    await expect(detail(page)).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
    await history(page).locator("summary").first().click();
    expect(await attempts.allTextContents()).toEqual(originalAttempts);
    const completeEvents = await events.allTextContents();
    expect(completeEvents.slice(0, originalEvents.length)).toEqual(originalEvents);
    expect(completeEvents).toHaveLength(originalEvents.length + 2);
    await expect(events).toContainText(["Human capture confirmed; code routed the captured fields."]);
    await captureJson(info, `completed-type1-retained-history-${enabled ? "on" : "off"}`, { attempts: originalAttempts, events: completeEvents });
  }
});
