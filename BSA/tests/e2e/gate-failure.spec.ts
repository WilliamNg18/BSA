import { expect, test } from "./fixtures";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { REC_META } from "../../src/components/demo/label-meta";
import { injectPrescriberFault } from "../support/prescriber-fault";
import { cases, operatorAction, operatorAdvice, operatorDecision, operatorRadio, performDecision, startDemonstrationReview } from "./operator-action-helpers";

for (const c of cases.filter((item) => item.id === "EX-24112")) {
  test(`gate FAIL withholds ${c.id} advice in queue, pack, trace, human record and replay`, async ({ page }) => {
    const original = CASES.find((item) => item.id === c.id)!;
    const baseline = runAgent(original);
    expect(baseline.gate.result).toBe("PASS");
    let injections = 0;
    // Transform only this synthetic input in the served production bundle.
    // The production gate runs unchanged; no source edits or debug API.
    await page.route("**/assets/*.js", async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      const fault = injectPrescriberFault(source, c.id, original.extracted.prescriber);
      if (!fault.injections) {
        await route.fulfill({ response });
        return;
      }
      expect(fault.injections).toBe(1);
      injections += fault.injections;
      await route.fulfill({ response, body: fault.source });
    });

    await startDemonstrationReview(page);
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    expect(injections).toBe(1);
    const row = page.locator(`[data-case-id="${c.id}"]`);
    await page.getByRole("button", { name: /^Type 2 worklist\s+\d+$/ }).click();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Evidence assembled; unresolved facts remain");
    await row.getByRole("link", { name: `Open ${c.id}`, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Operator case pack: ${c.title}`);
    await expect(page.getByRole("alert")).toContainText("Recommendation withheld by the compliance gate");
    await expect(page.getByText("Gate: FAIL", { exact: true })).toBeVisible();
    const recommendation = operatorAdvice(page);
    await expect(recommendation.getByText("NONE; FAIL", { exact: true })).toBeVisible();
    await expect(recommendation.getByText("Operator draft preview", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Draft explanation to the pharmacy" })).toHaveCount(0);
    await expect(page.getByText(/^Alternative considered:/)).toHaveCount(0);
    await expect(operatorDecision(page).getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(operatorAction(page, "ACCEPT")).toBeDisabled();
    await expect(operatorAdvice(page).getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    for (const rec of ["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION"] as const) {
      await expect(page.getByText(REC_META[rec].label, { exact: true })).toHaveCount(0);
    }

    const nav = page.getByRole("navigation", { name: "Case views" });
    await nav.getByRole("link", { name: "Case-building trace", exact: true }).click();
    const trace = page.getByRole("list", { name: "Agent trace", exact: true });
    await expect(trace.locator(":scope > li")).toHaveCount(9);
    await expect(page.locator("[data-assisted-slot]")).toHaveCount(4);
    for (const slot of ["Clause", "Requirements", "Alternative", "Confidence"]) await expect(page.locator(`[data-assisted-slot="${slot}"]`)).toContainText("Withheld: gate FAIL");
    await expect(trace).toContainText("Proposal withheld by the compliance gate");
    await expect(trace).toContainText("Fail: Mandatory fields present");
    await expect(trace).not.toContainText("Recommend:");
    await expect(trace).not.toContainText("Draft to pharmacy:");
    for (const reason of baseline.reasons) await expect(trace).not.toContainText(reason);
    if (baseline.draftToPharmacy) await expect(trace).not.toContainText(baseline.draftToPharmacy);
    await page.clock.install();
    await page.getByRole("button", { name: "Replay step by step" }).click();
    for (let step = 1; step <= 9; step++) {
      if (step > 1) await page.getByRole("button", { name: "Next step", exact: true }).click();
      await expect(trace.locator(":scope > li")).toHaveCount(step);
      await expect(trace).not.toContainText("Recommend:");
      await expect(trace).not.toContainText("Draft to pharmacy:");
    }

    await nav.getByRole("link", { name: "Operator case pack", exact: true }).click();
    await operatorRadio(page, "ESCALATE").check();
    const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
    await expect(reason).toHaveAttribute("aria-required", "true");
    for (const value of ["", "1234567", "   1234567   "]) {
      await reason.fill(value);
      await operatorAction(page, "ESCALATE").click();
      await expect(page).toHaveURL(new RegExp(`/case/${c.id}$`));
      await expect(operatorDecision(page).getByRole("alert")).toHaveText("Enter a reason of at least eight characters.");
    }
    await reason.fill("Review prescriber evidence");
    await performDecision(page, "ESCALATE");
    await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
    await expect(page.locator("dl > div").filter({ has: page.getByText("Human decision", { exact: true }) }).locator("dd")).toContainText("ESCALATE by Demo operator");
    await expect(page.getByText("No. Note: Review prescriber evidence", { exact: true })).toBeVisible();
    await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
    await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toHaveCount(0);
    for (const label of ["Rule version used", "Clause recorded"]) {
      await expect(page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd")).toHaveText("Not recorded");
    }
    for (const rec of ["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION"] as const) {
      await expect(page.getByText(REC_META[rec].label, { exact: true })).toHaveCount(0);
    }
    await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    await page.getByRole("button", { name: /^Type 2 worklist\s+\d+$/ }).click();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Awaiting senior review");
    await expect(row).toContainText("Human reason retained; no rule and reason recorded together");
    expect(injections).toBe(1);
  });
}