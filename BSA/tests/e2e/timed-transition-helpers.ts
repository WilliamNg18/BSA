import type { Locator, Page, TestInfo } from "@playwright/test";
import { captureJson, expect } from "./fixtures";
import { TransitionDeadline } from "../support/transition-deadline";

export async function assertVisibleHandoffWithinOneSecond(
  page: Page,
  info: TestInfo,
  input: {
    name: string;
    action: Locator;
    followedId: string;
    destination: "Pharmacy" | "NHSBSA";
    originState: string;
    destinationState: Locator;
    destinationText: string;
    requiredText?: { locator: Locator; text: string }[];
    lastEventText: string;
  },
) {
  await expect(input.action).toBeVisible();
  await expect(input.action).toBeEnabled();
  const followed = page.getByRole("region", { name: "Followed item", exact: true });
  await expect(followed).toContainText(input.followedId);
  const deadline = new TransitionDeadline();
  const milestones: { label: string; elapsedMs: number }[] = [];
  try {
    await input.action.click({ timeout: deadline.remainingMs() });
    milestones.push({ label: "actual human action completed", elapsedMs: deadline.elapsedMs() });
    await expect(followed).toContainText(input.originState, { timeout: deadline.remainingMs() });
    await expect(followed.locator("p").first()).toContainText(input.lastEventText, { timeout: deadline.remainingMs() });
    await followed.getByRole("button", { name: `${input.destination} view`, exact: true })
      .click({ timeout: deadline.remainingMs() });
    await expect(input.destinationState).toHaveText(input.destinationText, { timeout: deadline.remainingMs() });
    for (const requirement of input.requiredText ?? []) {
      await expect(requirement.locator).toContainText(requirement.text, { timeout: deadline.remainingMs() });
    }
    await expect(followed).toContainText(input.followedId, { timeout: deadline.remainingMs() });
    milestones.push({ label: "actual destination and required reason visible", elapsedMs: deadline.finish() });
  } finally {
    await captureJson(info, `timing-${input.name}`, {
      name: input.name, caseId: input.followedId, budgetMs: 1000,
      elapsedMs: deadline.elapsedMs(), milestones, url: page.url(),
      clock: "Node monotonic wall-clock, independent of the controlled domain timestamp",
      startsBefore: "Actual human button click; includes visible origin and destination assertions and Follow navigation",
    });
  }
}
