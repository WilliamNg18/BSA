import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, navigatePrimary, test } from "./fixtures";
import { selectEpsScenario } from "./operator-action-helpers";
import { assertVisibleHandoffWithinOneSecond } from "./timed-transition-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

for (const width of [1280, 1440]) {
  test(`B On Both reaches the actual visible queue row within the original one-second budget at ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/pharmacy/claims?caseId=EX-24112");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await page.getByRole("region", { name: "Shared case history", exact: true })
      .getByRole("button", { name: "Follow this case", exact: true }).click();
    const followed = page.getByRole("region", { name: "Followed item", exact: true });
    await followed.getByRole("button", { name: "Pharmacy view", exact: true }).click();
    await navigatePrimary(page, "Pharmacy check");
    await selectEpsScenario(page, "EX-24112");
    const tile = page.getByRole("region", { name: "Actual session work counts", exact: true })
      .getByRole("button", { name: /^Type 2 worklist/ });
    const state = page.locator('[data-case-id="EX-24112"] [data-item-state]');
    try {
      await assertVisibleHandoffWithinOneSecond(page, info, {
      name: `EX-24112-both-on-send-post-${width}`,
      action: page.locator('[data-pharmacy-action="submit"]'),
      followedId: "EX-24112",
      destination: "NHSBSA",
      originState: LIFECYCLE_LABELS.submitted.pharmacy,
      originRequiredText: [{
        locator: page.getByRole("region", { name: "Submission receipt", exact: true }).getByText("EX-24112:2", { exact: true }),
        text: "EX-24112:2",
      }],
      queue: {
        link: page.getByRole("link", { name: "Back to queue", exact: true }),
        tile: tile.locator("span").last(), expectedTileText: "2", select: tile,
      },
      destinationState: state, destinationText: LIFECYCLE_LABELS.submitted.nhsbsa.on,
      stateMatch: "contains", lastEventText: "Verification recorded",
      });
    } finally {
      const geometry = await state.evaluateAll((elements) => elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        const ancestors = [];
        for (let parent = element.parentElement; parent && parent.tagName !== "BODY"; parent = parent.parentElement) {
          const box = parent.getBoundingClientRect();
          const style = getComputedStyle(parent);
          ancestors.push({ tag: parent.tagName, y: box.y, height: box.height, overflowX: style.overflowX, overflowY: style.overflowY });
        }
        return { text: element.textContent, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
          viewport: { width: innerWidth, height: innerHeight }, scrollY, focused: element === document.activeElement, ancestors };
      }));
      await captureJson(info, `queue-state-geometry-${width}`, geometry);
    }
    await expect(state).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked();
    await expect(followed).toContainText("EX-24112");
    const captureFilter = page.getByRole("region", { name: "Actual session work counts", exact: true })
      .getByRole("button", { name: /^Type 1 capture lane/ });
    await captureFilter.click();
    await expect(captureFilter).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-case-id="EX-24112"]')).toHaveCount(0);
    await tile.click();
    await expect(state).toBeFocused();
    await expect(state).toBeInViewport({ ratio: 1 });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("a mounted followed capture moves to its real Type 2 lane without retaining the old filter", async ({ page }) => {
  await page.goto("/case/EX-24123");
  await page.getByRole("region", { name: "Shared case history", exact: true })
    .getByRole("button", { name: "Follow this case", exact: true }).click();
  await page.getByRole("link", { name: "Back to queue", exact: true }).click();
  const counts = page.getByRole("region", { name: "Actual session work counts", exact: true });
  await expect(counts.getByRole("button", { name: /^Type 1 capture lane/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true })
    .getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await expect(counts.getByRole("button", { name: /^Type 2 worklist/ })).toHaveAttribute("aria-pressed", "true");
  const state = page.locator('[data-case-id="EX-24123"] [data-item-state]');
  await expect(state).toBeFocused();
  await expect(state).toBeInViewport({ ratio: 1 });
  await expect(page.locator('[data-type1-case="EX-24123"]')).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Followed item", exact: true })).toContainText("EX-24123");
});
