import type { Page } from "@playwright/test";
import { captureJson, expect, test } from "./fixtures";
import { startBReviewFromPharmacy } from "./pharmacy-scenario-helpers";
import { decisionNote, operatorAdvice, operatorRadio, performDecision } from "./operator-action-helpers";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";

const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
const response = (page: Page) => page.getByRole("region", { name: "Operator response", exact: true });
const events = (page: Page) => history(page).getByRole("list", { name: "Lifecycle events", exact: true });

async function verifyPharmacyModes(page: Page, reason: string, correctionExpected: boolean, approvedText?: string) {
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.setChecked(false);
  await history(page).locator("summary").first().click();
  await expect(response(page)).toContainText(reason);
  await expect(events(page)).toContainText(reason);
  const originalHistory = await history(page).innerText();
  const originalState = await history(page).getByRole("status").innerText();
  const originalAttempts = await history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).innerText();
  const eventRows = events(page).locator(":scope > li");
  const originalEvents = await eventRows.allTextContents();
  const decisionIndex = originalEvents.map((event) => event.includes(reason)).lastIndexOf(true);
  expect(decisionIndex, "The actual latest decision reason is present in Off history").toBeGreaterThanOrEqual(0);
  const currentEvent = eventRows.nth(decisionIndex);

  await flag.setChecked(true);
  await expect(eventRows).toHaveCount(originalEvents.length);
  await expect(history(page).getByRole("status")).toHaveText(originalState);
  await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" })).toHaveText(originalAttempts, { useInnerText: true });
  const approved = response(page).getByRole("region", { name: "Operator-approved pharmacy note", exact: true });
  await expect(response(page)).not.toContainText("Exact fix");
  await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(correctionExpected ? 1 : 0);
  if (approvedText) {
    await expect(approved).toContainText(approvedText);
    await expect(approved).toContainText("Operator-approved note");
    await expect(currentEvent).toContainText(approvedText);
    await expect(currentEvent).toContainText("Operator-approved note");
  } else {
    await expect(response(page)).toContainText(reason);
    await expect(response(page)).toContainText("Human decision reason");
    await expect(approved).toHaveCount(0);
    await expect(response(page)).toContainText("No operator-approved draft.");
    await expect(currentEvent).toContainText("No operator-approved note recorded.");
  }

  await flag.setChecked(false);
  await expect(history(page)).toHaveText(originalHistory, { useInnerText: true });
  await expect(response(page)).toContainText(reason);
  await expect(approved).toHaveCount(0);
}

test("seeded EX-24112 prior referral stays historical while corrected paper awaits release through Off On Off", async ({ page }, info) => {
  await page.goto("pharmacy/claims?caseId=EX-24112");
  await history(page).locator("summary").first().click();
  const originalHistory = await history(page).innerText();
  const attempts = history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true });
  const originalAttempts = await attempts.innerText();
  const messages = events(page).locator(":scope > li > p");
  const originalMessages = await messages.allTextContents();
  const priorReferral = buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]);
  for (const enabled of [false, true, false]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expect(history(page).getByRole("status")).toHaveText("Resubmitted, ready to release");
    await expect(attempts).toHaveText(originalAttempts, { useInnerText: true });
    await expect(messages).toHaveText(originalMessages);
    if (!enabled) await expect(history(page)).toHaveText(originalHistory, { useInnerText: true });
    await expect(events(page)).toContainText(priorReferral);
    await expect(events(page)).toContainText("Acknowledged paper amendment resubmitted; operator release remains required.");
    await expect(response(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Resubmit/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply suggested correction", exact: true })).toHaveCount(0);
  }
  await captureJson(info, "seeded-referral-and-ready-paper-history-preserved", originalHistory);
});

// C/F are now fixed background. The live information-request contract is exercised on B below.
for (const id of ["EX-24119", "EX-24088"]) {
  test(`background ${id} stays unclickable through Off On Off`, async ({ page }, info) => {
    await page.goto(`pharmacy/claims?caseId=${id}`);
    const background = page.getByRole("rowgroup", { name: "Historical cases, background", exact: true });
    const original = await background.innerText();
    const flag = page.getByRole("banner").getByRole("switch");
    for (const enabled of [false, true, false]) {
      await flag.setChecked(enabled);
      await expect(background).toHaveText(original, { useInnerText: true });
      await expect(background).toContainText(id);
      await expect(background).toContainText("Background only, not playable");
      await expect(background.getByRole("link")).toHaveCount(0);
      await expect(background.getByRole("button")).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Resubmit/ })).toHaveCount(0);
    }
    await captureJson(info, "background-not-promoted-to-live-claim", original);
  });
}

for (const kind of ["referral", "information request"] as const) {
  const id = "EX-24112";
  for (const mode of ["manual", "unapproved", "approved"] as const) {
    test(`new ${id} ${kind} ${mode} never promotes the human reason to an approved note`, async ({ page }, info) => {
      await page.goto(`case/${id}`);
      await startBReviewFromPharmacy(page);
      const enabled = mode !== "manual";
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      const outcome = kind === "referral" ? "REFER_BACK" : "REQUEST_INFORMATION";
      await operatorRadio(page, outcome).check();
      if (kind === "referral") await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("RB2B");
      let approvedText: string | undefined;
      const internalReason = `Internal operator rationale for ${id} ${kind} ${mode}, not the pharmacy draft`;
      await decisionNote(page, outcome).fill(internalReason);
      if (mode === "approved") {
        await operatorAdvice(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
        await expect(operatorRadio(page, "REFER_BACK")).toBeChecked();
        if (kind === "referral") approvedText = await decisionNote(page).inputValue();
        else {
          // B has referral advice, not C's retired information-request fixture.
          await operatorRadio(page, "REQUEST_INFORMATION").check();
          await decisionNote(page, "REQUEST_INFORMATION").fill(internalReason);
        }
      }
      const reason = approvedText ?? internalReason;
      await performDecision(page, outcome);
      if (approvedText) await expect(page.getByRole("main")).not.toContainText(internalReason);
      await page.getByRole("link", { name: "View pharmacy claim", exact: true }).click();
      await verifyPharmacyModes(page, reason, kind === "referral", approvedText);
      if (mode === "approved" && kind === "information request") {
        await expect(response(page).getByRole("region", { name: "Operator-approved pharmacy note", exact: true })).toHaveCount(0);
      }
      await captureJson(info, "new-response-history-preserved", await history(page).innerText());
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      await history(page).getByRole("link", { name: "View NHSBSA case", exact: true }).click();
      await history(page).locator("summary").first().click();
      await expect(events(page)).toContainText(reason);
      await expect(events(page)).toContainText("Human reason");
    });
  }
}
