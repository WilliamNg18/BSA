import AxeBuilder from "@axe-core/playwright";
import { captureJson, confirmReset, expect, test } from "./fixtures";
import { GATHERING_STEPS, MANUAL_LOOP_MONTH_DEFAULTS } from "../../src/lib/domain/baseline";
import { automaticCaseIds, cases, prepareCorrectedBReview, startDemonstrationReview } from "./operator-action-helpers";

for (const c of cases) {
  test(`Task6 ${c.id} manual trace and raw pack are not agent evidence`, async ({ page }) => {
    await page.goto(`case/${c.id}/trace`);
    const trace = page.getByRole("list", { name: "Manual gathering trace", exact: true });
    if (automaticCaseIds.includes(c.id)) {
      await expect(trace).toHaveCount(0);
      await expect(page.locator("[data-manual-total], [data-assisted-slot]")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Replay unavailable in manual comparison", exact: true })).toHaveCount(0);
    } else {
    await expect(trace.locator(":scope > li")).toHaveCount(7);
    for (const { key } of GATHERING_STEPS) {
      const step = trace.locator(`[data-manual-step="${key}"]`);
      await expect(step).toContainText("Human decision");
      await expect(step).toContainText("Part of the referral investigation; not additional time");
      await expect(step.locator("svg.lucide-timer")).toHaveCount(1);
      await expect(step.locator("[data-pain-marker]")).toHaveAttribute("data-pain-marker", "open");
    }
    await expect(page.locator("[data-manual-total]")).toContainText(`${MANUAL_LOOP_MONTH_DEFAULTS.gatheringMinutesToday} min / referred-back item`);
    await expect(page.getByText(`First judgement: ${MANUAL_LOOP_MONTH_DEFAULTS.judgingMinutesToday} minutes / referral-loop item · Assumption, not the whole-service Type 2 average.`, { exact: true })).toBeVisible();
    await expect(page.locator("[data-assisted-slot]")).toHaveCount(4);
    for (const slot of ["Clause", "Requirements", "Alternative", "Confidence"]) await expect(page.locator(`[data-assisted-slot="${slot}"]`)).toContainText("Not recorded");
    await expect(page.getByRole("button", { name: "Replay unavailable in manual comparison", exact: true })).toBeDisabled();
    }
    await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
    if (automaticCaseIds.includes(c.id)) {
      const prechecks = page.getByRole("list", { name: "Deterministic clearance trace" });
      await expect(prechecks.locator(":scope > li")).toHaveCount(2);
      await expect(prechecks).toContainText("Cleared by rules; agent not invoked");
      await expect(prechecks).not.toContainText("run_endorsement_checks");
    }
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Original machine-captured fields", exact: true })).toBeVisible();
    if (c.id !== "EX-24123") await expect(page.getByRole("main").locator("figure")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Applicable Drug Tariff provision", exact: true })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Confidence signals", exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Assisted fields not recorded", exact: true }).locator("[data-pain-marker]")).toHaveCount(4);
    if (c.id === "EX-24123") {
      const capturePain = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true }).locator("[data-pain-marker]");
      await expect(capturePain).toHaveCount(1);
      await expect(capturePain).toContainText("No guidance, experience only");
      await expect(capturePain).toHaveAttribute("data-pain-marker", "open");
    }
    await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(1);
    if (c.id !== "EX-24123" && !automaticCaseIds.includes(c.id)) {
      await startDemonstrationReview(page, c.id);
      await expect(page.getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(1);
      await expect(operatorDecision(page).getByRole("radio", { checked: true })).toHaveCount(0);
      await expect(page.getByRole("radio", { name: "Sufficient (human choice)", exact: true })).not.toBeChecked();
      await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveAttribute("aria-required", "true");
    }
    if (automaticCaseIds.includes(c.id)) {
      await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Shared case history", exact: true })).toContainText("existing rules engine");
    }
  });
}

for (const id of automaticCaseIds) for (const enabled of [false, true]) {
  test(`Task19 ${id} automatic pricing has only deterministic trace and no human approval, Agent ${enabled}`, async ({ page }) => {
    await page.goto(`case/${id}/trace`);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const trace = page.getByRole("list", { name: "Deterministic clearance trace", exact: true });
    await expect(trace.locator(":scope > li")).toHaveCount(2);
    await expect(trace).toContainText("Cleared by rules; agent not invoked");
    await expect(trace).not.toContainText("run_endorsement_checks");
    await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
    await expect(page.getByText("priced by NHSBSA's existing rules engine, no person involved. The agent was not invoked.", { exact: true })).toBeVisible();
    await expect(page.getByText("The agent's part is over. The rest is a person.", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Open case evidence", exact: true })).toHaveAttribute("href", `/case/${id}`);
    for (const name of ["Replay step by step", "Next step", "Show all", "Clear"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
    await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
    await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
  });
}

for (const label of ["Refer back", "Request information", "Escalate"]) {
  test(`Task6 manual ${label} requires reason and records NONE through valid lifecycle review`, async ({ page }) => {
    await page.goto("case/EX-24112");
    await startDemonstrationReview(page);
    await page.getByRole("radio", { name: label, exact: true }).check();
    const reason = page.getByLabel(outcome === "REQUEST_INFORMATION" ? "Question (required)" : "Reason (required)", { exact: true });
    for (const value of ["", "   1234567   "]) {
      await reason.fill(value);
      await operatorAction(page, outcome).click();
      await expect(page).toHaveURL(/\/case\/EX-24112$/);
      await expect(operatorDecision(page).getByRole("alert")).toHaveText(outcome === "REQUEST_INFORMATION"
        ? "Enter a question of at least eight characters." : "Enter a reason of at least eight characters.");
    }
    await reason.fill("Human review of captured evidence");
    if (label === "Refer back") await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
    await performDecision(page, outcome, { openAudit: true });
    await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
    await expect(page.getByText("No. Note: Human review of captured evidence", { exact: true })).toBeVisible();
    await expect(page.getByText("No recorded rule version to replay in this manual comparison", { exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
    await expect(page.getByText("No agent recommendation existed. The stored override flag is retained; correcting this counter requires Stream B integration.", { exact: true })).toHaveCount(0);
  });
}

for (const id of ["EX-24112", "SYN-FQ123-MISMATCH"]) {
  test(`manual sufficient cannot release unresolved source facts for ${id}`, async ({ page }) => {
    await startDemonstrationReview(page, id);
    await page.getByRole("radio", { name: /^Sufficient \(human choice\)/ }).check();
    await page.getByLabel("Reason (required)", { exact: true }).fill("Human choice cannot replace missing or conflicting source facts");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
    await expect(page.getByRole("alert").filter({ hasText: "Current source facts do not satisfy the release gate." })).toBeVisible();
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
    await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
  });
}

for (const enabled of [false, true]) {
  test(`corrected B requires a fresh human recheck before pricing, Agent ${enabled}`, async ({ page }) => {
    await prepareCorrectedBReview(page, enabled);
    await page.getByRole("radio", { name: enabled ? /^Accept the recommendation / : /^Sufficient \(human choice\)/ }).check();
    const reason = page.getByLabel("Reason (required)", { exact: true });
    for (const value of ["", "1234567", "   1234567   "]) {
      await reason.fill(value);
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: "A reason of at least eight characters is required for this decision." })).toBeVisible();
    }
    await reason.fill("Human reviewed the corrected endorsement date against the source");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
    await expect(page.locator("dl > div").filter({ has: page.getByText("Human decision", { exact: true }) }).locator("dd")).toContainText("ACCEPT by Demo operator");
    await expect(page.getByRole("main")).toContainText("Human reviewed the corrected endorsement date against the source");
    await page.locator("[data-original-records] > summary").click();
    await expect(page.locator("[data-original-records]")).toContainText("DR-000873: REFER BACK");
    await expect(page.locator("[data-original-records]")).toContainText("DR-000874: ACCEPT");
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  });
}

test("manual Sufficient cannot release missing evidence, but a reconciled correction can be human-released", async ({ page }) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("radio", { name: "Sufficient (human choice)", exact: true }).check();
  await page.getByLabel("Reason (required)", { exact: true }).fill("Human review cannot bypass missing evidence");
  await expect(operatorAction(page, "ACCEPT")).toBeDisabled();
  await expect(operatorDecision(page).getByText("Release unavailable: code gate", { exact: true })).toBeVisible();
  await page.goto("case/SYN-FQ123-RECHECK");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await page.getByRole("radio", { name: "Sufficient (human choice)", exact: true }).check();
  const reason = page.getByLabel("Reason (required)", { exact: true });
  for (const value of ["", "   1234567   "]) {
    await reason.fill(value);
    await expect(operatorAction(page, "ACCEPT")).toBeDisabled();
  }
  await reason.fill("Human review confirms the corrected dispensing date");
  await expect(operatorAction(page, "ACCEPT")).toBeEnabled();
  await performDecision(page, "ACCEPT", { releaseVerified: false });
  const status = page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status");
  await expect(status).toHaveText(MANUAL_RELEASE_LABELS.nhsbsa);
  await expect(status).not.toContainText("no operator action");
});

test("Task6 trace slots follow phases; Clear, Step and Show all never create a record", async ({ page }) => {
  await page.goto("case/EX-24112/trace");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("button", { name: "Replay step by step", exact: true }).click();
  for (let n = 1; n <= 9; n++) {
    if (n > 1) await page.getByRole("button", { name: "Next step", exact: true }).click();
    const clause = page.locator('[data-assisted-slot="Clause"]');
    const requirements = page.locator('[data-assisted-slot="Requirements"]');
    const alternative = page.locator('[data-assisted-slot="Alternative"]');
    if (n < 4) await expect(clause).toContainText("Not yet assembled");
    else await expect(clause.locator("blockquote")).toHaveCount(1);
    if (n < 6) await expect(requirements).toContainText("Not yet assembled");
    else await expect(requirements).toContainText("Dated: not met");
    if (n < 8) await expect(alternative).toContainText("Not yet assembled");
    else await expect(alternative).toContainText("Not permitted");
  }
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("list", { name: "Agent trace", exact: true }).locator(":scope > li")).toHaveCount(0);
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
});

test("Task6 full pack assembles in two seconds, with no decision pane before completion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.clock.install({ time: new Date("2026-09-11T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-11T12:00:10Z"));
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-pack-assembly]")).toHaveAttribute("data-pack-assembly", "0");
  await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
  await page.clock.runFor(333);
  await expect(page.getByRole("heading", { name: "EPS claim message", exact: true })).toBeVisible();
  await expect(page.getByRole("main").locator("figure")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toHaveCount(0);
  await page.clock.runFor(334);
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
  await page.clock.runFor(333);
  await expect(page.getByRole("heading", { name: "Applicable Drug Tariff provision", exact: true })).toBeVisible();
  await page.clock.runFor(999);
  await expect(page.locator("[data-pack-assembly]")).toHaveAttribute("data-pack-assembly", "5");
  await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(1);
});

test("Task6 live reduced motion cancels timers; Pause, Step, flag and route exit do not write history", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("case/EX-24112/trace");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.clock.install({ time: new Date("2026-09-11T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-11T12:00:10Z"));
  await page.getByRole("button", { name: "Replay step by step", exact: true }).click();
  const steps = page.getByRole("list", { name: "Agent trace", exact: true }).locator(":scope > li");
  await page.clock.runFor(222);
  await expect(steps).toHaveCount(1);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(2000);
  await expect(steps).toHaveCount(1);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  await expect(steps).toHaveCount(1);
  await page.clock.runFor(3000);
  await expect(steps).toHaveCount(1);
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(steps).toHaveCount(2);
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await page.clock.runFor(3000);
  await expect(steps).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Manual gathering trace" }).locator(":scope > li")).toHaveCount(7);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("button", { name: "Replay step by step", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
});

test("Task6 shared decision draft survives toggle, comparison and navigation; Reset clears it", async ({ page }) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  const flag = page.getByRole("banner").getByRole("switch");
  await page.getByRole("radio", { name: "Request information", exact: true }).check();
  await page.getByLabel("Question (required)", { exact: true }).fill("Keep this human decision draft");
  await flag.setChecked(true);
  await page.getByRole("button", { name: "Compare manual view", exact: true }).click();
  await expect(page.getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(1);
  await expect(operatorAction(page, "REQUEST_INFORMATION")).toHaveCount(1);
  await expect(page.getByRole("complementary", { name: "Read-only manual comparison" }).getByRole("textbox")).toHaveCount(0);
  await expect(page.getByLabel("Question (required)", { exact: true })).toHaveValue("Keep this human decision draft");
  await flag.setChecked(false);
  await expect(page.getByRole("radio", { name: "Request information", exact: true })).toBeChecked();
  await expect(page.getByLabel("Question (required)", { exact: true })).toHaveValue("Keep this human decision draft");
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Case-building trace", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
  await expect(page.getByLabel("Question (required)", { exact: true })).toHaveValue("Keep this human decision draft");
  await flag.setChecked(true);
  const status = page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status");
  const originalState = await status.innerText();
  await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
  const appliedNote = await page.getByLabel("Reason (required)", { exact: true }).inputValue();
  const appliedCode = await page.getByLabel("RB code (required)", { exact: true }).inputValue();
  expect(appliedNote).not.toBe("");
  for (const enabled of [false, true]) {
    await flag.setChecked(enabled);
    await expect(page.getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
    await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveValue(appliedNote);
    await expect(page.getByLabel("RB code (required)", { exact: true })).toHaveValue(appliedCode);
    await expect(operatorDecision(page).locator("[data-suggestion-applied]")).toBeVisible();
    await expect(status).toHaveText(originalState);
  }
  await confirmReset(page);
  await expect(flag).not.toBeChecked();
  await startDemonstrationReview(page);
  await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveValue("");
});

test("Task6 D keeps failed signals and unestablished reconciliation; A remains no-call On", async ({ page }) => {
  await page.goto("case/EX-24123");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("alert").locator("li")).toHaveCount(3);
  const signals = page.getByRole("list", { name: "Confidence signals", exact: true });
  await expect(signals.locator(":scope > li")).toHaveCount(5);
  await expect(signals.locator(".sr-only").filter({ hasText: ", failed" })).toHaveCount(4);
  const reconciliation = signals.getByRole("listitem").filter({ hasText: "Sources reconcile" });
  await expect(reconciliation).toContainText("Not established");
  await expect(reconciliation).not.toContainText(", satisfied");
  await expect(page.getByText("Reconciliation not established.", { exact: true })).toBeVisible();
  await expect(page.getByText("No detected conflict does not establish agreement. Missing, unreadable or unconfirmed fields still need evidence.", { exact: true })).toBeVisible();
  await expect(page.getByText("The sources agree.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Case built, awaiting operator", { exact: true })).toHaveCount(0);
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await page.goto("case/EX-24107/trace");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("list", { name: "Deterministic clearance trace", exact: true }).locator(":scope > li")).toHaveCount(2);
  await expect(page.getByText("Cleared by rules; agent not invoked", { exact: true })).toBeVisible();
  await expect(page.getByText("priced by NHSBSA's existing rules engine, no person involved. The agent was not invoked.", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Deterministic clearance trace", exact: true })).not.toContainText("run_endorsement_checks");
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
});

for (const screen of [{ name: "desktop", width: 1440, height: 1000, colorScheme: "light" }] as const) {
  for (const enabled of [false, true]) {
    for (const view of ["pack", "trace", "record"]) {
      test(`Task6 screenshot and all-rule axe ${view} ${screen.name} On=${enabled}`, async ({ page }, info) => {
        await page.setViewportSize({ width: screen.width, height: screen.height });
        await page.emulateMedia({ colorScheme: screen.colorScheme });
        await page.goto(`case/EX-24112${view === "pack" ? "" : `/${view}`}`);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        if (enabled && view === "pack") await page.getByRole("button", { name: "Compare manual view", exact: true }).click();
        await page.evaluate(() => document.fonts.ready);
        const axe = await new AxeBuilder({ page }).analyze();
        await captureJson(info, "task6-axe", axe);
        expect(axe.violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: info.outputPath(`${view}-${screen.name}-${enabled ? "on" : "off"}.png`), fullPage: true });
      });
    }
  }
}