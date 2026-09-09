import { cases, expect, test } from "./fixtures";
import { DISCUSSION_PROMPTS, WALKTHROUGH } from "../../src/lib/domain/content";

test("trace replay announces one step at a time, Show all and Clear work", async ({ page }) => {
  await page.goto("case/EX-24107/trace");
  const trace = page.getByRole("list", { name: "Agent trace", exact: true });
  const steps = trace.locator(":scope > li");
  await expect(trace).toHaveAttribute("aria-live", "polite");
  await expect(steps).toHaveCount(9);
  await page.clock.install();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(steps).toHaveCount(0);
  await page.getByRole("button", { name: "Replay step by step" }).click();
  await expect(steps).toHaveCount(0);
  for (let step = 1; step <= 9; step++) {
    await page.clock.runFor(900);
    await expect(steps).toHaveCount(step);
  }
  await expect(page.getByRole("heading", { name: "Where it ends" })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await expect(steps).toHaveCount(9);
});

test("pharmacy is advisory for missing, corrected, complete, unreadable and unavailable inputs", async ({ page }) => {
  await page.goto("pharmacy");
  const status = page.getByRole("status").filter({ hasText: /^(Information may be missing|Ready to submit|Agent unable to determine)$/ });
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  await expect(status).toHaveText("Information may be missing");
  await page.getByRole("button", { name: "Correct the information" }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("NCSO  RK 21/08/26");
  await expect(status).toHaveText("Ready to submit");
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
  await expect(status).toHaveText("Agent unable to determine");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("status").filter({ hasText: "Submitted (synthetic)." })).toBeVisible();
});

test("override requires eight trimmed characters then writes and preserves a human record", async ({ page }) => {
  await page.goto("case/EX-24112");
  await page.getByRole("radio", { name: /^Amend / }).click();
  const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
  await expect(reason).toHaveAttribute("aria-required", "true");
  for (const value of ["", "1234567", "   1234567   "]) {
    await reason.fill(value);
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/EX-24112$/);
    await expect(page.getByText("A reason is required when you override the recommendation, or when there is no recommendation to accept.").first()).toBeVisible();
  }
  await reason.fill("12345678");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
  await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
  await expect(page.getByText("Yes. Reason: 12345678", { exact: true })).toBeVisible();
  await expect(page.getByText("Drug Tariff 2026-08", { exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
  await expect(page.getByText("Decision already recorded for this case", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
});

test("recommended B decision replays under July; flag off applies to replay; Reset restores seed", async ({ page }) => {
  await page.goto("case/EX-24112");
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await page.getByRole("combobox", { name: "Replay with", exact: true }).click();
  await page.getByRole("option", { name: "July 2026 (2026-07)", exact: true }).click();
  await expect(page.getByText("Replayed under July 2026", { exact: true })).toBeVisible();
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Agent recommendations on", exact: true }).click();
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toHaveCount(0);
  await expect(page.getByText("No recommendation (agent not run)", { exact: true })).toHaveCount(2);
  await expect(page.getByText("REFER BACK by Demo operator", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Agent recommendations on", exact: true })).toBeChecked();
  await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open the case pack", exact: true }).click();
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  await page.locator("a[href='/BSA/case/EX-24088']").first().click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Record DR-000871", exact: true })).toBeVisible();
});

test("agent flag hides recommendations on every case without changing case state", async ({ page }) => {
  await page.goto("queue");
  const rows = page.locator("tbody > tr");
  await expect(rows).toHaveCount(12);
  const stateCells = rows.locator("td:nth-child(6)");
  const states = await stateCells.allTextContents();
  await page.getByRole("switch", { name: "Agent recommendations on", exact: true }).click();
  await expect(stateCells).toHaveText(states);
  for (const c of cases) {
    await page.locator(`a[href='/BSA/case/${c.id}']`).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Operator case pack: ${c.title}`);
    await expect(page.getByText("No recommendation (agent not run)", { exact: true })).toBeVisible();
    await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    await expect(stateCells).toHaveText(states);
  }
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(stateCells).toHaveText(states);
});

test("D shows its three abstention reasons; E has no agent trace", async ({ page }) => {
  await page.goto("case/EX-24123");
  const abstention = page.getByRole("alert");
  await expect(abstention).toContainText("The agent abstained");
  await expect(abstention.locator("li")).toHaveCount(3);
  await expect(abstention).toContainText("Only 1 of 3 readings agree");
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  await page.goto("case/EX-24101/trace");
  await expect(page.getByRole("list", { name: "Agent trace" }).locator(":scope > li")).toHaveCount(2);
  await expect(page.getByText("Cleared by rules; agent not invoked", { exact: true })).toBeVisible();
});

test("presenter seven beats navigate and discussion follows each case view", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Presenter mode", exact: true }).click();
  const presenter = page.getByRole("complementary", { name: "Presenter walkthrough" });
  await expect(presenter.getByRole("button", { name: "Previous beat" })).toBeDisabled();
  for (const [index, beat] of WALKTHROUGH.entries()) {
    await expect(presenter).toContainText(`Beat ${index + 1} of 7`);
    await presenter.getByRole("button", { name: "Go to screen", exact: true }).click();
    expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe(`/BSA${beat.route === "/" ? "" : beat.route}`);
    if (index < WALKTHROUGH.length - 1) await presenter.getByRole("button", { name: "Next beat" }).click();
  }
  await expect(presenter.getByRole("button", { name: "Next beat" })).toBeDisabled();
  await presenter.getByRole("button", { name: "Close presenter mode" }).click();
  for (const key of ["/case", "/trace", "/record"]) {
    await page.goto(`case/EX-24112${key === "/case" ? "" : key}`);
    await page.getByRole("button", { name: "Discussion mode", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Discussion mode", exact: true });
    await expect(dialog).toBeVisible();
    for (const prompt of DISCUSSION_PROMPTS.filter((p) => p.routes.includes(key))) {
      await expect(dialog.locator("section[aria-labelledby='prompts-here']")).toContainText(prompt.text);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  }
});

test("queue state filters are interactive", async ({ page }) => {
  await page.goto("queue");
  await expect(page.locator("tbody > tr")).toHaveCount(12);
  await page.getByRole("radio", { name: "Agent abstained", exact: true }).click();
  await expect(page.locator("tbody > tr")).toHaveCount(2);
  await page.getByRole("radio", { name: "All", exact: true }).click();
  await expect(page.locator("tbody > tr")).toHaveCount(12);
});