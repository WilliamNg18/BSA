import AxeBuilder from "@axe-core/playwright";
import { expect, navigatePrimary, test } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { PLAYABLE_CASES } from "../../src/lib/domain/cases";
import { openHistory } from "./perspective-helpers";

const stops = [
  { chapter: 1, label: "Real process", path: "/#scene" },
  { chapter: 2, label: "A month in numbers", path: "/#month" },
  { chapter: 3, label: "Evidence to a decision", path: "/#pipeline" },
  { chapter: 4, label: "Cases and boundaries", path: "/#cases" },
  { chapter: 5, label: "One continuous cycle", path: "/#two-places" },
  { chapter: 5, label: "Pharmacy check", path: "/pharmacy" },
  { chapter: 5, label: "NHSBSA queue", path: "/queue" },
  { chapter: 5, label: "Pharmacy claims", path: "/pharmacy/claims" },
  { chapter: 6, label: "The central bet", path: "/#close" },
];

for (const enabled of [false, true]) {
  test(`six chapters retain all nine stops in both directions: agent ${enabled}`, async ({ page }) => {
    await page.goto("./#scene");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const rail = page.getByRole("navigation", { name: "Guided tour" });
    for (const [index, stop] of stops.entries()) {
      if (index) await rail.getByRole("button", { name: "Next", exact: true }).press("Enter");
      await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === stop.path);
      await expect(rail).toContainText(`${stop.chapter}/6 · ${stop.label}`);
      if (index) await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
      if (stop.chapter === 3) {
        await expect(page.getByRole("region", { name: "Prescription processing paths" })).toBeVisible();
        await expect(page.getByRole("list", { name: "Four canonical synthetic cases" })).toHaveCount(0);
      }
      if (stop.chapter === 4) {
        await expect(page.getByRole("link", { name: "Inspect the proposed evidence boundary", exact: true })).toHaveAttribute("href", "/boundary");
        await expect(page.getByRole("region", { name: "Prescription processing paths" })).toHaveCount(0);
        const cards = page.getByRole("list", { name: "Four canonical synthetic cases" }).locator(":scope > li");
        await expect(cards).toHaveCount(4);
        expect(PLAYABLE_CASES.map((item) => item.id)).toEqual(["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"]);
        for (const [caseIndex, item] of PLAYABLE_CASES.entries()) {
          await expect(cards.nth(caseIndex)).toContainText(item.id);
          const open = cards.nth(caseIndex).getByRole("link", { name: item.id === "EX-24107" ? "View automatically priced claim" : `Open case ${item.scenario}`, exact: true });
          await expect(open).toBeVisible();
          await expect(open).toHaveAttribute("href", item.id === "EX-24107" ? "/pharmacy/claims?case=EX-24107" : `/case/${item.id}`);
          if (item.id === "EX-24107") {
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
    await expect(page.getByRole("menuitem")).toHaveText(stops.filter((stop, index) => index === 0 || stop.chapter !== stops[index - 1].chapter).map((stop) => `${stop.chapter}. ${stop.label}`));
    await page.getByRole("menuitem", { name: "5. One continuous cycle", exact: true }).press("Enter");
    await expect(page).toHaveURL(/#two-places$/);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "One continuous cycle", exact: true })).toBeFocused();
    for (const path of ["/pharmacy", "/queue", "/pharmacy/claims"]) {
      await rail.getByRole("button", { name: "Next", exact: true }).press("Enter");
      await expect(page).toHaveURL((url) => url.pathname === path);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
    }
    await expect(page).toHaveURL(/\/pharmacy\/claims$/);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Pharmacy claims", exact: true })).toBeFocused();
    const dismiss = rail.getByRole("button", { name: "Dismiss tour" });
    await dismiss.focus();
    await expect(dismiss).toBeFocused();
    await dismiss.press("Enter");
    await expect(rail).toHaveCount(0);
    await page.getByRole("button", { name: "Restore tour", exact: true }).press("Enter");
    await expect(rail).toContainText("5/6 · Pharmacy claims");
    await expect(page).toHaveURL(/\/pharmacy\/claims$/);
  });

  test(`cycle guide follows human referral, correction, recheck and existing pricing: agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("EX-24112:2");
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const recorded = page.getByRole("region", { name: "Shared case history", exact: true });
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    await page.getByRole("radio", { name: "Refer back", exact: true }).check();
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
    await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Please add the dispensing date beside the initials");
    if (enabled) await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await performDecision(page, "REFER_BACK");
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
    await openHistory(page);
    const events = recorded.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
    const priorHistory = await events.allTextContents();
    const recordFields = events.locator("dl > div")
      .filter({ has: page.getByText("Attempt / record", { exact: true }) }).locator("dd");
    const priorRecords = (await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text));
    expect(priorRecords.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    expect((await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text))).toEqual(priorRecords);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    if (enabled) await expect(operatorDecision(page).getByRole("region", { name: "Suggestion", exact: true }).getByText("Sufficient: release to pricing once confirmed", { exact: true })).toBeVisible();
    await page.getByRole("radio", { name: "Sufficient (human choice)", exact: true }).check();
    await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human recheck confirms the corrected dispensing date");
    await performDecision(page, "ACCEPT", { releaseVerified: enabled });
    const releaseLabels = enabled ? HUMAN_RELEASE_LABELS : MANUAL_RELEASE_LABELS;
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
    await openHistory(page);
    expect((await events.allTextContents()).slice(0, priorHistory.length)).toEqual(priorHistory);
    await expect(events.nth(-2)).toContainText("Human decision recorded (synthetic).");
    await expect(events.nth(-2).locator("dl > div").filter({ has: page.getByText("Time / actor", { exact: true }) })).toContainText("operator");
    await expect(events.last()).toContainText("Priced by NHSBSA's existing rules engine after human judgement");
    await expect(events.last().locator("dl > div").filter({ has: page.getByText("Time / actor", { exact: true }) })).toContainText("code");
    await expect(page.getByRole("region", { name: "Existing pricing outcome", exact: true })).not.toContainText("no person involved");
    const acceptedRecords = (await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text));
    expect(acceptedRecords.slice(0, priorRecords.length)).toEqual(priorRecords);
    expect(acceptedRecords).toHaveLength(priorRecords.length + 1);
    for (const mode of [!enabled, enabled]) {
      await page.getByRole("banner").getByRole("switch").setChecked(mode);
      await expect(recorded.getByRole("status")).toHaveText(releaseLabels.pharmacy);
      expect((await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text))).toEqual(acceptedRecords);
    }
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
    await expect(operatorDecision(page).getByRole("radiogroup", { name: "Decision", exact: true })).toHaveCount(0);
    await expect(operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
    await openHistory(page);
    expect((await events.allTextContents()).slice(0, priorHistory.length)).toEqual(priorHistory);
    expect((await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text))).toEqual(acceptedRecords);
    await expect(recorded.getByRole("status")).not.toContainText("no operator action");
    await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText(releaseLabels.pharmacy);
  });

  test(`submission receipts distinguish complete B from wrong-pack review: agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    if (enabled) {
      await page.getByRole("button", { name: "Apply correction", exact: true }).click();
      await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing, no person involved");
    } else {
      await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO RK 21/08/26");
    }
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
    await expect(receipt).toContainText("EX-24112:2");
    await expect(receipt).toContainText("NCSO RK 21/08/26");
    await receipt.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const recorded = page.getByRole("region", { name: "Shared case history", exact: true });
    const releasedState = enabled ? LIFECYCLE_LABELS.released_to_pricing.pharmacy : LIFECYCLE_LABELS.paid.pharmacy;
    await expect(recorded.getByRole("status")).toHaveText(releasedState);
    await openHistory(page);
    const events = recorded.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
    await expect(events.last()).toContainText(enabled
      ? "Verified, released to existing pricing, no operator action. No payment calculated."
      : "no person involved");
    await expect(events.last().locator("dl > div").filter({ has: page.getByText("Time / actor", { exact: true }) })).toContainText("code");
    await expect(events.last()).toContainText("No decision record");
    const releaseIdentity = () => events.evaluateAll((items) => items.map((item) => ({
      fields: Array.from(item.querySelectorAll("dl > div"))
        .filter((field) => ["Time / actor", "Attempt / record"].includes(field.querySelector("dt")?.textContent ?? ""))
        .map((field) => field.textContent),
      message: item.querySelector(":scope > p")?.textContent,
    })));
    const releasedHistory = await releaseIdentity();
    for (const mode of [!enabled, enabled]) {
      await page.getByRole("banner").getByRole("switch").setChecked(mode);
      await expect(recorded.getByRole("status")).toHaveText(releasedState);
      expect(await releaseIdentity()).toEqual(releasedHistory);
    }
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);

    await navigatePrimary(page, "Pharmacy check");
    await page.getByRole("radio", { name: "Wrong pack size", exact: true }).check();
    await expect(page.getByRole("spinbutton", { name: "Pack size dispensed", exact: true })).toHaveValue("28");
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    await expect(receipt).toContainText("SYN-FQ123-MISMATCH:2");
    await receipt.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await openHistory(page);
    if (enabled) {
      // Plausible typed format is not source agreement: G's second gate withholds release.
      await expect(events.last()).toContainText("Product pack and presentation agree");
      await expect(events.last().locator("dl > div").filter({ has: page.getByText("Time / actor", { exact: true }) })).toContainText("code");
    } else {
      await expect(events.last()).toContainText("Explicit demo submission");
      await expect(events.last().locator("dl > div").filter({ has: page.getByText("Time / actor", { exact: true }) })).toContainText("pharmacy");
    }
    await expect(events.last()).toContainText("No decision record");
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/SYN-FQ123-MISMATCH$/);
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  });
}

for (const width of [1280, 1440]) {
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
