import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import type { Page, TestInfo } from "@playwright/test";
import { captureJson, expect, staticRoutes, test as base } from "./fixtures";
import { PROCESS_MONTH_DEFAULTS } from "../../src/lib/domain/baseline";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";

const hosting = JSON.parse(readFileSync(new URL("../../../hosting.config.json", import.meta.url), "utf8")) as {
  globalHeaders: Record<string, string>;
};

const test = base.extend<{ csp: void }>({
  csp: [async ({ page }, use, info) => {
    const violations: string[] = [];
    await page.exposeFunction("recordPolicyViolation", (value: string) => violations.push(value));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        const report = window as typeof window & { recordPolicyViolation: (value: string) => void };
        report.recordPolicyViolation(`${event.effectiveDirective}: ${event.blockedURI} (${event.sourceFile}:${event.lineNumber})`);
      });
    });
    page.on("response", (response) => {
      if (response.request().resourceType() !== "document") return;
      for (const [header, value] of Object.entries(hosting.globalHeaders)) {
        expect(response.headers()[header.toLowerCase()], header).toBe(value);
      }
    });
    await use();
    await captureJson(info, "csp-violations", violations);
    expect(violations, "Actual hosting policy must not block application controls").toEqual([]);
  }, { auto: true }],
});

test.setTimeout(60_000);

async function audit(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).analyze();
  await captureJson(info, name, results);
  expect(results.violations, JSON.stringify(results.violations.map((v) => ({
    id: v.id, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
  })), null, 2)).toEqual([]);
}

const surfaces = [
  ...["scene", "month", "pipeline", "cases", "two-places", "close"].map((chapter) => [`Overview ${chapter}`, `./#${chapter}`]),
  ["Pharmacy check", "pharmacy"], ["Pharmacy claims", "pharmacy/claims"],
  ["Exception queue", "queue"], ["Case pack", "case/EX-24112"],
  ["How the case was built", "case/EX-24112/trace"], ["Decision record", "case/EX-24088/record"],
] as const;

for (const colorScheme of ["light", "dark"] as const) {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    for (const enabled of [false, true]) {
      test.describe(`final ${colorScheme} motion=${reducedMotion} agent=${enabled}`, () => {
        test.use({ colorScheme, reducedMotion, viewport: { width: 1440, height: 1000 } });
        for (const [name, route] of surfaces) {
          test(`axe ${name}`, async ({ page }, info) => {
            await page.goto(route);
            await page.getByRole("banner").getByRole("switch").setChecked(enabled);
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
            if (enabled && route.endsWith("/trace")) await page.getByRole("button", { name: "Show all", exact: true }).click();
            await audit(page, info, "screen-axe");
          });
        }

        test("axe claim detail and Follow banner", async ({ page }, info) => {
          await page.goto("pharmacy/claims?caseId=EX-24112");
          await page.getByRole("banner").getByRole("switch").setChecked(enabled);
          await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toBeVisible();
          await page.getByRole("button", { name: "Follow this case", exact: true }).press("Enter");
          await expect(page.getByRole("region", { name: "Followed item" })).toBeVisible();
          await audit(page, info, "claim-follow-axe");
          await page.getByRole("link", { name: "Switch side: NHSBSA", exact: true }).press("Enter");
          await expect(page).toHaveURL(/\/case\/EX-24112$/);
          await audit(page, info, "case-follow-axe");
          await page.getByRole("button", { name: "Dismiss followed item" }).press("Enter");
          await expect(page.getByRole("main")).toBeFocused();
        });
      });
    }
  }
}

test("keyboard navigation, menus and tooltip under real CSP", async ({ page }, info) => {
  await page.goto("./#scene");
  await expect(page.getByRole("heading", { level: 1, name: staticRoutes[0].title, exact: true })).toBeFocused();
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.focus();
  await flag.press("Space");
  await expect(flag).toBeChecked();
  await expect(flag).toHaveAccessibleDescription(/Off withholds recommendations/);
  await expect(flag).toHaveAttribute("title", /Off withholds recommendations/);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.goto("./#pipeline");
  const figure = page.getByRole("button", { name: "Monthly referrals: figure context", exact: true });
  await figure.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.getByRole("tooltip").hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(figure).toBeFocused();
  const chapter = page.getByRole("button", { name: "Choose tour chapter" });
  await chapter.press("ArrowDown");
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await audit(page, info, "chapter-menu-axe");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#close$/);
  await expect(page.getByRole("heading", { level: 1, name: "The central bet", exact: true })).toBeFocused();
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(page).toHaveURL(/\/pharmacy\/claims$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pharmacy claims", exact: true })).toBeFocused();
  const operations = page.getByRole("button", { name: "Operations", exact: true });
  await operations.focus();
  await expect(operations).toBeFocused();
  await operations.press("ArrowDown");
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "NHSBSA queue" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitem", { name: "Pharmacy check" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pharmacy pre-submission check", exact: true })).toBeFocused();
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test.describe(`keyboard motion=${reducedMotion}`, () => {
    test.use({ reducedMotion });
    test("reset preserves scroll compensation, containment and focus", async ({ page }, info) => {
      await page.goto("./#month");
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      const before = await page.evaluate(() => ({
        width: document.body.getBoundingClientRect().width,
        overflow: document.body.style.overflow,
        margin: document.body.style.marginRight,
        gap: innerWidth - document.documentElement.clientWidth,
      }));
      for (let repeat = 0; repeat < 2; repeat++) {
        await page.getByRole("button", { name: "Reset demo", exact: true }).press("Enter");
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        for (const surface of [dialog, page.locator('[data-slot="alert-dialog-overlay"]')]) {
          expect(await surface.evaluate((element) => getComputedStyle(element).animationName))
            .toBe(reducedMotion === "reduce" ? "none" : "enter");
        }
        await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");
        const locked = await page.evaluate(() => ({
          width: document.body.getBoundingClientRect().width,
          overflow: getComputedStyle(document.body).overflow,
          gap: parseFloat(document.body.style.getPropertyValue("--removed-body-scroll-bar-size")),
        }));
        expect(locked.overflow).toBe("hidden");
        expect(locked.gap).toBe(before.gap);
        expect(Math.abs(locked.width - before.width)).toBeLessThanOrEqual(1);
        const cancel = dialog.getByRole("button", { name: "Keep working" });
        await expect(cancel).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(dialog.getByRole("button", { name: "Reset demonstration", exact: true })).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(cancel).toBeFocused();
        if (repeat === 0) {
          await audit(page, info, "reset-dialog-axe");
          await page.screenshot({ path: info.outputPath("reset-dialog.png"), fullPage: true });
        }
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
        await expect(page.getByRole("button", { name: "Reset demo", exact: true })).toBeFocused();
        expect(await page.evaluate(() => ({
          overflow: document.body.style.overflow, margin: document.body.style.marginRight,
        }))).toEqual({ overflow: before.overflow, margin: before.margin });
      }
    });

    test("capture timing has keyboard-controlled steps without confirming an item", async ({ page }, info) => {
      await page.goto("queue");
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
      const product = capture.getByRole("textbox", { name: "Product code", exact: true });
      const originalProduct = await product.inputValue();
      const clock = capture.getByRole("status", { name: "Assumed confirmation time", exact: true });
      await expect(clock).toHaveText(`${PROCESS_MONTH_DEFAULTS.type1ConfirmSeconds.toLocaleString("en-GB")} seconds`);
      await capture.getByRole("button", { name: "Restart timing illustration", exact: true }).press("Enter");
      await expect(clock).toHaveText("0 seconds");
      await capture.getByRole("button", { name: "Next timing step", exact: true }).press("Enter");
      await expect(clock).toHaveText(`${(PROCESS_MONTH_DEFAULTS.type1ConfirmSeconds / 2).toLocaleString("en-GB")} seconds`);
      await capture.getByRole("button", { name: "Next timing step", exact: true }).press("Enter");
      await expect(clock).toHaveText(`${PROCESS_MONTH_DEFAULTS.type1ConfirmSeconds.toLocaleString("en-GB")} seconds`);
      await expect(product).toHaveValue(originalProduct);
      await expect(capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true })).not.toBeChecked();
      await expect(capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true })).toBeVisible();
      await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toHaveCount(0);
      await audit(page, info, "capture-timing-axe");
    });

    test("tour dismissal and restoration retain keyboard focus", async ({ page }) => {
      await page.goto("./#scene");
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      const rail = page.getByRole("navigation", { name: "Guided tour", exact: true });
      await page.getByRole("button", { name: "Dismiss tour", exact: true }).press("Enter");
      await expect(rail).toHaveCount(0);
      await expect(page.getByRole("main")).toBeFocused();
      await page.getByRole("button", { name: "Restore tour", exact: true }).press("Enter");
      const chapter = rail.getByRole("button", { name: "Choose tour chapter", exact: true });
      await expect(chapter).toBeFocused();
      await chapter.press("ArrowDown");
      await expect(page.getByRole("menuitem").first()).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(chapter).toBeFocused();
      for (const path of ["/queue", "/pharmacy/claims"] as const) {
        const stop = TOUR_STOPS.find((item) => item.to === path)!;
        await page.goto(path);
        const intro = page.getByRole("region", { name: `Tour chapter ${stop.chapter}`, exact: true });
        await expect(intro.getByRole("heading", { name: `${stop.chapter}. ${stop.label}`, exact: true })).toHaveCount(1);
      }
    });
  });
}
