import { expect, navigatePrimary, test } from "./fixtures";
import { expectHumanRelease, readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";
import { DECLARATION_RECONCILIATION, PAPER_D_CAPTURE_FIELDS, openQueueCapture } from "./paper-declaration-helpers";
import { choosePharmacyRadio } from "./pharmacy-scenario-helpers";
import { operatorRadio, performDecision } from "./operator-action-helpers";
import { assertInlineDecisionRecorded } from "./perspective-helpers";

const D = "EX-24123";

for (const enabled of [false, true]) {
  test(`one state: completed D capture retains human provenance through required Type 2 review, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Select the only playable paper item", "Pharmacy", async () => {
        await choosePharmacyRadio(page, "Paper");
        await expect(page.getByRole("radio", { name: "Complete paper", exact: true })).toHaveCount(0);
      });
      if (enabled) await action("Load the explicit synthetic pharmacy declaration", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
        await expect(page.getByRole("textbox", { name: "Declared endorsement", exact: true })).toHaveValue(PAPER_D_CAPTURE_FIELDS.Endorsement);
      });
      const submitted = await action("Post D without inventing readable paper or a release", "Pharmacy", async () => {
        await page.getByRole("button", { name: enabled ? "Post paper with declaration" : "Post paper", exact: true }).click();
      });
      expect(submitted.itemProcesses[D]).toMatchObject({ capture: null, routing: { outcome: "type1_capture", requiresHuman: true } });
      expect(submitted.lifecycles[D].state).toBe("submitted");
      expect(submitted.records).toEqual(initial.records);
      expect(submitted.caseRevisions[D].slice(0, initial.caseRevisions[D].length)).toEqual(initial.caseRevisions[D]);
      await action("Open actual Type 1 capture", "NHSBSA", async () => {
        await navigatePrimary(page, "NHSBSA queue");
        await openQueueCapture(page, D);
      });
      const capture = page.getByRole("region", { name: `Type 1 capture for ${D}`, exact: true });
      for (const [name, value] of Object.entries(PAPER_D_CAPTURE_FIELDS)) {
        await action(`Supply or verify the actual captured ${name}`, "NHSBSA", async () => {
          const field = capture.getByRole("textbox", { name, exact: true });
          if (!enabled || name === "Prescriber") {
            await expect(field).toHaveValue("");
            await field.fill(value);
          } else await expect(field).toHaveValue(value);
        });
      }
      if (enabled) await action("Explicitly attest the declared evidence", "NHSBSA", async () => {
        await capture.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
      });
      const confirmed = await action("Confirm capture, not a Type 2 decision", "NHSBSA", async () => {
        await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
        await expect(page.locator(`[data-case-id="${D}"]`)).toBeVisible();
      });
      expect(confirmed.itemProcesses[D]).toMatchObject({
        routing: { outcome: "type2_endorsement", requiresHuman: true },
        capture: { operator: "Demo operator", declarationReconciled: enabled,
          fields: { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: PAPER_D_CAPTURE_FIELDS.Endorsement, prescriber: PAPER_D_CAPTURE_FIELDS.Prescriber } },
      });
      expect(confirmed.lifecycles[D].state).toBe("in_review");
      expect(confirmed.records).toEqual(initial.records);
      expect(confirmed.caseRevisions).toEqual(submitted.caseRevisions);
      expect(confirmed.lifecycles[D].history.slice(0, submitted.lifecycles[D].history.length)).toEqual(submitted.lifecycles[D].history);
      expect(confirmed.lifecycles[D].history.at(-1)).toMatchObject({
        actor: "operator", processStep: "type1_capture", capture: confirmed.itemProcesses[D].capture,
      });
      await action("Open the captured item for the required Type 2 judgement", "NHSBSA", async () => {
        await page.getByRole("link", { name: `Open ${D}`, exact: true }).click();
        await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
      });
      expect(await readDomainState(page)).toEqual(confirmed);
      await action("Choose sufficient after complete human-supplied evidence", "NHSBSA", async () => {
        await operatorRadio(page, "ACCEPT").check();
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human checked the captured product, quantity, endorsement and prescriber.");
      });
      const beforeRelease = await readDomainState(page);
      expect(beforeRelease.operatorDrafts[D]).toMatchObject({
        revision: submitted.caseRevisions[D].at(-1)!.number, outcome: "ACCEPT", appliedSuggestion: false,
        note: "Human checked the captured product, quantity, endorsement and prescriber.",
      });
      expect(beforeRelease).toEqual({
        ...confirmed, operatorDrafts: { ...confirmed.operatorDrafts, [D]: beforeRelease.operatorDrafts[D] },
      });
      const decided = await action("Record the actual human decision before existing pricing", "NHSBSA", async () => {
        await performDecision(page, "ACCEPT", { releaseVerified: enabled });
        await expect(page).toHaveURL(/\/case\/EX-24123\/record$/);
      });
      expectHumanRelease(beforeRelease, decided, D);
      expect(decided.lifecycles[D].state).toBe("released_to_pricing");
      expect(decided.records).toHaveLength(initial.records.length + 1);
      expect(decided.records.at(-1)).toMatchObject({ caseId: D, decision: "ACCEPT", revision: submitted.caseRevisions[D].at(-1)!.number });
      expect(decided.itemProcesses[D].capture).toEqual(confirmed.itemProcesses[D].capture);
      expect(decided.lifecycles[D].history.slice(0, confirmed.lifecycles[D].history.length)).toEqual(confirmed.lifecycles[D].history);
      expect(decided.lifecycles[D].history.slice(confirmed.lifecycles[D].history.length)).toEqual([
        expect.objectContaining({ actor: "operator", processStep: "release_to_pricing", releaseOrigin: "human_decision" }),
      ]);
      for (const key of ["caseRevisions", "lifecycles", "itemProcesses", "itemVerification", "operatorDrafts", "pharmacyDrafts", "caseStates"] as const) {
        for (const id of Object.keys(initial[key])) {
          if (id !== D) expect(decided[key][id], `${key}: unrelated ${id} stays exact`).toEqual(initial[key][id]);
        }
      }
      await action("Read the actual human decision and verify no stale notification", "NHSBSA", async () => {
        await assertInlineDecisionRecorded(page, "ACCEPT");
      });
      await action("Read the human-decided item without claiming automatic-only work", "NHSBSA", async () => {
        await navigatePrimary(page, "NHSBSA queue");
        await expect(page.locator(`[data-case-id="${D}"]`)).toBeVisible();
        await expect(page.locator(`[data-type1-case="${D}"]`)).toHaveCount(0);
      });
      expect(await readDomainState(page)).toEqual(decided);
    });
  });
}
