import type { Page } from "@playwright/test";
import { expect, navigatePrimary, test } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { expectHumanRelease, readDomainState, verifyPerspectiveEquivalence, type DomainAction, type DomainSnapshot } from "./one-state-helpers";
import { choosePharmacyRadio } from "./pharmacy-scenario-helpers";
import { decisionNote, operatorAction, operatorDecision, operatorRadio, performDecision } from "./operator-action-helpers";
import { assertInlineDecisionRecorded } from "./perspective-helpers";

const B = "EX-24112";
const detail = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });

function expectUnrelatedCases(before: DomainSnapshot, after: DomainSnapshot, changed: string) {
  for (const key of ["lifecycles", "caseRevisions", "itemProcesses", "itemVerification", "operatorDrafts", "pharmacyDrafts", "caseStates"] as const) {
    for (const id of new Set([...Object.keys(before[key]), ...Object.keys(after[key])])) {
      if (id !== changed) expect(after[key][id], `${key}: ${id} is not part of this action`).toEqual(before[key][id]);
    }
  }
  expect(after.records.slice(0, before.records.length)).toEqual(before.records);
  expect(after.caseRevisions[changed].slice(0, before.caseRevisions[changed].length)).toEqual(before.caseRevisions[changed]);
  expect(after.lifecycles[changed].history.slice(0, before.lifecycles[changed].history.length)).toEqual(before.lifecycles[changed].history);
}

async function openWork(page: Page, action: DomainAction, id: string) {
  await action(`Navigate to the actual worklist for ${id}`, "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
  await action(`Open ${id} without starting review`, "NHSBSA", async () => {
    await page.getByRole("link", { name: `Open ${id}`, exact: true }).click();
  });
}

for (const approval of ["manual", "unchecked", "approved"] as const) {
  const enabled = approval !== "manual";
  test(`one state: B referral, correction and explicit human recheck with ${approval} draft`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      if (enabled) await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
      else await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
      const submitted = await action("Submit B with the missing dispensing date", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send claim", exact: true }).click();
      });
      expect(submitted.itemProcesses[B]).toMatchObject({ channel: "eps", routing: { outcome: "type2_endorsement", requiresHuman: true } });
      await openWork(page, action, B);
      expect(await readDomainState(page), "Reading new work is not a human review").toEqual(submitted);
      await action("Explicitly start B review", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Start review", exact: true }).click();
      });
      await action("Choose a human referral", "NHSBSA", async () => {
        await operatorRadio(page, "REFER_BACK").check();
      });
      const reviewing = await readDomainState(page);
      await action("Reject a missing human reason", "NHSBSA", async () => {
        await operatorAction(page, "REFER_BACK").click();
        await expect(page.getByRole("alert").filter({ hasText: "Enter a reason of at least eight characters." })).toBeVisible();
      });
      expect(await readDomainState(page)).toEqual(reviewing);
      let reason = `Human ${approval} referral: add the missing dispensing date`;
      const reasoned = await action("Write the human referral reason", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill(reason);
      });
      expect(reasoned).toEqual({
        ...reviewing, operatorDrafts: { ...reviewing.operatorDrafts, [B]: { ...reviewing.operatorDrafts[B], note: reason } },
      });
      await action("Reject a referral without an explicit RB code", "NHSBSA", async () => {
        await operatorAction(page, "REFER_BACK").click();
        await expect(page).toHaveURL(/\/case\/EX-24112$/);
        await expect(page.getByRole("alert").filter({ hasText: "Choose an RB code." })).toBeVisible();
      });
      expect(await readDomainState(page), "Rejected referral leaves the entire shared reason draft unchanged").toEqual(reasoned);
      const selected = await action("Choose the synthetic missing-endorsement RB code", "NHSBSA", async () => {
        await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
      });
      expect(selected).toEqual({
        ...reasoned, operatorDrafts: { ...reasoned.operatorDrafts, [B]: { ...reasoned.operatorDrafts[B], rbCode: "SYN-NCSO" } },
      });
      const apply = operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true });
      await expect(operatorDecision(page).locator("[data-suggestion-applied]")).toHaveCount(0);
      await expect(apply).toHaveCount(enabled ? 1 : 0);
      if (approval === "approved") {
        const generated = await operatorDecision(page).getByRole("region", { name: "Recommendation", exact: true })
          .getByRole("term").filter({ hasText: /^Note$/ }).locator("+ dd").innerText();
        const applied = await action("Apply only this generated pharmacy draft", "NHSBSA", async () => { await apply.click(); });
        const appliedEvent = applied.lifecycles[B].history.at(-1)!;
        reason = generated;
        expect(appliedEvent).toMatchObject({
          actor: "operator", from: "in_review", to: "in_review", revision: selected.caseRevisions[B].at(-1)!.number,
          processStep: "suggestion_applied", message: "Applied by the operator from the agent's suggestion.",
        });
        expect(applied).toEqual({
          ...selected,
          operatorDrafts: { ...selected.operatorDrafts, [B]: {
            revision: selected.caseRevisions[B].at(-1)!.number, outcome: "REFER_BACK", rbCode: "SYN-NCSO",
            note: generated, appliedSuggestion: true,
          } },
          lifecycles: { ...selected.lifecycles, [B]: {
            ...selected.lifecycles[B], history: [...selected.lifecycles[B].history, appliedEvent],
          } },
        });
        await expect(decisionNote(page)).toHaveValue(generated);
        await expect(operatorAction(page, "ACCEPT")).toBeDisabled();
      } else expect(await readDomainState(page), "An unapplied draft cannot create a human decision or approval").toEqual(selected);
      const referred = await action("Record the human referral once", "NHSBSA", async () => {
        await performDecision(page, "REFER_BACK");
        await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
      });
      expect(referred.records).toHaveLength(initial.records.length + 1);
      const record = referred.records.at(-1);
      expect(record).toMatchObject({ caseId: B, reason, rbCode: "SYN-NCSO" });
      if (approval === "approved") expect(record?.approvedDraft).toMatchObject({ approvedBy: "Demo operator", decision: "REFER_BACK" });
      else expect(record?.approvedDraft).toBeUndefined();
      expect(referred.lifecycles[B].state).toBe("referred_back");
      expect(referred.caseRevisions).toEqual(submitted.caseRevisions);
      await action("Read the recorded referral and verify no stale notification", "NHSBSA", async () => {
        await assertInlineDecisionRecorded(page, "REFER_BACK");
      });
      expect(await readDomainState(page)).toEqual(referred);
      if (enabled) {
        for (const [month, outcome] of [["2026-07", "Sufficient: release to pricing once confirmed"], ["2026-08", "Refer back with the exact fix"]] as const) {
          await action(`Replay the recorded evidence under ${month}`, "NHSBSA", async () => {
            await page.getByRole("combobox", { name: "Replay with", exact: true }).selectOption(month);
            await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveText(outcome);
          });
          expect(await readDomainState(page), "Replay is not a new decision or mutation of its original rule").toEqual(referred);
        }
      }
      await action("Navigate to the pharmacy side of the same B record", "Pharmacy", async () => {
        await navigatePrimary(page, "Pharmacy claims");
      });
      await action("Open the actual referred-back B item", "Pharmacy", async () => {
        await page.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true }).click();
      });
      await expect(detail(page)).toContainText("SYN-NCSO");
      await expect(page.getByRole("region", { name: "Operator-approved pharmacy note", exact: true })).toHaveCount(approval === "approved" ? 1 : 0);
      if (approval === "approved") {
        await action("Check the current missing endorsement", "Pharmacy", async () => {
          await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        });
        await action("Apply the approved date correction without submitting", "Pharmacy", async () => {
          await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
        });
      } else {
        await action("Type the complete pharmacy endorsement without draft approval", "Pharmacy", async () => {
          await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
        });
      }
      const correctedText = approval === "approved" ? "NCSO RK 21/08/26" : "NCSO  RK 21/08/26";
      await expect(page.getByRole("textbox", { name: "Corrected endorsement", exact: true })).toHaveValue(correctedText);
      const corrected = await readDomainState(page);
      expect(corrected.pharmacyDrafts[B]).toMatchObject({
        revision: referred.caseRevisions[B].at(-1)!.number, channel: "eps", purpose: "correction",
        endorsementText: correctedText, appliedSuggestion: approval === "approved",
        epsPrescription: { dispenserEndorsement: correctedText },
      });
      const correctionEvent = corrected.lifecycles[B].history.at(-1)!;
      if (approval === "approved") expect(correctionEvent).toMatchObject({
        actor: "pharmacy", processStep: "correction_applied", from: "referred_back", to: "referred_back",
        revision: referred.caseRevisions[B].at(-1)!.number,
      });
      expect(corrected, "Apply may record its human event; neither Apply nor editing submits").toEqual({
        ...referred, pharmacyDrafts: { ...referred.pharmacyDrafts, [B]: corrected.pharmacyDrafts[B] },
        lifecycles: approval === "approved" ? { ...referred.lifecycles, [B]: {
          ...referred.lifecycles[B], history: [...referred.lifecycles[B].history, correctionEvent],
        } } : referred.lifecycles,
      });
      const resubmitted = await action("Explicitly resubmit the complete EPS correction", "Pharmacy", async () => {
        await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
        await expect(detail(page)).toContainText(LIFECYCLE_LABELS.resubmitted.pharmacy);
      });
      expect(resubmitted.itemProcesses[B]).toMatchObject({ channel: "eps", routing: { outcome: "type2_endorsement", requiresHuman: true } });
      expect(resubmitted.records).toEqual(referred.records);
      expect(resubmitted.caseRevisions[B].at(-1)).toMatchObject({
        channel: "eps", kind: "resubmission", endorsementText: correctedText,
        precheck: { status: enabled ? "ready" : "not_checked", mode: enabled ? "scripted" : "off" },
      });
      expectUnrelatedCases(referred, resubmitted, B);
      await openWork(page, action, B);
      expect(await readDomainState(page), "Opening a corrected referral is not a human recheck").toEqual(resubmitted);
      await action("Explicitly begin the correction recheck", "NHSBSA", async () => {
        await page.getByRole("button", { name: "Start review", exact: true }).click();
      });
      await action("Judge the corrected endorsement sufficient", "NHSBSA", async () => {
        if (enabled) await expect(operatorDecision(page).getByRole("region", { name: "Recommendation", exact: true }).getByText("Sufficient recommended", { exact: true })).toBeVisible();
        await operatorRadio(page, "ACCEPT").check();
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human recheck confirms the date beside the initials");
      });
      const beforeRelease = await readDomainState(page);
      const paid = await action("Record the human correction decision before existing pricing", "NHSBSA", async () => {
        await performDecision(page, "ACCEPT", { releaseVerified: enabled });
        await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
      });
      expectHumanRelease(beforeRelease, paid, B);
      expect(paid.lifecycles[B].state).toBe("released_to_pricing");
      expect(paid.itemProcesses[B].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: false, pricingAuthority: "existing_rules_engine" });
      expect(paid.records).toHaveLength(referred.records.length + 1);
      expect(paid.records.at(-1)).toMatchObject({ caseId: B, revision: resubmitted.caseRevisions[B].at(-1)!.number, decision: "ACCEPT" });
      expectUnrelatedCases(referred, paid, B);
      expect(paid.lifecycles[B].history.slice(initial.lifecycles[B].history.length)
        .filter((event) => event.processStep === "release_to_pricing" || event.processStep === "referral")).toHaveLength(2);
      await action("Read the human-decided B case without inventing automatic-only work", "NHSBSA", async () => {
        await navigatePrimary(page, "NHSBSA queue");
        await expect(page.locator(`[data-case-id="${B}"]`)).toBeVisible();
        for (const id of ["EX-24107", "EX-24101"]) await expect(page.locator(`[data-case-id="${id}"]`)).toHaveCount(0);
      });
      expect(await readDomainState(page)).toEqual(paid);
    });
  });
}

for (const enabled of [false, true]) {
  test(`one state: actual A EPS selection has no capture or approval, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Choose the complete A submission example", "Pharmacy", async () => {
        await choosePharmacyRadio(page, "Complete endorsement");
      });
      await action("Explicitly select the EPS channel", "Pharmacy", async () => {
        await choosePharmacyRadio(page, "EPS");
      });
      if (enabled) await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
      else await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
      const paid = await action("Submit complete A EPS for existing pricing", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send claim", exact: true }).click();
        await expect(page.getByRole("region", { name: "Submission receipt", exact: true }))
          .toContainText(enabled ? "released to existing pricing, no operator action" : "no person involved");
      });
      expect(paid.lifecycles["EX-24107"].state).toBe(enabled ? "released_to_pricing" : "paid");
      expect(paid.itemProcesses["EX-24107"]).toMatchObject({ channel: "eps", capture: null, routing: { outcome: "auto_priced", requiresHuman: false } });
      expect(paid.records).toEqual(initial.records);
      expectUnrelatedCases(initial, paid, "EX-24107");
      await action("Inspect work after automatic A pricing", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      for (const id of ["EX-24107", "EX-24101"]) {
        await expect(page.locator(`[data-case-id="${id}"], [data-type1-case="${id}"]`)).toHaveCount(0);
      }
      expect(await readDomainState(page)).toEqual(paid);
    });
  });

  test(`one state: human release remains staff work, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Open the existing B referral for a real correction", "Pharmacy", async () => {
        await navigatePrimary(page, "Pharmacy claims");
        await page.getByRole("button", { name: `Correct and resubmit ${B}`, exact: true }).click();
      });
      await action("Supply the missing date before asking for human release", "Pharmacy", async () => {
        await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO RK 21/08/26");
      });
      if (enabled) await action("Check the corrected source rather than override missing facts", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        await expect(detail(page)).toContainText("Ready");
      });
      const resubmitted = await action("Resubmit complete B evidence for explicit human recheck", "Pharmacy", async () => {
        await page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
      });
      expect(resubmitted.lifecycles[B].state).toBe("resubmitted");
      expect(resubmitted.itemProcesses[B].routing.requiresHuman).toBe(true);
      expect(resubmitted.records).toEqual(initial.records);
      await openWork(page, action, B);
      await action("Start the human review", "NHSBSA", async () => { await page.getByRole("button", { name: "Start review", exact: true }).click(); });
      await action("Choose a human release only after the code facts are valid", "NHSBSA", async () => {
        await operatorRadio(page, "ACCEPT").check();
      });
      await action("Enter the human judgement reason", "NHSBSA", async () => {
        await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human reviewed the synthetic evidence and judged it sufficient");
      });
      const beforeRelease = await readDomainState(page);
      const decided = await action("Record the sufficient human decision", "NHSBSA", async () => {
        await performDecision(page, "ACCEPT", { releaseVerified: enabled });
        await expect(page).toHaveURL(/\/record$/);
      });
      expect(decided.records).toHaveLength(initial.records.length + 1);
      expect(decided.itemProcesses[B].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: false, pricingAuthority: "existing_rules_engine" });
      expectHumanRelease(beforeRelease, decided, B);
      expect(decided.lifecycles[B].state).toBe("released_to_pricing");
      expectUnrelatedCases(initial, decided, B);
      await action("Return to actual staff work after human acceptance", "NHSBSA", async () => { await page.getByRole("link", { name: "Back to queue", exact: true }).click(); });
      await action("Filter human-decided work", "NHSBSA", async () => { await page.getByRole("button", { name: /^Decided/ }).click(); });
      await expect(page.locator(`[data-case-id="${B}"]`)).toBeVisible();
      for (const id of ["EX-24107", "EX-24101"]) await expect(page.locator(`[data-case-id="${id}"]`)).toHaveCount(0);
      expect(await readDomainState(page)).toEqual(decided);
    });
  });
}
