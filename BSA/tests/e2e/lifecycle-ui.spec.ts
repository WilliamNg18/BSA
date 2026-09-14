import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { captureJson, expect, test } from "./fixtures";
import { DEMONSTRABLE_LIFECYCLE_STATES, prepareUnseededState } from "./current-lifecycle-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { decisionNote, operatorDecision, operatorRadio, performDecision, startDemonstrationReview, type OperatorOutcome } from "./operator-action-helpers";
import { HUMAN_RELEASE_LABELS, MANUAL_RELEASE_LABELS } from "../support/release-labels";
import { PLAYABLE_CASES } from "../../src/lib/domain/cases";

const B = "EX-24112";
const detail = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });
const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
async function queueReview(page: Page, id = B) {
  await page.getByRole("link", { name: "Open shared queue", exact: true }).click();
  await page.getByRole("link", { name: `Open ${id}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
  await page.getByRole("button", { name: "Start review", exact: true }).click();
}
async function record(page: Page, outcome: OperatorOutcome, reason: string, releaseVerified?: boolean) {
  await operatorDecision(page).getByRole("textbox", { name: "Reason (required)", exact: true }).fill(reason);
  await performDecision(page, outcome, { releaseVerified });
}

test("Task25 Off referral to approved On correction requires a human recheck before pricing", async ({ page }, info) => {
  const started = Date.now();
  await page.goto("pharmacy");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await expect(detail(page)).toContainText("Submitted, awaiting processing");
  await history(page).locator("summary").first().click();
  const attempts = page.getByRole("list", { name: "Immutable pharmacy attempts" });
  await expect(attempts.locator(":scope > li")).toHaveCount(2);
  await expect(attempts.locator(":scope > li").last()).toContainText("not_checked · off");
  const blindAttempt = await attempts.locator(":scope > li").last().innerText();
  await page.getByRole("button", { name: "Follow this case", exact: true }).click();
  await queueReview(page);
  await page.getByRole("radio", { name: "Refer back", exact: true }).check();
  await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  await record(page, "REFER_BACK", "Please add the dispensing date beside the initials");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page)).toContainText("Please add the dispensing date beside the initials");
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Resubmit blind", exact: true }).click();
  await expect(detail(page)).toContainText("Resubmitted, awaiting re-check");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(detail(page)).toContainText("Resubmitted, awaiting re-check");
  await queueReview(page);
  await expect(operatorDecision(page).getByRole("radio", { checked: true })).toHaveCount(0);
  await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
  await performDecision(page, "REFER_BACK");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page).getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toHaveValue("NCSO  RK 21/08/26");
  await expect(detail(page)).toContainText("Ready");
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(detail(page)).toContainText("Ready");
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
  await page.getByRole("button", { name: "Resubmit", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.nhsbsa.on);
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(operatorDecision(page).getByRole("region", { name: "Suggestion", exact: true }).getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Sufficient (human choice)", exact: true }).check();
  await record(page, "ACCEPT", "Human recheck confirms the corrected date before existing pricing", true);
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await page.getByRole("combobox", { name: "Replay with", exact: true }).selectOption("2026-08");
  await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText("Sufficient: release to pricing once confirmed");
  await expect(history(page).getByRole("status")).toHaveText(HUMAN_RELEASE_LABELS.nhsbsa);
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Operator case pack", exact: true }).click();
  await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(history(page).getByRole("status")).toHaveText(HUMAN_RELEASE_LABELS.pharmacy);
  await expect(page.getByRole("button", { name: "Stop following this case", exact: true })).toBeVisible();
  await history(page).getByText("History and attempts (4)", { exact: true }).click();
  await expect(attempts.locator(":scope > li")).toHaveCount(4);
  await expect(attempts.locator(":scope > li").nth(1)).toHaveText(blindAttempt, { useInnerText: true });
  await expect(attempts.locator(":scope > li").nth(2)).toContainText("NCSO  RK");
  await expect(attempts.locator(":scope > li").nth(2)).toContainText("not_checked · off");
  await expect(attempts.locator(":scope > li").nth(3)).toContainText("ready · scripted");
  await expect(page.getByRole("list", { name: "Lifecycle events" }).getByText("Human decision recorded (synthetic).", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("list", { name: "Lifecycle events" })).toContainText("Human review complete; released to existing pricing. No payment calculated.");
  await expect(history(page).getByRole("status")).not.toContainText("no operator action");
  await captureJson(info, "off-to-on-roundtrip-history", await history(page).innerText());
  await captureJson(info, "roundtrip-elapsed-time", { elapsedMs: Date.now() - started, informational: true });
});

test("Task25 manual EPS correction retains an unchecked snapshot until explicit human recheck", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await queueReview(page);
  await page.getByRole("radio", { name: "Refer back", exact: true }).check();
  await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
  await record(page, "REFER_BACK", "Human requests the missing date beside initials");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
  await page.getByRole("button", { name: "Resubmit blind", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.nhsbsa.off);
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await page.getByRole("radio", { name: "Sufficient (human choice)", exact: true }).check();
  await record(page, "ACCEPT", "Human recheck confirms the manually corrected endorsement", false);
  await expect(history(page).getByRole("status")).toHaveText(MANUAL_RELEASE_LABELS.nhsbsa);
  await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
  await history(page).getByText("History and attempts (3)", { exact: true }).click();
  await expect(page.getByRole("list", { name: "Immutable pharmacy attempts" })).toContainText("not_checked · off");
  await expect(page.getByRole("list", { name: "Lifecycle events" }).getByText("Human decision recorded (synthetic).", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("list", { name: "Lifecycle events" })).toContainText("Human review complete; released to existing pricing. No payment calculated.");
});

test("Task9 toggling never approves a draft and arbitrary BB edits never receive the B date correction", async ({ page }) => {
  await page.goto(`pharmacy/claims?caseId=${B}`);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(detail(page)).toContainText("No operator-approved draft");
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("BB RK 21/08/26");
  await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
  await expect(detail(page)).toContainText("No supported correction");
  await page.getByText("Precheck evidence", { exact: true }).click();
  await expect(detail(page)).toContainText("2026-08 / P2-C8");
  await expect(detail(page)).not.toContainText("2026-08 / P2-C9");
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
});

test("Task9 an actual B information request preserves pharmacy confirmation for human recheck", async ({ page }) => {
  await page.goto(`case/${B}`);
  await startDemonstrationReview(page);
  await operatorRadio(page, "REQUEST_INFORMATION").check();
  const question = "Please confirm the dispensing date beside the initials.";
  await decisionNote(page, "REQUEST_INFORMATION").fill(question);
  await performDecision(page, "REQUEST_INFORMATION");
  await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
  await expect(detail(page)).toContainText(LIFECYCLE_LABELS.information_requested.pharmacy);
  await expect(detail(page)).toContainText(question);
  await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Pharmacy text is required");
  const confirmation = "The dispensing date is 21 August 2026; please check the original endorsement.";
  await page.getByRole("textbox", { name: "Confirm", exact: true }).fill(confirmation);
  await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
  await expect(detail(page)).toContainText("Resubmitted, awaiting re-check");
  await queueReview(page, B);
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.in_review.nhsbsa.off);
  await history(page).getByText("History and attempts (3)", { exact: true }).click();
  await expect(page.getByRole("list", { name: "Immutable pharmacy attempts" })).toContainText(confirmation);
  await expect(page.getByRole("list", { name: "Lifecycle events" })).toContainText(question);
});

test("Task19 D blocks Type 2 before capture and A Today clears by code without an operator", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("radio", { name: "Paper", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Unreadable form", exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Paper", exact: true })).toBeChecked();
  await expect(page.getByLabel("Declared product", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Declared quantity", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Post paper", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" }).locator("li")).toHaveCount(3);
  await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /^Refer back/ })).toHaveCount(0);
  await expect(page).toHaveURL(/\/case\/EX-24123$/);
  await page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Decision and audit record", exact: true }).click();
  await expect(page.getByText("No human decision recorded yet", { exact: true })).toBeVisible();
  await page.goto("pharmacy");
  await page.getByRole("radio", { name: "Complete endorsement", exact: true }).click();
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.nhsbsa.off);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await page.locator('a[href="/case/EX-24107/trace"]').first().click();
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(page.getByRole("list", { name: "Deterministic clearance trace", exact: true })).toContainText("agent not invoked");
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
});

test("Hillcrest's four items exercise real states, counts and claimed amounts without a pharmacy selector", async ({ page }) => {
  await page.goto("pharmacy/claims");
  const pharmacy = page.getByRole("combobox", { name: "Pharmacy (synthetic)", exact: true });
  await expect(pharmacy).toHaveCount(0);
  await expect(page.locator("[data-pharmacy-identity]")).toContainText("Hillcrest Pharmacy (FQ123)");
  {
    await page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / }).click();
    const table = page.getByRole("table", { name: "Pharmacy claims", exact: true });
    const allRows = table.locator("tbody tr:not([data-background-case])");
    await expect(allRows).toHaveCount(4);
    await expect(page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / })).toContainText("4");
    for (const item of PLAYABLE_CASES) {
      await expect(allRows.filter({ hasText: item.id }).locator("td:nth-child(3)")).toHaveText(
        new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(item.claim.amountClaimed));
    }
    for (const state of DEMONSTRABLE_LIFECYCLE_STATES) {
      await prepareUnseededState(page, state);
      await page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / }).click();
      const labels = LIFECYCLE_LABELS[state];
      const rows = table.getByRole("row").filter({ has: page.getByRole("cell").filter({ hasText: labels.pharmacy }) });
      expect(await rows.count()).toBeGreaterThan(0);
      await rows.first().getByRole("button").click();
      if (!["referred_back", "information_requested"].includes(state)) await expect(detail(page).getByRole("textbox")).toHaveCount(0);
      if (state === "submitted") {
        await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
        await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
        await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
        await expect(detail(page)).toContainText("Submitted, awaiting processing");
        await page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / }).click();
      }
    }
  }
});

for (const width of [1280, 1440]) for (const enabled of [false, true]) {
  test(`Task9 claims full-rule accessibility width=${width} On=${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 1280 ? "dark" : "light" });
    await page.goto(`pharmacy/claims?caseId=${B}`);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    if (enabled) await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
    await history(page).getByText("History and attempts (1)", { exact: true }).click();
    const axe = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "claims-axe", axe);
    expect(axe.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (page.viewportSize()?.width === 1440) await page.screenshot({ path: info.outputPath("claims.png"), fullPage: true });
  });
}