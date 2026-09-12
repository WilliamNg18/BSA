import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { choosePerspective, flag, perspectiveGuard, perspectiveRoundTrips } from "./perspective-helpers";

test("Pharmacy submit to NHSBSA decision to Pharmacy same decision, Off then On without Reset", async ({ page }, info) => {
  await perspectiveRoundTrips(page, info);
});

test("caught-before-submission records only a completed human-applied correction", async ({ page }) => {
  await page.goto("/pharmacy");
  await choosePerspective(page, "Pharmacy");
  await flag(page).setChecked(true);
  const endorsement = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy", exact: true });
  const metric = page.getByRole("region", { name: "Selected pharmacy this month", exact: true })
    .locator("dl > div").filter({ hasText: "Caught before submission" }).getByRole("definition");
  await endorsement.fill("NCSO RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("0");
  await navigatePrimary(page, "Pharmacy check");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
  await page.getByRole("button", { name: "Apply correction", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("1");
  await navigatePrimary(page, "Pharmacy check");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
  await page.getByRole("button", { name: "Apply correction", exact: true }).click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("1");
  await confirmReset(page);
  await flag(page).setChecked(true);
  await expect(metric).toHaveText("0");
});

for (const cancellation of ["edit", "scenario", "Agent Off", "leave page", "Reset", "submit"] as const) {
  test(`unfinished correction evidence is cancelled by ${cancellation}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install();
    await page.goto("/pharmacy");
    await choosePerspective(page, "Pharmacy");
    await flag(page).setChecked(true);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
    await page.clock.pauseAt(new Date());
    await page.getByRole("button", { name: "Apply correction", exact: true }).click();
    if (cancellation === "edit") await page.getByRole("textbox", { name: "Endorsement entered by the pharmacy", exact: true }).fill("NCSO XY 21/08/26");
    if (cancellation === "scenario") await page.getByRole("radio", { name: "Complete endorsement", exact: true }).check();
    if (cancellation === "Agent Off") await flag(page).setChecked(false);
    if (cancellation === "leave page") await navigatePrimary(page, "Pharmacy claims");
    if (cancellation === "Reset") await confirmReset(page);
    if (cancellation === "submit") await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    await page.clock.runFor(3000);
    await navigatePrimary(page, "Pharmacy claims");
    await flag(page).setChecked(true);
    const metric = page.getByRole("region", { name: "Selected pharmacy this month", exact: true })
      .locator("dl > div").filter({ hasText: "Caught before submission" }).getByRole("definition");
    await expect(metric).toHaveText("0");
  });
}

for (const width of [360, 768, 1024, 1440, 1920]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`perspective header, filtered navigation and zero-violation axe ${width} ${colorScheme}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/");
      const header = page.getByRole("banner");
      const group = header.getByRole("group", { name: "Perspective", exact: true });
      await expect(group.getByRole("radio", { name: "Both", exact: true })).toBeChecked();
      for (const perspective of ["Pharmacy", "NHSBSA", "Both"] as const) {
        await choosePerspective(page, perspective);
        await flag(page).setChecked(perspective !== "Pharmacy");
        const controls = [group, flag(page), header.getByRole("button", { name: "Reset demo", exact: true })];
        for (const control of controls) {
          const box = await control.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        }
        const groupBox = await group.boundingBox();
        const flagBox = await flag(page).boundingBox();
        expect(groupBox!.x + groupBox!.width).toBeLessThanOrEqual(flagBox!.x);
        expect(await header.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
        const nav = page.getByRole("navigation", { name: "Primary", exact: true });
        const mobile = nav.getByRole("button", { name: "Open navigation", exact: true });
        const mobileNavigation = await mobile.isVisible();
        await (mobileNavigation ? mobile : nav.getByRole("button", { name: "Operations", exact: true })).click();
        const expected = perspective === "Pharmacy" ? ["Pharmacy check", "Pharmacy claims"] : perspective === "NHSBSA" ? ["NHSBSA queue"] : ["Pharmacy check", "Pharmacy claims", "NHSBSA queue"];
        const menu = mobileNavigation ? page.getByRole("dialog", { name: "Navigation", exact: true }).getByRole("region", { name: "Operations", exact: true }).getByRole("link") : page.getByRole("menuitem");
        await expect(menu).toHaveText(expected);
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(page.getByRole("menu")).toHaveCount(0);
        await navigatePrimary(page, "Evaluation");
        await expect(group.getByRole("radio", { name: perspective, exact: true })).toBeChecked();
        await expect(page.getByRole("navigation", { name: "Guided tour" })).toHaveCount(perspective === "Both" ? 1 : 0);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await captureCheckpoint(page, info, `perspective-${perspective.toLowerCase()}-${width}-${colorScheme}`);
        const headerPath = info.outputPath(`header-${perspective.toLowerCase()}-${width}-${colorScheme}.png`);
        await header.screenshot({ path: headerPath });
        await info.attach("Perspective header", { path: headerPath, contentType: "image/png" });
      }
    });
  }
}

for (const width of [360, 768]) for (const colorScheme of ["light", "dark"] as const) {
  test(`document reflow for every perspective and Agent mode ${width} ${colorScheme}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/evaluation");
    await page.evaluate(() => document.fonts.ready);
    for (const side of ["Pharmacy", "NHSBSA", "Both"] as const) for (const enabled of [false, true]) {
      await choosePerspective(page, side);
      await flag(page).setChecked(enabled);
      const layout = await page.evaluate(() => ({
        viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
        overflow: Array.from(document.querySelectorAll("body *")).flatMap((element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > innerWidth + 1 ? [{
            tag: element.tagName, class: element.getAttribute("class"), right: rect.right, width: rect.width,
            text: element.textContent?.slice(0, 100),
          }] : [];
        }),
      }));
      await captureJson(info, `reflow-${side}-${enabled}`, layout);
      expect(layout.document).toBeLessThanOrEqual(width);
      expect(layout.body).toBeLessThanOrEqual(width);
      const radio = page.getByRole("group", { name: "Perspective", exact: true }).getByRole("radio", { name: side, exact: true });
      await radio.focus();
      await expect(radio).toBeFocused();
      const box = (await radio.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(2);
      expect(box.x + box.width).toBeLessThanOrEqual(width - 2);
    }
  });
}

test("native perspective keyboard, Reset retention and suspended tour shortcuts", async ({ page }) => {
  await page.goto("/#scene");
  const both = page.getByRole("radio", { name: "Both", exact: true });
  await both.focus();
  await both.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "NHSBSA", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "NHSBSA", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "Pharmacy", exact: true })).toBeChecked();
  await flag(page).setChecked(true);
  await confirmReset(page);
  await expect(page.getByRole("radio", { name: "Pharmacy", exact: true })).toBeChecked();
  await expect(flag(page)).not.toBeChecked();
  await expect(page.getByRole("navigation", { name: "Guided tour" })).toHaveCount(0);
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/#scene$/);
  await choosePerspective(page, "Both");
  await page.getByRole("button", { name: "Dismiss tour", exact: true }).click();
  await choosePerspective(page, "NHSBSA");
  await expect(page.getByRole("button", { name: "Restore tour", exact: true })).toHaveCount(0);
  await choosePerspective(page, "Both");
  await page.getByRole("button", { name: "Restore tour", exact: true }).click();
  await expect(page.getByRole("button", { name: "Choose tour chapter", exact: true })).toBeFocused();
});

test("single perspectives suspend Follow without forgetting the followed item", async ({ page }) => {
  await page.goto("/#cases");
  await page.locator('[data-case="B"]').getByRole("button", { name: "Follow this item", exact: true }).click();
  const followed = page.getByRole("region", { name: "Followed item", exact: true });
  await expect(followed).toContainText("Following EX-24112");
  for (const side of ["Pharmacy", "NHSBSA"] as const) {
    await choosePerspective(page, side);
    await expect(followed).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Switch side", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /following this item|Follow this item/ })).toHaveCount(0);
  }
  await choosePerspective(page, "Both");
  await expect(followed).toContainText("Following EX-24112");
  await expect(page.locator('[data-case="B"]').getByRole("button", { name: "Stop following this item", exact: true })).toHaveAttribute("aria-pressed", "true");
  await followed.getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
  await expect(page).toHaveURL(/\/case\/EX-24112$/);
  await expect(followed).toContainText("Following EX-24112");
});

test("browser history into the hidden side remains a recoverable view, not an error", async ({ page }) => {
  await page.goto("/case/EX-24112/trace");
  await navigatePrimary(page, "Pharmacy check");
  await choosePerspective(page, "Pharmacy");
  await page.goBack();
  await expect(page).toHaveURL(/\/case\/EX-24112\/trace$/);
  await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Switch to NHSBSA", exact: true }).click();
  await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/case\/EX-24112\/trace$/);
});

for (const path of ["/pharmacy", "/pharmacy/claims?caseId=EX-24112", "/queue", "/case/EX-24112", "/case/EX-24112/trace", "/case/EX-24112/record", "/queue/", "/Queue", "/Pharmacy", "/Pharmacy/Claims/", "/CASE/EX-24112/trace"]) {
  test(`opposite-side URL guard preserves ${path} and explicitly restores its view`, async ({ page }) => {
    await page.goto(path);
    const wrong = path.toLowerCase().startsWith("/pharmacy") ? "NHSBSA" : "Pharmacy";
    const right = wrong === "Pharmacy" ? "NHSBSA" : "Pharmacy";
    await flag(page).setChecked(true);
    await choosePerspective(page, wrong);
    await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new URL(path, page.url()).href);
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    await expect(page.locator("[data-tour-prose]")).toHaveCount(0);
    await page.getByRole("button", { name: `Switch to ${right}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: perspectiveGuard, exact: true })).toHaveCount(0);
    await expect(flag(page)).toBeChecked();
    const restoredHeading = path.includes("?caseId=")
      ? page.getByRole("heading", { name: "Claim detail: EX-24112", exact: true })
      : page.getByRole("main").getByRole("heading", { level: 1 });
    await expect(restoredHeading).toBeFocused();
    const disallowed = right === "Pharmacy" ? /^\/(?:queue|case\/)/ : /^\/pharmacy(?:\/|$)/;
    const links = await page.getByRole("main").getByRole("link").evaluateAll((elements) => elements.map((element) => element.getAttribute("href") ?? ""));
    expect(links.filter((href) => disallowed.test(href))).toEqual([]);
    await expect(page.getByRole("button", { name: /^Follow this/ })).toHaveCount(0);
  });
}

for (const hash of ["scene", "month", "pipeline", "cases", "two-places", "close"]) {
  test(`overview ${hash} has no accidental cross-side actions`, async ({ page }) => {
    await page.goto(`/#${hash}`);
    for (const side of ["Pharmacy", "NHSBSA"] as const) {
      await choosePerspective(page, side);
      for (const enabled of [false, true]) {
        await flag(page).setChecked(enabled);
        const disallowed = side === "Pharmacy" ? /^\/(?:queue|case\/)/ : /^\/pharmacy(?:\/|$)/;
        const links = await page.getByRole("main").locator("a").evaluateAll((elements) => elements.map((element) => element.getAttribute("href") ?? ""));
        expect(links.filter((href) => disallowed.test(href))).toEqual([]);
        await expect(page.getByRole("button", { name: /^Follow this/ })).toHaveCount(0);
      }
    }
  });
}
