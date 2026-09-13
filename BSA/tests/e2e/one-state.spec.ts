import { expect, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";

test("one state: observer is read-only and retains every authoritative collection", async ({ page }) => {
  await page.goto("/pharmacy");
  const snapshot = await readDomainState(page);
  expect(Object.keys(snapshot).sort()).toEqual([
    "baselineInputs", "caseRevisions", "caseStates", "itemProcesses", "lifecycles",
    "pharmacy", "pharmacyCorrections", "processInputs", "records", "todayMinutes",
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
  test(`one state: complete EPS automatically prices without operator approval, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      await action("Select complete EPS example", "Pharmacy", async () => {
        await page.getByRole("radio", { name: "Complete endorsement", exact: true }).check();
      });
      const submitted = await action("Explicitly submit complete EPS item", "Pharmacy", async () => {
        await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
        await expect(page.getByRole("link", { name: "View submitted claim", exact: true })).toBeVisible();
      });
      expect(submitted).toMatchObject({
        itemProcesses: { "EX-24107": { channel: "eps", routing: {
          outcome: "auto_priced", requiresHuman: false, pricingAuthority: "existing_rules_engine",
        } } },
        lifecycles: { "EX-24107": { state: "paid", history: expect.arrayContaining([
          expect.objectContaining({ actor: "code", processStep: "automatic_pricing" }),
        ]) } },
        caseStates: { "EX-24107": "cleared_by_rules" },
      });
      expect(initial.records).toEqual(expect.any(Array));
      expect(submitted.records, "Automatic pricing must not append a human approval").toEqual(initial.records);
      await action("Read the automatic item receipt", "Pharmacy", async () => {
        await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
        await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText("EX-24107");
      });
      expect(await readDomainState(page), "Reading the receipt cannot create an operator decision").toEqual(submitted);
      await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
    });
  });

  test(`one state: incomplete EPS draft survives every perspective switch, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy", exact: true });
      await action("Select incomplete EPS example", "Pharmacy", async () => {
        await page.getByRole("radio", { name: "Information missing", exact: true }).check();
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
        await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
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
