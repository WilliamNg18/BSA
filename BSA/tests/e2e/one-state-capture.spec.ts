import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { captureJson, expect, navigatePrimary, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence, type DomainAction, type DomainSnapshot } from "./one-state-helpers";

const D = "EX-24123";
const declaration = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)" };
const labels = { productCode: "Product code", quantity: "Quantity", endorsementText: "Endorsement", prescriber: "Prescriber" } as const;

function expectOtherCasesUnchanged(before: DomainSnapshot, after: DomainSnapshot) {
  for (const key of ["caseRevisions", "lifecycles", "itemProcesses", "caseStates"] as const) {
    for (const id of Object.keys(before[key])) {
      if (id !== D) expect(after[key][id], `${key}: unrelated ${id} remains exact`).toEqual(before[key][id]);
    }
  }
  for (const key of ["baselineInputs", "processInputs", "pharmacyCorrections", "todayMinutes"] as const) {
    expect(after[key], `Capture cannot alter ${key}`).toEqual(before[key]);
  }
}

async function fillCapture(action: DomainAction, capture: Locator, fields: Partial<Record<keyof typeof labels, string>>) {
  for (const [field, label] of Object.entries(labels)) {
    const value = fields[field as keyof typeof labels];
    if (value !== undefined) await action(`Key capture ${label}`, "NHSBSA", async () => {
      await capture.getByRole("textbox", { name: label, exact: true }).fill(value);
    });
  }
}

for (const enabled of [false, true]) {
  for (const scenario of ["fresh unknown", "corrected fields", "missing prescriber", "invalid quantity", "manual mode", "reset draft"] as const) {
    test(`one state: Type 1 ${scenario}, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
      await page.setViewportSize({ width: enabled ? 360 : 1440, height: 1000 });
      await page.emulateMedia({ colorScheme: enabled ? "dark" : "light", reducedMotion: "reduce" });
      await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
        const initial = await readDomainState(page);
        if (scenario === "fresh unknown") {
          await action("Choose unreadable paper without a declaration", "Pharmacy", async () => {
            await page.getByRole("radio", { name: "Unreadable form", exact: true }).check();
          });
          await expect(page.getByRole("radio", { name: "Paper", exact: true })).toBeChecked();
          for (const name of ["Declared product code", "Declared quantity", "Declared prescriber (synthetic)", "Dispenser endorsement"]) {
            await expect(page.getByLabel(name, { exact: true })).toHaveValue("");
          }
          const submitted = await action("Submit the genuinely undeclared paper revision", "Pharmacy", async () => {
            await page.getByRole("button", { name: "Send claim", exact: true }).click();
          });
          expect(submitted.caseRevisions[D].at(-1)?.declaration).toBeUndefined();
          expect(submitted.itemProcesses[D]).toMatchObject({ capture: null, routing: { outcome: "type1_capture", requiresHuman: true } });
          expect(submitted.caseRevisions[D].slice(0, initial.caseRevisions[D].length)).toEqual(initial.caseRevisions[D]);
        }
        await action("Open the actual capture lane", "NHSBSA", async () => {
          await navigatePrimary(page, "NHSBSA queue");
        });
        const capture = page.getByRole("region", { name: `Type 1 capture for ${D}`, exact: true });
        await expect(capture).toBeVisible();
        const before = await readDomainState(page);
        const reconciled = capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true });
        const confirm = capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true });
        const assisted = enabled && scenario !== "fresh unknown";
        for (const [field, label] of Object.entries(labels)) {
          await expect(capture.getByRole("textbox", { name: label, exact: true })).toHaveValue(
            assisted ? String(declaration[field as keyof typeof declaration]) : "");
        }
        await expect(reconciled).toHaveCount(assisted ? 1 : 0);
        if (assisted) await expect(reconciled).not.toBeChecked();
        await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);

        if (scenario === "reset draft" || scenario === "manual mode") {
          await fillCapture(action, capture, { productCode: "UNSAVED-SYNTHETIC" });
          if (assisted) await action("Mark the uncommitted draft reconciled", "NHSBSA", async () => { await reconciled.check(); });
          expect(await readDomainState(page)).toEqual(before);
          if (scenario === "manual mode" && enabled) {
            await action("Discard prefill and key fields manually", "NHSBSA", async () => {
              await capture.getByRole("button", { name: "Key fields manually", exact: true }).click();
            });
            await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toBeFocused();
            for (const label of Object.values(labels)) await expect(capture.getByRole("textbox", { name: label, exact: true })).toHaveValue("");
            await expect(reconciled).toHaveCount(0);
            await action("Review the immutable original declaration again", "NHSBSA", async () => {
              await capture.getByRole("button", { name: "Review pharmacy declaration", exact: true }).click();
            });
            await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toHaveValue(declaration.productCode);
            await expect(reconciled).not.toBeChecked();
          }
          await action("Explicitly change the Agent setting", "NHSBSA", async () => {
            await page.getByRole("banner").getByRole("switch").setChecked(!enabled);
          });
          await action("Restore the original Agent setting", "NHSBSA", async () => {
            await page.getByRole("banner").getByRole("switch").setChecked(enabled);
          });
          await expect(capture.getByRole("textbox", { name: "Product code", exact: true })).toHaveValue(enabled ? declaration.productCode : "");
          if (enabled) await expect(reconciled).not.toBeChecked();
          expect(await readDomainState(page), "Agent and capture-mode changes discard drafts, not evidence").toEqual(before);
          if (scenario === "reset draft") {
            await fillCapture(action, capture, { quantity: "99" });
            if (enabled) await action("Reconcile the draft before Reset", "NHSBSA", async () => { await reconciled.check(); });
            await action("Explicitly open and confirm Reset without recording a capture", "NHSBSA", async () => {
              await page.getByRole("button", { name: "Reset demo", exact: true }).click();
              expect(await readDomainState(page), "Opening the modal cannot mutate domain state").toEqual(before);
              await page.getByRole("alertdialog", { name: "Reset demonstration?", exact: true })
                .getByRole("button", { name: "Reset demonstration", exact: true }).click();
            });
            await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
            for (const label of Object.values(labels)) await expect(capture.getByRole("textbox", { name: label, exact: true })).toHaveValue("");
            expect(await readDomainState(page)).toEqual(initial);
            return;
          }
        }

        if (scenario === "invalid quantity") {
          for (const value of ["0", "-1", "1.5", "1e2", "NaN", "9007199254740992"]) {
            await action(`Enter invalid quantity ${value}`, "NHSBSA", async () => {
              await capture.getByRole("textbox", { name: "Quantity", exact: true }).fill(value);
            });
            if (assisted) await action(`Explicitly reconcile invalid quantity ${value}`, "NHSBSA", async () => { await reconciled.check(); });
            await action(`Reject invalid quantity ${value}`, "NHSBSA", async () => {
              await confirm.click();
              await expect(capture.getByRole("alert")).toContainText("Enter a positive whole quantity, or leave blank if unreadable.");
              await expect(capture.getByRole("alert")).toBeFocused();
            });
            expect(await readDomainState(page), `${value} must not append evidence`).toEqual(before);
          }
          await fillCapture(action, capture, { quantity: "100" });
        }

        const corrected = scenario === "corrected fields";
        const missing = scenario === "missing prescriber";
        if (corrected || missing) {
          if (assisted) await action("Reconcile before editing a capture field", "NHSBSA", async () => { await reconciled.check(); });
          await fillCapture(action, capture, enabled
            ? corrected ? { quantity: "99" } : { prescriber: "" }
            : { productCode: declaration.productCode, quantity: corrected ? "99" : "100", endorsementText: declaration.endorsementText, prescriber: corrected ? declaration.prescriber : "" });
          if (assisted) {
            await expect(reconciled).not.toBeChecked();
            await action("Reject a changed declaration until reconciled again", "NHSBSA", async () => {
              await confirm.click();
              await expect(capture.getByRole("alert")).toContainText("Reconcile the declaration with the paper, or use manual capture.");
              await expect(capture.getByRole("alert")).toBeFocused();
            });
          }
        }
        if (assisted) await action("Explicitly reconcile the final values", "NHSBSA", async () => { await reconciled.check(); });
        expect(await readDomainState(page), "All unconfirmed capture edits are presentation-only").toEqual(before);
        const audit = await new AxeBuilder({ page }).analyze();
        await captureJson(info, `capture-${scenario}-axe`, audit);
        expect(audit.violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(enabled ? 360 : 1440);

        const confirmed = await action("Record human capture, not a Type 2 decision", "NHSBSA", async () => {
          await confirm.click();
          await expect(page.locator(`[data-case-id="${D}"]`)).toBeVisible();
        });
        expect(confirmed.itemProcesses[D]).toMatchObject({
          capture: {
            revision: before.itemProcesses[D].revision, operator: "Demo operator",
            provenance: assisted && !corrected && !missing ? "pharmacy_declaration" : "human_capture",
            declarationReconciled: assisted,
          },
          routing: { outcome: "type2_endorsement", requiresHuman: true },
        });
        const fields = confirmed.itemProcesses[D].capture?.fields;
        if (corrected) expect(fields).toEqual({ ...declaration, quantity: 99 });
        if (missing) expect(fields).toEqual({ ...declaration, prescriber: null });
        if (scenario === "fresh unknown") expect(fields).toEqual({ productCode: null, quantity: null, endorsementText: "", prescriber: null });
        expect(confirmed.records).toEqual(before.records);
        expect(confirmed.caseRevisions).toEqual(before.caseRevisions);
        expectOtherCasesUnchanged(before, confirmed);
        const events = confirmed.lifecycles[D].history;
        expect(events.slice(0, before.lifecycles[D].history.length)).toEqual(before.lifecycles[D].history);
        expect(events.slice(before.lifecycles[D].history.length)).toEqual([
          expect.objectContaining({ actor: "operator", processStep: "type1_capture", capture: confirmed.itemProcesses[D].capture }),
        ]);
        await action("Inspect capture provenance from the Type 2 case", "NHSBSA", async () => {
          await page.getByRole("link", { name: `Open ${D}`, exact: true }).click();
          await expect(page.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeVisible();
        });
        expect(await readDomainState(page)).toEqual(confirmed);
        if (enabled && missing) {
          await expect(page.getByRole("alert")).toContainText("Recommendation withheld by the compliance gate");
          await expect(page.getByText("Gate: FAIL", { exact: true })).toBeVisible();
          await expect(page.getByText("One or more mandatory fields missing", { exact: false })).toBeVisible();
          await expect(page.getByRole("radio", { name: /^Accept the recommendation/ })).toBeDisabled();
          await expect(page.getByRole("radio", { name: /^Amend / })).toBeDisabled();
          await expect(page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true })).toHaveCount(0);
        } else if (enabled && (corrected || scenario === "fresh unknown")) {
          await expect(page.getByRole("alert").filter({ hasText: "The agent abstained" })).toBeVisible();
          await expect(page.getByText("NOT RUN", { exact: true })).toBeVisible();
        }
      });
    });
  }
}
