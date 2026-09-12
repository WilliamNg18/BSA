import { captureCheckpoint, cases, confirmReset, expect, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

for (const caseId of ["EX-24107", "EX-24112"]) {
test(`${caseId} trace replay announces one step at a time, Show all and Clear work`, async ({ page }, testInfo) => {
  await page.goto(`case/${caseId}/trace`);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const trace = page.getByRole("list", { name: "Agent trace", exact: true });
  const steps = trace.locator(":scope > li");
  await expect(trace).toHaveAttribute("aria-live", "polite");
  await expect(steps).toHaveCount(9);
  await page.clock.install();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(steps).toHaveCount(0);
  await page.getByRole("button", { name: "Replay step by step" }).click();
  await expect(steps).toHaveCount(1);
  for (let step = 1; step <= 9; step++) {
    if (step > 1) await page.getByRole("button", { name: "Next step", exact: true }).click();
    await expect(steps).toHaveCount(step);
    if (step === 1) await captureCheckpoint(page, testInfo, `${caseId}-replay-first-step`);
  }
  await expect(page.getByRole("heading", { name: "Where it ends" })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await expect(steps).toHaveCount(9);
  await captureCheckpoint(page, testInfo, `${caseId}-replay-complete`);
});
}

test("pharmacy is advisory for missing, corrected, complete, unreadable and unavailable inputs", async ({ page }, testInfo) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const status = page.locator("[data-pharmacy-status]");
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  await expect(status).toHaveText("Information may be missing");
  await captureCheckpoint(page, testInfo, "pharmacy-before-date");
  await page.getByRole("button", { name: "Apply correction" }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("NCSO  RK 21/08/26");
  await expect(status).toHaveText("Ready to submit");
  await captureCheckpoint(page, testInfo, "pharmacy-after-date");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(status).toHaveText("Information may be missing");
  await field.fill("NCSO RK 21/08/26");
  await expect(status).toHaveText("Ready to submit");
  await page.getByRole("radio", { name: "Complete endorsement", exact: true }).click();
  await expect(status).toHaveText("Ready to submit");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await expect(status).toHaveText("Agent unable to determine");
  const submit = page.getByRole("button", { name: "Continue with submission" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("status").filter({ hasText: "Submitted (synthetic)." })).toBeVisible();
  await page.getByRole("radio", { name: "Information missing", exact: true }).click();
  await page.getByRole("switch", { name: "Agent available", exact: true }).click();
  await expect(status).toHaveText("Agent unavailable: manual submission");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("status").filter({ hasText: "Submitted (synthetic)." })).toBeVisible();
});

test("override requires eight trimmed characters then writes and preserves a human record", async ({ page }, testInfo) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Missing or insufficient information");
  await captureCheckpoint(page, testInfo, "b-pack");
  await page.getByRole("radio", { name: /^Amend / }).click();
  const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
  await expect(reason).toHaveAttribute("aria-required", "true");
  for (const value of ["", "1234567", "   1234567   "]) {
    await reason.fill(value);
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/EX-24112$/);
    await expect(page.getByRole("alert").filter({ hasText: "A reason of at least eight characters is required for this decision." })).toBeVisible();
    if (value === "") await captureCheckpoint(page, testInfo, "b-rejected-empty-reason");
  }
  await reason.fill("12345678");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await expect(page.getByText("Yes. Reason: 12345678", { exact: true })).toBeVisible();
  await expect(page.getByText("Drug Tariff 2026-08", { exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, "b-accepted-amendment-record");
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
  await expect(page.getByText("Read-only: not awaiting an operator decision", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
});

test("recommended B decision replays under July; flag off applies to replay; Reset restores seed", async ({ page }, testInfo) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Reviewed the missing dispensing date");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, "b-recommended-decision-record");
  await page.getByRole("combobox", { name: "Replay with", exact: true }).selectOption("2026-07");
  await expect(page.getByText("Replayed under July 2026", { exact: true })).toBeVisible();
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, "b-july-sufficient");
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toHaveCount(0);
  await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
  await expect(page.getByText("Replay disabled in this manual comparison. The historical rule version is preserved; enable assistance to inspect it.", { exact: true })).toBeVisible();
  await expect(page.getByText("REFER BACK by Demo operator", { exact: false })).toBeVisible();
  await captureCheckpoint(page, testInfo, "b-july-assistance-off");
  await confirmReset(page);
  await expect(page.getByRole("switch", { name: "Agent: Off", exact: true })).not.toBeChecked();
  await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open the case pack", exact: true }).click();
  await startDemonstrationReview(page);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  await page.locator("a[href='/case/EX-24088']").first().click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000871", exact: true })).toBeVisible();
});

test("agent flag hides recommendations on every case without changing case state", async ({ page }, testInfo) => {
  await page.goto("queue");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const rows = page.getByRole("region", { name: "Exception queue table", exact: true }).locator("tbody > tr");
  await expect(rows).toHaveCount(50);
  const stateCells = rows.locator("[data-queue-state]");
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  const states = await stateCells.allTextContents();
  await captureCheckpoint(page, testInfo, "queue-assistance-off");
  for (const c of cases) {
    await page.locator(`a[href='/case/${c.id}']`).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Operator case pack: ${c.title}`);
    await expect(page.getByText("No recommendation", { exact: true })).toBeVisible();
    await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
    await captureCheckpoint(page, testInfo, `${c.id}-assistance-off`);
    await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    await expect(stateCells).toHaveText(states);
  }
  await confirmReset(page);
  await expect(stateCells).toHaveText(states);
});

test("D shows its three abstention reasons; E has no agent trace", async ({ page }, testInfo) => {
  await page.goto("case/EX-24123");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const abstention = page.getByRole("alert");
  await expect(abstention).toContainText("The agent abstained");
  await expect(abstention.locator("li")).toHaveCount(3);
  await expect(abstention).toContainText("Only 1 of 3 readings agree");
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, "d-abstention-not-run");
  await page.goto("case/EX-24101/trace");
  await expect(page.getByRole("list", { name: "Manual gathering trace" }).locator(":scope > li")).toHaveCount(7);
  await expect(page.getByRole("list", { name: "Deterministic clearance trace" }).locator(":scope > li")).toHaveCount(2);
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
  await expect(page.getByText("Cleared by rules; agent not invoked", { exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, "e-cleared-no-agent");
});

test("product header retains working controls without presentation UI", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const header = page.getByRole("banner");
  await expect(header).toContainText("Prescription Exception Case Builder");
  await expect(header.locator("svg.lucide-shield-check")).toBeVisible();
  await expect(page.locator("[data-disclaimer]")).toContainText("Synthetic demonstration data throughout.");
  await expect(page.getByText("The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides.", { exact: false })).toBeVisible();
  await expect(header.getByRole("switch")).toHaveCount(1);
  const nav = header.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Operations", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "How it works", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Presenter mode|Discussion mode/ })).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Presenter walkthrough" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Discussion mode", exact: true })).toHaveCount(0);
  await expect(page.locator("a[href$='/notes']")).toHaveCount(0);
  await expect(header).not.toContainText("NHSBSA capability demonstration · synthetic data");
  await header.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await expect(header.getByRole("switch", { name: "Agent: Off", exact: true })).not.toBeChecked();
  await confirmReset(page);
  await expect(header.getByRole("switch", { name: "Agent: Off", exact: true })).not.toBeChecked();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await header.screenshot({ path: testInfo.outputPath("after-header.png") });
});

test("queue state filters are interactive", async ({ page }) => {
  await page.goto("queue");
  const rows = page.getByRole("region", { name: "Exception queue table", exact: true }).locator("tbody > tr");
  await expect(rows).toHaveCount(50);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const tile = page.getByRole("button", { name: /Abstained worked as today/ });
  await tile.click();
  await expect(tile).toHaveAttribute("aria-pressed", "true");
  await expect(rows.locator("[data-queue-state]")).toHaveText(Array(50).fill("Abstained worked as today"));
  await page.getByRole("button", { name: /All items/ }).click();
  await expect(rows).toHaveCount(50);
});