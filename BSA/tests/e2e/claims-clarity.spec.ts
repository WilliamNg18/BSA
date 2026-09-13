import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

const offGuide = "Today: referred-back items appear in MYS Unpaid items with an RB code and the operator's reason. The pharmacy corrects and resubmits.";
const onGuide = "Read the operator-approved fix, correct the endorsement, then explicitly resubmit. The agent verifies the submission and advises; a person decides.";

test("Task16 four counted synthetic amount tiles filter one five-column table", async ({ page }) => {
  await page.goto("pharmacy/claims");
  const tiles = page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button");
  const names = ["Action needed", "Waiting on NHSBSA", "Paid this month", "All"];
  const table = page.getByRole("table", { name: "Pharmacy claims", exact: true });
  await expect(tiles).toHaveCount(4);
  await expect(table.getByRole("columnheader")).toHaveText(["Item", "Dispensed", "Amount", "State", "Action"]);
  for (const [index, name] of names.entries()) {
    const tile = tiles.nth(index);
    await expect(tile).toContainText(name);
    await tile.focus();
    await tile.press("Enter");
    await expect(tile).toHaveAttribute("aria-pressed", "true");
    const rows = table.locator("tbody tr");
    await expect(tile).toContainText(`${await rows.count()} items`);
    const amounts = await rows.locator("td:nth-child(3)").allTextContents();
    const total = amounts.reduce((sum, amount) => sum + Number(amount.replace(/[£,]/g, "")), 0);
    await expect(tile).toContainText(new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(total));
    const states = await rows.locator("td:nth-child(4)").allTextContents();
    const allowed = index === 0 ? [LIFECYCLE_LABELS.referred_back.pharmacy, LIFECYCLE_LABELS.information_requested.pharmacy]
      : index === 1 ? [LIFECYCLE_LABELS.submitted.pharmacy, LIFECYCLE_LABELS.in_review.pharmacy, LIFECYCLE_LABELS.resubmitted.pharmacy, LIFECYCLE_LABELS.escalated.pharmacy]
      : index === 2 ? [LIFECYCLE_LABELS.paid.pharmacy] : Object.values(LIFECYCLE_LABELS).map((labels) => labels.pharmacy);
    for (const state of states) expect(allowed).toContain(state);
  }
  await expect(page.getByRole("combobox", { name: "Claim state" })).toHaveCount(0);
});

for (const enabled of [false, true]) {
  test(`Task16 guide and delivery provenance are keyboard accessible On=${enabled}`, async ({ page }, info) => {
    await page.goto("pharmacy/claims?caseId=EX-24112");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect(page.getByRole("group", { name: "Claim filters", exact: true })).toBeVisible();
    const guide = page.getByRole("region", { name: "Referral cycle guide", exact: true });
    await expect(guide.locator("p")).toHaveText(enabled ? onGuide : offGuide);
    await page.mouse.move(0, 0);
    await page.keyboard.press("Escape");
    const help = guide.getByRole("button", { name: "What is assumed?", exact: true });
    await help.scrollIntoViewIfNeeded();
    await help.focus();
    await expect(help).toBeFocused();
    await expect(page.getByRole("tooltip")).toContainText("Owner-supplied public context: MYS Unpaid items and NHSmail notification; expiry after 18 months.");
    await expect(page.getByRole("tooltip")).toContainText("Weeks of delay are illustrative. No notification is sent here.");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    if (!enabled) {
      await page.getByRole("button", { name: "How was this sent?", exact: true }).focus();
      await expect(page.getByRole("tooltip")).toContainText("The operator text and code are recorded synthetic evidence.");
      await expect(page.getByRole("tooltip")).toContainText("Weeks of delay are illustrative.");
    } else {
      await expect(page.getByRole("region", { name: "Operator response", exact: true })).toContainText("No operator-approved draft");
      await expect(page.getByRole("region", { name: "Operator-approved pharmacy note", exact: true })).toHaveCount(0);
    }
    const audit = await new AxeBuilder({ page }).analyze();
    await captureJson(info, "claims-guide-axe", audit);
    expect(audit.violations).toEqual([]);
  });
}

test("Task16 monthly actual counts and action filters update on explicit resubmission", async ({ page }) => {
  await page.goto("pharmacy/claims?caseId=EX-24112");
  const monthly = page.getByRole("region", { name: "Selected pharmacy this month", exact: true });
  const corrected = monthly.locator("dl > div").filter({ hasText: "Corrected/resubmitted" }).getByRole("definition");
  const before = Number((await corrected.innerText()).replaceAll(",", ""));
  const actionTile = page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^Action needed / });
  const beforeActions = Number((await actionTile.innerText()).match(/(\d+) items/)![1]);
  await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
  await expect(corrected).toHaveText(String(before));
  await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
  await expect(corrected).toHaveText(String(before + 1), { timeout: 1000 });
  await expect(actionTile).toContainText(`${beforeActions - 1} items`, { timeout: 1000 });
  await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText(LIFECYCLE_LABELS.paid.pharmacy, { timeout: 1000 });
  await expect(monthly).toContainText("not this pharmacy's recorded totals");
});
