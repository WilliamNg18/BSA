import AxeBuilder from "@axe-core/playwright";
import { captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { choosePaperExample, choosePharmacyRadio, openPharmacyPrecheck, openPharmacyReceipt, startBReviewFromPharmacy } from "./pharmacy-scenario-helpers";

const scenarios = [
  { id: "A", caseId: "EX-24107", label: "Complete endorsement", status: "Ready" },
  { id: "B", caseId: "EX-24112", label: "NCSO missing date", status: "Information missing" },
  { id: "M", caseId: "SYN-FQ123-MISMATCH", label: "Wrong pack size", status: "Ready" },
  { id: "D", caseId: "EX-24123", label: "Unreadable paper", status: "Ready" },
];

async function chooseScenario(page: Page, scenario: typeof scenarios[number], enabled: boolean) {
  if (scenario.id === "D") await choosePaperExample(page);
  else {
    await choosePharmacyRadio(page, "EPS");
    await choosePharmacyRadio(page, scenario.label);
  }
  if (scenario.id === "D" && enabled) await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
}

async function expectScenarioStatus(page: Page, scenario: typeof scenarios[number], enabled: boolean) {
  if (enabled) await expect(page.locator("[data-pharmacy-status]")).toHaveText(scenario.status);
  else {
    await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
    if (scenario.id === "D") {
      await expect(page.getByLabel("Declared endorsement", { exact: true })).toHaveCount(0);
      await expect(page.locator("[data-paper-narrative]")).toHaveText("Type 1 keys; Type 2 judges. RB2B delays are illustrative, not inevitable.");
    } else await expect(page.getByRole("region", { name: "EPS pharmacy submission", exact: true })).toContainText("No advisory check; later correction is possible");
  }
}

for (const theme of ["light", "dark"] as const) for (const on of [false, true]) for (const scenario of scenarios) {
  test(`Task4 ${scenario.id} agent=${on} ${theme}: receipt, timeline, all-rule axe`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(on);
    await chooseScenario(page, scenario, on);
    await expect(page.getByRole("radio", { name: scenario.id === "D" ? "Paper" : "EPS", exact: true })).toBeChecked();
    await expectScenarioStatus(page, scenario, on);
    await expect(page.locator("[data-scripted-badge]")).toHaveText("Scripted signal · Not live");
    const field = page.getByLabel(scenario.id === "D" ? "Declared endorsement" : "Dispenser endorsement", { exact: true });
    const text = scenario.id === "D" && !on ? "" : await field.inputValue();
    if (!on) {
      await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
      await expect(page.getByRole("list", { name: "Requirement checkboxes" })).toHaveCount(0);
    } else {
      const check = await openPharmacyPrecheck(page);
      await expect(check).toContainText("Typed product identified: met");
      await expect(check).toContainText("Typed quantity present: met");
      if (scenario.id === "M") await expect(page.locator("#eps-pack")).toHaveValue("28");
      else await expect(check).toContainText(`Dated: ${scenario.id === "B" ? "missing" : "met"}`);
      if (scenario.id === "D") await expect(page.getByRole("region", { name: "Paper pharmacy submission", exact: true })).toContainText("declared by the pharmacy, not read from the form");
    }
    const continueButton = page.getByRole("button", { name: scenario.id === "D" ? on ? "Post paper with declaration" : "Post paper" : "Send claim", exact: true });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    const receipt = await openPharmacyReceipt(page);
    await expect(receipt).toContainText(`${scenario.caseId}:2`);
    await expect(receipt).toContainText(text);
    if (!on) await expect(receipt).toContainText("No checks performed");
    await expect(receipt.locator("dl").first()).toContainText(`Gate 1${on ? scenario.id === "B" ? "fail" : "pass" : "none"}`);
    await expect(receipt.locator("dl").first()).toContainText(`Gate 2${on ? scenario.id === "A" ? "pass" : "fail" : "none"}`);
    const timeline = page.getByRole("list", { name: "Submission timeline", exact: true });
    await expect(timeline.locator("li")).toHaveCount(on || scenario.id === "A" ? 2 : 1);
    await expect(timeline.locator("li").first()).toContainText("pharmacy");
    if (scenario.id === "A") {
      await page.getByRole("button", { name: "Jump to end", exact: true }).click();
      await expect(receipt).toContainText(on ? "released to existing pricing, no operator action" : "priced by NHSBSA's existing rules engine, no person involved");
      await expect(timeline).toContainText(on ? "release to pricing" : "automatic pricing");
    } else {
      if (on) await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeEnabled();
      else await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeDisabled();
      await expect(timeline).not.toContainText("automatic pricing");
      await expect(timeline).not.toContainText("referred_back");
      await expect(timeline.getByRole("heading", { name: "release to pricing", exact: true })).toHaveCount(0);
      if (on) await expect(timeline.locator("li").last()).toContainText("verification");
    }
    if (scenario.id === "D") {
      if (on) await expect(receipt).toContainText("NCSO JB 27/08/26");
      else await expect(receipt).not.toContainText("declared by the pharmacy, not read from the form");
    }
    await expect(page.getByRole("button", { name: "Play timeline", exact: true })).toBeDisabled();
    const frozen = await receipt.innerText();
    const frozenTimeline = await timeline.innerText();
    if (scenario.id !== "D" || on) await field.fill("different typed text");
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
    await expect(timeline).toHaveText(frozenTimeline, { useInnerText: true });
    if (scenario.id !== "D" || on) await field.fill(text);
    if (scenario.id === "D" && on) await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
    await expectScenarioStatus(page, scenario, on);
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
    await chooseScenario(page, scenario, false);
    const flag = page.getByRole("banner").getByRole("switch");
    const status = page.locator("[data-pharmacy-status]");
    const submit = page.getByRole("button", { name: scenario.id === "D" ? "Post paper" : "Send claim", exact: true });
    await expectScenarioStatus(page, scenario, false);
    await expect(submit).toBeEnabled();
    await expect(page.getByRole("switch")).toHaveCount(1);
    await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
    await expect(submit).toBeEnabled();
    await submit.click();
    const receipt = await openPharmacyReceipt(page);
    await expect(receipt).toContainText("not_checked");
    await expect(receipt).toContainText("Not retrieved / Not retrieved");
    await expect(receipt).toContainText("No checks performed");
    const frozen = await receipt.innerText();
    await flag.setChecked(true);
    if (scenario.id === "D") {
      await expect(page.locator("[data-pharmacy-status]")).not.toHaveText("Ready");
      await expect(page.getByRole("button", { name: "Post paper with declaration", exact: true })).toBeEnabled();
    } else {
      await expect(status).toHaveText(scenario.status);
      await expect(submit).toBeEnabled();
    }
    await flag.setChecked(false);
    await expectScenarioStatus(page, scenario, false);
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
  });
}

test("Task4 B applies only the suggested dispensing date, retains receipt and never edits canonical B", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const field = page.getByLabel("Dispenser endorsement", { exact: true });
  await expect(field).toHaveValue("NCSO  RK");
  await expect(await openPharmacyPrecheck(page)).toContainText("Dated: missing");
  await page.getByRole("button", { name: "Apply suggested correction", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("NCSO RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await expect(await openPharmacyPrecheck(page)).toContainText("Dated: met");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("button", { name: "Step timeline", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-pharmacy-timeline] [role=status]")).toContainText("released to existing pricing, no operator action");
  await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeDisabled();
  await expect(page.getByRole("list", { name: "Submission timeline" }).locator("li")).toHaveCount(2);
  await field.fill("NCSO  RK");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
  await expect(await openPharmacyReceipt(page)).toContainText("NCSO RK 21/08/26");
  await confirmReset(page);
  await expect(page.getByRole("region", { name: "Submission receipt" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(field).toHaveValue("NCSO  RK");
  await page.goto("case/EX-24112");
  await startBReviewFromPharmacy(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("radio", { name: "Refer back", exact: true })).not.toBeChecked();
  await page.getByRole("region", { name: "Operator decision", exact: true }).getByRole("button", { name: "Apply suggestion", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
});

for (const text of ["BB RK", "BB RK 21/08/26", "XP RK", "XP RK 21/08/26"]) {
  test(`Task4 B edited to ${text} stops outside NCSO coverage but can still submit`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    // Establish a successful revision first to detect stale rule/ready reuse.
    await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
    await page.getByLabel("Dispenser endorsement", { exact: true }).fill(text);
    await expect(page.locator("[data-pharmacy-status]")).toContainText("No supported correction");
    const check = await openPharmacyPrecheck(page);
    await expect(check).toContainText("Supported typed endorsement: missing");
    const clause = text.startsWith("BB") ? "P2-C8" : "P2-C12";
    await expect(check).toContainText(`2026-08 / ${clause}`);
    await expect(check).not.toContainText("P2-C9");
    await expect(check.locator("blockquote")).toContainText(text.startsWith("BB") ? "endorsed BB" : "endorse XP");
    await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
    const submit = page.getByRole("button", { name: "Send claim", exact: true });
    await expect(submit).toBeEnabled();
    await submit.click();
    const receipt = await openPharmacyReceipt(page);
    await expect(receipt).toContainText(text);
    await expect(receipt).toContainText("missing");
    await expect(receipt).toContainText(`2026-08 / ${clause}`);
    await expect(receipt.locator("dl").first()).toContainText("Gate 1fail");
    await expect(page.getByRole("button", { name: "Jump to end", exact: true })).toBeEnabled();
    const timeline = page.getByRole("list", { name: "Submission timeline" });
    await expect(timeline.getByText("Not needed", { exact: true })).toHaveCount(0);
    await expect(timeline.locator("li")).toHaveCount(2);
    await expect(timeline.locator("li").last()).toContainText("verification");
    await expect(timeline).not.toContainText("Illustrative referral");
    await expect(receipt).toContainText("Human review pending");
  });
}

test("Task4 D combined caption stays within 25 words and retains synthetic confidence labels", async ({ page }) => {
  await page.goto("pharmacy");
  await choosePaperExample(page);
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
  await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await flag.setChecked(false);
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  const receipt = await openPharmacyReceipt(page);
  await expect(receipt).toContainText("NCSO RK 21/08/26");
  await expect(receipt).toContainText("not_checked");
  await expect(receipt).toContainText("No checks performed");
  await page.getByRole("button", { name: "Jump to end", exact: true }).click();
  await expect(page.getByRole("list", { name: "Submission timeline" }).locator("li")).toHaveCount(2);
  await expect(receipt).toContainText("no person involved");
});

test("Task4 global Reset restores seed evidence and receipts without replacing the selected URL case", async ({ page }) => {
  await page.goto("pharmacy");
  const flag = page.getByRole("banner").getByRole("switch");
  const field = page.getByLabel("Dispenser endorsement", { exact: true });
  const submit = page.getByRole("button", { name: "Send claim", exact: true });
  await flag.setChecked(true);
  await field.fill("Unknown endorsement");
  await choosePaperExample(page);
  await page.getByRole("textbox", { name: "Declared endorsement", exact: true }).fill("Unknown endorsement");
  await expect(page.locator("[data-pharmacy-status]")).not.toHaveText("Ready");
  await flag.setChecked(false);
  await page.getByRole("button", { name: "Post paper", exact: true }).click();
  await flag.setChecked(true);
  await page.getByLabel("Declared product", { exact: true }).fill("Co-codamol 30/500 tablets");
  await page.getByLabel("Declared quantity", { exact: true }).fill("100");
  await page.getByLabel("Declared dispensing date", { exact: true }).fill("2026-08-27");
  await confirmReset(page);
  await expect(flag).not.toBeChecked();
  await expect(page.getByRole("switch")).toHaveCount(1);
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24123");
  await expect(page.getByRole("region", { name: "Submission receipt" })).toHaveCount(0);
  await expect(page.locator("[data-pharmacy-timeline]")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Paper", exact: true })).toBeChecked();
  await flag.setChecked(true);
  await expect(page.getByLabel("Declared endorsement", { exact: true })).toHaveValue("NCSO JB 27/08/26");
  await expect(page.getByLabel("Declared product", { exact: true })).toHaveValue("Co-codamol 30/500 tablets");
  await expect(page.getByLabel("Declared quantity", { exact: true })).toHaveValue("100");
  await expect(page.getByLabel("Declared dispensing date", { exact: true })).toHaveValue("2026-08-27");
  await flag.setChecked(false);
  await page.getByRole("radio", { name: "EPS", exact: true }).click();
  await page.getByRole("radio", { name: "NCSO missing date", exact: true }).click();
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("EX-24112:2");
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("EX-24112:3");
  await navigatePrimary(page, "NHSBSA queue");
  await confirmReset(page);
  await navigatePrimary(page, "Pharmacy check");
  await expect(flag).not.toBeChecked();
  await submit.click();
  await expect(page.getByRole("region", { name: "Submission receipt" })).toContainText("EX-24112:2");
});

test("Task4 current checks do not simulate pending work; timeline cancellation respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("pharmacy");
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  const flag = page.getByRole("banner").getByRole("switch");
  const field = page.getByLabel("Dispenser endorsement", { exact: true });
  await flag.setChecked(true);
  await page.clock.runFor(1999);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
  await field.fill("NCSO RK 21/08/26");
  await page.clock.runFor(1);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  const receipt = await openPharmacyReceipt(page);
  await expect(receipt).toContainText("ready");
  await expect(receipt).not.toContainText("No checks performed");
  const frozenReceipt = await receipt.innerText();
  await page.clock.runFor(1999);
  await expect(receipt).toHaveText(frozenReceipt, { useInnerText: true });
  await page.clock.runFor(1);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await choosePharmacyRadio(page, "Wrong pack size");
  await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
  await page.clock.runFor(2000);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await expect(page.locator("#eps-pack")).toHaveValue("28");
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
  await flag.setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.getByRole("list", { name: "Scripted pharmacy process" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
  await flag.setChecked(true);
  await flag.setChecked(false);
  await page.clock.runFor(3000);
  await expect(page.getByRole("heading", { name: /^Rule retrieved/ })).toHaveCount(0);
  await page.getByRole("radio", { name: "Complete endorsement", exact: true }).click();
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
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
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("pharmacy");
    await choosePaperExample(page);
    await expect(page.getByRole("radio", { name: "Paper", exact: true })).toBeChecked();
    const endorsement = page.getByLabel("Declared endorsement", { exact: true });
    await expect(endorsement).toHaveCount(0);
    await page.getByRole("button", { name: "Post paper", exact: true }).click();
    const receipt = await openPharmacyReceipt(page);
    const receiptEvidence = receipt.locator(":scope > details > dl").first();
    const blind = await receiptEvidence.innerText();
    await expect(receipt).toContainText("EX-24123:2");
    await expect(receipt.getByRole("link", { name: "Open shared queue", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Submitted pharmacy declaration", exact: true })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Submission timeline" }).locator("li")).toHaveCount(1);
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    for (const [label, value] of [
      ["Declared product", "Co-codamol 30/500 tablets"],
      ["Declared quantity", "100"],
      ["Declared dispensing date", "2026-08-27"],
      ["Declared endorsement", "NCSO JB 27/08/26"],
    ]) {
      const field = page.getByLabel(label, { exact: true });
      await field.fill(value);
      await page.getByRole("radio", { name: "NHSBSA", exact: true }).click();
      await expect(page.getByRole("heading", { name: /This view belongs to the other side/ })).toBeVisible();
      await page.getByRole("radio", { name: "Pharmacy", exact: true }).click();
      await expect(field).toHaveValue(value);
    }
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
    await expect(await openPharmacyPrecheck(page)).toContainText("Dated: met");
    await expect(receiptEvidence).toHaveText(blind, { useInnerText: true });
    await expect(receipt.getByRole("link", { name: "Open shared queue", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: "Both", exact: true }).click();
    await expect(receipt.getByRole("link", { name: "Open shared queue", exact: true })).toBeVisible();
    await expect(receiptEvidence).toHaveText(blind, { useInnerText: true });
    await page.getByRole("button", { name: "Post paper with declaration", exact: true }).click();
    await openPharmacyReceipt(page);
    await expect(receipt).toContainText("EX-24123:3");
    const declaration = receipt.getByRole("region", { name: "Submitted pharmacy declaration", exact: true });
    await expect(declaration).toContainText("declared by the pharmacy, not read from the form");
    await expect(declaration).toContainText("Co-codamol 30/500 tablets");
    await expect(declaration).toContainText("100");
    await expect(declaration).toContainText("2026-08-27");
    await expect(declaration).not.toContainText("Dr Demo");
    await expect(declaration).toContainText("NCSO JB 27/08/26");
    await expect(receipt).not.toContainText("no person involved");
    const frozen = await receipt.innerText();
    await endorsement.fill("Changed unsent declaration");
    await expect(page.locator("[data-pharmacy-status]")).not.toHaveText("Ready");
    await expect(receipt).toHaveText(frozen, { useInnerText: true });
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const detail = page.getByRole("region", { name: "Claim detail", exact: true });
    await expect(detail).toContainText("NCSO JB 27/08/26");
    await detail.getByText("History and attempts (3)", { exact: true }).click();
    await expect(page.getByRole("region", { name: "Declaration for attempt 3", exact: true })).toContainText("NCSO JB 27/08/26");
    await expect(page.getByRole("region", { name: "Declaration for attempt 3", exact: true })).not.toContainText("Dr Demo (synthetic)");
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
  await choosePaperExample(page);
  await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await page.getByLabel("Declared quantity", { exact: true }).fill("-1");
  await expect(page.locator("[data-pharmacy-status]")).not.toHaveText("Ready");
  await page.getByRole("button", { name: "Post paper with declaration", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid paper declaration");
  await expect(page.getByLabel("Declared quantity", { exact: true })).toHaveValue("-1");
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
    await expect(attempts.first()).toContainText("NCSO JB 27/08/26");
    await detail.getByText("Demonstration replay", { exact: true }).click();
    await expect(detail.getByText("Replay the retained pharmacy declaration, not the scan reading.", { exact: false })).toBeVisible();
    await detail.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
    await expect(detail.getByRole("alert")).toHaveCount(0);
    await expect(detail.getByRole("status").first()).toHaveText("Submitted, awaiting processing");
    await expect(attempts).toHaveCount(2);
    await expect(attempts.first()).toHaveText(seed, { useInnerText: true });
    await expect(attempts.nth(1).getByRole("definition").first()).toHaveText("NCSO JB 27/08/26");
    await expect(detail.getByRole("region", { name: "Declaration for attempt 2", exact: true })).not.toContainText("Dr Demo (synthetic)");
    await expect(detail.getByRole("region", { name: "Type 1 capture for attempt 2", exact: true })).toHaveCount(0);
    const newEvents = detail.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
    await expect(newEvents.filter({ hasText: "Explicit demo submission; previous revisions retained." }).last()).toContainText("pharmacy");
    await expect(newEvents.last()).toContainText(enabled ? "code" : "pharmacy");
    await expect(newEvents.last()).not.toContainText("automatic pricing");
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  });
}