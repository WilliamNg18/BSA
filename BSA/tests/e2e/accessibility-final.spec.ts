import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import type { Page, TestInfo } from "@playwright/test";
import { captureJson, expect, test as base } from "./fixtures";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";

const hosting = JSON.parse(readFileSync(new URL("../../../staticwebapp.config.json", import.meta.url), "utf8")) as {
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

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const enabled of [false, true]) {
    test.describe(`phone pack motion=${reducedMotion} agent=${enabled}`, () => {
      test.use({ reducedMotion, colorScheme: "dark", viewport: { width: 360, height: 900 } });
      for (const id of ["EX-24107", "EX-24112", "EX-24119", "EX-24123", "EX-24101", "EX-24088"]) {
        test(`axe and reflow ${id}`, async ({ page }, info) => {
          await page.goto(`case/${id}`);
          await page.getByRole("banner").getByRole("switch").setChecked(enabled);
          if (enabled) await page.getByRole("button", { name: "Show all", exact: true }).press("Enter");
          await audit(page, info, "phone-pack-axe");
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          // System-font metrics differ on Linux; enlarged text also forces the
          // historical replay link to wrap instead of widening the page.
          await page.evaluate(() => { document.documentElement.style.fontSize = "18px"; });
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          if (id !== "EX-24123") {
            const replay = page.getByRole("link", { name: "Open pharmacy claim for another attempt", exact: true });
            const bounds = await replay.boundingBox();
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
            await replay.press("Enter");
            await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toBeVisible();
          }
        });
      }
    });
  }
}

test("keyboard navigation, menus and tooltip under real CSP", async ({ page }, info) => {
  await page.goto("./#scene");
  const flag = page.getByRole("banner").getByRole("switch");
  await flag.focus();
  await flag.press("Space");
  await expect(flag).toBeChecked();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  const chapter = page.getByRole("button", { name: "Choose tour chapter" });
  await chapter.press("ArrowDown");
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await audit(page, info, "chapter-menu-axe");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#close$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(page).toHaveURL(/\/pharmacy\/claims$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  const operations = page.getByRole("button", { name: "Operations", exact: true });
  await operations.press("ArrowDown");
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "NHSBSA queue" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitem", { name: "Pharmacy check" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
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

    test("simulation and sweep have keyboard-controlled motion alternatives", async ({ page }, info) => {
      await page.goto("queue");
      await page.getByRole("banner").getByRole("switch").setChecked(true);
      const clock = page.getByRole("status", { name: "Shared day clock" });
      await expect(clock).toHaveText("08:00");
      await page.getByRole("button", { name: "Step 15 minutes", exact: true }).press("Enter");
      await expect(clock).toHaveText("08:15");
      const play = page.getByRole("button", { name: "Play day", exact: true });
      if (reducedMotion === "reduce") await expect(play).toBeDisabled();
      else {
        await play.press("Space");
        await page.getByRole("button", { name: "Pause day", exact: true }).press("Space");
        await expect(play).toBeEnabled();
      }
      await page.getByRole("button", { name: "Jump to 17:00", exact: true }).press("Enter");
      await expect(clock).toHaveText("17:00");
      await page.getByRole("button", { name: "Restart day", exact: true }).press("Enter");
      await expect(clock).toHaveText("08:00");
      // Scroll to actual seed rows before starting the viewport-scoped sweep.
      await page.locator("[data-queue-seed]").first().scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: "Sweep visible rows", exact: true }).first().press("Enter");
      await expect(page.locator("[data-sweep-status]")).not.toHaveText("No sweep");
      if (reducedMotion === "reduce") {
        const initial = await page.locator("[data-sweep-status]").textContent();
        await page.getByRole("button", { name: "Step sweep", exact: true }).press("Enter");
        await expect(page.locator("[data-sweep-status]")).not.toHaveText(initial!);
      }
      await page.getByRole("button", { name: "Cancel sweep", exact: true }).press("Enter");
      await expect(page.locator("[data-sweep-status]")).toHaveText("No sweep");
      await audit(page, info, "simulation-axe");
    });

    test("mobile navigation sheet retains focus and scroll lock", async ({ page }, info) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("./#scene");
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
      await trigger.press("Enter");
      const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
      await expect(sheet).toBeVisible();
      await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");
      await audit(page, info, "mobile-navigation-axe");
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
      await trigger.press("Enter");
      await sheet.getByRole("link", { name: "Pharmacy claims", exact: true }).press("Enter");
      await expect(page).toHaveURL(/\/pharmacy\/claims$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      await expect(sheet).toHaveCount(0);
      await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
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

for (const colorScheme of ["light", "dark"] as const) {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    for (const enabled of [false, true]) {
      test.describe(`mobile claims ${colorScheme} motion=${reducedMotion} agent=${enabled}`, () => {
        test.use({ colorScheme, reducedMotion, viewport: { width: 360, height: 900 } });
        for (const [state, labels] of Object.entries(LIFECYCLE_LABELS)) {
          test(`axe list and action panel ${state}`, async ({ page }, info) => {
            await page.goto("pharmacy/claims");
            await page.getByRole("banner").getByRole("switch").setChecked(enabled);
            const filter = page.getByRole("combobox", { name: "Claim state", exact: true });
            // Native selection is keyboard-operated, not assigned through the DOM.
            await filter.focus();
            await filter.press("Home");
            const index = Object.keys(LIFECYCLE_LABELS).indexOf(state);
            for (let i = 0; i <= index; i++) await filter.press("ArrowDown");
            await filter.press("Enter");
            await expect(filter).toHaveValue(state);
            await audit(page, info, "claims-list-axe");
            await page.getByRole("list", { name: "Pharmacy claims", exact: true }).getByRole("button").first().press("Enter");
            const detail = page.getByRole("region", { name: "Claim detail", exact: true });
            await expect(detail.getByRole("heading", { level: 2 })).toBeFocused();
            await expect(detail.getByRole("status").first()).toHaveText(labels.pharmacy);
            if (enabled && state === "referred_back") {
              await detail.getByRole("button", { name: "Re-check endorsement", exact: true }).press("Enter");
            }
            await page.getByRole("region", { name: "Shared case history", exact: true }).locator("summary").first().press("Enter");
            await audit(page, info, "claims-detail-axe");
            expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
            if (state === "referred_back") {
              const endorsement = detail.getByRole("textbox", { name: "Corrected endorsement", exact: true });
              await endorsement.focus();
              await endorsement.press("End");
              await page.keyboard.type(" 2025-08-12");
              await detail.getByRole("button", { name: "Resubmit claim", exact: true }).press("Enter");
              await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
            } else if (state === "information_requested") {
              const confirmation = detail.getByRole("textbox", { name: "Pharmacy confirmation", exact: true });
              await confirmation.focus();
              await page.keyboard.type("Synthetic clarification: please re-check both quantities.");
              await detail.getByRole("button", { name: "Send confirmation", exact: true }).press("Enter");
              await expect(detail.getByRole("status").first()).toHaveText(LIFECYCLE_LABELS.resubmitted.pharmacy);
            }
          });
        }
      });
    }
  }
}
