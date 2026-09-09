import { cases, expect, test } from "./fixtures";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { REC_META } from "../../src/components/demo/label-meta";

for (const c of cases.slice(0, 3)) {
  test(`gate FAIL withholds ${c.id} advice in queue, pack, trace, human record and replay`, async ({ page }) => {
    const original = CASES.find((item) => item.id === c.id)!;
    const baseline = runAgent(original);
    expect(baseline.gate.result).toBe("PASS");
    let injections = 0;
    // Transform only this synthetic input in the served production bundle.
    // The production gate runs unchanged; no source edits or debug API.
    await page.route("**/BSA/assets/*.js", async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      const pattern = new RegExp(`(id:"${c.id}",scenario:"[ABC]"[\\s\\S]*?prescriber:)"[^"]*"`, "g");
      const matches = [...source.matchAll(pattern)];
      if (!matches.length) {
        await route.fulfill({ response });
        return;
      }
      expect(matches).toHaveLength(1);
      injections++;
      await route.fulfill({ response, body: source.replace(pattern, '$1"Illegible"') });
    });

    await page.goto("queue");
    await expect(page.locator("tbody > tr")).toHaveCount(12);
    expect(injections).toBe(1);
    const row = page.getByRole("row").filter({ hasText: c.id });
    await expect(row.locator("td").nth(3)).toHaveText("No recommendation");
    await expect(row.locator("td").nth(2)).toContainText("findings");
    await row.getByRole("link", { name: "Case pack", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Operator case pack: ${c.title}`);
    await expect(page.getByRole("alert")).toContainText("Recommendation withheld by the compliance gate");
    await expect(page.getByText("FAIL", { exact: true })).toBeVisible();
    await expect(page.getByText("No recommendation", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Draft explanation to the pharmacy" })).toHaveCount(0);
    await expect(page.getByText(/^Alternative considered:/)).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /^Escalate / })).toBeChecked();
    await expect(page.getByRole("radio", { name: /^Accept the recommendation / })).toBeDisabled();
    await expect(page.getByRole("radio", { name: /^Amend / })).toBeDisabled();
    for (const rec of ["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION"] as const) {
      await expect(page.getByText(REC_META[rec].label, { exact: true })).toHaveCount(0);
    }

    const nav = page.getByRole("navigation", { name: "Case views" });
    await nav.getByRole("link", { name: "Case-building trace", exact: true }).click();
    const trace = page.getByRole("list", { name: "Agent trace", exact: true });
    await expect(trace.locator(":scope > li")).toHaveCount(9);
    await expect(trace).toContainText("Proposal withheld by the compliance gate");
    await expect(trace).toContainText("Fail: Mandatory fields present");
    await expect(trace).not.toContainText("Recommend:");
    await expect(trace).not.toContainText("Draft to pharmacy:");
    for (const reason of baseline.reasons) await expect(trace).not.toContainText(reason);
    if (baseline.draftToPharmacy) await expect(trace).not.toContainText(baseline.draftToPharmacy);
    await page.clock.install();
    await page.getByRole("button", { name: "Replay step by step" }).click();
    for (let step = 1; step <= 9; step++) {
      await page.clock.runFor(900);
      await expect(trace.locator(":scope > li")).toHaveCount(step);
      await expect(trace).not.toContainText("Recommend:");
      await expect(trace).not.toContainText("Draft to pharmacy:");
    }

    await nav.getByRole("link", { name: "Operator case pack", exact: true }).click();
    const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
    await expect(reason).toHaveAttribute("aria-required", "true");
    for (const value of ["", "1234567", "   1234567   "]) {
      await reason.fill(value);
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/case/${c.id}$`));
      await expect(page.getByText("A reason is required when you override the recommendation, or when there is no recommendation to accept.").first()).toBeVisible();
    }
    await reason.fill("Review prescriber evidence");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
    await expect(page.getByText("ESCALATE by Demo operator", { exact: false })).toBeVisible();
    await expect(page.getByText("Yes. Reason: Review prescriber evidence", { exact: true })).toBeVisible();
    await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(1);
    for (const month of ["July 2026 (2026-07)", "August 2026 (2026-08)", "September 2026 (2026-09)"]) {
      await page.getByRole("combobox", { name: "Replay with", exact: true }).click();
      await page.getByRole("option", { name: month, exact: true }).click();
      await expect(page.getByText("Recommendation withheld by the compliance gate. Evidence only; gate FAIL.", { exact: true })).toBeVisible();
      await expect(page.getByText("No recommendation", { exact: true })).toHaveCount(3);
      for (const rec of ["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION"] as const) {
        await expect(page.getByText(REC_META[rec].label, { exact: true })).toHaveCount(0);
      }
    }
    await page.getByRole("link", { name: "Back to queue", exact: true }).click();
    await expect(row.locator("td").nth(3)).toHaveText("No recommendation");
    await expect(row.locator("td").nth(5)).toHaveText("Human decision recorded");
    expect(injections).toBe(1);
  });
}