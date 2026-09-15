import type { Page } from "@playwright/test";
import { expect, navigatePrimary, test } from "./fixtures";
import { expectHumanRelease, readDomainState, verifyPerspectiveEquivalence, type DomainAction } from "./one-state-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { openQueueCapture } from "./paper-declaration-helpers";
import { operatorRadio, performDecision } from "./operator-action-helpers";
import { assertInlineDecisionRecorded } from "./perspective-helpers";

const D = "EX-24123";
const claim = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });

async function capturePaper(page: Page, action: DomainAction, enabled: boolean, label: string) {
  await action(`${label}: read the shared capture lane`, "NHSBSA", async () => {
    await navigatePrimary(page, "NHSBSA queue");
    await openQueueCapture(page, D);
  });
  const capture = page.getByRole("region", { name: `Type 1 capture for ${D}`, exact: true });
  await expect(capture).toBeVisible();
  await action(`${label}: explicitly capture synthetic source fields`, "NHSBSA", async () => {
    await capture.getByRole("textbox", { name: "Product code", exact: true }).fill("SYN-COCOD-100");
    await capture.getByRole("textbox", { name: "Quantity", exact: true }).fill("100");
    await capture.getByRole("textbox", { name: "Endorsement", exact: true }).fill("NCSO JB 27/08/26");
    await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  });
  if (enabled) await action(`${label}: human reconciles paper evidence`, "NHSBSA", async () => {
    await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true }).check();
  });
  return action(`${label}: confirm capture without deciding Type 2`, "NHSBSA", async () => {
    await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    await expect(page.locator(`[data-case-id="${D}"]`)).toBeVisible();
  });
}

for (const enabled of [false, true]) {
  test(`one state: same paper item through the whole Hillcrest cycle and Reset, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const seed = await readDomainState(page);
      expect(Object.keys(seed.lifecycles).sort()).toEqual([
        "EX-24107", "EX-24112", "EX-24123", "SYN-FQ123-MISMATCH",
      ]);
      expect(Object.entries(seed.itemProcesses).filter(([, process]) => process.routing.outcome === "auto_priced").map(([id]) => id).sort())
        .toEqual(["EX-24107"]);
      await action("Read Hillcrest pharmacy claims", "Pharmacy", async () => { await navigatePrimary(page, "Pharmacy claims"); });
      await action("Show the waiting paper item", "Pharmacy", async () => {
        await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^Waiting on NHSBSA/ }).click();
      });
      await action("Open D without changing its evidence", "Pharmacy", async () => {
        await page.getByRole("button", { name: `View ${D}`, exact: true }).click();
        await claim(page).getByText("Demonstration replay", { exact: true }).click();
      });
      const submitted = await action("Explicitly submit D as a new paper demonstration attempt", "Pharmacy", async () => {
        await claim(page).getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
        await expect(claim(page).getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
      });
      expect(submitted.caseRevisions[D].at(-1)).toMatchObject({ kind: "submission", channel: "paper", number: 2 });
      expect(submitted.itemProcesses[D].routing.outcome).toBe("type1_capture");
      const captured = await capturePaper(page, action, enabled, "First paper attempt");
      expect(captured.records).toEqual(seed.records);
      expect(captured.caseRevisions).toEqual(submitted.caseRevisions);
      expect(captured.itemProcesses[D].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
      await action("Open the same captured D in Type 2", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${D}`, exact: true }).click();
      });
      await action("Choose a human referral rather than inferred acceptance", "NHSBSA", async () => {
        await operatorRadio(page, "REFER_BACK").check();
      });
      await action("Write the human presentation concern and RB2B", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human requests explicit pharmacy presentation and prescriber evidence before release.");
        await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
      });
      const referred = await action("Commit D's human referral once", "NHSBSA", async () => {
        await performDecision(page, "REFER_BACK");
        await expect(page).toHaveURL(/\/EX-24123\/record$/);
      });
      expect(referred.records).toHaveLength(seed.records.length + 1);
      expect(referred.itemProcesses[D].rbCode).toBe("RB2B");
      await action("Read the recorded referral without changing D", "NHSBSA", async () => {
        await assertInlineDecisionRecorded(page, "REFER_BACK");
      });
      expect(await readDomainState(page)).toEqual(referred);
      await action("Return to the pharmacy's same D record", "Pharmacy", async () => { await navigatePrimary(page, "Pharmacy claims"); });
      await action("Show Action needed items", "Pharmacy", async () => {
        await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^Action needed/ }).click();
      });
      await action("Open D with its recorded RB2B", "Pharmacy", async () => {
        await page.getByRole("button", { name: `Correct and resubmit ${D}`, exact: true }).click();
        await expect(claim(page)).toContainText("RB2B");
      });
      await action("Pharmacy explicitly corrects and confirms the declared fields", "Pharmacy", async () => {
        await page.getByRole("textbox", { name: "Declared product", exact: true }).fill("Co-codamol 30/500 tablets");
        await page.getByRole("spinbutton", { name: "Declared quantity", exact: true }).fill("100");
        await page.getByRole("textbox", { name: "Declared prescriber (synthetic)", exact: true }).fill("Dr Demo (synthetic)");
        await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO JB 27/08/26");
      });
      const edited = await readDomainState(page);
      expect(edited.pharmacyDrafts[D]).toMatchObject({
        revision: referred.caseRevisions[D].at(-1)!.number, channel: "paper", purpose: "correction", appliedSuggestion: false,
        endorsementText: "NCSO JB 27/08/26",
        declaration: { fields: { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26", prescriber: "Dr Demo (synthetic)" } },
      });
      expect(edited, "Only the shared pharmacy draft changes before resubmission").toEqual({
        ...referred, pharmacyDrafts: { ...referred.pharmacyDrafts, [D]: edited.pharmacyDrafts[D] },
      });
      const resubmitted = await action("Explicitly resubmit the corrected D paper", "Pharmacy", async () => {
        await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
        await expect(claim(page).getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
      });
      expect(resubmitted.records).toEqual(referred.records);
      expect(resubmitted.itemProcesses[D].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: true });
      const rechecked = await capturePaper(page, action, enabled, "Resubmitted paper recheck");
      expect(rechecked.records).toEqual(referred.records);
      expect(rechecked.caseRevisions[D]).toEqual(resubmitted.caseRevisions[D]);
      await action("Open D after the new revision's human recheck", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${D}`, exact: true }).click();
      });
      await action("Choose human Sufficient after correction", "NHSBSA", async () => {
        await operatorRadio(page, "ACCEPT").check();
      });
      await action("Write the recheck reason", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human rechecked the corrected presentation, prescriber and endorsement evidence.");
      });
      const beforeRelease = await readDomainState(page);
      const paid = await action("Human accepts D and existing pricing follows", "NHSBSA", async () => {
        await performDecision(page, "ACCEPT", { releaseVerified: enabled });
        await expect(page).toHaveURL(/\/EX-24123\/record$/);
      });
      expectHumanRelease(beforeRelease, paid, D);
      expect(paid.lifecycles[D].state).toBe("released_to_pricing");
      expect(paid.itemProcesses[D].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: false, pricingAuthority: "existing_rules_engine" });
      expect(paid.records).toHaveLength(seed.records.length + 2);
      expect(paid.lifecycles[D].history.at(-1)).toMatchObject({ actor: "operator", processStep: "release_to_pricing", releaseOrigin: "human_decision" });
      expect(paid.lifecycles[D].history.slice(0, referred.lifecycles[D].history.length)).toEqual(referred.lifecycles[D].history);
      expect(paid.records.slice(0, seed.records.length)).toEqual(seed.records);
      await action("Read the actual acceptance without changing D", "NHSBSA", async () => {
        await assertInlineDecisionRecorded(page, "ACCEPT");
      });
      expect(await readDomainState(page)).toEqual(paid);
      for (const id of Object.keys(seed.lifecycles).filter((id) => id !== D)) {
        expect(paid.lifecycles[id]).toEqual(seed.lifecycles[id]);
        expect(paid.caseRevisions[id]).toEqual(seed.caseRevisions[id]);
        expect(paid.itemProcesses[id]).toEqual(seed.itemProcesses[id]);
        expect(paid.itemVerification[id]).toEqual(seed.itemVerification[id]);
        expect(paid.operatorDrafts[id]).toEqual(seed.operatorDrafts[id]);
        expect(paid.pharmacyDrafts[id]).toEqual(seed.pharmacyDrafts[id]);
      }
      await action("Reset the demonstration through its confirmation", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Reset demo", exact: true }).click();
        await page.getByRole("alertdialog").getByRole("button", { name: "Reset demonstration", exact: true }).click();
      });
      expect(await readDomainState(page)).toEqual(seed);
      await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
    });
  });
}
