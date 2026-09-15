import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { enterDesktopDemo } from "./desktop-step-helpers";
import { expectHeaderOutcomeSettled } from "./header-outcome-helpers";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const enabled of [true, false]) test(`final-state audit waits for Outcome ${enabled ? "entry" : "exit"} with ${reducedMotion}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion, colorScheme: "light" });
    await enterDesktopDemo(page, !enabled);
    await expectHeaderOutcomeSettled(page, !enabled);
    const flag = page.getByRole("banner").getByRole("switch");
    // Hold the actual Web Animation, as route-transition-contrast holds CSS frames.
    const transition = await page.evaluateHandle((entering) => {
      const original = Element.prototype.animate;
      const held: Animation[] = [];
      Element.prototype.animate = function (keyframes, options) {
        const animation = original.call(this, keyframes, options);
        if (this.matches("[data-agent-outcome]")) {
          animation.pause();
          animation.currentTime = Number(animation.effect!.getTiming().duration) * (entering ? 0.05 : 0.95);
          held.push(animation);
        }
        return animation;
      };
      return {
        count: () => held.length,
        release: () => {
          Element.prototype.animate = original;
          held.forEach((animation) => animation.play());
        },
      };
    }, enabled);
    try {
      await flag.setChecked(enabled);
      await expect.poll(() => transition.evaluate((value) => value.count())).toBe(1);
      const assisted = page.getByTestId("demo-assisted");
      await expect(assisted).toHaveAttribute("data-readonly", String(!enabled));
      await expect(assisted).toHaveCSS("opacity", "1");
      const frame = await page.locator("[data-agent-outcome]").evaluate((element) => ({
        opacity: Number(getComputedStyle(element).opacity),
        inlineOpacity: element.getAttribute("style"),
        animations: element.getAnimations().map((animation) => ({
          playState: animation.playState, currentTime: animation.currentTime,
          duration: animation.effect?.getTiming().duration,
        })),
      }));
      expect(frame.opacity).toBeGreaterThan(0);
      expect(frame.opacity).toBeLessThan(1);
      expect(frame.animations[0].duration).toBe(reducedMotion === "reduce" ? 100 : 150);
      await captureJson(info, `${enabled ? "entering" : "exiting"}-frame`, frame);

      const during = await new AxeBuilder({ page }).analyze();
      await captureJson(info, "held-frame-axe-negative-control", { violations: during.violations, incomplete: during.incomplete });
      expect(during.violations).toHaveLength(1);
      expect(during.violations[0].id).toBe("color-contrast");
      expect(during.violations[0].nodes.every((node) => node.html.includes("data-outcome-text"))).toBe(true);
      await expect(expectHeaderOutcomeSettled(page, enabled)).rejects.toThrow();
      await transition.evaluate((value) => value.release());
      await expectHeaderOutcomeSettled(page, enabled);
      const result = await new AxeBuilder({ page }).analyze();
      await captureJson(info, `${enabled ? "on" : "off"}-axe`, { violations: result.violations, incomplete: result.incomplete });
      expect(result.violations).toEqual([]);
    } finally {
      await transition.evaluate((value) => value.release());
      await transition.dispose();
    }
  });
}
