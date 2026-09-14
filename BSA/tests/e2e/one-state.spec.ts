import { expect, navigatePrimary, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";

test("one state: observer is read-only and retains every authoritative collection", async ({ page }) => {
  await page.goto("/pharmacy");
  const snapshot = await readDomainState(page);
  expect(Object.keys(snapshot).sort()).toEqual([
    "baselineInputs", "caseRevisions", "caseStates", "itemProcesses", "itemVerification", "lifecycles", "manualLoopInputs",
    "operatorDrafts", "pharmacy", "pharmacyCorrections", "pharmacyDrafts", "processInputs", "records", "todayMinutes",
  ]);
  const observer = await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "__BSA_READ_DOMAIN_STATE__");
    return { writable: descriptor?.writable, configurable: descriptor?.configurable, setter: typeof descriptor?.set };
  });
  expect(observer).toEqual({ writable: false, configurable: false, setter: "undefined" });
  for (const enabled of [true, false]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    expect(await readDomainState(page), "The header Agent control alone cannot mutate operational state").toEqual(snapshot);
  }
});

  for (const enabled of [false, true]) {
    test(`one state: explicit Type 1 capture preserves the pharmacy declaration, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
      await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
        const initial = await readDomainState(page);
        await action("Open actual NHSBSA work", "NHSBSA", async () => {
          await navigatePrimary(page, "NHSBSA queue");
        });
        const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
        await expect(capture).toBeVisible();
        const product = capture.getByRole("textbox", { name: "Product code", exact: true });
        await expect(product).toHaveValue(enabled ? "SYN-COCOD-100" : "");
        expect(await readDomainState(page), "Opening a capture form must not confirm the prior declaration").toEqual(initial);
        await action("Restart the assumed capture stopwatch", "NHSBSA", async () => {
          await capture.getByRole("button", { name: "Restart timing illustration", exact: true }).click();
        });
        await action("Advance the assumed capture stopwatch", "NHSBSA", async () => {
          await capture.getByRole("button", { name: "Next timing step", exact: true }).click();
        });
        expect(await readDomainState(page), "Timing illustration must not write a lifecycle event or change assumptions").toEqual(initial);
        if (enabled) {
          await action("Reject capture without explicit reconciliation", "NHSBSA", async () => {
            await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
            await expect(capture.getByRole("alert")).toBeVisible();
            await expect(capture.getByRole("alert")).toBeFocused();
          });
          expect(await readDomainState(page), "Failed reconciliation cannot create capture evidence").toEqual(initial);
          await action("Explicitly reconcile the declaration with the paper", "NHSBSA", async () => {
            await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true }).check();
          });
        }
        const confirmed = await action("Confirm the current capture without making a Type 2 decision", "NHSBSA", async () => {
          await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
          await expect(page.locator('[data-case-id="EX-24123"]')).toBeVisible();
        });
        expect(confirmed).toMatchObject({
          itemProcesses: { "EX-24123": {
            channel: "paper", revision: 1,
            routing: { outcome: "type2_endorsement", requiresHuman: true },
            capture: { revision: 1, operator: "Demo operator", provenance: enabled ? "pharmacy_declaration" : "human_capture", declarationReconciled: enabled },
          } },
          lifecycles: { "EX-24123": { state: "in_review", history: expect.arrayContaining([
            expect.objectContaining({ actor: "operator", processStep: "type1_capture", revision: 1, capture: expect.objectContaining({ declarationReconciled: enabled }) }),
          ]) } },
        });
        expect(confirmed.caseRevisions, "Human capture must leave every original pharmacy attempt byte-identical").toEqual(initial.caseRevisions);
        expect(confirmed.records, "Capture confirmation is not an endorsement decision or approval").toEqual(initial.records);
        await action("Read the captured item in the Type 2 worklist", "NHSBSA", async () => {
          await page.locator('[data-case-id="EX-24123"]').getByRole("link", { name: "Open EX-24123", exact: true }).click();
          await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
        });
        expect(await readDomainState(page)).toEqual(confirmed);
        if (enabled) {
          await expect(page.getByText("Human-confirmed fields: declared by the pharmacy, not read from the form. Original machine capture stays separate; proposed path.", { exact: true })).toBeVisible();
          expect(confirmed.itemProcesses["EX-24123"].capture?.fields.prescriber).toBeNull();
          await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" })).toBeVisible();
          await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).toHaveCount(0);
        }
      });
    });
  }

for (const enabled of [false, true]) {
  test(`one state: complete EPS automatically prices without operator approval, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Select the EPS missing-information example", "Pharmacy", async () => {
        await page.getByRole("radio", { name: "NCSO missing date", exact: true }).check();
      });
      await action("Enter a complete endorsement for the EPS item", "Pharmacy", async () => {
        await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO AB 27/08/26");
      });
      const submitted = await action("Explicitly submit complete EPS item", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Send claim", exact: true }).click();
        await expect(page.getByRole("link", { name: "View submitted claim", exact: true })).toBeVisible();
      });
      expect(submitted).toMatchObject({
        itemProcesses: { "EX-24112": { channel: "eps", routing: {
          outcome: "auto_priced", requiresHuman: false, pricingAuthority: "existing_rules_engine",
        } } },
        lifecycles: { "EX-24112": { state: enabled ? "released_to_pricing" : "paid", history: expect.arrayContaining([
          expect.objectContaining({ actor: "code", processStep: enabled ? "release_to_pricing" : "automatic_pricing" }),
        ]) } },
        caseStates: { "EX-24112": "cleared_by_rules" },
        caseRevisions: { "EX-24112": expect.arrayContaining([expect.objectContaining({
          kind: "submission", channel: "eps", endorsementText: "NCSO AB 27/08/26",
        })]) },
      });
      expect(submitted.itemVerification["EX-24112"]).toEqual(enabled
        ? { gate1: "pass", gate2: "pass", reconciled: true, released: true }
        : { gate1: "none", gate2: "none", reconciled: false, released: false });
      expect(initial.records).toEqual(expect.any(Array));
      expect(submitted.records, "Automatic pricing must not append a human approval").toEqual(initial.records);
      await action("Read the automatic item receipt", "Pharmacy", async () => {
        await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
        await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText("EX-24112");
      });
      expect(await readDomainState(page), "Reading the receipt cannot create an operator decision").toEqual(submitted);
      await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    });
  });

  test(`one state: incomplete EPS draft survives every perspective switch, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      const field = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
      await action("Select incomplete EPS example", "Pharmacy", async () => {
        await page.getByRole("radio", { name: "NCSO missing date", exact: true }).check();
      });
      await action("Enter an incomplete endorsement", "Pharmacy", async () => {
        await field.fill("NCSO XY");
      });
      await action("Revise the initials without adding the missing date", "Pharmacy", async () => {
        await expect(field).toHaveValue("NCSO XY");
        await field.fill("NCSO RK");
      });
      expect(await readDomainState(page), "Unsubmitted edits are not lifecycle or correction events").toEqual(initial);
      const submitted = await action("Explicitly submit the retained incomplete draft", "Pharmacy", async () => {
        await expect(field).toHaveValue("NCSO RK");
        await page.getByRole("button", { name: "Send claim", exact: true }).click();
        await expect(page.getByRole("link", { name: "View submitted claim", exact: true })).toBeVisible();
      });
      expect(submitted).toMatchObject({
        itemProcesses: { "EX-24112": { channel: "eps", routing: { outcome: "type2_endorsement", requiresHuman: true } } },
        caseRevisions: { "EX-24112": expect.arrayContaining([expect.objectContaining({
          kind: "submission", endorsementText: "NCSO RK", channel: "eps",
        })]) },
      });
    });
  });
}
