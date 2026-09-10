import { confirmReset, expect, navigatePrimary, test } from "./fixtures";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";
import { SOURCES_FOOTER, TOUR_CONTENT } from "../../src/lib/domain/public-facts";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { BASELINE_FIELDS } from "../../src/lib/domain/baseline";

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
          for (const label of ["Pharmacy check", "Exception queue", "Evaluation", "Boundary", "Assumptions", "Architecture", "Overview"]) await navigatePrimary(page, label);
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
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const rail = page.getByRole("navigation", { name: "Guided tour" });
    await expect(rail.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
    for (const [index, stop] of TOUR_STOPS.entries()) {
      if (index) await rail.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page).toHaveURL((url) => `${url.pathname.replace(/\/$/, "")}${url.hash}` === `/BSA${stop.to.replace("/#", "#")}`);
      await expect(rail).toContainText(`${stop.chapter}/7 · ${stop.label}`);
      // Toggling the flag intentionally leaves focus on that switch at entry.
      // Stream C's Task 9 page will own a focusable heading for the claims
      // chapter; until then this shell chapter box does not compete for focus.
      if (index > 0 && stop.to !== "/pharmacy/claims") await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      if (stop.chapter === 2) await expect(page.getByRole("region", { name: "Monthly workload calculator" })).toBeVisible();
      if (stop.chapter === 5) await expect(page.getByRole("heading", { name: "5. The queue · Simulation planned", exact: true })).toBeVisible();
      if (stop.chapter === 6) await expect(page.getByRole("heading", { name: "6. What the pharmacy sees · Existing claims mock, not a deployed integration.", exact: true })).toBeVisible();
    }
    await expect(rail.getByRole("button", { name: "Done", exact: true })).toBeDisabled();
    for (let index = TOUR_STOPS.length - 2; index >= 0; index--) {
      await rail.getByRole("button", { name: "Back", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(rail).toContainText(TOUR_STOPS[index].label);
      await expect(page).toHaveURL((url) => `${url.pathname.replace(/\/$/, "")}${url.hash}` === `/BSA${TOUR_STOPS[index].to.replace("/#", "#")}`);
      if (TOUR_STOPS[index].to !== "/pharmacy/claims") await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    }
    // Exercise the same full route sequence in both directions via shortcuts.
    for (const direction of [1, -1]) {
      for (let index = direction === 1 ? 1 : TOUR_STOPS.length - 2; index >= 0 && index < TOUR_STOPS.length; index += direction) {
        await page.keyboard.press(direction === 1 ? "Alt+ArrowRight" : "Alt+ArrowLeft");
        await expect(page).toHaveURL((url) => `${url.pathname.replace(/\/$/, "")}${url.hash}` === `/BSA${TOUR_STOPS[index].to.replace("/#", "#")}`);
        if (TOUR_STOPS[index].to !== "/pharmacy/claims") await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
        await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      }
    }
    await page.keyboard.press("Alt+ArrowRight");
    await expect(page).toHaveURL(/#month$/);
    await rail.getByRole("button", { name: "Choose tour chapter" }).click();
    await expect(page.getByRole("menuitem")).toHaveCount(7);
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

  for (const route of ["./#month", "pharmacy", "queue"]) {
    test(`@tour-focus controls retain focus through edits, toggles and reset: ${route} agent=${enabled}`, async ({ page }) => {
      await page.goto(route);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeFocused();
      const url = page.url();
      const flag = page.getByRole("banner").getByRole("switch");
      await flag.focus();
      await flag.setChecked(enabled);
      await expect(flag).toBeFocused();

      if (route !== "queue") {
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
  await navigatePrimary(page, "Exception queue");
  await page.locator("a[href='/BSA/case/EX-24112']").first().click();
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