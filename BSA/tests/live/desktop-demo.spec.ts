import { audit, captureJson, expect, test } from "./fixtures";
import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { assertDesktopHeader, assertDesktopStep, enterDesktopDemo, walkDesktopSteps } from "../e2e/desktop-step-helpers";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";
import { desktopNavigationTitle, desktopStepTitle } from "./inventory";
import { runGuidedReferralHandoff } from "../e2e/demo-story-helpers";

for (const step of DEMO_STEPS) for (const enabled of DEMO_MODES) {
  test(desktopStepTitle(step.number, enabled), async ({ page }, info) => {
    await enterDesktopDemo(page, enabled);
    for (let number = 2; number <= step.number; number++) {
      await page.getByTestId("demo-strip").getByRole("button", { name: "Next", exact: true }).click();
    }
    await assertDesktopStep(page, step.number, enabled);
    await assertDesktopHeader(page, 1440);
    await audit(page, info, `desktop-step-${String(step.number).padStart(2, "0")}`, enabled);
    expect(await page.evaluate(() => Reflect.has(window, "__BSA_READ_DOMAIN_STATE__")),
      "The ordinary served application must not expose instrumented domain state").toBe(false);
  });
}

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(desktopNavigationTitle(width, enabled), async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await enterDesktopDemo(page, enabled);
    const visited: { number: number; direction: string; url: string }[] = [];
    await walkDesktopSteps(page, enabled, async (number, direction) => {
      await assertDesktopHeader(page, width);
      visited.push({ number, direction, url: page.url() });
    });
    expect(visited.filter((entry) => entry.direction === "next").map((entry) => entry.number)).toEqual(DEMO_STEPS.map((entry) => entry.number));
    expect(visited.filter((entry) => entry.direction === "back").map((entry) => entry.number)).toEqual([...DEMO_STEPS].reverse().slice(1).map((entry) => entry.number));
    await captureJson(info, "ordered-desktop-navigation", { width, enabled, visited, screenshots: "Step images are captured separately at 1440 px only." });
    if (width === 1440 && enabled) {
      await runGuidedReferralHandoff(page);
      await audit(page, info, "guided-operator-to-pharmacy-handoff", true);
    }
  });
}
