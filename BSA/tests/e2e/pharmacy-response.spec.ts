import type { Page } from "@playwright/test";
import { captureJson, expect, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
const response = (page: Page) => page.getByRole("region", { name: "Operator response", exact: true });
const events = (page: Page) => history(page).getByRole("list", { name: "Lifecycle events", exact: true });

async function verifyPharmacyModes(page: Page, reason: string, approvedText?: string) {
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.setChecked(false);
  await history(page).locator("summary").first().click();
  await expect(response(page)).toContainText(reason);
  await expect(events(page)).toContainText(reason);
  const originalHistory = await history(page).innerText();
  const originalState = await history(page).getByRole("status").innerText();
  const originalAttempts = await history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).innerText();

  await flag.setChecked(true);
  await expect(page.getByRole("main")).not.toContainText(reason);
  await expect(history(page).getByRole("status")).toHaveText(originalState);
  await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" })).toHaveText(originalAttempts, { useInnerText: true });
  const approved = response(page).getByRole("region", { name: "Operator-approved pharmacy note", exact: true });
  if (approvedText) {
    await expect(approved).toContainText(approvedText);
    await expect(approved).toContainText("Operator-approved note");
    await expect(events(page)).toContainText(approvedText);
    await expect(events(page)).toContainText("Operator-approved note");
  } else {
    await expect(approved).toHaveCount(0);
    await expect(response(page)).toContainText("No operator-approved draft. Enabling assistance does not approve a note.");
    await expect(events(page)).toContainText("No operator-approved note recorded.");
  }

  await flag.setChecked(false);
  await expect(history(page)).toHaveText(originalHistory, { useInnerText: true });
  await expect(response(page)).toContainText(reason);
  await expect(approved).toHaveCount(0);
}

for (const [id, reason] of [
  ["EX-24112", "Endorsement initialled but not dated."],
  ["EX-24119", "Confirm the conflicting quantities; do not choose one automatically."],
] as const) {
  test(`seeded ${id} pharmacy reasons remain manual through Off On Off`, async ({ page }, info) => {
    await page.goto(`pharmacy/claims?caseId=${id}`);
    await verifyPharmacyModes(page, reason);
    await captureJson(info, "seeded-manual-history-preserved", await history(page).innerText());
  });
}

for (const id of ["EX-24112", "EX-24119"]) {
  for (const mode of ["manual", "unapproved", "approved"] as const) {
    test(`new ${id} ${mode} response never promotes the human reason to an approved note`, async ({ page }, info) => {
      await page.goto(`case/${id}`);
      await startDemonstrationReview(page);
      const enabled = mode !== "manual";
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await page.getByRole("radio", { name: id === "EX-24112" ? /^Refer back / : /^Request information / }).check();
      if (id === "EX-24112") await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
      let approvedText: string | undefined;
      if (enabled) {
        const approval = page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true });
        await expect(approval).not.toBeChecked();
        if (mode === "approved") {
          approvedText = await page.locator('[data-prose="pharmacy draft"] blockquote').innerText();
          await approval.check();
        }
      }
      const reason = `Internal operator rationale for ${id} ${mode}, not the pharmacy draft`;
      await page.getByRole("textbox", { name: /^Reason/ }).fill(reason);
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await expect(page).toHaveURL(/\/record$/);
      await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
      await verifyPharmacyModes(page, reason, approvedText);
      await captureJson(info, "new-response-history-preserved", await history(page).innerText());
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      await history(page).getByRole("link", { name: "View NHSBSA case", exact: true }).click();
      await history(page).locator("summary").first().click();
      await expect(events(page)).toContainText(reason);
      await expect(events(page)).toContainText("Human reason");
    });
  }
}
