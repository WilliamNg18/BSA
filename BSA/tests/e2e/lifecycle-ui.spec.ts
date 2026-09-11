import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, expect, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

const B = "EX-24112";
const detail = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });
const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
async function queueReview(page: Page, id = B) {
  await page.getByRole("link", { name: "Open shared queue", exact: true }).click();
  await page.locator(`[data-shared-case="${id}"]`).getByRole("button", { name: "Open for review", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
}
async function record(page: Page, reason: string) {
  await page.getByRole("textbox", { name: /^Reason/ }).fill(reason);
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page).toHaveURL(/\/record$/);
}

test("Task9/10 complete Off referral to approved On correction and human sufficient uses one shared case", async ({ page }, info) => {
  const started = Date.now();
  await page.goto("pharmacy");
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await expect(detail(page)).toContainText("Submitted, awaiting processing");
  await history(page).locator("summary").first().click();
  const attempts = page.getByRole("list", { name: "Immutable pharmacy attempts" });
  await expect(attempts.locator(":scope > li")).toHaveCount(2);
  await expect(attempts.locator(":scope > li").last()).toContainText("not_checked · off");
  const blindAttempt = await attempts.locator(":scope > li").last().innerText();
  await page.getByRole("button", { name: "Follow this case", exact: true }).click();
  await queueReview(page);
  await page.getByRole("radio", { name: /^Refer back / }).check();
  await record(page, "Please add the dispensing date beside the initials");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page)).toContainText("Please add the dispensing date beside the initials");
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await expect(detail(page)).toContainText("Resubmitted, awaiting re-check");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(detail(page)).toContainText("Resubmitted, awaiting re-check");
  await queueReview(page);
  await expect(page.getByRole("radio", { name: /^Refer back \(as recommended\)/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
  await record(page, "Reviewed missing date and approved the exact pharmacy instruction");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page).getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toHaveValue("NCSO  RK 21/08/26");
  await expect(detail(page)).toContainText("Not checked for this edit");
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(detail(page)).toContainText("Ready to resubmit");
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
  await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await page.getByRole("combobox", { name: "Replay with", exact: true }).selectOption("2026-08");
  await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText("Refer back with the exact fix");
  await queueReview(page);
  await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.in_review.nhsbsa.on);
  await expect(page.getByRole("radio", { name: /^Accept / })).toBeChecked();
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Case-building trace", exact: true }).click();
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toContainText("NCSO  RK 21/08/26");
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
  await record(page, "Human reviewed the date and complete evidence");
  await expect(history(page)).toContainText("Sufficient, released to existing pricing");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page)).toContainText("Payment approved (synthetic)");
  await expect(page.getByRole("button", { name: "Stop following this case", exact: true })).toBeVisible();
  await history(page).getByText("History and attempts (4)", { exact: true }).click();
  await expect(attempts.locator(":scope > li")).toHaveCount(4);
  await expect(attempts.locator(":scope > li").nth(1)).toHaveText(blindAttempt, { useInnerText: true });
  await expect(attempts.locator(":scope > li").nth(2)).toContainText("NCSO  RK");
  await expect(attempts.locator(":scope > li").nth(2)).toContainText("not_checked · off");
  await expect(attempts.locator(":scope > li").nth(3)).toContainText("ready · scripted");
  await expect(page.getByRole("list", { name: "Lifecycle events" }).getByText("Human decision recorded (synthetic).", { exact: true })).toHaveCount(3);
  await captureJson(info, "off-to-on-roundtrip-history", await history(page).innerText());
  expect(Date.now() - started).toBeLessThan(120_000);
});

test("Task9 manual correction retains an unchecked snapshot and requires an explicit human sufficient decision", async ({ page }) => {
  await page.goto(`pharmacy/claims?caseId=${B}`);
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
  await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await queueReview(page);
  await expect(page.getByRole("radio", { name: /^Escalate / })).toBeChecked();
  await page.getByRole("radio", { name: /^Sufficient \(human choice\)/ }).check();
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "eight characters" })).toBeVisible();
  await record(page, "Human reviewed the complete corrected endorsement");
  await expect(history(page)).toContainText("Sufficient, released to existing pricing");
  await expect(page.getByText("No. Note: Human reviewed the complete corrected endorsement", { exact: true })).toBeVisible();
  await history(page).getByText("History and attempts (2)", { exact: true }).click();
  await expect(page.getByRole("list", { name: "Immutable pharmacy attempts" })).toContainText("not_checked · off");
});

test("Task9 toggling never approves a draft and arbitrary BB edits never receive the B date correction", async ({ page }) => {
  await page.goto(`pharmacy/claims?caseId=${B}`);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(detail(page)).toContainText("No operator-approved draft");
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("BB RK 21/08/26");
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(detail(page)).toContainText("Agent unable to determine");
  await expect(detail(page)).toContainText("Clause: NOT RUN");
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
});

test("Task9 C shows both conflict values, approved note and confirmation without resolving evidence", async ({ page }) => {
  await page.goto("case/EX-24119");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
  await record(page, "Please confirm the conflicting quantities before a decision");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page)).toContainText("Operator-approved note");
  const quantities = detail(page).locator("dl").last();
  await expect(quantities).toContainText("56");
  await expect(quantities).toContainText("84");
  await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Pharmacy text is required");
  await page.getByRole("textbox", { name: "Pharmacy confirmation", exact: true }).fill("Please review both values against the synthetic form");
  await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
  await expect(detail(page)).toContainText("Resubmitted, awaiting re-check");
  await queueReview(page, "EX-24119");
  await expect(page.getByRole("radio", { name: /^Request information \(as recommended\)/ })).toBeChecked();
  await expect(page.getByRole("heading", { name: "Conflicts and missing evidence", exact: true })).toBeVisible();
  await history(page).getByText("History and attempts (3)", { exact: true }).click();
  await expect(page.getByRole("list", { name: "Immutable pharmacy attempts" })).toContainText("Please review both values against the synthetic form");
});

test("Task10 D stops at capture after revision and E clears by code on explicit queue arrival", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("radio", { name: "Unreadable form", exact: true }).click();
  await page.getByRole("textbox", { name: "Endorsement entered by the pharmacy", exact: true }).fill("NCSO RK 21/08/26");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Agent unable to determine");
  await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
  await queueReview(page, "EX-24123");
  await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" }).locator("li")).toHaveCount(3);
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /^Refer back / }).check();
  await record(page, "Please supply readable evidence for a human review");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(detail(page)).toContainText("Captured: STOPPED");
  await expect(detail(page)).not.toContainText("Ready to resubmit");
  await page.goto("pharmacy/claims?caseId=EX-24101");
  await detail(page).getByText("Demonstration replay", { exact: true }).click();
  await page.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
  await queueReview(page, "EX-24101");
  await expect(history(page)).toContainText("Sufficient, released to existing pricing");
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Cleared by deterministic rules; the agent was not called");
});

test("Task9 all pharmacies have seven states, real totals, read-only dispositions and shared ID deep links", async ({ page }) => {
  await page.goto("pharmacy/claims");
  const pharmacy = page.getByRole("combobox", { name: "Pharmacy (synthetic)", exact: true });
  await expect(pharmacy).toHaveValue("FQ123");
  for (const code of ["FQ123", "FH774", "FM208", "FT561", "FK390"]) {
    await pharmacy.selectOption(code);
    for (const state of ["submitted", "in_review", "information_requested", "referred_back", "resubmitted", "paid", "escalated"]) {
      await page.getByRole("combobox", { name: "Claim state", exact: true }).selectOption(state);
      const rows = page.getByRole("list", { name: "Pharmacy claims", exact: true }).locator(":scope > li");
      expect(await rows.count()).toBeGreaterThan(0);
      const amounts = await rows.allTextContents();
      const total = amounts.reduce((sum, text) => sum + Number(text.match(/Claimed: £([\d.]+)/)?.[1]), 0);
      await expect(page.locator('[aria-label="Synthetic claim totals"]').getByRole("definition").filter({ hasText: /^£/ })).toHaveText(`£${total.toFixed(2)}`);
      await rows.first().getByRole("button").click();
      if (!["referred_back", "information_requested"].includes(state)) await expect(detail(page).getByRole("textbox")).toHaveCount(0);
      if (code === "FQ123" && state === "submitted") {
        await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
        await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
        await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
        await expect(detail(page)).toContainText("Submitted, awaiting processing");
      }
    }
  }
});

for (const width of [360, 1440]) for (const enabled of [false, true]) {
  test(`Task9 claims full-rule accessibility width=${width} On=${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 360 ? "dark" : "light" });
    await page.goto(`pharmacy/claims?caseId=${B}`);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    if (enabled) await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
    await history(page).getByText("History and attempts (1)", { exact: true }).click();
    const axe = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "claims-axe", axe);
    expect(axe.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath("claims.png"), fullPage: true });
  });
}