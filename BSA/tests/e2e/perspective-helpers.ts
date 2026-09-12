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

export async function perspectiveRoundTrips(page: Page, info: TestInfo) {
  await page.goto("/pharmacy");
  let previousDecision = "";
  let previousEventCount = 0;
  let submittedId = "";
  for (const enabled of [false, true]) {
    await choosePerspective(page, "Pharmacy");
    await navigatePrimary(page, "Pharmacy check");
    await flag(page).setChecked(enabled);
    await page.getByRole("radio", { name: "Information missing", exact: true }).check();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled ? "Information may be missing" : "Not checked: manual submission");
    const endorsement = await page.getByRole("textbox", { name: "Endorsement entered by the pharmacy", exact: true }).inputValue();
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    const submitted = page.getByRole("link", { name: "View submitted claim", exact: true });
    const href = await submitted.getAttribute("href");
    const id = new URL(href!, page.url()).searchParams.get("caseId")!;
    expect(id).toBeTruthy();
    if (submittedId) expect(id).toBe(submittedId);
    submittedId = id;
    await submitted.click();
    await expect(detail(page).getByRole("heading", { level: 2 })).toContainText(id);
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
    await openHistory(page);
    const attempts = await history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).innerText();
    expect(attempts).toContain(endorsement);
    const events = await history(page).getByRole("list", { name: "Lifecycle events", exact: true }).innerText();
    expect(events).toContain("submitted");
    if (previousDecision) {
      expect(events).toContain(previousDecision);
      expect(await history(page).getByRole("list", { name: "Lifecycle events", exact: true }).locator(":scope > li").count()).toBe(previousEventCount + 1);
    }
    await expect(page.getByRole("button", { name: /^Follow this/ })).toHaveCount(0);
    await choosePerspective(page, "NHSBSA");
    await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toBeVisible();
    await expect(flag(page)).toBeChecked({ checked: enabled });
    await expect(page).toHaveURL(new RegExp(`caseId=${id}$`));
    await navigatePrimary(page, "NHSBSA queue");
    const row = page.locator("[data-shared-case]").filter({ hasText: id });
    await expect(row).toContainText(LIFECYCLE_LABELS.submitted.nhsbsa[enabled ? "on" : "off"]);
    await row.getByRole("button", { name: "Open for review", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}$`));
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.in_review.nhsbsa[enabled ? "on" : "off"]);
    await openHistory(page);
    await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true })).toHaveText(attempts);
    const reviewingEvents = await history(page).getByRole("list", { name: "Lifecycle events", exact: true }).innerText();
    expect(reviewingEvents).toContain(events);
    await page.getByRole("radio", { name: /^Refer back / }).check();
    if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
    const reason = `Perspective ${enabled ? "On" : "Off"}: add the dispensing date beside the initials`;
    await page.getByRole("textbox", { name: /^Reason/ }).fill(reason);
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}/record$`));
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.nhsbsa[enabled ? "on" : "off"]);
    await openHistory(page);
    const decisionEvents = history(page).getByRole("list", { name: "Lifecycle events", exact: true });
    const eventCount = await decisionEvents.locator(":scope > li").count();
    const lastDecision = decisionEvents.locator(":scope > li").last();
    const recordId = await lastDecision.locator("dl > div").filter({ has: page.getByText("Attempt / record", { exact: true }) }).locator("dd").innerText();
    expect(recordId).toMatch(/DR-\d+/);
    await expect(lastDecision).toContainText(reason);
    const stableEventFields = await lastDecision.locator("dl > div").filter({ has: page.getByText(/^(Time \/ actor|Transition|Attempt \/ record)$/) }).allTextContents();
    await choosePerspective(page, "Pharmacy");
    await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/case/${id}/record$`));
    await expect(flag(page)).toBeChecked({ checked: enabled });
    await navigatePrimary(page, "Pharmacy claims");
    const claims = page.getByRole("table", { name: "Pharmacy claims", exact: true });
    await claims.getByRole("row").filter({ hasText: id }).getByRole("button").click();
    await expect(detail(page).getByRole("heading", { level: 2 })).toContainText(id);
    await expect(history(page).getByRole("status")).toHaveText(LIFECYCLE_LABELS.referred_back.pharmacy);
    await openHistory(page);
    await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true })).toHaveText(attempts);
    const returnedEvents = history(page).getByRole("list", { name: "Lifecycle events", exact: true });
    await expect(returnedEvents.locator(":scope > li")).toHaveCount(eventCount);
    await expect(returnedEvents.locator(":scope > li").last()).toContainText(recordId);
    expect(await returnedEvents.locator(":scope > li").last().locator("dl > div").filter({ has: page.getByText(/^(Time \/ actor|Transition|Attempt \/ record)$/) }).allTextContents()).toEqual(stableEventFields);
    previousDecision = recordId;
    previousEventCount = eventCount;
    await expect(page.getByRole("navigation", { name: "Guided tour" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Followed item", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Follow this/ })).toHaveCount(0);
    await captureJson(info, `perspective-${enabled ? "on" : "off"}`, { id, endorsement, attempts, recordId, eventCount, stableEventFields, reason });
    await captureCheckpoint(page, info, `perspective-decision-${enabled ? "on" : "off"}`);
  }
}
