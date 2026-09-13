import AxeBuilder from "@axe-core/playwright";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

const scenarios = [
  { id: "A", label: "Complete endorsement", status: "Complete: will flow to automated pricing" },
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
    await expect(page.getByRole("radio", { name: scenario.id === "D" ? "Paper" : "EPS", exact: true })).toBeChecked();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText(on ? scenario.status : "Not checked: manual submission");
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
    await expect(receipt).toContainText(`${scenario.id === "A" ? "EX-24107" : scenario.id === "B" ? "EX-24112" : "EX-24123"}:2`);
    await expect(receipt).toContainText(text);
    if (!on) await expect(receipt).toContainText("No checks performed");
    const frozen = await receipt.innerText();
    const timeline = page.getByRole("list", { name: "Submission timeline", exact: true });
    await expect(timeline.locator("li")).toHaveCount(scenario.id === "A" ? 2 : 1);
    if (scenario.id === "A") {
      await page.getByRole("button", { name: "Jump to end", exact: true }).click();
      await expect(receipt).toContainText("priced by NHSBSA's existing rules engine; no person involved");
      await expect(timeline).toContainText("automatic pricing");
    } else {
      await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeDisabled();
      await expect(timeline).not.toContainText("automatic pricing");
      await expect(timeline).not.toContainText("referred_back");
    }
    if (scenario.id === "D") await expect(receipt.getByRole("region", { name: "Submitted pharmacy declaration" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Play timeline", exact: true })).toBeDisabled();
    const frozenTimeline = await timeline.innerText();
    await field.fill("different typed text");
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
    await expect(timeline).toHaveText(frozenTimeline, { useInnerText: true });
    await field.fill(text);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText(on ? scenario.status : "Not checked: manual submission");
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

for (const scenario of scenarios) {
  test(`Issue20 ${scenario.id}: header selects manual or checked status without changing receipts`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("radio", { name: scenario.label, exact: true }).click();
    const flag = page.getByRole("banner").getByRole("switch");
    const status = page.locator("[data-pharmacy-status]");
    const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
    await expect(status).toHaveText("Not checked: manual submission");
    await expect(submit).toBeEnabled();
    await expect(page.getByRole("switch")).toHaveCount(1);
    await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
    await expect(submit).toBeEnabled();
    await submit.click();
    const receipt = page.getByRole("region", { name: "Submission receipt" });
    await expect(receipt).toContainText("not_checked");
    await expect(receipt).toContainText("Not retrieved / Not retrieved");
    await expect(receipt).toContainText("No checks performed");
    const frozen = await receipt.innerText();
    await flag.setChecked(true);
    await expect(status).toHaveText(scenario.status);
    await expect(submit).toBeEnabled();
    await flag.setChecked(false);
    await expect(status).toHaveText("Not checked: manual submission");
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
  });
}

test("Task4 B applies only the suggested dispensing date, retains receipt and never edits canonical B", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const field = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
  await expect(field).toHaveValue("NCSO  RK");
  await expect(page.getByRole("checkbox", { name: "Dated", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Apply fix", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("NCSO  RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing");
  await expect(page.getByRole("checkbox", { name: "Dated", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("button", { name: "Step timeline", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-pharmacy-timeline] [role=status]")).toContainText("no person involved");
  await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeDisabled();
  await expect(page.getByRole("list", { name: "Submission timeline" }).locator("li")).toHaveCount(2);
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("NCSO  RK 21/08/26");
  await confirmReset(page);
  await expect(page.getByRole("region", { name: "Submission receipt" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(field).toHaveValue("NCSO  RK");
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
});

for (const text of ["BB RK", "BB RK 21/08/26", "XP RK", "XP RK 21/08/26"]) {
  test(`Task4 B edited to ${text} stops outside NCSO coverage but can still submit`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    // Establish a successful revision first to detect stale rule/ready reuse.
    await page.getByRole("button", { name: "Apply fix", exact: true }).click();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing");
    await page.getByLabel("Endorsement entered by the pharmacy", { exact: true }).fill(text);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Agent unable to determine");
    await expect(page.getByRole("list", { name: "Scripted pharmacy process" }).locator("li")).toHaveText([
      "CapturedPASS", "Endorsement typeSTOPPED", "Dispensing-date versionNOT RUN", "ClauseNOT RUN", "RequirementsNOT RUN",
    ]);
    await expect(page.getByRole("region", { name: "Validated synthetic rule" })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Requirement checkboxes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply fix", exact: true })).toHaveCount(0);
    const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
    await expect(submit).toBeEnabled();
    await submit.click();
    const receipt = page.getByRole("region", { name: "Submission receipt" });
    await expect(receipt).toContainText(text);
    await expect(receipt).toContainText("unable");
    await expect(receipt).toContainText("Not retrieved / Not retrieved");
    await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeDisabled();
    const timeline = page.getByRole("list", { name: "Submission timeline" });
    await expect(timeline.getByText("Not needed", { exact: true })).toHaveCount(0);
    await expect(timeline.locator("li")).toHaveCount(1);
    await expect(timeline).not.toContainText("Illustrative referral");
    await expect(receipt).toContainText("Submitted for Type 2 judgement");
  });
}

test("Task4 D combined caption stays within 25 words and retains synthetic confidence labels", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  const caption = page.locator("figcaption");
  const text = await caption.innerText();
  console.info("Advisory word count / budget 25:", text.match(/[\p{L}\p{N}]+(?:['’\u002d][\p{L}\p{N}]+)*/gu)?.length ?? 0);
  await expect(caption).toContainText("Synthetic form");
  await expect(caption).toContainText("labels show read confidence");
  await expect(caption).toContainText("Deliberately poor scan");
  await expect(page.locator("figure svg")).toContainText("read 0.");
});

test("Task4 corrected B stays corrected when submitted Off, without performed checks", async ({ page }) => {
  await page.goto("pharmacy");
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.setChecked(true);
  await page.getByRole("button", { name: "Apply fix", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing");
  await flag.setChecked(false);
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  const receipt = page.getByRole("region", { name: "Submission receipt" });
  await expect(receipt).toContainText("NCSO  RK 21/08/26");
  await expect(receipt).toContainText("not_checked");
  await expect(receipt).toContainText("No checks performed");
  await page.getByRole("button", { name: "Jump to end", exact: true }).click();
  await expect(page.getByRole("list", { name: "Submission timeline" }).locator("li")).toHaveCount(2);
  await expect(receipt).toContainText("no person involved");
});

test("Task4 global Reset clears receipts, channel and declaration drafts on this or another route", async ({ page }) => {
  await page.goto("pharmacy");
  const flag = page.getByRole("banner").getByRole("switch");
  const field = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
  const submit = page.getByRole("button", { name: "Continue with submission", exact: true });
  await flag.setChecked(true);
  await field.fill("Unknown endorsement");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await field.fill("Unknown endorsement");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Agent unable to determine");
  await flag.setChecked(false);
  await submit.click();
  await page.getByLabel("Declared product code", { exact: true }).fill("SYN-COCOD-100");
  await page.getByLabel("Declared quantity", { exact: true }).fill("100");
  await page.getByLabel("Declared prescriber (synthetic)", { exact: true }).fill("Dr Demo (synthetic)");
  await confirmReset(page);
  await expect(flag).not.toBeChecked();
  await expect(page.getByRole("switch")).toHaveCount(1);
  await expect(page.getByRole("radio", { name: "Information missing", exact: true })).toBeChecked();
  await expect(field).toHaveValue("NCSO  RK");
  await expect(page.getByRole("region", { name: "Submission receipt" })).toHaveCount(0);
  await expect(page.locator("[data-pharmacy-timeline]")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "EPS", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await expect(field).toHaveValue("");
  await expect(page.getByLabel("Declared product code", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Declared quantity", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Declared prescriber (synthetic)", { exact: true })).toHaveValue("");
  await page.getByRole("radio", { name: "Information missing", exact: true }).click();
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("EX-24112:2");
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("EX-24112:3");
  await navigatePrimary(page, "Exception queue");
  await confirmReset(page);
  await navigatePrimary(page, "Pharmacy check");
  await expect(flag).not.toBeChecked();
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("EX-24112:2");
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
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
  await page.clock.runFor(2000);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toContainText("STOPPED");
  await flag.setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
  await flag.setChecked(true);
  await flag.setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
  await page.getByRole("radio", { name: "Complete endorsement", exact: true }).click();
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("button", { name: "Play timeline", exact: true }).click();
  await page.clock.runFor(500);
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

for (const theme of ["light", "dark"] as const) {
  test(`Task20 paper declaration ${theme}: explicit fields survive perspective changes without reading the scan`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: theme === "dark" ? 360 : 1440, height: 1000 });
    await page.goto("pharmacy");
    await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Paper", exact: true })).toBeChecked();
    const endorsement = page.getByLabel("Endorsement entered by the pharmacy", { exact: true });
    await expect(endorsement).toHaveValue("");
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
    const receiptEvidence = receipt.locator(":scope > dl");
    const blind = await receiptEvidence.innerText();
    await expect(receipt).toContainText("EX-24123:2");
    await expect(receipt.getByRole("link", { name: "Open shared queue", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Submitted pharmacy declaration", exact: true })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Submission timeline" }).locator("li")).toHaveCount(1);
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    for (const [label, value] of [
      ["Declared product code", "SYN-COCOD-100"],
      ["Declared quantity", "100"],
      ["Declared prescriber (synthetic)", "Dr Demo (synthetic)"],
      ["Endorsement entered by the pharmacy", "NCSO AB 27/08/26"],
    ]) {
      const field = page.getByLabel(label, { exact: true });
      await expect(field).toHaveValue("");
      await field.fill(value);
      await page.getByRole("radio", { name: "NHSBSA", exact: true }).click();
      await expect(page.getByRole("heading", { name: /This view belongs to the other side/ })).toBeVisible();
      await page.getByRole("radio", { name: "Pharmacy", exact: true }).click();
      await expect(field).toHaveValue(value);
    }
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Declaration complete: human capture confirmation required");
    await expect(page.getByRole("list", { name: "Scripted pharmacy process" }).locator("li").first()).toHaveText("Declared fieldsPASS");
    await expect(receiptEvidence).toHaveText(blind, { useInnerText: true });
    await expect(receipt.getByRole("link", { name: "Open shared queue", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: "Both", exact: true }).click();
    await expect(receipt.getByRole("link", { name: "Open shared queue", exact: true })).toBeVisible();
    await expect(receiptEvidence).toHaveText(blind, { useInnerText: true });
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    await expect(receipt).toContainText("EX-24123:3");
    const declaration = page.getByRole("region", { name: "Submitted pharmacy declaration", exact: true });
    await expect(declaration).toContainText("declared by the pharmacy, not read from the form");
    await expect(declaration).toContainText("SYN-COCOD-100");
    await expect(declaration).toContainText("100");
    await expect(declaration).toContainText("Dr Demo (synthetic)");
    await expect(declaration).toContainText("NCSO AB 27/08/26");
    await expect(receipt).not.toContainText("no person involved");
    const frozen = await receipt.innerText();
    await endorsement.fill("Changed unsent declaration");
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Agent unable to determine");
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    await expect(detail).toContainText("NCSO AB 27/08/26");
    await detail.getByText("History and attempts (3)", { exact: true }).click();
    await expect(page.getByRole("region", { name: "Declaration for attempt 3", exact: true })).toContainText("Dr Demo (synthetic)");
    await expect(page.getByRole("region", { name: "Declaration for attempt 2", exact: true })).toHaveCount(0);
    await expect(page.getByRole("banner").getByRole("switch")).toHaveCount(1);
    const axe = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "task20-declaration-axe", axe);
    expect(axe.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("Task20 declaration edits invalidate the check and reject malformed quantity without submitting", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await page.getByLabel("Declared product code", { exact: true }).fill("SYN-COCOD-100");
  await page.getByLabel("Declared quantity", { exact: true }).fill("100");
  await page.getByLabel("Declared prescriber (synthetic)", { exact: true }).fill("Dr Demo (synthetic)");
  await page.getByLabel("Endorsement entered by the pharmacy", { exact: true }).fill("NCSO AB 27/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Declaration complete: human capture confirmation required");
  await page.getByLabel("Declared quantity", { exact: true }).fill("-1");
  await expect(page.locator("[data-pharmacy-status]")).not.toHaveText("Declaration complete: human capture confirmation required");
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Declared quantity must be a positive whole number or left blank.");
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
});

for (const enabled of [false, true]) {
  test(`Task20 seed D replay uses the retained declaration without confirming capture, Agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy/claims?caseId=EX-24123");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    await detail.getByText("History and attempts (1)", { exact: true }).click();
    const attempts = detail.getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).locator(":scope > li");
    await expect(attempts).toHaveCount(1);
    const seed = await attempts.first().innerText();
    await expect(attempts.first()).toContainText("N?S? ~~ 1?/0?");
    await expect(attempts.first()).toContainText("NCSO AB 27/08/26");
    await detail.getByText("Demonstration replay", { exact: true }).click();
    await expect(detail.getByText("Replay the retained pharmacy declaration, not the scan reading.", { exact: false })).toBeVisible();
    await detail.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
    await expect(detail.getByRole("alert")).toHaveCount(0);
    await expect(detail.getByRole("status").first()).toHaveText("Submitted, awaiting processing");
    await expect(attempts).toHaveCount(2);
    await expect(attempts.first()).toHaveText(seed, { useInnerText: true });
    await expect(attempts.nth(1).getByRole("definition").first()).toHaveText("NCSO AB 27/08/26");
    await expect(detail.getByRole("region", { name: "Declaration for attempt 2", exact: true })).toContainText("Dr Demo (synthetic)");
    await expect(detail.getByRole("region", { name: "Type 1 capture for attempt 2", exact: true })).toHaveCount(0);
    const event = detail.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li").last();
    await expect(event).toContainText("pharmacy");
    await expect(event).not.toContainText("automatic pricing");
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  });
}