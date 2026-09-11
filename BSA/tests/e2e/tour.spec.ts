import { confirmReset, expect, navigatePrimary as navigateExisting, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";
import { SOURCES_FOOTER, TOUR_CONTENT } from "../../src/lib/domain/public-facts";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { BASELINE_FIELDS } from "../../src/lib/domain/baseline";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { startDemonstrationReview } from "./lifecycle-helpers";

// The shared legacy helper's Operations labels are owned by integration QA.
async function navigatePrimary(page: Page, label: string) {
  if (!["Pharmacy claims", "NHSBSA queue"].includes(label)) return navigateExisting(page, label);
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  const mobile = nav.getByRole("button", { name: "Open navigation", exact: true });
  if (await mobile.isVisible()) {
    await mobile.press("Enter");
    await page.getByRole("dialog", { name: "Navigation", exact: true }).getByRole("link", { name: label, exact: true }).press("Enter");
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toHaveCount(0);
  } else {
    await nav.getByRole("button", { name: "Operations", exact: true }).press("Enter");
    const item = page.getByRole("menuitem", { name: label, exact: true });
    await item.focus();
    await expect(item).toBeFocused();
    await item.press("Enter");
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await expect(page).toHaveURL(label === "Pharmacy claims" ? /\/pharmacy\/claims$/ : /\/queue$/);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [360, 768, 960, 1024, 1280, 1440, 1920]) {
    test.describe(`tour header ${width} ${colorScheme}`, () => {
      test.use({ colorScheme, viewport: { width, height: 900 } });
      test("single row, pinned rail, full grouped navigation and both agent states", async ({ page }) => {
        await page.goto("./");
        const header = page.getByRole("banner");
        const rail = page.getByRole("navigation", { name: "Guided tour" });
        for (const enabled of [true, false]) {
          await header.getByRole("switch").setChecked(enabled);
          const box = await header.boundingBox();
          await expect(header.getByRole("switch")).toHaveAttribute("data-state", enabled ? "checked" : "unchecked");
          expect(box?.height).toBeLessThanOrEqual(64);
          const controls = [header.getByRole("link", { name: "Prescription Exception Case Builder" }), header.getByRole("switch"), header.getByRole("button", { name: "Reset demo" })];
          for (const control of controls) {
            await expect(control).toBeVisible();
            const bounds = await control.boundingBox();
            expect(bounds!.y).toBeGreaterThanOrEqual(box!.y);
            expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(box!.y + box!.height);
            expect(bounds!.x).toBeGreaterThanOrEqual(0);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
          }
          expect((await rail.boundingBox())?.y).toBe(box!.height);
          for (const label of ["Pharmacy check", "Pharmacy claims", "NHSBSA queue", "Evaluation", "Boundary", "Assumptions", "Architecture", "Overview"]) await navigatePrimary(page, label);
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          expect((await header.boundingBox())?.y).toBe(0);
          expect((await rail.boundingBox())?.y).toBe(box!.height);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        }
      });
    });
  }
}

for (const enabled of [true, false]) {
  test(`@tour-focus tour forwards and backwards, chapter menu, pharmacy substop: agent=${enabled}`, async ({ page }) => {
    await page.goto("./#scene");
    await page.getByRole("banner").getByRole("switch").focus();
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const rail = page.getByRole("navigation", { name: "Guided tour" });
    await expect(rail.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
    for (const [index, stop] of TOUR_STOPS.entries()) {
      if (index) await rail.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page).toHaveURL((url) => `${url.pathname.replace(/\/$/, "")}${url.hash}` === `/BSA${stop.to.replace("/#", "#")}`);
      await expect(rail).toContainText(`${stop.chapter}/7 · ${stop.label}`);
      // Toggling the flag intentionally leaves focus on that switch at entry.
      if (index > 0) await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      else await expect(page.getByRole("banner").getByRole("switch")).toBeFocused();
      if (stop.chapter === 2) await expect(page.getByRole("region", { name: "Monthly workload calculator" })).toBeVisible();
      if (stop.chapter === 5) await expect(page.getByRole("heading", { name: "5. The queue", exact: true })).toBeVisible();
      if (stop.chapter === 6) await expect(page.getByRole("heading", { name: "Pharmacy claims", exact: true })).toBeFocused();
    }
    await expect(rail.getByRole("button", { name: "Done", exact: true })).toBeDisabled();
    for (let index = TOUR_STOPS.length - 2; index >= 0; index--) {
      await rail.getByRole("button", { name: "Back", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(rail).toContainText(TOUR_STOPS[index].label);
      await expect(page).toHaveURL((url) => `${url.pathname.replace(/\/$/, "")}${url.hash}` === `/BSA${TOUR_STOPS[index].to.replace("/#", "#")}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    }
    // Exercise the same full route sequence in both directions via shortcuts.
    for (const direction of [1, -1]) {
      for (let index = direction === 1 ? 1 : TOUR_STOPS.length - 2; index >= 0 && index < TOUR_STOPS.length; index += direction) {
        await page.keyboard.press(direction === 1 ? "Alt+ArrowRight" : "Alt+ArrowLeft");
        await expect(page).toHaveURL((url) => `${url.pathname.replace(/\/$/, "")}${url.hash}` === `/BSA${TOUR_STOPS[index].to.replace("/#", "#")}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
        await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      }
    }
    await page.keyboard.press("Alt+ArrowRight");
    await expect(page).toHaveURL(/#month$/);
    await rail.getByRole("button", { name: "Choose tour chapter" }).click();
    await expect(page.getByRole("menuitem")).toHaveCount(7);
    await page.getByRole("menuitem", { name: "6. What the pharmacy sees", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Pharmacy claims", exact: true })).toBeFocused();
    await rail.getByRole("button", { name: "Choose tour chapter" }).click();
    await page.getByRole("menuitem", { name: "4. One agent, two places", exact: true }).click();
    await expect(page).toHaveURL(/#two-places$/);
    await expect(page.locator("[data-two-places]")).toContainText(`Agent ${enabled ? "On" : "Off"}`);
    await expect(page.getByRole("list", { name: "Pharmacy · Before submission flow" })).toBeVisible();
    await expect(page.getByRole("list", { name: "NHSBSA · After exception routing flow" })).toBeVisible();
    await rail.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/\/pharmacy$/);
    await rail.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(/#two-places$/);
  });

  for (const route of ["./#month", "pharmacy", "queue", "pharmacy/claims"]) {
    test(`@tour-focus controls retain focus through edits, toggles and reset: ${route} agent=${enabled}`, async ({ page }) => {
      await page.goto(route);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeFocused();
      const url = page.url();
      const flag = page.getByRole("banner").getByRole("switch");
      await flag.focus();
      await flag.setChecked(enabled);
      await expect(flag).toBeFocused();

      if (route === "pharmacy/claims") {
        const filter = page.getByRole("combobox", { name: "Claim state", exact: true });
        await filter.focus();
        for (const key of ["Alt+ArrowRight", "Alt+ArrowLeft"]) {
          await filter.press(key);
          await expect(page).toHaveURL(url);
          await expect(filter).toBeFocused();
        }
      } else if (route !== "queue") {
        if (route === "./#month") await page.locator("[data-gathering-breakdown] > summary").click();
        const fields = route === "pharmacy"
          ? [page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" })]
          : await page.getByRole("region", { name: "Monthly workload calculator" }).getByRole("textbox").all();
        expect(fields).toHaveLength(route === "pharmacy" ? 1 : BASELINE_FIELDS.length);
        for (const field of fields) {
          await field.fill(route === "pharmacy" ? "NCSO RK" : "12");
          await field.press("End");
          await field.press("3");
          await expect(field).toHaveValue(route === "pharmacy" ? "NCSO RK3" : "123");
          for (const key of ["Alt+ArrowRight", "Alt+ArrowLeft"]) {
            await field.press(key);
            await expect(page).toHaveURL(url);
            await expect(field).toBeFocused();
          }
        }
      } else {
        const filter = page.getByRole("radio", { name: "Agent abstained", exact: true });
        await filter.focus();
        await filter.press("Space");
        await expect(filter).toBeChecked();
        await expect(filter).toBeFocused();
      }

      await flag.focus();
      await flag.press("Space");
      await expect(flag).toBeChecked({ checked: !enabled });
      await expect(flag).toBeFocused();
      await flag.press("Space");
      await expect(flag).toBeChecked({ checked: enabled });
      await expect(flag).toBeFocused();

      const reset = page.getByRole("button", { name: "Reset demo", exact: true });
      for (const action of ["Escape", "Keep working", "Reset demonstration"]) {
        await reset.focus();
        await reset.press("Enter");
        const dialog = page.getByRole("alertdialog");
        const cancel = dialog.getByRole("button", { name: "Keep working", exact: true });
        await expect(cancel).toBeFocused();
        await page.keyboard.press("Alt+ArrowRight");
        await expect(page).toHaveURL(url);
        await expect(cancel).toBeFocused();
        if (action === "Escape") await page.keyboard.press("Escape");
        else await dialog.getByRole("button", { name: action, exact: true }).press("Enter");
        await expect(dialog).toHaveCount(0);
        await expect(reset).toBeFocused();
        await expect(page).toHaveURL(url);
        await expect(heading).not.toBeFocused();
        await expect(flag).toBeChecked({ checked: action !== "Reset demonstration" && enabled });
      }
    });
  }
}

test("mobile navigation closes without animation events after live reduced-motion changes", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "no-preference" });
  await page.goto("./#scene");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  const content = page.locator('[data-slot="sheet-content"]');
  const overlay = page.locator('[data-slot="sheet-overlay"]');

  for (const action of ["Escape", "Close", "Pharmacy check"]) {
    await trigger.focus();
    await trigger.press("Enter");
    await expect(content).toHaveAttribute("data-state", "open");
    // Normal opening animation remains; preference changes apply to this mounted sheet.
    await expect(content).toHaveCSS("animation-name", "enter");
    await expect(content).toHaveCSS("animation-duration", "0.5s");
    await expect(overlay).toHaveCSS("animation-name", "enter");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const layer of [content, overlay]) {
      await expect(layer).toHaveCSS("animation-name", "none");
      await expect(layer).toHaveCSS("transition-duration", "0s");
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(content).toHaveCSS("animation-name", "enter");
    await expect(overlay).toHaveCSS("animation-name", "enter");
    // Deterministically withhold animation completion, as in a stalled background tab.
    // Closing must use Presence's no-animation unmount, not wait for a timeout/event.
    await page.locator('[data-slot="sheet-content"], [data-slot="sheet-overlay"]').evaluateAll((layers) => {
      for (const layer of layers) (layer as HTMLElement).style.animationPlayState = "paused";
    });
    if (action === "Escape") await page.keyboard.press("Escape");
    else if (action === "Close") await content.getByRole("button", { name: "Close", exact: true }).press("Enter");
    else await content.getByRole("link", { name: action, exact: true }).press("Enter");

    // Raw selectors include hidden/closed layers; an inert remnant cannot pass.
    await expect(content).toHaveCount(0);
    await expect(overlay).toHaveCount(0);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("body")).not.toHaveCSS("pointer-events", "none");
    await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
    await expect(page.locator('#root[aria-hidden="true"], #root[inert], #root [inert]')).toHaveCount(0);
    if (action !== "Pharmacy check") await expect(trigger).toBeFocused();
    else await expect(page).toHaveURL(/\/pharmacy$/);
    const flag = page.getByRole("banner").getByRole("switch");
    await flag.focus();
    await expect(flag).toBeFocused();
    const enabled = await flag.isChecked();
    await flag.press("Space");
    await expect(flag).toBeChecked({ checked: !enabled });
    await expect(flag).toBeFocused();
  }
  // Keep the shared helper's strict zero-dialog assertion and exercise it again.
  await navigatePrimary(page, "NHSBSA queue");
  await expect(content).toHaveCount(0);
  await expect(overlay).toHaveCount(0);
});

test("documentary scene figures are invariant; A–D match runAgent and off is neutral manual work", async ({ page }) => {
  await page.goto("./#scene");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const scene = page.getByRole("list", { name: "Public context figures" });
  const before = await scene.innerText();
  await page.getByRole("switch", { name: "Agent: On" }).click();
  await expect(scene).toHaveText(before, { useInnerText: true });
  await expect(page.locator("[data-scene-with-gathering], [data-scene-referrals]")).toHaveCount(0);
  await page.getByRole("switch", { name: "Agent: Off" }).click();
  await page.getByRole("button", { name: "Choose tour chapter" }).click();
  await page.getByRole("menuitem", { name: "3. The pipeline", exact: true }).click();
  for (const item of CASES.slice(0, 4)) {
    const card = page.locator(`[data-case="${item.scenario}"]`);
    const pack = runAgent(item);
    await expect(card.locator("[data-outcome]")).toHaveText(pack.recommendation);
    await expect(card).toContainText(`Gate: ${pack.gate.result.replaceAll("_", " ")}`);
  }
  await expect(page.locator('[data-case="B"] [data-correction]')).toHaveText("Fix: add the date beside the initials.");
  const c = page.locator('[data-case="C"]');
  await expect(c).toContainText("56");
  await expect(c).toContainText("84");
  await expect(c).toContainText("Unresolved");
  const d = page.locator('[data-case="D"]');
  await d.locator("summary").click();
  await expect(d.getByRole("list", { name: "Abstention reasons", exact: true }).locator("li")).toHaveText(runAgent(CASES[3]).abstainReasons);
  await page.getByRole("switch", { name: "Agent: On" }).click();
  await expect(page.locator("[data-outcome]")).toHaveCount(0);
  await expect(page.locator("[data-manual-tasks]")).toHaveCount(4);
  await expect(page.locator('[aria-label="Four canonical synthetic cases"]')).not.toContainText(/minutes|seconds|savings|SUFFICIENT|REFER_BACK|REQUEST_INFORMATION|ABSTAIN/);
  await page.getByRole("switch", { name: "Agent: Off" }).click();
  await expect(page.locator("[data-outcome]")).toHaveCount(4);
});

test("one sourcing footer and concise qualifications replace documentary disclosures", async ({ page }) => {
  await page.goto("./#scene");
  await expect(page.locator("[data-key-figure]")).toHaveCount(3);
  await expect(page.locator('footer[aria-label="Sources"]')).toHaveText(`Sources: ${SOURCES_FOOTER}`);
  await expect(page.locator("[data-source-disclosure]")).toHaveCount(0);
  const referrals = page.locator('[data-key-figure="monthly-referrals"]');
  await referrals.getByText("Figure qualification", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(referrals).toContainText("approximately 83,333, not exactly 85,000");
  await page.goto("./#close");
  await page.getByText(TOUR_CONTENT.questionsDisclosure.title, { exact: true }).click();
  const questions = page.getByRole("list", { name: "Seven discovery questions" }).locator(":scope > li");
  await expect(questions).toHaveCount(7);
  for (const [index, question] of TOUR_CONTENT.questionsDisclosure.questions.entries()) await expect(questions.nth(index).locator(":scope > p")).toHaveText(question.text);
  await expect(page.locator("main")).not.toContainText(/\.pdf|\.docx|P0686|source:/i);
  await page.getByText(TOUR_CONTENT.assumptionsDisclosure.title, { exact: true }).click();
  await expect(page.getByText("Stop if no repeatable pattern.", { exact: false })).toBeVisible();
});

test("dismissal is session-only; principle remains; restore resumes; reload restores defaults", async ({ page }) => {
  await page.goto("./#cases");
  await page.getByRole("button", { name: /Synthetic demonstration data throughout/ }).click();
  await expect(page.locator("#synthetic-disclaimer")).toBeHidden();
  await expect(page.locator("[data-principle]")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss tour", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Guided tour" })).toHaveCount(0);
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/#cases$/);
  await page.getByRole("button", { name: "Restore tour", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Guided tour" })).toContainText("3/7");
  await navigatePrimary(page, "Pharmacy check");
  await expect(page.locator("#synthetic-disclaimer")).toBeHidden();
  await expect(page.locator("[data-principle]")).toBeVisible();
  await page.reload();
  await expect(page.locator("#synthetic-disclaimer")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Guided tour" })).toBeVisible();
});

test("reset cancel and Escape preserve edits and records; confirm resets local and global state", async ({ page }) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await navigatePrimary(page, "Pharmacy check");
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  const seed = await field.inputValue();
  await field.fill("NCSO RK 21/08/26");
  await page.getByRole("switch", { name: "Agent: On" }).click();
  for (const cancel of ["button", "escape"]) {
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("button", { name: "Keep working" })).toBeFocused();
    if (cancel === "button") await dialog.getByRole("button", { name: "Keep working" }).click();
    else await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(field).toHaveValue("NCSO RK 21/08/26");
    await expect(page.getByRole("switch", { name: "Agent: Off" })).not.toBeChecked();
  }
  await confirmReset(page);
  await expect(field).toHaveValue(seed);
  await expect(page.getByRole("switch", { name: "Agent: Off" })).not.toBeChecked();
  await navigatePrimary(page, "NHSBSA queue");
  await page.locator("a[href='/BSA/case/EX-24112']").first().click();
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  await startDemonstrationReview(page);
  await expect(page.getByRole("button", { name: "Record decision", exact: true })).toBeVisible();
});

test("keyboard shortcuts ignore fields, combined modifiers, menus and confirmation dialogs", async ({ page }) => {
  await page.goto("pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const field = page.getByRole("textbox", { name: "Endorsement entered by the pharmacy" });
  await field.focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await page.getByRole("button", { name: "Next", exact: true }).focus();
  for (const key of ["Control+Alt+ArrowRight", "Meta+Alt+ArrowRight", "Shift+Alt+ArrowRight"]) {
    await page.keyboard.press(key);
    await expect(page).toHaveURL(/\/pharmacy$/);
  }
  await page.getByRole("button", { name: "Choose tour chapter" }).click();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(/\/pharmacy$/);
  await page.keyboard.press("Escape");
  await page.getByRole("switch", { name: "Agent: On" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Off withholds recommendations");
  await expect(page.getByRole("switch", { name: "Agent: On" })).toHaveAttribute("data-state", "checked");
  await page.getByRole("button", { name: "Choose tour chapter" }).click();
  await page.getByRole("menuitem", { name: "3. The pipeline", exact: true }).click();
  await expect(page).toHaveURL(/#cases$/);
  await expect(page.getByRole("heading", { name: "The exception pipeline", exact: true })).toBeFocused();
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(/#cases$/);
});

test("unknown routes do not claim a tour chapter and retain start and home recovery", async ({ page }) => {
  await page.goto("not-a-tour-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  const rail = page.getByRole("navigation", { name: "Guided tour" });
  await expect(rail).toContainText("Explore · Start the tour");
  await expect(rail.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
  await rail.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/#scene$/);
});

test("chapter narrative stays within 25 words in both states; selected QA screenshots", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: width === 1440 ? "light" : "dark" });
    for (const fragment of ["scene", "month", "cases", "two-places", "close"]) {
      await page.goto(`./#${fragment}`);
      for (const enabled of [true, false]) {
        // Hash navigation preserves session state, unlike a full page reload.
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        const prose = await page.locator("[data-tour-prose] > p").innerText();
        expect(prose.trim().split(/\s+/).length).toBeLessThanOrEqual(25);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        await page.screenshot({ path: testInfo.outputPath(`${fragment}-${width}-${width === 1440 ? "light" : "dark"}-${enabled ? "on" : "off"}.png`), fullPage: true });
      }
    }
  }
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const width of [360, 768, 960, 1024, 1280, 1440, 1920]) {
    test.describe(`follow banner ${width} ${reducedMotion}`, () => {
      test.use({ viewport: { width, height: 900 }, reducedMotion, colorScheme: reducedMotion === "reduce" ? "dark" : "light" });
      test("@tour-follow same item, dynamic sticky layout, keyboard dismissal and reset", async ({ page }, testInfo) => {
        await page.goto("pharmacy/claims?case=EX-24123");
        const history = page.getByRole("region", { name: "Shared case history", exact: true });
        const detail = page.getByRole("heading", { name: "Claim detail: EX-24123", exact: true });
        await expect(detail).toBeFocused();
        await history.locator("summary").first().press("Enter");
        const events = history.getByRole("list", { name: "Lifecycle events", exact: true });
        const before = await events.innerText();
        const follow = history.getByRole("button", { name: "Follow this case", exact: true });
        await expect(page.getByRole("button", { name: /^Follow this (case|item)$/ })).toHaveCount(1);
        await follow.press("Enter");
        const banner = page.getByRole("region", { name: "Followed item", exact: true });
        const header = page.getByRole("banner");
        const rail = page.getByRole("navigation", { name: "Guided tour", exact: true });
        const flag = header.getByRole("switch");
        const reset = header.getByRole("button", { name: "Reset demo", exact: true });
        for (const enabled of [true, false]) {
          await flag.focus();
          await flag.setChecked(enabled);
          await expect(flag).toBeFocused();
          await expect(banner).toContainText("Following EX-24123");
          await expect(banner).toContainText(LIFECYCLE_LABELS.in_review.pharmacy);
          await expect(banner).toContainText(LIFECYCLE_LABELS.in_review.nhsbsa[enabled ? "on" : "off"]);
          await expect(events).toHaveText(before, { useInnerText: true });
          await page.evaluate(() => window.scrollTo(0, 0));
          const h = (await header.boundingBox())!;
          expect(h.y).toBe(0);
          expect(h.height).toBeLessThanOrEqual(64);
          for (const control of [flag, reset, header.getByRole("link", { name: "Prescription Exception Case Builder" })]) {
            const b = (await control.boundingBox())!;
            expect(b.y).toBeGreaterThanOrEqual(0);
            expect(b.y + b.height).toBeLessThanOrEqual(h.height);
            expect(b.x).toBeGreaterThanOrEqual(0);
            expect(b.x + b.width).toBeLessThanOrEqual(width);
          }
          await expect.poll(async () => {
            const b = (await banner.boundingBox())!, r = (await rail.boundingBox())!;
            return Math.abs(b.y - h.height) + Math.abs(r.y - b.y - b.height);
          }).toBeLessThan(1);
          const r = (await rail.boundingBox())!;
          expect((await page.locator("[data-disclaimer]").boundingBox())!.y).toBeGreaterThanOrEqual(r.y + r.height);
          await expect(page.locator("[data-principle]")).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        }
        await banner.getByRole("link", { name: "Switch side: NHSBSA", exact: true }).press("Enter");
        await expect(page).toHaveURL(/\/case\/EX-24123$/);
        const pharmacyView = page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Pharmacy view", exact: true });
        await expect(pharmacyView).toHaveAttribute("href", "/BSA/pharmacy/claims?case=EX-24123");
        await pharmacyView.press("Enter");
        await expect(detail).toBeFocused();
        await expect.poll(async () => {
          const d = (await detail.boundingBox())!, r = (await rail.boundingBox())!;
          return d.y - r.y - r.height;
        }).toBeGreaterThanOrEqual(0);
        // Dismiss only the banner, not history, the URL, or the current mode.
        const url = page.url();
        await banner.getByRole("button", { name: "Dismiss followed item" }).press("Enter");
        await expect(banner).toHaveCount(0);
        await expect(page.getByRole("main")).toBeFocused();
        await expect(page).toHaveURL(url);
        await expect(flag).not.toBeChecked();
        await history.locator("summary").first().press("Enter");
        await expect(events).toHaveText(before, { useInnerText: true });
        await expect(follow).toHaveAttribute("aria-pressed", "false");
        await follow.press("Enter");
        await flag.setChecked(true);
        await reset.press("Enter");
        await page.getByRole("alertdialog").getByRole("button", { name: "Keep working", exact: true }).press("Enter");
        await expect(reset).toBeFocused();
        await expect(banner).toBeVisible();
        await expect(flag).toBeChecked();
        await confirmReset(page);
        await expect(reset).toBeFocused();
        await expect(banner).toHaveCount(0);
        await expect(flag).not.toBeChecked();
        await expect(page).toHaveURL(url);
        await history.locator("summary").first().press("Enter");
        await expect(events).toHaveText(before, { useInnerText: true });
        await page.screenshot({ path: testInfo.outputPath("follow-reset.png"), fullPage: true });
      });
    });
  }
}

test("@tour-follow following does not silently switch to another viewed case", async ({ page }) => {
  await page.goto("./#cases");
  await page.locator('[data-case="D"]').getByRole("button", { name: "Follow this item", exact: true }).press("Enter");
  await page.locator('[data-case="B"]').getByRole("link", { name: "Open case B", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/case\/EX-24112$/);
  const banner = page.getByRole("region", { name: "Followed item", exact: true });
  await expect(banner).toContainText("Following EX-24123");
  await expect(banner.getByRole("link", { name: "Switch side: Pharmacy", exact: true })).toHaveAttribute("href", "/BSA/pharmacy/claims?case=EX-24123");
  await expect(page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Pharmacy view", exact: true })).toHaveAttribute("href", "/BSA/pharmacy/claims?case=EX-24112");
  await banner.getByRole("link", { name: "Switch side: Pharmacy", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: "Claim detail: EX-24123", exact: true })).toBeFocused();
});