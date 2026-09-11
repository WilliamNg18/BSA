import AxeBuilder from "@axe-core/playwright";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";

const scenarios = [
  { id: "A", label: "Complete endorsement", status: "Ready to submit" },
  { id: "B", label: "Information missing", status: "Information may be missing" },
  { id: "D", label: "Unreadable form", status: "Agent unable to determine" },
];

for (const theme of ["light", "dark"] as const) for (const on of [false, true]) for (const scenario of scenarios) {
  test(`Task4 ${scenario.id} agent=${on} ${theme}: receipt, timeline, all-rule axe`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: theme === "dark" ? 360 : 1440, height: 1000 });
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(on);
    await page.getByRole("radio", { name: scenario.label, exact: true }).click();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText(on ? scenario.status : "Agent unable to determine");
    await expect(page.locator("[data-scripted-badge]")).toHaveText("Scripted signal · Not live");
    const field = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
    const text = await field.inputValue();
    if (!on) {
      await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
      await expect(page.getByRole("list", { name: "Requirement checkboxes" })).toHaveCount(0);
      await expect(page.getByText(/real pharmacy checks are unknown/)).toBeVisible();
    } else if (scenario.id === "D") {
      await expect(page.getByRole("list", { name: "Scripted pharmacy process" }).locator("li")).toHaveText([
        "CapturedSTOPPED", "Endorsement typeNOT RUN", "Dispensing-date versionNOT RUN", "ClauseNOT RUN", "RequirementsNOT RUN",
      ]);
      await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
    } else {
      await expect(page.getByRole("checkbox", { name: "Dated", exact: true })).toBeChecked({ checked: scenario.id === "A" });
    }
    const continueButton = page.getByRole("button", { name: "Continue with submission", exact: true });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    const receipt = page.getByRole("region", { name: "Submission receipt" });
    await expect(receipt).toContainText("PH-0001");
    await expect(receipt).toContainText(text);
    if (!on) await expect(receipt).toContainText("No checks performed");
    const frozen = await receipt.innerText();
    await page.getByRole("button", { name: "Jump to end", exact: true }).click();
    const timeline = page.getByRole("list", { name: "Submission timeline", exact: true });
    await expect(timeline.locator("li")).toHaveCount(6);
    await expect(timeline.getByText("Not needed", { exact: true })).toHaveCount(scenario.id === "A" ? 3 : 0);
    if (scenario.id === "D") await expect(timeline).toContainText("Not guaranteed");
    await expect(page.getByRole("button", { name: "Play timeline", exact: true })).toBeDisabled();
    await page.getByText("Timeline assumptions", { exact: true }).click();
    await page.getByLabel("Month end days · Assumption", { exact: true }).fill("30");
    await field.fill("different typed text");
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
    await expect(timeline.locator("li").nth(1)).toContainText("14");
    await field.fill(text);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText(on ? scenario.status : "Agent unable to determine");
    const axe = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "task4-axe", axe);
    expect(axe.violations).toEqual([]);
    // Full-page capture otherwise paints sticky navigation at the last field's scroll offset.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.getByRole("banner")).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`${scenario.id}-${on ? "on" : "off"}-${theme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("Task4 B applies only the suggested dispensing date, retains receipt and never edits canonical B", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const field = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
  await expect(field).toHaveValue("NCSO  RK");
  await expect(page.getByRole("checkbox", { name: "Dated", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Apply correction", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("NCSO  RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
  await expect(page.getByRole("checkbox", { name: "Dated", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("button", { name: "Step timeline", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-pharmacy-timeline] [role=status]")).toContainText("Simulated day 14");
  await page.getByRole("button", { name: "Jump to end", exact: true }).click();
  await expect(page.getByRole("list", { name: "Submission timeline" }).getByText("Not needed", { exact: true })).toHaveCount(3);
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("NCSO  RK 21/08/26");
  await confirmReset(page);
  await expect(page.getByRole("region", { name: "Submission receipt" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(field).toHaveValue("NCSO  RK");
  await page.goto("case/EX-24112");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
});

for (const text of ["BB RK", "BB RK 21/08/26", "XP RK", "XP RK 21/08/26"]) {
  test(`Task4 B edited to ${text} stops outside NCSO coverage but can still submit`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    // Establish a successful revision first to detect stale rule/ready reuse.
    await page.getByRole("button", { name: "Apply correction", exact: true }).click();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
    await page.getByLabel("Endorsement entered by the pharmacy", { exact: true }).fill(text);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Agent unable to determine");
    await expect(page.getByRole("list", { name: "Scripted pharmacy process" }).locator("li")).toHaveText([
      "CapturedPASS", "Endorsement typeSTOPPED", "Dispensing-date versionNOT RUN", "ClauseNOT RUN", "RequirementsNOT RUN",
    ]);
    await expect(page.getByRole("region", { name: "Validated synthetic rule" })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Requirement checkboxes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply correction", exact: true })).toHaveCount(0);
    const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
    await expect(submit).toBeEnabled();
    await submit.click();
    const receipt = page.getByRole("region", { name: "Submission receipt" });
    await expect(receipt).toContainText(text);
    await expect(receipt).toContainText("unable");
    await expect(receipt).toContainText("Not retrieved / Not retrieved");
    await page.getByRole("button", { name: "Jump to end", exact: true }).click();
    const timeline = page.getByRole("list", { name: "Submission timeline" });
    await expect(timeline.getByText("Not needed", { exact: true })).toHaveCount(0);
    await expect(timeline).toContainText("Illustrative referral");
  });
}

test("Task4 D combined caption stays within 25 words and retains synthetic confidence labels", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  const caption = page.locator("figcaption");
  const text = await caption.innerText();
  expect(text.match(/[\p{L}\p{N}]+(?:['’\u002d][\p{L}\p{N}]+)*/gu)?.length ?? 0).toBeLessThanOrEqual(25);
  await expect(caption).toContainText("Synthetic form");
  await expect(caption).toContainText("labels show read confidence");
  await expect(caption).toContainText("Deliberately poor scan");
  await expect(page.locator("figure svg")).toContainText("read 0.");
});

test("Task4 corrected B stays corrected when submitted Off, without performed checks", async ({ page }) => {
  await page.goto("pharmacy");
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.setChecked(true);
  await page.getByRole("button", { name: "Apply correction", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
  await flag.setChecked(false);
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  const receipt = page.getByRole("region", { name: "Submission receipt" });
  await expect(receipt).toContainText("NCSO  RK 21/08/26");
  await expect(receipt).toContainText("not_checked");
  await expect(receipt).toContainText("No checks performed");
  await page.getByRole("button", { name: "Jump to end", exact: true }).click();
  await expect(page.getByRole("list", { name: "Submission timeline" }).getByText("Not needed", { exact: true })).toHaveCount(3);
});

test("Task4 global Reset clears receipts, all form states and assumptions on this or another route", async ({ page }) => {
  await page.goto("pharmacy");
  const flag = page.getByRole("banner").getByRole("switch");
  const field = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
  const availability = page.getByRole("switch", { name: "Agent available", exact: true });
  const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
  await flag.setChecked(true);
  await field.fill("NCSO RK 21/08/26");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await field.fill("NCSO RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Agent unable to determine");
  await availability.setChecked(false);
  await submit.click();
  await page.getByText("Timeline assumptions", { exact: true }).click();
  const inputs = page.locator("[data-pharmacy-assumptions] input");
  for (let index = 0; index < 5; index++) await inputs.nth(index).fill(String(30 + index));
  await inputs.first().fill("invalid");
  await expect(inputs.first()).toHaveAttribute("aria-invalid", "true");
  await confirmReset(page);
  await expect(flag).not.toBeChecked();
  await expect(availability).toBeChecked();
  await expect(page.getByRole("radio", { name: "Information missing", exact: true })).toBeChecked();
  await expect(field).toHaveValue("NCSO  RK");
  await expect(page.getByRole("region", { name: "Submission receipt" })).toHaveCount(0);
  await expect(page.locator("[data-pharmacy-timeline]")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
  await page.getByText("Timeline assumptions", { exact: true }).click();
  for (const [index, value] of [14, 3, 7, 5, 14].entries()) {
    await expect(inputs.nth(index)).toHaveValue(String(value));
    await expect(inputs.nth(index)).toHaveAttribute("aria-invalid", "false");
  }
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("PH-0001");
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("PH-0002");
  await navigatePrimary(page, "Exception queue");
  await confirmReset(page);
  await navigatePrimary(page, "Pharmacy check");
  await expect(flag).not.toBeChecked();
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("PH-0001");
});

test("Task4 rapid revisions, pending submission, cancellation and reduced-motion timer safety", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("pharmacy");
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  const flag = page.getByRole("banner").getByRole("switch");
  const field = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
  await flag.setChecked(true);
  await page.clock.runFor(1999);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Scripted check in progress");
  await field.fill("NCSO RK 21/08/26");
  await page.clock.runFor(1);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Scripted check in progress");
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("No checks performed");
  await page.clock.runFor(1999);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
  await page.clock.runFor(2000);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toContainText("STOPPED");
  await flag.setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
  await flag.setChecked(true);
  await page.getByRole("switch", { name: "Agent available", exact: true }).setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("button", { name: "Play timeline", exact: true }).click();
  await page.clock.runFor(1000);
  await page.getByRole("button", { name: "Pause timeline", exact: true }).click();
  const status = page.locator("[data-pharmacy-timeline] [role=status]");
  const paused = await status.innerText();
  await page.clock.runFor(5000);
  await expect(status).toHaveText(paused);
  await page.getByRole("button", { name: "Play timeline", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await status.innerText();
  await page.clock.runFor(5000);
  await expect(status).toHaveText(reduced);
  await expect(page.getByRole("button", { name: "Play timeline", exact: true })).toBeDisabled();
});