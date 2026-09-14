import type { Page, TestInfo } from "@playwright/test";
import { captureCheckpoint, captureJson, expect, navigatePrimary } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

export const perspectiveGuard = "This view belongs to the other side; switch perspective to see it";
export const flag = (page: Page) => page.getByRole("banner").getByRole("switch");
export const history = (page: Page) => page.getByRole("region", { name: "Shared case history", exact: true });
export const detail = (page: Page) => page.getByRole("region", { name: "Claim detail", exact: true });

export async function choosePerspective(page: Page, label: "Pharmacy" | "NHSBSA" | "Both") {
  const control = page.getByRole("group", { name: "Perspective", exact: true }).getByRole("radio", { name: label, exact: true });
  await control.check();
  await expect(control).toBeChecked();
}

export async function openHistory(page: Page) {
  const disclosure = history(page).locator("details").filter({ has: page.locator("summary", { hasText: /^History and attempts/ }) }).first();
  if (await disclosure.getAttribute("open") === null) await disclosure.locator(":scope > summary").click();
}

export async function historyIdentity(page: Page) {
  return history(page).getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li").evaluateAll((items) => items.map((item) => ({
    fields: Array.from(item.querySelectorAll("dl > div"))
      .filter((field) => ["Time / actor", "Attempt / record"].includes(field.querySelector("dt")?.textContent ?? ""))
      .map((field) => field.textContent),
    message: item.querySelector(":scope > p")?.textContent,
  })));
}

export async function perspectiveRoundTrips(page: Page, info: TestInfo) {
  await page.goto("/pharmacy");
  let previousDecision = "";
  let previousEventCount = 0;
  let previousIdentity: Awaited<ReturnType<typeof historyIdentity>> = [];
  let submittedId = "";
  for (const enabled of [false, true]) {
    await choosePerspective(page, "Pharmacy");
    await navigatePrimary(page, "Pharmacy check");
    await flag(page).setChecked(enabled);
    const missingDate = page.getByRole("radio", { name: "NCSO missing date", exact: true });
    await missingDate.click();
    await expect(missingDate).toBeChecked();
    await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24112");
    await expect(page.getByRole("radio", { name: "EPS", exact: true })).toBeChecked();
    await expect(page).toHaveURL(/\/pharmacy$/);
    if (enabled) await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
    else await expect(page.getByRole("region", { name: "Claims precheck", exact: true })).toHaveCount(0);
    const endorsement = await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).inputValue();
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
    await expect(receipt).toContainText(`EX-24112:${enabled ? 3 : 2}`);
    await receipt.getByText("Recorded submission", { exact: true }).click();
    await expect(receipt).toContainText(endorsement);
    const submitted = receipt.getByRole("link", { name: "View submitted claim", exact: true });
    const href = await submitted.getAttribute("href");
    const id = new URL(href!, page.url()).searchParams.get("caseId")!;
    expect(id).toBe("EX-24112");
    if (submittedId) expect(id).toBe(submittedId);
    submittedId = id;
    await submitted.click();
    await expect(detail(page).getByRole("heading", { name: `Claim detail: ${id}`, exact: true })).toBeVisible();
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await openHistory(page);
    const attempts = await history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).textContent();
    expect(attempts).toContain(endorsement);
    const events = await history(page).getByRole("list", { name: "Lifecycle events", exact: true }).innerText();
    expect(events).toContain(LIFECYCLE_LABELS.submitted.pharmacy);
    const submittedIdentity = await historyIdentity(page);
    if (previousDecision) {
      expect(events).toContain(previousDecision);
      expect(submittedIdentity.slice(0, previousIdentity.length)).toEqual(previousIdentity);
      // Verification is a code receipt, never an operator decision.
      expect(submittedIdentity).toHaveLength(previousEventCount + (enabled ? 2 : 1));
    }
    const submissionEvents = submittedIdentity.slice(enabled ? -2 : -1);
    expect(submissionEvents[0].fields[0]).toContain("pharmacy");
    expect(submissionEvents[0].message).toBe("Explicit demo submission; previous revisions retained.");
    if (enabled) {
      expect(submissionEvents[1].fields[0]).toContain("code");
      expect(submissionEvents[1].fields[1]).toContain("No decision record");
    }
    if (!enabled) await history(page).getByRole("button", { name: "Follow this case", exact: true }).click();
    await expect(history(page).getByRole("button", { name: "Stop following this case", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: "Followed item", exact: true })).toContainText(id);
    await choosePerspective(page, "NHSBSA");
    await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toBeVisible();
    await expect(flag(page)).toBeChecked({ checked: enabled });
    await expect(page).toHaveURL(new RegExp(`caseId=${id}$`));
    await navigatePrimary(page, "NHSBSA queue");
    const row = page.locator(`[data-case-id="${id}"]`);
    await expect(row).toContainText("New submission");
    await row.getByRole("link", { name: `Open ${id}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.nhsbsa[enabled ? "on" : "off"]);
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.in_review.nhsbsa[enabled ? "on" : "off"]);
    await openHistory(page);
    expect(await history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).textContent()).toBe(attempts);
    const reviewingIdentity = await historyIdentity(page);
    expect(reviewingIdentity.slice(0, submittedIdentity.length)).toEqual(submittedIdentity);
    expect(reviewingIdentity.slice(submittedIdentity.length).map((event) => event.message)).toEqual(enabled
      ? ["Arrived for review.", "Scripted case built; human decision required."]
      : ["Arrived for review."]);
    const operator = page.getByRole("region", { name: "Operator decision", exact: true });
    if (enabled) {
      await operator.getByRole("button", { name: "Apply suggestion", exact: true }).click();
      await expect(operator.locator("[data-suggestion-applied]")).toBeVisible();
    } else {
      await operator.getByRole("radio", { name: "Refer back", exact: true }).check();
      await operator.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
      await operator.getByRole("textbox", { name: "Reason (required)", exact: true })
        .fill("Perspective Off: add the dispensing date beside the initials");
    }
    const reason = await operator.getByRole("textbox", { name: "Reason (required)", exact: true }).inputValue();
    await expect(operator.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    const beforeDecision = await historyIdentity(page);
    expect(beforeDecision.slice(0, reviewingIdentity.length)).toEqual(reviewingIdentity);
    expect(beforeDecision).toHaveLength(reviewingIdentity.length + (enabled ? 1 : 0));
    if (enabled) expect(beforeDecision.at(-1)!.message).toBe("Applied by the operator from the agent's suggestion.");
    await operator.getByRole("button", { name: "Refer back", exact: true }).click();
    await operator.getByRole("link", { name: "Open audit record", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}/record$`));
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.nhsbsa[enabled ? "on" : "off"]);
    await openHistory(page);
    const decisionEvents = history(page).getByRole("list", { name: "Lifecycle events", exact: true });
    const eventCount = await decisionEvents.locator(":scope > li").count();
    const lastDecision = decisionEvents.locator(":scope > li").last();
    const recordId = await lastDecision.locator("dl > div").filter({ has: page.getByText("Attempt / record", { exact: true }) }).locator("dd").innerText();
    expect(recordId).toMatch(/DR-\d+/);
    await expect(lastDecision).toContainText(reason);
    const stableEvents = await historyIdentity(page);
    expect(stableEvents.slice(0, beforeDecision.length)).toEqual(beforeDecision);
    expect(stableEvents).toHaveLength(beforeDecision.length + 1);
    expect(stableEvents.at(-1)!.fields[0]).toContain("operator");
    await expect(lastDecision).toContainText(`${LIFECYCLE_LABELS.in_review.nhsbsa[enabled ? "on" : "off"]} → ${LIFECYCLE_LABELS.referred_back.nhsbsa[enabled ? "on" : "off"]}`);
    await choosePerspective(page, "Pharmacy");
    await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/case/${id}/record$`));
    await expect(flag(page)).toBeChecked({ checked: enabled });
    await navigatePrimary(page, "Pharmacy claims");
    const claims = page.getByRole("table", { name: "Pharmacy claims", exact: true });
    await claims.getByRole("row").filter({ hasText: id }).getByRole("button").click();
    await expect(detail(page).getByRole("heading", { name: `Claim detail: ${id}`, exact: true })).toBeVisible();
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
    await openHistory(page);
    expect(await history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).textContent()).toBe(attempts);
    const returnedEvents = history(page).getByRole("list", { name: "Lifecycle events", exact: true });
    await expect(returnedEvents.locator(":scope > li")).toHaveCount(eventCount);
    await expect(returnedEvents.locator(":scope > li").last()).toContainText(recordId);
    expect(await historyIdentity(page)).toEqual(stableEvents);
    await expect(returnedEvents.locator(":scope > li").last()).toContainText(`${LIFECYCLE_LABELS.in_review.pharmacy} → ${LIFECYCLE_LABELS.referred_back.pharmacy}`);
    previousDecision = recordId;
    previousEventCount = eventCount;
    previousIdentity = stableEvents;
    await expect(page.getByRole("navigation", { name: "Guided tour" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Followed item", exact: true })).toContainText(id);
    await expect(history(page).getByRole("button", { name: "Stop following this case", exact: true })).toHaveAttribute("aria-pressed", "true");
    for (const side of ["Pharmacy", "NHSBSA"]) {
      await expect(page.getByRole("region", { name: "Followed item", exact: true })
        .getByRole("button", { name: `${side} view`, exact: true })).toBeVisible();
    }
    await captureJson(info, `perspective-${enabled ? "on" : "off"}`, { id, endorsement, attempts, recordId, eventCount, stableEvents, reason });
    await captureCheckpoint(page, info, `perspective-decision-${enabled ? "on" : "off"}`);
  }
}
