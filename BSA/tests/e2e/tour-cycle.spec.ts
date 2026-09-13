import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

const stops = [
  { chapter: 1, label: "The scene", path: "/#scene" },
  { chapter: 2, label: "A month in numbers", path: "/#month" },
  { chapter: 3, label: "What exists today and what changes", path: "/#pipeline" },
  { chapter: 4, label: "Four cases", path: "/#cases" },
  { chapter: 5, label: "One agent, two places", path: "/#two-places" },
  { chapter: 5, label: "Pharmacy example", path: "/pharmacy" },
  { chapter: 6, label: "The queue", path: "/queue" },
  { chapter: 7, label: "What the pharmacy sees", path: "/pharmacy/claims" },
  { chapter: 8, label: "Where it ends", path: "/#close" },
];

for (const enabled of [false, true]) {
  test(`eight chapters remain independently reachable in both directions: agent ${enabled}`, async ({ page }) => {
    await page.goto("./#scene");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const rail = page.getByRole("navigation", { name: "Guided tour" });
    for (const [index, stop] of stops.entries()) {
      if (index) await rail.getByRole("button", { name: "Next", exact: true }).press("Enter");
      await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === stop.path);
      await expect(rail).toContainText(`${stop.chapter}/8 · ${stop.label}`);
      if (index) await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
      if (stop.chapter === 3) {
        await expect(page.getByRole("region", { name: "Prescription processing paths" })).toBeVisible();
        await expect(page.getByRole("list", { name: "Four canonical synthetic cases" })).toHaveCount(0);
      }
      if (stop.chapter === 4) {
        await expect(page.getByRole("region", { name: "Prescription processing paths" })).toHaveCount(0);
        const cards = page.getByRole("list", { name: "Four canonical synthetic cases" }).locator(":scope > li");
        await expect(cards).toHaveCount(4);
        for (const [caseIndex, scenario] of ["A", "B", "C", "D"].entries()) {
          await expect(cards.nth(caseIndex).getByRole("link", { name: scenario === "A" ? "View automatically priced claim" : `Open case ${scenario}`, exact: true })).toBeVisible();
          if (scenario === "A") {
            await expect(cards.nth(caseIndex)).toHaveAttribute("data-case-routing", "auto_priced");
            await expect(cards.nth(caseIndex).getByRole("link", { name: "Open case A", exact: true })).toHaveCount(0);
            await expect(cards.nth(caseIndex).locator("[data-pain-marker], [data-outcome]")).toHaveCount(0);
          }
          await expect(cards.nth(caseIndex).getByRole("button", { name: "Follow this item", exact: true })).toBeVisible();
        }
      }
      if (stop.path === "/#two-places") {
        for (const name of ["Pharmacy · Before submission flow", "NHSBSA · After exception routing flow"]) {
          await expect(page.getByRole("list", { name }).locator(":scope > li")).toHaveCount(enabled ? 5 : 7);
        }
        const loop = page.getByRole("list", { name: enabled
          ? "Assisted referral loop · Less repeat gathering proposed flow"
          : "Today referral loop · Repeated manual gathering flow" });
        await expect(loop).toBeVisible();
        await expect(loop.locator(":scope > li")).toHaveCount(enabled ? 6 : 8);
        await expect(loop).toContainText("Pharmacy");
        await expect(loop).toContainText("Operator re-checks and decides");
        await expect(loop).toContainText(enabled ? "Operator decides and approves the pharmacy note" : "Gather the revised evidence again");
        await expect(page.getByText(/Case D still needs manual review/)).toBeVisible();
      }
    }
    await expect(rail.getByRole("button", { name: "Done", exact: true })).toBeDisabled();
    for (const stop of stops.slice(0, -1).reverse()) {
      await page.keyboard.press("Alt+ArrowLeft");
      await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === stop.path);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
    }
    await rail.getByRole("button", { name: "Choose tour chapter" }).click();
    await expect(page.getByRole("menuitem")).toHaveText(stops.filter((stop) => stop.path !== "/pharmacy").map((stop) => `${stop.chapter}. ${stop.label}`));
    await page.getByRole("menuitem", { name: "7. What the pharmacy sees", exact: true }).press("Enter");
    await expect(page).toHaveURL(/\/pharmacy\/claims$/);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Pharmacy claims", exact: true })).toBeFocused();
    const dismiss = rail.getByRole("button", { name: "Dismiss tour" });
    await dismiss.focus();
    await expect(dismiss).toBeFocused();
    await dismiss.press("Enter");
    await expect(rail).toHaveCount(0);
    await page.getByRole("button", { name: "Restore tour", exact: true }).press("Enter");
    await expect(rail).toContainText("7/8 · What the pharmacy sees");
    await expect(page).toHaveURL(/\/pharmacy\/claims$/);
  });

  test(`cycle guide follows human referral, correction, recheck and existing pricing: agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const recorded = page.getByRole("region", { name: "Shared case history", exact: true });
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    await page.getByRole("radio", { name: /^Refer back / }).check();
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
    if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
    await page.getByRole("textbox", { name: /^Reason/ }).fill("Please add the dispensing date beside the initials");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
    if (enabled) {
      await expect(page.getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
      await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
      await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
    } else {
      await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
    }
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
    const priorHistory = await recorded.getByRole("listitem").allTextContents();
    const recordFields = recorded.locator("dl > div")
      .filter({ has: page.getByText("Attempt / record", { exact: true }) }).locator("dd");
    const priorRecords = (await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text));
    expect(priorRecords.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    expect((await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text))).toEqual(priorRecords);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    if (enabled) await expect(page.getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
    await page.getByRole("radio", { name: enabled ? /^Accept the recommendation \(as recommended\)/ : /^Sufficient \(human choice\)/ }).check();
    await page.getByRole("textbox", { name: /^Reason/ }).fill("Human recheck confirms the corrected dispensing date");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
    expect((await recorded.getByRole("listitem").allTextContents()).slice(0, priorHistory.length)).toEqual(priorHistory);
    const acceptedRecords = (await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text));
    expect(acceptedRecords.slice(0, priorRecords.length)).toEqual(priorRecords);
    expect(acceptedRecords).toHaveLength(priorRecords.length + 1);
    for (const mode of [!enabled, enabled]) {
      await page.getByRole("banner").getByRole("switch").setChecked(mode);
      await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
      expect((await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text))).toEqual(acceptedRecords);
    }
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
    expect((await recorded.getByRole("listitem").allTextContents()).slice(0, priorHistory.length)).toEqual(priorHistory);
    expect((await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text))).toEqual(acceptedRecords);
    await expect(recorded).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
    await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
  });
}

for (const width of [360, 1440]) {
  test(`cycle comparison preserves recorded state, reduced motion and accessible reflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("pharmacy/claims?caseId=EX-24112");
    const guide = page.getByRole("region", { name: "Referral cycle guide", exact: true });
    for (const enabled of [false, true]) {
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await expect(guide).toContainText(enabled
        ? "Read the operator-approved fix, correct the endorsement, then explicitly resubmit. The agent verifies the submission and advises; a person decides."
        : "Today: referred-back items appear in MYS Unpaid items with an RB code and the operator's reason. The pharmacy corrects and resubmits.");
      await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });
}
