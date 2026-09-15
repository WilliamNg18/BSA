import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { decisionNote, operatorAction, operatorRadio, startDemonstrationReview } from "./operator-action-helpers";
import { assertVisibleHandoffWithinOneSecond } from "./timed-transition-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

for (const width of [1280, 1440]) {
  test(`received pharmacy confirmation and actual state are visible on case entry within one second at ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await startDemonstrationReview(page, "EX-24112", true);
    await page.getByRole("region", { name: "Shared case history", exact: true })
      .getByRole("button", { name: "Follow this case", exact: true }).click();
    await operatorRadio(page, "REQUEST_INFORMATION").check();
    await decisionNote(page, "REQUEST_INFORMATION").fill("Please confirm the current synthetic evidence for EX-24112.");
    await operatorAction(page, "REQUEST_INFORMATION").click();
    await page.getByRole("region", { name: "Followed item", exact: true })
      .getByRole("button", { name: "Pharmacy view", exact: true }).click();
    const answer = "The pharmacy confirms its recorded evidence for EX-24112; a human must reconcile it.";
    await page.getByRole("textbox", { name: "Confirm", exact: true }).fill(answer);
    const state = page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status");
    const confirmation = page.getByRole("region", { name: "Pharmacy confirmation", exact: true }).getByText(answer, { exact: true });
    try {
      await assertVisibleHandoffWithinOneSecond(page, info, {
        name: `EX-24112-both-on-send-confirmation-${width}`,
        action: page.getByRole("button", { name: "Send confirmation", exact: true }),
        followedId: "EX-24112", destination: "NHSBSA",
        originState: LIFECYCLE_LABELS.resubmitted.pharmacy,
        destinationState: state, destinationText: LIFECYCLE_LABELS.resubmitted.nhsbsa.on,
        requiredText: [{ locator: confirmation, text: answer }],
        lastEventText: "Verification recorded",
      });
    } finally {
      await captureJson(info, `case-entry-geometry-${width}`, {
        state: await state.boundingBox(), confirmation: await confirmation.boundingBox(),
        viewport: page.viewportSize(), scrollY: await page.evaluate(() => window.scrollY),
      });
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.getByRole("region", { name: "Recommendation", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    const reason = decisionNote(page);
    await reason.fill("The operator is reviewing the new confirmation.");
    await expect(reason).toBeFocused();
    await expect(reason).toHaveValue("The operator is reviewing the new confirmation.");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
