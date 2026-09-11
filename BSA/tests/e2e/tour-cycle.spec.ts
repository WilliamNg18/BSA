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
        await expect(page.getByRole("region", { name: "Six-stage exception pipeline" })).toBeVisible();
        await expect(page.getByRole("list", { name: "Four canonical synthetic cases" })).toHaveCount(0);
      }
      if (stop.chapter === 4) {
        await expect(page.getByRole("region", { name: "Six-stage exception pipeline" })).toHaveCount(0);
        const cards = page.getByRole("list", { name: "Four canonical synthetic cases" }).locator(":scope > li");
        await expect(cards).toHaveCount(4);
        for (const [caseIndex, scenario] of ["A", "B", "C", "D"].entries()) {
          await expect(cards.nth(caseIndex).getByRole("link", { name: `Open case ${scenario}`, exact: true })).toBeVisible();
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
    await rail.getByRole("button", { name: "Dismiss tour" }).press("Enter");
    await expect(rail).toHaveCount(0);
    await page.getByRole("button", { name: "Restore tour", exact: true }).press("Enter");
    await expect(rail).toContainText("7/8 · What the pharmacy sees");
    await expect(page).toHaveURL(/\/pharmacy\/claims$/);
  });

  test(`cycle guide follows real human referral, correction, re-check and synthetic pricing: agent ${enabled}`, async ({ page }) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const guide = page.getByRole("region", { name: "Referral cycle guide", exact: true });
    const recorded = guide.getByRole("region", { name: "Recorded claim state", exact: true });
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await guide.getByRole("link", { name: "Open this operator case", exact: true }).click();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    await page.getByRole("radio", { name: /^Refer back / }).check();
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
    await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    for (const mode of [!enabled, enabled]) {
      await page.getByRole("banner").getByRole("switch").setChecked(mode);
      await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
    }
    await guide.getByRole("link", { name: "Open this operator case", exact: true }).click();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    if (!enabled) await page.getByRole("radio", { name: /^Sufficient \(human choice\)/ }).check();
    else await expect(page.getByRole("radio", { name: /^Accept / })).toBeChecked();
    await page.getByRole("textbox", { name: /^Reason/ }).fill("Human reviewed the corrected date and complete evidence");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
    await expect(recorded.getByRole("status")).toHaveText(LIFECYCLE_LABELS.paid.pharmacy);
    await expect(recorded).toContainText("Recorded synthetic outcome attributed to existing pricing");
    await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText(LIFECYCLE_LABELS.paid.pharmacy);
  });
}

for (const width of [360, 1440]) {
  test(`cycle comparison preserves recorded state, reduced motion and accessible reflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("pharmacy/claims");
    const guide = page.getByRole("region", { name: "Referral cycle guide", exact: true });
    for (const enabled of [false, true]) {
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await expect(guide.getByRole("heading", { name: enabled ? "With agent · Assisted preparation" : "Today · Manual preparation" })).toBeVisible();
      await expect(guide.getByRole("list", { name: "Referral cycle stages" }).getByRole("heading")).toHaveText([
        "1. Referred back", "2. Corrected", "3. Resubmitted", "4. Re-checked", "5. Paid · Synthetic only",
      ]);
      await expect(guide.getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
      await expect(guide).toContainText("This guide is not claim history");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });
}
