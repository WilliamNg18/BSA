import AxeBuilder from "@axe-core/playwright";
import { captureJson, cases, confirmReset, expect, test } from "./fixtures";
import { GATHERING_STEPS, BASELINE_DEFAULTS } from "../../src/lib/domain/baseline";

for (const c of cases) {
  test(`Task6 ${c.id} manual trace and raw pack are not agent evidence`, async ({ page }) => {
    await page.goto(`case/${c.id}/trace`);
    const trace = page.getByRole("list", { name: "Manual gathering trace", exact: true });
    await expect(trace.locator(":scope > li")).toHaveCount(7);
    for (const { key } of GATHERING_STEPS) {
      const step = trace.locator(`[data-manual-step="${key}"]`);
      await expect(step).toContainText("Human decision");
      await expect(step).toContainText(`${BASELINE_DEFAULTS[key]} min`);
      await expect(step.locator("svg.lucide-timer")).toHaveCount(1);
      await expect(step.locator("[data-pain-marker]")).toHaveAttribute("data-pain-marker", "open");
    }
    await expect(page.locator("[data-manual-total]")).toContainText("5 min / item");
    await expect(page.locator("[data-assisted-slot]")).toHaveCount(4);
    for (const slot of ["Clause", "Requirements", "Alternative", "Confidence"]) await expect(page.locator(`[data-assisted-slot="${slot}"]`)).toContainText("Not recorded");
    await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Replay unavailable in manual comparison", exact: true })).toBeDisabled();
    if (c.id === "EX-24101") {
      const prechecks = page.getByRole("list", { name: "Deterministic clearance trace" });
      await expect(prechecks.locator(":scope > li")).toHaveCount(2);
      await expect(prechecks).toContainText("Cleared by rules; agent not invoked");
      await expect(prechecks).not.toContainText("run_endorsement_checks");
    }
    await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Raw captured fields", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Applicable Drug Tariff provision", exact: true })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Confidence signals", exact: true })).toHaveCount(0);
    await expect(page.locator("[data-pain-marker]")).toHaveCount(4);
    await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(1);
    if (c.id !== "EX-24088") {
      await expect(page.getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(1);
      await expect(page.getByRole("radio", { name: /^Escalate / })).toBeChecked();
      await expect(page.getByRole("radio", { name: /^Sufficient \(human choice\)/ })).not.toBeChecked();
      await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveAttribute("aria-required", "true");
    }
  });
}

for (const label of ["Sufficient (human choice)", "Refer back", "Request information", "Escalate"]) {
  test(`Task6 manual ${label} requires reason and records NONE without lifecycle calls`, async ({ page }) => {
    await page.goto("case/EX-24107");
    await page.getByRole("radio", { name: new RegExp(`^${label.replace(/[()]/g, "\\$&")} `) }).check();
    const reason = page.getByLabel("Reason (required)", { exact: true });
    for (const value of ["", "   1234567   "]) {
      await reason.fill(value);
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await expect(page).toHaveURL(/\/case\/EX-24107$/);
      await expect(page.getByText("A reason is required when you override the recommendation, or when there is no recommendation to accept.").first()).toBeVisible();
    }
    await reason.fill("Human review of captured evidence");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
    await expect(page.getByText("Yes. Reason: Human review of captured evidence", { exact: true })).toBeVisible();
    await expect(page.getByText("No recorded rule version to replay in this manual comparison", { exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
    await expect(page.getByText("No agent recommendation existed. The stored override flag is retained; correcting this counter requires Stream B integration.", { exact: true })).toBeVisible();
    if (label.startsWith("Sufficient")) await expect(page.getByText("ACCEPT by Demo operator", { exact: false })).toBeVisible();
  });
}

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
  await page.clock.install({ time: new Date("2026-09-11T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-11T12:00:10Z"));
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-pack-assembly]")).toHaveAttribute("data-pack-assembly", "0");
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await page.clock.runFor(333);
  await expect(page.getByRole("heading", { name: "Prescription image", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toHaveCount(0);
  await page.clock.runFor(334);
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
  await page.clock.runFor(333);
  await expect(page.getByRole("heading", { name: "Applicable Drug Tariff provision", exact: true })).toBeVisible();
  await page.clock.runFor(999);
  await expect(page.locator("[data-pack-assembly]")).toHaveAttribute("data-pack-assembly", "5");
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(1);
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

test("Task6 decision draft survives toggle and comparison; route exit and Reset clear it", async ({ page }) => {
  await page.goto("case/EX-24112");
  const flag = page.getByRole("banner").getByRole("switch");
  await page.getByRole("radio", { name: /^Request information / }).check();
  await page.getByLabel("Reason (required)", { exact: true }).fill("Keep this human decision draft");
  await flag.setChecked(true);
  await page.getByRole("button", { name: "Compare manual view", exact: true }).click();
  await expect(page.getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(1);
  await expect(page.getByRole("complementary", { name: "Read-only manual comparison" }).getByRole("textbox")).toHaveCount(0);
  await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveValue("Keep this human decision draft");
  await flag.setChecked(false);
  await expect(page.getByRole("radio", { name: /^Request information / })).toBeChecked();
  await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveValue("Keep this human decision draft");
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Case-building trace", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
  await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveValue("");
  await page.getByLabel("Reason (required)", { exact: true }).fill("Reset this local draft");
  await confirmReset(page);
  await expect(flag).not.toBeChecked();
  await expect(page.getByLabel("Reason (required)", { exact: true })).toHaveValue("");
});

test("Task6 D keeps three reasons and four failed signals; E remains no-call On", async ({ page }) => {
  await page.goto("case/EX-24123");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("alert").locator("li")).toHaveCount(3);
  const signals = page.getByRole("list", { name: "Confidence signals", exact: true });
  await expect(signals.locator(":scope > li")).toHaveCount(5);
  await expect(signals.locator(".sr-only").filter({ hasText: ", failed" })).toHaveCount(4);
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  await page.goto("case/EX-24101/trace");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("list", { name: "Agent trace", exact: true }).locator(":scope > li")).toHaveCount(2);
  await expect(page.getByText("Cleared by rules; agent not invoked", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).not.toContainText("run_endorsement_checks");
});

for (const screen of [{ name: "desktop", width: 1440, height: 1000, colorScheme: "light" }, { name: "phone", width: 360, height: 800, colorScheme: "dark" }] as const) {
  for (const enabled of [false, true]) {
    for (const view of ["pack", "trace", "record"]) {
      test(`Task6 screenshot and all-rule axe ${view} ${screen.name} On=${enabled}`, async ({ page }, info) => {
        await page.setViewportSize({ width: screen.width, height: screen.height });
        await page.emulateMedia({ colorScheme: screen.colorScheme });
        await page.goto(view === "record" ? "case/EX-24088/record" : `case/EX-24112${view === "trace" ? "/trace" : ""}`);
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