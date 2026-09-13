import { expect, navigatePrimary, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";

const C = "EX-24119";
const D = "EX-24123";

for (const enabled of [false, true]) {
  test(`one state: C confirmation retains both conflicting quantities, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Navigate to the pharmacy C seed", "Pharmacy", async () => { await navigatePrimary(page, "Pharmacy claims"); });
      await action("Verify Hillcrest owns C without a selector", "Pharmacy", async () => {
        await expect(page.locator("[data-pharmacy-identity]")).toContainText(`Hillcrest Pharmacy (${initial.lifecycles[C].pharmacyCode})`);
      });
      await action("Open the historically requested C item", "Pharmacy", async () => {
        await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
          .filter({ hasText: C }).getByRole("button").click();
      });
      await action("Open the explicit C demonstration replay", "Pharmacy", async () => {
        await page.getByRole("region", { name: "Claim detail", exact: true }).getByText("Demonstration replay", { exact: true }).click();
      });
      await action("Submit a new C attempt without rewriting its historical request", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Submit another demonstration attempt", exact: true }).click();
      });
      await action("Navigate to actual C work", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      await action("Open the unresolved C case", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${C}`, exact: true }).click();
      });
      await action("Explicitly start the C review", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Start review", exact: true }).click();
      });
      await action("Request information without resolving either quantity", "NHSBSA", async () => {
        await page.getByRole("radio", { name: /^Request information / }).check();
      });
      await action("Write the human confirmation request", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Please confirm both conflicting quantities against the synthetic form");
      });
      if (enabled) await action("Explicitly approve the C request draft", "NHSBSA", async () => {
        await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
      });
      const requested = await action("Record one human request for information", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Record decision", exact: true }).click();
        await expect(page).toHaveURL(/\/case\/EX-24119\/record$/);
      });
      expect(requested.lifecycles[C].state).toBe("information_requested");
      expect(requested.records).toHaveLength(initial.records.length + 1);
      expect(requested.records.at(-1)).toMatchObject({ caseId: C, decision: "REQUEST_INFORMATION" });
      if (enabled) expect(requested.records.at(-1)?.approvedDraft).toMatchObject({ decision: "REQUEST_INFORMATION", approvedBy: "Demo operator" });
      else expect(requested.records.at(-1)?.approvedDraft).toBeUndefined();
      await action("Dismiss the human information-request notification", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
      });
      expect(await readDomainState(page), "Dismissing a notification cannot change the recorded request").toEqual(requested);
      await action("Navigate to pharmacy claims", "Pharmacy", async () => { await navigatePrimary(page, "Pharmacy claims"); });
      await action("Verify C's pharmacy for the new request", "Pharmacy", async () => {
        await expect(page.locator("[data-pharmacy-identity]")).toContainText(`Hillcrest Pharmacy (${initial.lifecycles[C].pharmacyCode})`);
      });
      await action("Open the pharmacy C confirmation", "Pharmacy", async () => {
        await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
          .filter({ hasText: C }).getByRole("button").click();
      });
      const confirmation = page.getByRole("region", { name: "Requested confirmation", exact: true });
      for (const [label, value] of [["Captured form quantity", "56"], ["Claim ledger quantity", "84"]]) {
        await expect(confirmation.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd")).toHaveText(value);
      }
      await action("Reject an empty pharmacy confirmation", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
        await expect(page.getByRole("alert").filter({ hasText: "Pharmacy text is required" })).toBeVisible();
      });
      expect(await readDomainState(page)).toEqual(requested);
      const text = "The synthetic form says 56 while the claim ledger says 84; please review both values";
      await action("Type confirmation without sending or resolving evidence", "Pharmacy", async () => {
        await page.getByRole("textbox", { name: "Pharmacy confirmation", exact: true }).fill(text);
      });
      expect(await readDomainState(page)).toEqual(requested);
      const sent = await action("Send the pharmacy confirmation for human re-check", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send confirmation", exact: true }).click();
      });
      expect(sent.records).toEqual(requested.records);
      expect(sent.caseRevisions[C].slice(0, requested.caseRevisions[C].length)).toEqual(requested.caseRevisions[C]);
      expect(sent.caseRevisions[C].at(-1)).toMatchObject({ kind: "confirmation", confirmation: text, channel: "eps" });
      expect(sent.lifecycles[C].history.slice(0, requested.lifecycles[C].history.length)).toEqual(requested.lifecycles[C].history);
      expect(sent.itemProcesses[C].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
      expect(sent.lifecycles[C].state).toBe("resubmitted");
      await action("Return to actual C work after confirmation", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      await action("Open C without beginning the next human review", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${C}`, exact: true }).click();
      });
      await expect(page.getByRole("button", { name: "Start review", exact: true })).toBeVisible();
      if (enabled) {
        await expect(page.getByRole("heading", { name: "Conflicts and missing evidence", exact: true })).toBeVisible();
        await expect(page.getByRole("main")).toContainText("56");
        await expect(page.getByRole("main")).toContainText("84");
      }
      expect(await readDomainState(page), "Reading confirmation cannot resolve evidence or record a decision").toEqual(sent);
    });
  });

  test(`one state: D capture history survives referral and a new paper revision, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Navigate to D Type 1 capture", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      const capture = page.getByRole("region", { name: `Type 1 capture for ${D}`, exact: true });
      if (enabled) await action("Explicitly reconcile the prior D declaration", "NHSBSA", async () => {
        await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the paper", exact: true }).check();
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
        ["Declared product code", "SYN-COCOD-100"], ["Declared quantity", "100"],
        ["Declared prescriber (synthetic)", "Dr Demo (synthetic)"], ["Corrected endorsement", "NCSO AB 27/08/26"],
      ]) {
        await action(`Correct D ${name}`, "Pharmacy", async () => {
          await page.getByRole(name === "Declared quantity" ? "spinbutton" : "textbox", { name, exact: true }).fill(value);
        });
      }
      expect(await readDomainState(page)).toEqual(referred);
      const resubmitted = await action("Explicitly resubmit the declared paper item", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
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
      if (enabled) await expect(capture.getByRole("checkbox", { name: "I have reconciled the declaration with the paper", exact: true })).not.toBeChecked();
      expect(await readDomainState(page)).toEqual(resubmitted);
    });
  });
}
