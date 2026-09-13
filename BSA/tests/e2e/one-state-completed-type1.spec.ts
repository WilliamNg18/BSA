import { expect, navigatePrimary, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";
import { completePaperFields, confirmCompletePaper, openFourCases, PAPER_B, submitCompletePaper } from "./paper-capture-helpers";

for (const enabled of [false, true]) {
  test(`one state: completed Type 1 paper keeps human provenance without Type 2, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      const submitted = await submitCompletePaper(page, action);
      expect(submitted.itemProcesses[PAPER_B]).toMatchObject({ capture: null, routing: { outcome: "type1_capture", requiresHuman: true } });
      expect(submitted.lifecycles[PAPER_B].state).toBe("submitted");
      expect(submitted.records).toEqual(initial.records);
      expect(submitted.caseRevisions[PAPER_B].slice(0, initial.caseRevisions[PAPER_B].length)).toEqual(initial.caseRevisions[PAPER_B]);

      const confirmed = await confirmCompletePaper(page, enabled, action);
      expect(confirmed.itemProcesses[PAPER_B]).toMatchObject({
        routing: { outcome: "type1_capture", requiresHuman: false },
        capture: { fields: completePaperFields, operator: "Demo operator",
          provenance: "human_capture", declarationReconciled: enabled },
      });
      expect(confirmed.lifecycles[PAPER_B].state).toBe("paid");
      expect(confirmed.records).toEqual(initial.records);
      expect(confirmed.caseRevisions).toEqual(submitted.caseRevisions);
      expect(confirmed.lifecycles[PAPER_B].history.slice(0, submitted.lifecycles[PAPER_B].history.length)).toEqual(submitted.lifecycles[PAPER_B].history);
      expect(confirmed.lifecycles[PAPER_B].history.slice(submitted.lifecycles[PAPER_B].history.length))
        .toEqual([
          expect.objectContaining({ actor: "operator", processStep: "type1_capture", capture: confirmed.itemProcesses[PAPER_B].capture }),
          expect.objectContaining({ actor: "code", processStep: "type1_capture", from: "in_review", to: "paid" }),
        ]);
      for (const key of ["caseRevisions", "lifecycles", "itemProcesses", "caseStates"] as const) {
        for (const id of Object.keys(initial[key])) {
          if (id !== PAPER_B) expect(confirmed[key][id], `${key}: unrelated ${id} stays exact`).toEqual(initial[key][id]);
        }
      }
      await expect(page.locator(`[data-type1-case="${PAPER_B}"], [data-case-id="${PAPER_B}"]`)).toHaveCount(0);
      await action("Inspect completed capture under Decided", "NHSBSA", async () => {
        await page.getByRole("button", { name: /^Decided/ }).click();
      });
      await expect(page.getByRole("region", { name: "Completed Type 1 captures", exact: true })).toContainText("Human capture confirmed");
      await expect(page.getByRole("region", { name: "Type 2 items", exact: true })).not.toContainText(PAPER_B);
      await action("Read the completed paper case in Four cases", "NHSBSA", async () => { await openFourCases(page); });
      const card = page.locator('[data-case="B"]');
      await expect(card).toHaveAttribute("data-case-routing", "type1_capture");
      await expect(card).toHaveAttribute("data-case-capture", "complete");
      await expect(card.getByRole("region", { name: "Completed Type 1 capture", exact: true })).toContainText("Capture complete · Existing pricing");
      await expect(card).not.toContainText("Awaiting Type 1 capture");
      await expect(card).not.toContainText("no person involved");
      await expect(card.getByRole("link", { name: "Open case", exact: true })).toHaveCount(0);
      for (const current of [!enabled, enabled]) {
        await action(`Inspect completed capture with Agent ${current ? "On" : "Off"}`, "NHSBSA", async () => {
          await page.getByRole("banner").getByRole("switch").setChecked(current);
        });
        await expect(card).toHaveAttribute("data-case-capture", "complete");
        await expect(card).toContainText("A person confirmed the captured fields");
        expect(await readDomainState(page)).toEqual(confirmed);
      }
      await action("Return to the completed staff work", "NHSBSA", async () => { await navigatePrimary(page, "NHSBSA queue"); });
      await expect(page.getByRole("region", { name: "Completed Type 1 captures", exact: true })).toContainText("Human capture confirmed");
      expect(await readDomainState(page), "Read-only queue and chapter navigation cannot change capture or history").toEqual(confirmed);
    });
  });
}
