import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { choosePerspective, flag, history, historyIdentity, openHistory, perspectiveGuard, perspectiveRoundTrips } from "./perspective-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

test("Pharmacy submit to NHSBSA decision to Pharmacy same decision, Off then On without Reset", async ({ page }, info) => {
  await perspectiveRoundTrips(page, info);
});

test("caught-before-submission records only a completed human-applied correction", async ({ page }) => {
  await page.goto("/pharmacy");
  await choosePerspective(page, "Pharmacy");
  await flag(page).setChecked(true);
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24112");
  const metric = page.getByRole("region", { name: "Selected pharmacy this month", exact: true })
    .locator(":scope > dl > div").filter({ has: page.getByText("Caught before submission", { exact: true }) })
    .getByRole("definition");
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("0");
  await navigatePrimary(page, "Pharmacy check");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
  await page.locator('[data-pharmacy-action="apply-correction"]').click();
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("1");
  await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
    .filter({ hasText: "EX-24112" }).getByRole("button").click();
  await openHistory(page);
  await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).locator(":scope > li")).toHaveCount(1);
  for (let visit = 0; visit < 2; visit++) {
    await navigatePrimary(page, "Pharmacy check");
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
    await expect(page.locator('[data-pharmacy-action="apply-correction"]')).toHaveCount(0);
    await navigatePrimary(page, "Pharmacy claims");
    await expect(metric).toHaveText("1");
    await flag(page).setChecked(false);
    await expect(metric).toHaveCount(0);
    await flag(page).setChecked(true);
    await expect(metric).toHaveText("1");
  }
  await confirmReset(page);
  await flag(page).setChecked(true);
  await expect(metric).toHaveText("0");
});

test("shared human edits persist; recorded releases count only explicit verified submissions", async ({ page }) => {
  await page.goto("/pharmacy");
  await choosePerspective(page, "Pharmacy");
  await flag(page).setChecked(true);
  const endorsement = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
  const metric = page.locator("[data-pharmacy-released-count]");
  await endorsement.fill("NCSO RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("0");
  await navigatePrimary(page, "Pharmacy check");
  await expect(endorsement).toHaveValue("NCSO RK 21/08/26");
  await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready");
  await expect(page.locator('[data-pharmacy-action="apply-correction"]')).toHaveCount(0);
  await expect(metric).toHaveText("0");
  await page.locator('[data-pharmacy-action="submit"]').click();
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("released to existing pricing, no operator action");
  await expect(metric).toHaveText("1");
  await page.locator('[data-pharmacy-action="submit"]').click();
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("EX-24112:3");
  await navigatePrimary(page, "Pharmacy claims");
  await expect(metric).toHaveText("1");
  await confirmReset(page);
  await flag(page).setChecked(true);
  await expect(metric).toHaveText("0");
});

for (const boundary of ["edit", "scenario", "Agent Off", "leave page", "Reset", "submit"] as const) {
  test(`applied correction has durable evidence and no implicit submission across ${boundary}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install({ time: new Date("2026-09-12T12:00:00Z") });
    await page.goto("/pharmacy");
    await choosePerspective(page, "Pharmacy");
    await flag(page).setChecked(true);
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information missing");
    const seed = await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).inputValue();
    await page.locator('[data-pharmacy-action="apply-correction"]').click();
    await expect(page.getByRole("textbox", { name: "Dispenser endorsement", exact: true })).toHaveValue(/21\/08\/26$/);
    await expect(page.locator("[data-pharmacy-released-count]")).toHaveText("0");
    if (boundary === "edit") await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO XY 21/08/26");
    if (boundary === "scenario") {
      await page.getByRole("radio", { name: "Complete endorsement", exact: true }).check();
      await page.getByRole("radio", { name: "NCSO missing date", exact: true }).check();
      await expect(page.getByRole("textbox", { name: "Dispenser endorsement", exact: true })).toHaveValue(/21\/08\/26$/);
    }
    if (boundary === "Agent Off") await flag(page).setChecked(false);
    if (boundary === "leave page") await navigatePrimary(page, "Pharmacy claims");
    if (boundary === "Reset") await confirmReset(page);
    if (boundary === "submit") await page.locator('[data-pharmacy-action="submit"]').click();
    await page.clock.runFor(3000);
    await navigatePrimary(page, "Pharmacy claims");
    await flag(page).setChecked(true);
    await expect(page.locator("[data-pharmacy-released-count]")).toHaveText(boundary === "submit" ? "1" : "0");
    await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
    await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
      .filter({ hasText: "EX-24112" }).getByRole("button").click();
    await openHistory(page);
    const events = await historyIdentity(page);
    expect(events.filter((event) => event.message === "Suggested correction applied by the pharmacy to a new submission draft; not sent.")).toHaveLength(boundary === "Reset" ? 0 : 1);
    await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li")).toHaveCount(boundary === "submit" ? 2 : 1);
    await expect(history(page).getByRole("list", { name: "Immutable pharmacy attempts" }).locator(":scope > li").first()
      .locator("dl > div").filter({ has: page.getByText("Endorsement snapshot", { exact: true }) }).locator("dd")).toHaveText(seed);
    await expect(history(page).getByRole("status")).toHaveText(boundary === "submit" ? LIFECYCLE_LABELS.released_to_pricing.pharmacy : LIFECYCLE_LABELS.referred_back.pharmacy);
  });
}

for (const width of [1280, 1440]) {
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
        await nav.getByRole("button", { name: "Operations", exact: true }).click();
        const expected = perspective === "Pharmacy" ? ["Pharmacy check", "Pharmacy claims"] : perspective === "NHSBSA" ? ["NHSBSA queue"] : ["Pharmacy check", "Pharmacy claims", "NHSBSA queue"];
        const menu = page.getByRole("menuitem");
        await expect(menu).toHaveText(expected);
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(page.getByRole("menu")).toHaveCount(0);
        await navigatePrimary(page, "Evaluation");
        await expect(group.getByRole("radio", { name: perspective, exact: true })).toBeChecked();
        await expect(page.getByRole("navigation", { name: "Guided tour" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Enter demo mode", exact: true })).toBeVisible();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        if (width === 1440) {
          await captureCheckpoint(page, info, `perspective-${perspective.toLowerCase()}-${width}-${colorScheme}`);
          const headerPath = info.outputPath(`header-${perspective.toLowerCase()}-${width}-${colorScheme}.png`);
          await header.screenshot({ path: headerPath });
          await info.attach("Perspective header", { path: headerPath, contentType: "image/png" });
        }
      }
    });
  }
}

test("native perspective keyboard, Reset retention and explicit demo shortcuts", async ({ page }) => {
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
  await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
  await choosePerspective(page, "NHSBSA");
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "2");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
  await choosePerspective(page, "Both");
  await page.getByRole("button", { name: "Exit demo", exact: true }).click();
  await expect(page.getByTestId("demo-step-screen")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
});

test("Follow persists in every perspective and explicit opposite visits restore their origin", async ({ page }) => {
  await page.goto("/#cases");
  await page.locator('[data-case="B"]').getByRole("button", { name: "Follow this item", exact: true }).click();
  const followed = page.getByRole("region", { name: "Followed item", exact: true });
  await expect(followed).toContainText("Following EX-24112");
  const lastEvent = await followed.locator("p").first().innerText();
  for (const side of ["Pharmacy", "NHSBSA"] as const) {
    await choosePerspective(page, side);
    await expect(followed).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Switch side", exact: true })).toHaveCount(0);
    const opposite = side === "Pharmacy" ? "NHSBSA" : "Pharmacy";
    await followed.getByRole("button", { name: `${opposite} view`, exact: true }).click();
    await expect(page).toHaveURL(side === "Pharmacy" ? /\/case\/EX-24112$/ : /\/pharmacy\/claims\?case=EX-24112$/);
    await expect(page.getByRole("radio", { name: "Both", exact: true })).toBeChecked();
    await expect(followed).toContainText("Both temporarily shown");
    await followed.getByRole("button", { name: `${side} view`, exact: true }).click();
    await expect(page.getByRole("radio", { name: side, exact: true })).toBeChecked();
    await expect(followed.locator("p").first()).toHaveText(lastEvent);
    await expect(followed.getByRole("status")).toHaveCount(0);
  }
  await choosePerspective(page, "Both");
  await expect(followed).toContainText("Following EX-24112");
  await expect(history(page).getByRole("button", { name: "Stop following this case", exact: true })).toHaveAttribute("aria-pressed", "true");
  await followed.getByRole("button", { name: "NHSBSA view", exact: true }).click();
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
    await expect(page.getByRole("region", { name: "Followed item", exact: true })).toHaveCount(0);
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
        await expect(page.getByRole("button", { name: "Follow this item", exact: true })).toHaveCount(hash === "cases" ? 4 : hash === "two-places" ? 1 : 0);
      }
    }
  });
}
