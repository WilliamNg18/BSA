import { expect, navigatePrimary, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";
import { caseById } from "../../src/lib/domain/cases";
import { choosePharmacyRadio } from "./pharmacy-scenario-helpers";

const B = "EX-24112";
const D = "EX-24123";

for (const enabled of [false, true]) {
  test(`one state: B confirmation preserves received evidence and still requires human recheck, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Select the playable missing-date EPS item", "Pharmacy", async () => {
        await choosePharmacyRadio(page, "EPS");
        await choosePharmacyRadio(page, "NCSO missing date");
        await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO RK");
      });
      const submitted = await action("Send an actual B revision with unresolved evidence", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send claim", exact: true }).click();
      });
      expect(submitted.itemProcesses[B].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
      await action("Navigate to actual B work", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      await action("Open the unresolved B case", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${B}`, exact: true }).click();
      });
      await action("Explicitly start the B review", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Start review", exact: true }).click();
      });
      await action("Request information without silently correcting the source", "NHSBSA", async () => {
        await page.getByRole("radio", { name: /^Request information / }).check();
      });
      await action("Write the human confirmation request", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Please confirm the dispensing date against the original EPS endorsement");
      });
      const requested = await action("Record one human request for information", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Record decision", exact: true }).click();
        await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
      });
      expect(requested.lifecycles[B].state).toBe("information_requested");
      expect(requested.records).toHaveLength(initial.records.length + 1);
      expect(requested.records.at(-1)).toMatchObject({ caseId: B, decision: "REQUEST_INFORMATION" });
      expect(requested.records.at(-1)?.approvedDraft).toBeUndefined();
      expect(requested.caseRevisions).toEqual(submitted.caseRevisions);
      await action("Dismiss the human information-request notification", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
      });
      expect(await readDomainState(page), "Dismissing a notification cannot change the recorded request").toEqual(requested);
      await action("Navigate to pharmacy claims", "Pharmacy", async () => { await navigatePrimary(page, "Pharmacy claims"); });
      await action("Verify B's pharmacy for the new request", "Pharmacy", async () => {
        await expect(page.locator("[data-pharmacy-identity]")).toContainText(`Hillcrest Pharmacy (${initial.lifecycles[B].pharmacyCode})`);
      });
      await action("Open the pharmacy B confirmation", "Pharmacy", async () => {
        await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
          .filter({ hasText: B }).getByRole("button").click();
      });
      const confirmation = page.getByRole("region", { name: "Requested confirmation", exact: true });
      const source = caseById(B)!;
      for (const [label, value] of [["Captured form quantity", String(source.extracted.quantity)], ["Claim ledger quantity", String(source.claim.quantity)]]) {
        await expect(confirmation.getByRole("term").filter({ hasText: new RegExp(`^${label}$`) }).locator("+ dd")).toHaveText(value);
      }
      await action("Reject an empty pharmacy confirmation", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
        await expect(page.getByRole("alert").filter({ hasText: "Pharmacy text is required" })).toBeVisible();
      });
      expect(await readDomainState(page)).toEqual(requested);
      const text = "Please review the dispensing date; this response does not amend the original NCSO endorsement";
      await action("Type confirmation without sending or resolving evidence", "Pharmacy", async () => {
        await page.getByRole("textbox", { name: "Confirm", exact: true }).fill(text);
      });
      const confirmationDraft = await readDomainState(page);
      expect(confirmationDraft.pharmacyDrafts[B]).toMatchObject({
        revision: requested.caseRevisions[B].at(-1)!.number,
        confirmation: text, endorsementText: requested.caseRevisions[B].at(-1)!.endorsementText, appliedSuggestion: false,
      });
      expect(confirmationDraft, "Typing confirmation changes only the shared pharmacy draft").toEqual({
        ...requested, pharmacyDrafts: { ...requested.pharmacyDrafts, [B]: confirmationDraft.pharmacyDrafts[B] },
      });
      const sent = await action("Send the pharmacy confirmation for human re-check", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
      });
      expect(sent.records).toEqual(requested.records);
      expect(sent.caseRevisions[B].slice(0, requested.caseRevisions[B].length)).toEqual(requested.caseRevisions[B]);
      expect(sent.caseRevisions[B].at(-1)).toMatchObject({
        kind: "confirmation", confirmation: text, channel: "eps",
        endorsementText: requested.caseRevisions[B].at(-1)!.endorsementText,
        epsPrescription: requested.caseRevisions[B].at(-1)!.epsPrescription,
      });
      expect(sent.lifecycles[B].history.slice(0, requested.lifecycles[B].history.length)).toEqual(requested.lifecycles[B].history);
      expect(sent.itemProcesses[B].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
      expect(sent.lifecycles[B].state).toBe("resubmitted");
      expect(sent.itemVerification[B].released).toBe(false);
      await action("Return to actual B work after confirmation", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      await action("Open B without beginning the next human review", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${B}`, exact: true }).click();
      });
      await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
      expect(await readDomainState(page), "Reading confirmation cannot resolve evidence or record a decision").toEqual(sent);
    });
  });

  test(`one state: D capture history survives referral and a new paper revision, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Navigate to D Type 1 capture", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      const capture = page.getByRole("region", { name: `Type 1 capture for ${D}`, exact: true });
      if (enabled) await action("Explicitly reconcile the prior D declaration", "NHSBSA", async () => {
        await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true }).check();
      });
      const captured = await action("Confirm D capture without a Type 2 decision", "NHSBSA", async () => {
        await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
        await expect(page.locator(`[data-case-id="${D}"]`)).toBeVisible();
      });
      expect(captured.caseRevisions).toEqual(initial.caseRevisions);
      expect(captured.records).toEqual(initial.records);
      expect(captured.itemProcesses[D].capture).toMatchObject({
        revision: initial.itemProcesses[D].revision,
        provenance: enabled ? "pharmacy_declaration" : "human_capture",
        declarationReconciled: enabled,
      });
      await action("Open captured D for human judgement", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${D}`, exact: true }).click();
      });
      await action("Choose a human referral after capture", "NHSBSA", async () => {
        await page.getByRole("radio", { name: /^Refer back / }).check();
      });
      await action("Select the actual missing-presentation code", "NHSBSA", async () => {
        await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
      });
      await action("Write the human presentation-referral reason", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human requests pharmacy confirmation of the product presentation");
      });
      const referred = await action("Record the D referral without draft approval", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Record decision", exact: true }).click();
        await expect(page).toHaveURL(/\/case\/EX-24123\/record$/);
      });
      expect(referred.records).toHaveLength(initial.records.length + 1);
      expect(referred.records.at(-1)).toMatchObject({ caseId: D, decision: "REFER_BACK", rbCode: "RB2B" });
      expect(referred.records.at(-1)?.approvedDraft).toBeUndefined();
      expect(referred.itemProcesses[D].capture).toEqual(captured.itemProcesses[D].capture);
      await action("Dismiss the human referral notification", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
      });
      expect(await readDomainState(page), "Dismissing a notification cannot change the referral or capture").toEqual(referred);
      await action("Navigate to the pharmacy D referral", "Pharmacy", async () => { await navigatePrimary(page, "Pharmacy claims"); });
      await action("Verify Hillcrest owns D without a selector", "Pharmacy", async () => {
        await expect(page.locator("[data-pharmacy-identity]")).toContainText(`Hillcrest Pharmacy (${initial.lifecycles[D].pharmacyCode})`);
      });
      await action("Open D correction and resubmission", "Pharmacy", async () => {
        await page.getByRole("button", { name: `Correct and resubmit ${D}`, exact: true }).click();
      });
      await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText("RB2B");
      for (const [name, value] of [
        ["Declared product", "Co-codamol 30/500 tablets"], ["Declared quantity", "100"],
        ["Declared prescriber (synthetic)", "Dr Demo (synthetic)"], ["Corrected endorsement", "NCSO AB 27/08/26"],
      ]) {
        await action(`Correct D ${name}`, "Pharmacy", async () => {
          await page.getByRole(name === "Declared quantity" ? "spinbutton" : "textbox", { name, exact: true }).fill(value);
        });
      }
      const edited = await readDomainState(page);
      expect(edited.pharmacyDrafts[D]).toMatchObject({
        revision: referred.caseRevisions[D].at(-1)!.number, channel: "paper", purpose: "correction", appliedSuggestion: false,
        endorsementText: "NCSO AB 27/08/26",
        declaration: { fields: { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)" } },
      });
      expect(edited, "Manual paper edits remain one shared draft, never a new attempt").toEqual({
        ...referred, pharmacyDrafts: { ...referred.pharmacyDrafts, [D]: edited.pharmacyDrafts[D] },
      });
      const resubmitted = await action("Explicitly resubmit the declared paper item", "Pharmacy", async () => {
        await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
      });
      expect(resubmitted.records).toEqual(referred.records);
      expect(resubmitted.caseRevisions[D].slice(0, initial.caseRevisions[D].length)).toEqual(initial.caseRevisions[D]);
      expect(resubmitted.caseRevisions[D].at(-1)).toMatchObject({
        kind: "resubmission", channel: "paper", endorsementText: "NCSO AB 27/08/26",
        declaration: { provenance: "pharmacy_declaration", fields: { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)" } },
      });
      expect(resubmitted.itemProcesses[D]).toMatchObject({ capture: null, routing: { outcome: "type1_capture", requiresHuman: true } });
      expect(resubmitted.lifecycles[D].history.slice(0, referred.lifecycles[D].history.length)).toEqual(referred.lifecycles[D].history);
      expect(resubmitted.lifecycles[D].history.filter((event) => event.capture).map((event) => event.capture)).toEqual([captured.itemProcesses[D].capture]);
      await action("Read the new D capture lane without confirming it", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      await expect(capture).toBeVisible();
      await expect(page.locator(`[data-case-id="${D}"]`)).toHaveCount(0);
      await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toHaveCount(0);
      if (enabled) await expect(capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true })).not.toBeChecked();
      expect(await readDomainState(page)).toEqual(resubmitted);
    });
  });
}
