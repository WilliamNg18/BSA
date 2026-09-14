import AxeBuilder from "@axe-core/playwright";
import { expect, navigatePrimary, test } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { enterDesktopDemo } from "./desktop-step-helpers";
import { historyIdentity, openHistory } from "./perspective-helpers";

for (const enabled of [false, true]) {
  test(`ordinary cycle views remain reachable after demo Exit: agent ${enabled}`, async ({ page }) => {
    await enterDesktopDemo(page, enabled);
    const strip = page.getByTestId("demo-strip");
    await strip.getByRole("combobox", { name: "Jump to demo step" }).selectOption("8");
    await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-case", "EX-24112");
    await expect(page.getByTestId("demo-step-screen").getByRole("table")).toHaveCount(1);
    await strip.getByRole("button", { name: "Exit demo", exact: true }).click();
    await expect(page.getByTestId("demo-step-screen")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Type 2 worklist", exact: true })).toBeVisible();
    for (const [name, path] of [["Pharmacy check", "/pharmacy"], ["NHSBSA queue", "/queue"], ["Pharmacy claims", "/pharmacy/claims"]] as const) {
      await navigatePrimary(page, name);
      await expect(page).toHaveURL((url) => url.pathname === path && !url.search);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
    }
    await navigatePrimary(page, "Overview");
    await page.goto("./#two-places");
    for (const name of ["Pharmacy · Before submission flow", "NHSBSA · After exception routing flow"]) {
      await expect(page.getByRole("list", { name }).locator(":scope > li")).toHaveCount(enabled ? 5 : 7);
    }
    const loop = page.getByRole("list", { name: enabled
      ? "Assisted referral loop · Less repeat gathering proposed flow"
      : "Today referral loop · Repeated manual gathering flow" });
    await expect(loop.locator(":scope > li")).toHaveCount(enabled ? 6 : 8);
    await expect(loop).toContainText("Pharmacy");
    await expect(loop).toContainText("Operator re-checks and decides");
    await expect(loop).toContainText(enabled ? "Operator decides and approves the pharmacy note" : "Gather the revised evidence again");
    await expect(page.getByText(/Case D still needs manual review/)).toBeVisible();
    await strip.getByRole("button", { name: "Enter demo mode", exact: true }).press("Enter");
    await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
  });

  test(`cycle guide follows human referral, correction, recheck and attributed release: agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.locator('[data-pharmacy-action="submit"]').click();
    await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("EX-24112:2");
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const recorded = page.getByRole("region", { name: "Shared case history", exact: true });
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    const operator = page.getByRole("region", { name: "Operator decision", exact: true });
    await operator.getByRole("button", { name: "Start review", exact: true }).click();
    if (enabled) await operator.getByRole("button", { name: "Apply suggestion", exact: true }).click();
    else {
      await operator.getByRole("radio", { name: "Refer back", exact: true }).check();
      await operator.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
      await operator.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Please add the dispensing date beside the initials");
    }
    await expect(operator.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    await operator.getByRole("button", { name: "Refer back", exact: true }).click();
    await recorded.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
    if (enabled) {
      await expect(page.getByRole("region", { name: "Operator-approved pharmacy note" })).toBeVisible();
      await page.locator('[data-pharmacy-action="apply-correction"]').click();
      await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
    } else await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
    await openHistory(page);
    const priorHistory = await historyIdentity(page);
    const events = recorded.getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li");
    const recordFields = events.locator("dl > div")
      .filter({ has: page.getByText("Attempt / record", { exact: true }) }).locator("dd");
    const records = async () => (await recordFields.allTextContents()).filter((text) => /DR-\d+/.test(text));
    const priorRecords = await records();
    expect(priorRecords.length).toBeGreaterThan(0);
    const priorAttempts = await recorded.getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li").allTextContents();
    await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    expect(await records()).toEqual(priorRecords);
    expect((await recorded.getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li").allTextContents()).slice(0, priorAttempts.length)).toEqual(priorAttempts);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await operator.getByRole("button", { name: "Start review", exact: true }).click();
    const reason = "Human recheck confirms the corrected dispensing date";
    await operator.getByRole("textbox", { name: "Reason (required)", exact: true }).fill(reason);
    await expect(operator.getByRole("button", { name: "Release to pricing", exact: true })).toBeEnabled();
    await operator.getByRole("button", { name: "Release to pricing", exact: true }).click();
    const release = page.getByRole("region", { name: "Release record", exact: true });
    await expect(release).toContainText("after operator review");
    await expect(release).not.toContainText("no operator action");
    await expect(release.locator("dl > div").filter({ has: page.getByText("Released by", { exact: true }) })).toContainText("operator");
    await expect(release).toContainText(reason);
    await recorded.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    const status = enabled ? "Verified and released to pricing after operator review (synthetic)" : "Released to pricing after operator review (synthetic)";
    await expect(recorded.getByRole("status")).toHaveText(status);
    await openHistory(page);
    expect((await historyIdentity(page)).slice(0, priorHistory.length)).toEqual(priorHistory);
    const acceptedRecords = await records();
    expect(acceptedRecords.slice(0, priorRecords.length)).toEqual(priorRecords);
    expect(acceptedRecords).toHaveLength(priorRecords.length + 1);
    const releasedHistory = await historyIdentity(page);
    for (const mode of [!enabled, enabled]) {
      await page.getByRole("banner").getByRole("switch").setChecked(mode);
      await expect(recorded.getByRole("status")).toHaveText(status);
      expect(await historyIdentity(page)).toEqual(releasedHistory);
      expect(await records()).toEqual(acceptedRecords);
    }
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page.getByRole("button", { name: /^(Start review|Release to pricing|Apply suggestion|Refer back)$/ })).toHaveCount(0);
    await recorded.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await openHistory(page);
    expect(await historyIdentity(page)).toEqual(releasedHistory);
    await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText(status);
  });

  test(`submission receipts distinguish complete B from wrong-pack review: agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    if (enabled) {
      await page.locator('[data-pharmacy-action="apply-correction"]').click();
      await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
    } else await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO RK 21/08/26");
    await expect(page.locator("[data-pharmacy-released-count]")).toHaveText("0");
    await page.locator('[data-pharmacy-action="submit"]').click();
    const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
    await expect(receipt).toContainText("EX-24112:2");
    await expect(receipt).toContainText(enabled ? "released to existing pricing, no operator action" : "no person involved");
    for (const gate of ["Gate 1", "Gate 2"]) {
      await expect(receipt.locator("dl > div").filter({ has: page.getByText(gate, { exact: true }) }).locator("dd")).toHaveText(enabled ? "pass" : "none");
    }
    await expect(page.locator("[data-pharmacy-released-count]")).toHaveText(enabled ? "1" : "0");
    await receipt.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const recorded = page.getByRole("region", { name: "Shared case history", exact: true });
    const releasedState = enabled ? LIFECYCLE_LABELS.released_to_pricing.pharmacy : LIFECYCLE_LABELS.paid.pharmacy;
    await expect(recorded.getByRole("status")).toHaveText(releasedState);
    await openHistory(page);
    const releasedHistory = await historyIdentity(page);
    expect(releasedHistory.at(-1)!.fields[0]).toContain("code");
    expect(releasedHistory.at(-1)!.fields[1]).toContain("No decision record");
    for (const mode of [!enabled, enabled]) {
      await page.getByRole("banner").getByRole("switch").setChecked(mode);
      await expect(recorded.getByRole("status")).toHaveText(releasedState);
      expect(await historyIdentity(page)).toEqual(releasedHistory);
    }
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page.getByRole("button", { name: /^(Start review|Release to pricing|Apply suggestion)$/ })).toHaveCount(0);
    await navigatePrimary(page, "Pharmacy check");
    const mismatch = page.getByRole("radio", { name: "Wrong pack size", exact: true });
    await mismatch.click();
    await expect(mismatch).toBeChecked();
    await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "SYN-FQ123-MISMATCH");
    await expect(page).toHaveURL((url) => url.pathname === "/pharmacy"
      && url.searchParams.get("case") === "SYN-FQ123-MISMATCH" && url.searchParams.get("channel") === "eps");
    await expect(page.getByRole("spinbutton", { name: "Pack size dispensed", exact: true })).toHaveValue("28");
    await page.locator('[data-pharmacy-action="submit"]').click();
    await expect(receipt).toContainText("SYN-FQ123-MISMATCH:2");
    await expect(receipt).not.toContainText("released to existing pricing");
    if (enabled) {
      await expect(receipt.locator("dl > div").filter({ has: page.getByText("Gate 1", { exact: true }) }).locator("dd")).toHaveText("pass");
      await expect(receipt.locator("dl > div").filter({ has: page.getByText("Gate 2", { exact: true }) }).locator("dd")).toHaveText("fail");
    }
    await receipt.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await recorded.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    await expect(page).toHaveURL(/\/case\/SYN-FQ123-MISMATCH$/);
    await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Release to pricing", exact: true })).toHaveCount(0);
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
