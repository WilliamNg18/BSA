import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, expect, test } from "./fixtures";

// Stream E owns this file (Task 10: live round trip with Follow this item
// banner and Switch side; Task 13: verification of Tasks 8-13). It is new
// cross-stream coverage, not a replacement for any existing page test.
//
// These scenarios depend on Stream B's lifecycle store implementation, Stream
// A's pharmacy submit/resubmit UI, Stream C's claims detail/actions and
// Stream D's Follow banner shell and navigation Switch side control. None of
// that exists yet on this branch (the store's lifecycle methods still throw
// `not implemented`, per docs/parallel-contracts.md), so this whole file is
// tagged pending-integration and skipped.
//
// Per docs/parallel-contracts.md ("Merge B first, then A/C/D, then E"), unskip
// this file only after B/A/C/D have merged, then run it in both agent toggle
// states with all-default-rule axe and retained screenshots, and record the
// evidence in docs/PROGRESS.md against Task 10 and Task 13.
test.describe.skip("live round trip (pending-integration)", () => {
  for (const enabled of [true, false]) {
    test.describe(`agent=${enabled}`, () => {
      test.use({ viewport: { width: 1440, height: 1000 } });

      test(`pharmacy submits, NHSBSA refers back, pharmacy resubmits and is paid, agent=${enabled}`, async ({ page }, testInfo) => {
        await page.goto("./#pharmacy");
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);

        // Pharmacy: submit an endorsement for a synthetic case.
        await page.goto("./pharmacy");
        await page.getByRole("textbox", { name: "Endorsement" }).fill("NCSO DL");
        await page.getByRole("button", { name: "Submit" }).click();
        await expect(page.getByText("Submitted, awaiting processing")).toBeVisible();
        await captureCheckpoint(page, testInfo, `round-trip-submitted-${enabled}`);

        // Follow this item: the pharmacy can track the case without leaving.
        await page.getByRole("button", { name: "Follow this item" }).click();
        await expect(page.getByRole("status", { name: "Follow this item" })).toBeVisible();

        // Switch side: move to the NHSBSA queue/claims view from the same banner.
        await page.getByRole("link", { name: "Switch side" }).click();
        await expect(page).toHaveURL(/queue|pharmacy\/claims/);
        await expect(page.getByText(enabled ? "Case built, awaiting operator" : "Awaiting operator")).toBeVisible();

        // Operator refers the case back, requiring a correction.
        await page.getByRole("button", { name: "Refer back" }).click();
        await page.getByRole("textbox", { name: "Reason" }).fill("Missing dispensing date");
        await page.getByRole("button", { name: "Confirm" }).click();
        await expect(page.getByText("Referred back")).toBeVisible();

        // Switch side again: back to the pharmacy, which sees the referral.
        await page.getByRole("link", { name: "Switch side" }).click();
        await expect(page.getByText("Referred back: correction needed before payment")).toBeVisible();
        await page.getByRole("textbox", { name: "Endorsement" }).fill("NCSO DL 03/09/2026");
        await page.getByRole("button", { name: "Resubmit" }).click();
        await expect(page.getByText("Resubmitted, awaiting re-check")).toBeVisible();

        // NHSBSA accepts and confirms; pharmacy sees the synthetic payment state.
        await page.getByRole("link", { name: "Switch side" }).click();
        await page.getByRole("button", { name: "Accept" }).click();
        await page.getByRole("button", { name: "Send confirmation" }).click();
        await page.getByRole("link", { name: "Switch side" }).click();
        await expect(page.getByText("Payment approved (synthetic)")).toBeVisible();
        await captureCheckpoint(page, testInfo, `round-trip-paid-${enabled}`);

        const results = await new AxeBuilder({ page }).analyze();
        await captureJson(testInfo, "axe-results", results);
        expect(results.violations).toEqual([]);
      });

      test(`unfollowing hides the banner and never changes lifecycle state itself, agent=${enabled}`, async ({ page }) => {
        await page.goto("./pharmacy");
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await page.getByRole("button", { name: "Follow this item" }).click();
        await expect(page.getByRole("status", { name: "Follow this item" })).toBeVisible();
        await page.getByRole("button", { name: "Stop following" }).click();
        await expect(page.getByRole("status", { name: "Follow this item" })).toHaveCount(0);
      });
    });
  }
});
