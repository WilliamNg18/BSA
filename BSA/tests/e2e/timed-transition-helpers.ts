import type { Locator, Page, TestInfo } from "@playwright/test";
import { captureJson, expect } from "./fixtures";
import { TransitionDeadline } from "../support/transition-deadline";

async function visibleWithinDeadline(locator: Locator, deadline: TransitionDeadline) {
  await expect(locator).toBeVisible({ timeout: deadline.remainingMs() });
  await expect(locator).toBeInViewport({ ratio: 1, timeout: deadline.remainingMs() });
  await expect.poll(async () => locator.evaluate((element) => {
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      opacity *= Number(style.opacity);
      if (style.visibility !== "visible" || style.display === "none") return false;
    }
    return Number.isFinite(opacity) && opacity >= 0.99;
  }, undefined, { timeout: deadline.remainingMs() }), {
    timeout: deadline.remainingMs(), intervals: [16],
    message: "The observed transition must be painted, not only present in a hidden/fading DOM node.",
  }).toBe(true);
}

export async function assertVisibleHandoffWithinOneSecond(
  page: Page,
  info: TestInfo,
  input: {
    name: string;
    action: Locator;
    followedId: string;
    destination: "Pharmacy" | "NHSBSA";
    originState: string;
    originRequiredText?: { locator: Locator; text: string }[];
    destinationState: Locator;
    destinationText: string;
    stateMatch?: "exact" | "contains";
    queue?: { link: Locator; tile: Locator; expectedTileText: string; select?: Locator; expand?: Locator };
    requiredText?: { locator: Locator; text: string }[];
    lastEventText: string;
  },
) {
  await expect(input.action).toBeVisible();
  await expect(input.action).toBeEnabled();
  if (input.queue && input.destination !== "NHSBSA") throw new Error("Queue timing requires the NHSBSA destination.");
  const followed = page.getByRole("region", { name: "Followed item", exact: true });
  await expect(followed).toContainText(input.followedId);
  const priorEvent = await followed.locator("p").first().innerText();
  const deadline = new TransitionDeadline();
  const milestones: { label: string; elapsedMs: number }[] = [];
  let observedElapsedMs: number | null = null;
  try {
    await input.action.click({ timeout: deadline.remainingMs() });
    milestones.push({ label: "actual human action completed", elapsedMs: deadline.elapsedMs() });
    await visibleWithinDeadline(followed, deadline);
    await expect(followed).toContainText(input.originState, { timeout: deadline.remainingMs() });
    await visibleWithinDeadline(followed.locator("p").first(), deadline);
    await expect(followed.locator("p").first()).not.toHaveText(priorEvent, { timeout: deadline.remainingMs() });
    await expect(followed.locator("p").first()).toContainText(input.lastEventText, { timeout: deadline.remainingMs() });
    for (const requirement of input.originRequiredText ?? []) {
      await visibleWithinDeadline(requirement.locator, deadline);
      await expect(requirement.locator).toContainText(requirement.text, { timeout: deadline.remainingMs() });
    }
    await followed.getByRole("button", { name: `${input.destination} view`, exact: true })
      .click({ timeout: deadline.remainingMs() });
    await expect(page).toHaveURL((url) => input.destination === "Pharmacy"
      ? url.pathname === "/pharmacy/claims" && (url.searchParams.get("case") ?? url.searchParams.get("caseId")) === input.followedId
      : url.pathname === `/case/${encodeURIComponent(input.followedId)}`, { timeout: deadline.remainingMs() });
    if (input.queue) {
      await input.queue.link.click({ timeout: deadline.remainingMs() });
      await expect(page).toHaveURL((url) => url.pathname === "/queue", { timeout: deadline.remainingMs() });
      await visibleWithinDeadline(input.queue.tile, deadline);
      await expect(input.queue.tile).toContainText(input.queue.expectedTileText, { timeout: deadline.remainingMs() });
      if (input.queue.select) await input.queue.select.click({ timeout: deadline.remainingMs() });
      if (input.queue.expand) await input.queue.expand.click({ timeout: deadline.remainingMs() });
    }
    await visibleWithinDeadline(input.destinationState, deadline);
    if (input.stateMatch === "contains") await expect(input.destinationState).toContainText(input.destinationText, { timeout: deadline.remainingMs() });
    else await expect(input.destinationState).toHaveText(input.destinationText, { timeout: deadline.remainingMs() });
    for (const requirement of input.requiredText ?? []) {
      await visibleWithinDeadline(requirement.locator, deadline);
      await expect(requirement.locator).toContainText(requirement.text, { timeout: deadline.remainingMs() });
    }
    await expect(followed).toContainText(input.followedId, { timeout: deadline.remainingMs() });
    observedElapsedMs = deadline.finish();
    milestones.push({ label: "actual destination and required reason visible", elapsedMs: observedElapsedMs });
  } finally {
    const elapsedMs = observedElapsedMs ?? deadline.elapsedMs();
    const failureGeometry = observedElapsedMs === null
      ? await input.destinationState.evaluateAll((elements) => elements.map((element) => {
        const ancestors = [];
        for (let node: Element | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          ancestors.push({
            tag: node.tagName, id: node.id, className: node.getAttribute("class"),
            rect: node.getBoundingClientRect().toJSON(),
            overflowX: style.overflowX, overflowY: style.overflowY, opacity: style.opacity,
            clientWidth: node.clientWidth, clientHeight: node.clientHeight,
            scrollLeft: node.scrollLeft, scrollTop: node.scrollTop,
          });
        }
        return { viewport: { width: innerWidth, height: innerHeight }, ancestors };
      }))
      : undefined;
    await captureJson(info, `timing-${input.name}`, {
      name: input.name, caseId: input.followedId, budgetMs: 1000,
      elapsedMs,
      status: observedElapsedMs === null ? "FAIL" : "PASS",
      milestones, url: page.url(),
      clock: "Node monotonic wall-clock, independent of the controlled domain timestamp",
      startsBefore: "Actual human button click; includes visible origin and destination assertions and Follow navigation",
      visibility: "Viewport intersection and cumulative ancestor opacity, not DOM text alone",
      priorEvent,
      failureGeometry,
      geometryBoundary: failureGeometry ? "Read only after the outcome; not used to establish latency or change the verdict." : undefined,
    });
  }
}
