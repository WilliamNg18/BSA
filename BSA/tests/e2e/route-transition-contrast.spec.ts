import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { captureJson, expect, test } from "./fixtures";

const hosting = JSON.parse(readFileSync(new URL("../../../hosting.config.json", import.meta.url), "utf8")) as {
  globalHeaders: Record<string, string>;
};
const routeSelector = 'main [class*="motion-safe:slide-in-from-bottom-"]';

for (const colorScheme of ["light", "dark"] as const) {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    for (const enabled of [false, true]) {
      test.describe(`route contrast ${colorScheme} motion=${reducedMotion} agent=${enabled}`, () => {
        test.use({ colorScheme, reducedMotion, viewport: { width: 1440, height: 1000 } });
        for (const frameTime of [0, 75, 135, 150]) test(`text retains contrast at ${frameTime}ms and Follow navigation`, async ({ page }, info) => {
          const csp: string[] = [];
          await page.exposeFunction("reportTransitionPolicyViolation", (directive: string) => csp.push(directive));
          await page.addInitScript((selector) => {
            document.addEventListener("securitypolicyviolation", (event) => {
              const reporter = window as typeof window & { reportTransitionPolicyViolation: (value: string) => void };
              reporter.reportTransitionPolicyViolation(`${event.effectiveDirective}: ${event.blockedURI}`);
            });
            // Hold the real CSS animation, not a replacement style. This also
            // catches the remounted route before a fast machine finishes it.
            new MutationObserver(() => {
              for (const element of document.querySelectorAll(selector)) {
                for (const animation of element.getAnimations()) {
                  if (animation.playState === "running") animation.pause();
                }
              }
            }).observe(document, { childList: true, subtree: true });
          }, routeSelector);

          const response = await page.goto("pharmacy/claims?caseId=EX-24112");
          for (const [name, value] of Object.entries(hosting.globalHeaders)) {
            expect(response!.headers()[name.toLowerCase()], name).toBe(value);
          }
          await page.getByRole("banner").getByRole("switch").setChecked(enabled);
          await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toBeVisible();
          await page.getByRole("button", { name: "Follow this case", exact: true }).press("Enter");
          await expect(page.getByRole("region", { name: "Followed item", exact: true })).toBeVisible();

          const frames = [];
          for (const route of ["claim", "case"] as const) {
            if (route === "case") {
              await page.getByRole("button", { name: "NHSBSA view", exact: true }).press("Enter");
              await expect(page).toHaveURL(/\/case\/EX-24112$/);
              await expect(page.getByRole("heading", { level: 1 })).toContainText("Operator case pack");
            }
            for (const time of route === "claim" ? frameTime === 75 ? [75] : [] : [frameTime]) {
              const frame = await page.locator(routeSelector).evaluate((element, time) => {
                const animations = element.getAnimations();
                for (const animation of animations) {
                  animation.pause();
                  animation.currentTime = time;
                }
                const style = getComputedStyle(element);
                return {
                  time, opacity: style.opacity, transform: style.transform,
                  animations: animations.map((animation) => ({
                    duration: animation.effect?.getTiming().duration,
                    keyframes: (animation.effect as KeyframeEffect).getKeyframes(),
                  })),
                };
              }, time);
              expect(frame.opacity, `${route} opacity at ${time}ms`).toBe("1");
              if (reducedMotion === "reduce") {
                expect(frame.animations).toHaveLength(0);
                expect(frame.transform).toBe("none");
              } else {
                expect(frame.animations).toHaveLength(1);
                expect(frame.animations[0].duration).toBe(150);
                if (time < 150) expect(frame.transform).not.toBe("none");
                else expect(frame.transform).toBe("none");
              }
              const audit = await new AxeBuilder({ page }).analyze();
              await captureJson(info, `${route}-${time}-axe`, audit);
              frames.push({ route, ...frame });
              expect(audit.violations, JSON.stringify(audit.violations)).toEqual([]);
            }
          }
          await captureJson(info, "route-frames", frames);
          await captureJson(info, "csp-violations", csp);
          expect(csp).toEqual([]);
          await page.getByRole("button", { name: "Dismiss followed item", exact: true }).press("Enter");
          await expect(page.getByRole("main")).toBeFocused();
        });
      });
    }
  }
}
