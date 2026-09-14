import type { Page } from "@playwright/test";
import { expect } from "./fixtures";
import { LIFECYCLE_LABELS, type LifecycleState } from "../../src/lib/domain/lifecycle";
import { EPS_SUPPLY_RULE } from "../../src/lib/domain/eps-check";
import { DECLARATION_RECONCILIATION } from "./paper-declaration-helpers";
import type { CycleActionOptions, PlayableCycle } from "../support/desktop-matrix";

export type CycleSide = "Pharmacy" | "NHSBSA";
export type CycleAction = (label: string, side: CycleSide, perform: () => Promise<void>, options?: CycleActionOptions) => Promise<unknown>;

export async function runFourCaseCycle(page: Page, scenario: PlayableCycle, enabled: boolean, action: CycleAction) {
  const id = scenario.id;
  const strip = page.getByTestId("demo-strip");
  const followed = page.getByRole("region", { name: "Followed item", exact: true });
  const active = () => page.getByTestId(enabled ? "demo-assisted" : "demo-today");
  const panel = () => active().getByRole("region", { name: "Operator decision", exact: true });
  const stateLabel = (state: LifecycleState, side: CycleSide, human = false) => {
    if (human && state === "released_to_pricing") return side === "Pharmacy"
      ? `${enabled ? "Verified and released" : "Released"} to pricing after operator review (synthetic)`
      : `${enabled ? "Verified and released" : "Released"} to existing pricing after operator review`;
    return side === "Pharmacy" ? LIFECYCLE_LABELS[state].pharmacy : LIFECYCLE_LABELS[state].nhsbsa[enabled ? "on" : "off"];
  };
  async function sides(label: string, state: LifecycleState, human = false) {
    for (const side of ["Pharmacy", "NHSBSA"] as const) {
      const origin = side === "Pharmacy" ? "NHSBSA" : "Pharmacy";
      let restricted = false;
      await action(`${label}: ${side} view`, origin, async () => {
        restricted = await page.getByRole("banner").getByRole("radio", { name: origin, exact: true }).isChecked();
        await followed.getByRole("button", { name: `${side} view`, exact: true }).click();
        await expect(page.getByRole("banner").getByRole("radio", { name: "Both", exact: true })).toBeChecked();
        if (restricted) await expect(followed.getByRole("status")).toHaveText(
          `Both temporarily shown. ${origin} view restores your perspective; choosing a perspective keeps your choice.`);
        await expect(followed).toContainText(`Following ${id}`);
        await expect(followed).toContainText(scenario.channel === "eps" ? "EPS" : "Paper");
        await expect(followed.getByText(stateLabel(state, side, human), { exact: true }).first()).toBeVisible();
        await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", String(scenario.step));
        await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-case", id);
        await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
        expect(new URL(page.url()).pathname).toBe(side === "Pharmacy" ? "/pharmacy/claims" : `/case/${id}`);
        if (side === "Pharmacy") expect(new URL(page.url()).searchParams.get("case")).toBe(id);
        if (human) await expect(followed).not.toContainText("no operator action");
      });
      await action(`${label}: explicit return to ${origin}`, origin, async () => {
        await followed.getByRole("button", { name: `${origin} view`, exact: true }).click();
        await expect(page.getByRole("banner").getByRole("radio", { name: restricted ? origin : "Both", exact: true })).toBeChecked();
        await expect(followed.getByRole("status")).toHaveCount(0);
        await expect(followed).toContainText(`Following ${id}`);
        await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", String(scenario.step));
        await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      }, { preservePerspective: true });
    }
    await action(`${label}: retain NHSBSA item for the next action`, "NHSBSA", async () => {
      await followed.getByRole("button", { name: "NHSBSA view", exact: true }).click();
      await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-case", id);
      await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", String(scenario.step));
      await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      await expect(followed).toContainText(`Following ${id}`);
      await expect(followed.getByText(stateLabel(state, "NHSBSA", human), { exact: true }).first()).toBeVisible();
    }, { preservePerspective: true });
  }
  async function capture(label: string, endorsement: string) {
    const region = active().getByRole("region", { name: `Type 1 capture for ${id}`, exact: true });
    await expect(region).toBeVisible();
    for (const [name, value] of [
      ["Product code", "SYN-COCOD-100"], ["Quantity", "100"],
      ["Endorsement", endorsement], ["Prescriber", "Dr Example (synthetic)"],
    ]) await action(`${label}: human enters ${name}`, "NHSBSA", async () => {
      await region.getByRole("textbox", { name, exact: true }).fill(value);
    });
    if (enabled) await action(`${label}: human reconciles declared evidence`, "NHSBSA", async () => {
      await region.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
    });
    await action(`${label}: human confirms capture`, "NHSBSA", async () => {
      await region.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
      await expect(panel()).toBeVisible();
    });
    await sides(label, "in_review");
  }
  await action("Enter the selected same-item demonstration", "Pharmacy", async () => {
    await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
    await strip.getByRole("combobox", { name: "Jump to demo step", exact: true }).selectOption(String(scenario.step));
    await expect(followed).toContainText(`Following ${id}`);
  });
  if (scenario.kind === "unreadable") await action("Prepare D's declared missing-date evidence without submitting", "Pharmacy", async () => {
    if (enabled) await active().getByRole("textbox", { name: "Declared endorsement", exact: true }).fill("NCSO JB");
    else {
      await expect(active().getByRole("textbox", { name: "Declared endorsement", exact: true })).toHaveCount(0);
      await expect(active().getByRole("button", { name: "Post paper", exact: true })).toBeVisible();
    }
  });
  await action("Pharmacy explicitly submits the same item", "Pharmacy", async () => {
    await active().locator('[data-pharmacy-action="submit"]').click();
    const receipt = active().getByRole("region", { name: "Submission receipt", exact: true });
    await expect(receipt).toContainText(`${id}:2`);
    if (scenario.kind === "wrong-pack" && enabled) {
      await expect(receipt.locator("div").filter({ has: page.getByText("Gate 1", { exact: true }) }).last()).toContainText("pass");
      await expect(receipt.locator("div").filter({ has: page.getByText("Gate 2", { exact: true }) }).last()).toContainText("fail");
      await expect(receipt).not.toContainText("released to existing pricing, no operator action");
    }
  });
  if (scenario.kind === "complete") {
    await sides("Automatic completion", enabled ? "released_to_pricing" : "paid");
    await expect(panel().getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    await expect(panel().getByRole("button", { name: "Release to pricing", exact: true })).toHaveCount(0);
    return;
  }
  await sides("Submitted item", "submitted");
  if (scenario.kind === "unreadable") await capture("Initial paper capture", "NCSO JB");
  else {
    await action("Operator starts the current revision's review", "NHSBSA", async () => {
      await panel().getByRole("button", { name: "Start review", exact: true }).click();
    });
    await sides("Operator review", "in_review");
  }
  await expect(panel().getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
  if (enabled) {
    const suggestion = panel().getByRole("region", { name: "Suggestion", exact: true });
    const draftedNote = await suggestion.locator("div").filter({ has: page.getByText("Drafted note", { exact: true }) }).last().locator("dd").innerText();
    await action("Operator applies the suggestion into visible fields only", "NHSBSA", async () => {
      await panel().getByRole("button", { name: "Apply suggestion", exact: true }).click();
      await expect(panel().getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
      await expect(panel().getByRole("combobox", { name: "RB code (required)", exact: true })).toHaveValue(scenario.kind === "missing-date" ? "SYN-NCSO" : "RB2B");
      await expect(panel().getByRole("textbox", { name: "Reason (required)", exact: true })).toHaveValue(draftedNote);
      await expect(panel().getByText("applied by the operator from the agent's suggestion", { exact: true })).toBeVisible();
      await expect(panel().getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    });
    await sides("Suggestion applied, still awaiting decision", "in_review");
  } else {
    await expect(panel().getByRole("region", { name: "Suggestion", exact: true })).toHaveCount(0);
    await action("Operator chooses referral without assistance", "NHSBSA", async () => {
      await panel().getByRole("radio", { name: "Refer back", exact: true }).check();
    });
    await action("Operator selects the actual RB code", "NHSBSA", async () => {
      await panel().getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption(scenario.kind === "missing-date" ? "SYN-NCSO" : "RB2B");
    });
    await action("Operator writes the correction reason", "NHSBSA", async () => {
      await panel().getByRole("textbox", { name: "Reason (required)", exact: true }).fill(
        scenario.kind === "wrong-pack" ? "Confirm and correct the pack size against the supplied item." : "Add the dispensing date beside the NCSO initials.");
    });
  }
  await action("Operator explicitly refers the item back", "NHSBSA", async () => {
    await panel().getByRole("button", { name: "Refer back", exact: true }).click();
  });
  await sides("Referred back", "referred_back");
  await action("Return to the current pharmacy correction", "Pharmacy", async () => {
    await followed.getByRole("button", { name: "Pharmacy view", exact: true }).click();
  });
  const field = scenario.kind === "wrong-pack"
    ? active().getByRole("spinbutton", { name: "Pack size dispensed", exact: true })
    : active().getByRole("textbox", { name: "Corrected endorsement", exact: true });
  const before = await field.inputValue();
  if (enabled) {
    await action("Pharmacy applies the approved supported correction only", "Pharmacy", async () => {
      await active().getByRole("button", { name: "Apply suggested correction", exact: true }).click();
      await expect(field).not.toHaveValue(before);
      await expect(field).toHaveClass(/ring-2/);
      await expect(active()).toContainText("Ready");
      await expect(active().getByRole("button", { name: "Resubmit", exact: true })).toBeVisible();
    });
  } else {
    if (scenario.kind === "unreadable") {
      await action("Pharmacy supplies the known paper product without image inference", "Pharmacy", async () => {
        await active().getByRole("textbox", { name: "Declared product", exact: true }).fill("Co-codamol 30/500 tablets");
      });
      await action("Pharmacy supplies the known paper quantity", "Pharmacy", async () => {
        await active().getByRole("spinbutton", { name: "Declared quantity", exact: true }).fill("100");
      });
    }
    await action("Pharmacy enters the source-supported correction unaided", "Pharmacy", async () => {
      await field.fill(scenario.kind === "wrong-pack" ? String(EPS_SUPPLY_RULE.packSize)
        : scenario.kind === "unreadable" ? "NCSO JB 27/08/26" : "NCSO RK 21/08/26");
    });
  }
  const corrected = await field.inputValue();
  await sides("Correction prepared, not resubmitted", "referred_back");
  await action("Reopen the shared pharmacy draft", "Pharmacy", async () => {
    await followed.getByRole("button", { name: "Pharmacy view", exact: true }).click();
    await expect(field).toHaveValue(corrected);
  });
  await action("Pharmacy explicitly resubmits the corrected revision", "Pharmacy", async () => {
    await active().getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }).click();
  });
  await sides("Resubmitted item", "resubmitted");
  if (scenario.kind === "unreadable") await capture("Corrected paper recheck", corrected);
  else {
    await action("Operator starts the corrected revision recheck", "NHSBSA", async () => {
      await panel().getByRole("button", { name: "Start review", exact: true }).click();
    });
    await sides("Corrected item in review", "in_review");
  }
  if (enabled) await action("Operator applies the checked sufficient recommendation without releasing", "NHSBSA", async () => {
    await panel().getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await expect(panel().getByRole("radio", { name: "Sufficient (human choice)", exact: true })).toBeChecked();
    await expect(panel().getByRole("textbox", { name: "Reason (required)", exact: true })).not.toHaveValue("");
  });
  await action("Operator records the release reason", "NHSBSA", async () => {
    await panel().getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Human recheck confirms the corrected source evidence before release to existing pricing.");
    await expect(panel().getByRole("button", { name: "Release to pricing", exact: true })).toBeEnabled();
  });
  await sides("Valid judgement prepared, not released", "in_review");
  await action("Operator explicitly releases to existing pricing", "NHSBSA", async () => {
    await panel().getByRole("button", { name: "Release to pricing", exact: true }).click();
  });
  await sides("Human release completed", "released_to_pricing", true);
}
