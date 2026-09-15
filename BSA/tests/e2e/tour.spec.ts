import { confirmReset, expect, navigatePrimary as navigateExisting, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { DEMO_STEPS, demoStepDestination } from "../../src/lib/domain/demo-steps";
import { SOURCES_FOOTER, TOUR_CONTENT } from "../../src/lib/domain/public-facts";
import { CASES, PLAYABLE_CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { PROCESS_PUBLIC_FACTS, formatProcessItems, formatProcessHours } from "../../src/lib/domain/baseline";
import { PROCESS_FIELDS, PROCESS_MONTH_DEFAULTS, calculateProcessMonth, chooseProcessChapter, expectSceneMetrics } from "./process-model-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { assertInlineDecisionRecorded, historyIdentity, openHistory } from "./perspective-helpers";
import { REC_META } from "../../src/components/demo/label-meta";
import { decisionNote, operatorAction, operatorActionButtons, operatorDecision, operatorRadio, performDecision } from "./operator-action-helpers";
import { assertDesktopStep, enterDesktopDemo } from "./desktop-step-helpers";

async function navigatePrimary(page: Page, label: string) {
  await navigateExisting(page, label);
  if (["Pharmacy claims", "NHSBSA queue"].includes(label)) {
    await expect(page).toHaveURL(label === "Pharmacy claims" ? /\/pharmacy\/claims$/ : /\/queue$/);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [1280, 1440]) {
    test.describe(`tour header ${width} ${colorScheme}`, () => {
      test.use({ colorScheme, viewport: { width, height: 900 } });
      test("single row, pinned rail, full grouped navigation and both agent states", async ({ page }) => {
        await page.goto("./");
        const header = page.getByRole("banner");
        const rail = page.getByRole("navigation", { name: "Demo mode", exact: true });
        for (const enabled of [true, false]) {
          await header.getByRole("switch").setChecked(enabled);
          const box = await header.boundingBox();
          await expect(header.getByRole("switch")).toHaveAttribute("data-state", enabled ? "checked" : "unchecked");
          expect(box?.height).toBeLessThanOrEqual(64);
          await expect(header.getByRole("radio", { name: "Both", exact: true })).toBeChecked();
          const navigation = header.getByRole("button", { name: "Operations", exact: true });
          const controls = [header.getByRole("link", { name: "Prescription Exception Case Builder" }), navigation, header.getByRole("group", { name: "Perspective", exact: true }), header.getByRole("switch"), header.getByRole("button", { name: "Reset demo" })];
          const centres: number[] = [];
          for (const control of controls) {
            await expect(control).toBeVisible();
            const bounds = await control.boundingBox();
            centres.push(bounds!.y + bounds!.height / 2);
            expect(bounds!.y).toBeGreaterThanOrEqual(box!.y);
            expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(box!.y + box!.height);
            expect(bounds!.x).toBeGreaterThanOrEqual(0);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
          }
          expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(1);
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
  test(`@tour-focus eleven steps forwards and backwards, Jump and cross-route focus: agent=${enabled}`, async ({ page }) => {
    test.setTimeout(90_000);
    await enterDesktopDemo(page, enabled);
    const rail = page.getByTestId("demo-strip");
    await expect(rail.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
    for (const [index, stop] of DEMO_STEPS.entries()) {
      if (index) await rail.getByRole("button", { name: "Next", exact: true }).click();
      await assertDesktopStep(page, stop.number, enabled);
      await expect(page).toHaveURL(new URL(demoStepDestination(stop), page.url()).href);
      await expect(rail).toContainText(`${stop.number} / 11 · ${stop.title}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    }
    await expect(rail.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    for (let index = DEMO_STEPS.length - 2; index >= 0; index--) {
      await rail.getByRole("button", { name: "Back", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(rail).toContainText(DEMO_STEPS[index].title);
      await expect(page).toHaveURL(new URL(demoStepDestination(DEMO_STEPS[index]), page.url()).href);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    }
    for (const direction of [1, -1]) {
      for (let index = direction === 1 ? 1 : DEMO_STEPS.length - 2; index >= 0 && index < DEMO_STEPS.length; index += direction) {
        await page.keyboard.press(direction === 1 ? "Alt+ArrowRight" : "Alt+ArrowLeft");
        await expect(page).toHaveURL(new URL(demoStepDestination(DEMO_STEPS[index]), page.url()).href);
        await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
        await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      }
    }
    const jump = rail.getByRole("combobox", { name: "Jump to demo step" });
    await expect(jump.locator("option")).toHaveText(DEMO_STEPS.map((step) => `${step.number}. ${step.title}`));
    await jump.selectOption("11");
    await expect(page.getByRole("heading", { level: 1, name: "11. Where it ends", exact: true })).toBeFocused();
    await jump.selectOption("6");
    await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-case", "EX-24123");
    await expect(page).toHaveURL(/\/pharmacy\?case=EX-24123&channel=paper$/);
    await rail.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(/\/pharmacy\?case=SYN-FQ123-MISMATCH&channel=eps$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
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
        for (const label of ["Waiting on NHSBSA", "Paid this month", "All", "Action needed"]) {
          const filter = page.locator('[aria-label="Claim filters"]').getByRole("button", { name: new RegExp(`^${label} `) });
          await filter.focus();
          await filter.press("Space");
          await expect(filter).toHaveAttribute("aria-pressed", "true");
          await expect(page).toHaveURL(url);
          await expect(filter).toBeFocused();
        }
      } else if (route !== "queue") {
        if (route === "./#month") await page.locator("[data-month-detail] > summary").click();
        const fields = route === "pharmacy"
          ? [page.getByRole("textbox", { name: "Dispenser endorsement" })]
          : await page.getByRole("region", { name: "Monthly workload calculator" }).getByRole("textbox").all();
        expect(fields).toHaveLength(route === "pharmacy" ? 1 : PROCESS_FIELDS.length);
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
        const filter = page.getByRole("region", { name: "Actual session work counts", exact: true })
          .getByRole("button", { name: /^Type 2 worklist\s+\d+$/ });
        await filter.focus();
        await filter.press("Space");
        await expect(filter).toHaveAttribute("aria-pressed", "true");
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

test("demo month uses the ordinary shared inputs and renders one editable surface", async ({ page }) => {
  await page.goto("./#month");
  await page.locator("[data-month-detail] > summary").click();
  await page.locator("#process-preventionPercent").fill("37");
  await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await page.getByRole("combobox", { name: "Jump to demo step" }).selectOption("2");
  const result = calculateProcessMonth({ ...PROCESS_MONTH_DEFAULTS, preventionPercent: 37 });
  for (const enabled of [false, true]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const screen = page.getByTestId("demo-step-screen");
    const active = page.getByTestId(enabled ? "demo-assisted" : "demo-today");
    const inactive = page.getByTestId(enabled ? "demo-today" : "demo-assisted");
    await active.locator("[data-month-detail] > summary").click();
    await expect(page.locator("#process-preventionPercent")).toHaveCount(1);
    await expect(active.locator("#process-preventionPercent")).toHaveValue("37");
    await expect(active.getByRole("textbox")).toHaveCount(PROCESS_FIELDS.length);
    await expect(inactive.locator("input,select,textarea,button,summary")).toHaveCount(0);
    await expect(page.locator("[data-month-headlines]")).toHaveCount(0);
    for (const [panel, values] of [[page.getByTestId("demo-today"), result.today], [page.getByTestId("demo-assisted"), result.withAgent]] as const) {
      await expect(panel.locator("[data-demo-month] > dl > div").nth(0).locator("dd")).toContainText(formatProcessItems(values.referredBackItems));
      await expect(panel.locator("[data-demo-month] > dl > div").nth(1).locator("dd")).toContainText(formatProcessHours(values.operatorHours));
    }
    await active.locator("#process-preventionPercent").press("Alt+ArrowRight");
    await expect(screen).toHaveAttribute("data-demo-step", "2");
    await expect(active.locator("#process-preventionPercent")).toBeFocused();
  }
  await page.getByRole("button", { name: "Exit demo", exact: true }).click();
  await page.locator("[data-month-detail] > summary").click();
  await expect(page.locator("#process-preventionPercent")).toHaveValue("37");
  await confirmReset(page);
  await expect(page.locator("#process-preventionPercent")).toHaveValue(String(PROCESS_MONTH_DEFAULTS.preventionPercent));
});

test("public scene facts stay invariant; automatic, Type 2 and Type 1 cases follow their actual routing", async ({ page }) => {
  await page.goto("./#scene");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Most items need no person");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const scene = page.getByRole("list", { name: "Public context figures" });
  const before = await scene.innerText();
  await page.getByRole("switch", { name: "Agent: On" }).click();
  await expect(scene).toHaveText(before, { useInnerText: true });
  await expectSceneMetrics(page, undefined, false);
  const context = page.getByRole("region", { name: "Public process context", exact: true });
  for (const value of [
    `Over ${formatProcessItems(PROCESS_PUBLIC_FACTS.monthlyItemsLowerBound)}`,
    `${PROCESS_PUBLIC_FACTS.epsPercent}%`, `${PROCESS_PUBLIC_FACTS.paperPercent}%`,
    formatProcessItems(PROCESS_PUBLIC_FACTS.type1MonthlyItems),
    formatProcessItems(PROCESS_PUBLIC_FACTS.type2MonthlyItems),
  ]) await expect(context).toContainText(value);
  await page.getByRole("switch", { name: "Agent: Off" }).click();
  await expectSceneMetrics(page);
  await chooseProcessChapter(page, 4);
  await expect(page.getByRole("heading", { name: "Processing cases · Follow each path", exact: true })).toBeVisible();
  const a = page.locator('[data-case="A"]');
  await expect(a).toHaveAttribute("data-case-routing", "auto_priced");
  await expect(a).toContainText("no operator queue row");
  await expect(a.getByRole("link", { name: "View automatically priced claim", exact: true })).toHaveAttribute("href", "/pharmacy/claims?case=EX-24107");
  await expect(a.getByRole("link", { name: "Open case A", exact: true })).toHaveCount(0);
  await expect(a.locator("[data-outcome], [data-pain-marker], [data-manual-tasks]")).toHaveCount(0);
  await expect(a).not.toContainText(/Gate:|recommendation|Human decision/);
  const cards = page.getByRole("list", { name: "Four canonical synthetic cases" }).locator(":scope > li");
  for (const item of PLAYABLE_CASES.filter((item) => ["EX-24112", "SYN-FQ123-MISMATCH"].includes(item.id))) {
    const card = cards.filter({ hasText: item.id });
    const pack = runAgent(item);
    await expect(card).toHaveAttribute("data-case-routing", item.id === "EX-24112" ? "referred_back" : "type2_endorsement");
    await expect(card.locator("[data-outcome]")).toHaveText(REC_META[pack.recommendation].label);
    await expect(card).toContainText(`Gate: ${pack.gate.result.replaceAll("_", " ")}`);
    const open = card.getByRole("link", { name: `Open case ${item.scenario}`, exact: true });
    await expect(open).toBeVisible();
    await expect(open).toHaveAttribute("href", `/case/${item.id}`);
  }
  await expect(page.locator('[data-case="B"] [data-correction]')).toHaveText("Fix: add the date beside the initials.");
  // C's archival quantity conflict is replaced by the playable wrong-pack evidence boundary.
  const mismatch = cards.filter({ hasText: "SYN-FQ123-MISMATCH" });
  await expect(mismatch).toContainText("Complete format, wrong pack");
  await mismatch.locator("summary", { hasText: "Outcome evidence and exact correction" }).click();
  await expect(mismatch.getByRole("list", { name: "Requirement checks" })).toContainText("Pack size dispensed: not met");
  await expect(mismatch.locator("[data-outcome]")).not.toHaveText(REC_META.SUFFICIENT.label);
  await expect(page.getByRole("list", { name: "Four canonical synthetic cases" })).not.toContainText(/EX-24119|EX-24088|EX-24101|SYN-FQ123-READABLE|SYN-FQ123-RECHECK/);
  const d = page.locator('[data-case="D"]');
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await expect(d).toContainText("Proposed: declared by the pharmacy, not read from the form.");
  await expect(d).toContainText("Unreconciled evidence still abstains");
  await expect(d.locator("[data-outcome]")).toHaveCount(0);
  await expect(d.getByRole("link", { name: "Open case D", exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Agent: On" }).click();
  await expect(page.locator("[data-outcome]")).toHaveCount(0);
  await expect(page.locator("[data-manual-tasks]")).toHaveCount(2);
  await expect(d).toContainText("Key product, quantity and endorsement from the image.");
  await expect(d).toContainText("Type 2 judgement follows only when required.");
  await expect(a).toHaveAttribute("data-case-routing", "auto_priced");
  await expect(a.locator("[data-pain-marker]")).toHaveCount(0);
  await expect(page.locator('[aria-label="Four canonical synthetic cases"]')).not.toContainText(/minutes|seconds|savings|SUFFICIENT|REFER_BACK|REQUEST_INFORMATION|ABSTAIN/);
  await page.getByRole("switch", { name: "Agent: Off" }).click();
  await expect(page.locator("[data-outcome]")).toHaveCount(2);
});

test("case D card follows human-confirmed current capture instead of retaining its seeded Type 1 branch", async ({ page }) => {
  await page.goto("./#cases");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const d = page.locator('[data-case="D"]');
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await navigatePrimary(page, "Pharmacy check");
  const channel = page.getByRole("radio", { name: "Paper", exact: true });
  await channel.click();
  await expect(channel).toBeChecked();
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24123");
  await expect(page).toHaveURL((url) => url.pathname === "/pharmacy"
    && url.searchParams.get("case") === "EX-24123" && url.searchParams.get("channel") === "paper");
  const paper = page.getByRole("region", { name: "Paper pharmacy submission", exact: true });
  await expect(paper.getByRole("img", { name: /^Synthetic scanned prescription form for case EX-24123\./ })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Unreadable form", exact: true })).toHaveCount(0);
  const source = CASES.find((item) => item.scenario === "D")!;
  await page.getByRole("button", { name: "Load worked declaration", exact: true }).click();
  await page.getByLabel("Declared quantity", { exact: true }).fill(String(source.claim.quantity));
  await page.getByRole("textbox", { name: "Declared endorsement", exact: true }).fill("NCSO RK 27/08/26");
  await page.getByRole("button", { name: "Post paper with declaration", exact: true }).click();
  const receipt = page.getByRole("region", { name: "Submission receipt", exact: true });
  await expect(receipt).toContainText("EX-24123:2");
  await expect(receipt.getByRole("status")).toHaveText("Human capture or reconciliation pending.");
  await receipt.getByText("Recorded submission", { exact: true }).click();
  const declaration = receipt.getByRole("region", { name: "Submitted pharmacy declaration", exact: true });
  await expect(declaration).toContainText("declared by the pharmacy, not read from the form");
  await expect(declaration.locator("dl > div").filter({ has: page.getByText("Declared quantity", { exact: true }) }).locator("dd")).toHaveText(String(source.claim.quantity));
  await expect(declaration.locator("dl > div").filter({ has: page.getByText("Declared endorsement", { exact: true }) }).locator("dd")).toHaveText("NCSO RK 27/08/26");
  await chooseProcessChapter(page, 4);
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await d.getByRole("link", { name: "Open case D", exact: true }).click();
  const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
  await expect(capture).toContainText("Image unreadable; agreement unknown.");
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await expect(capture.getByRole("alert")).toBeVisible();
  await chooseProcessChapter(page, 4);
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await d.getByRole("link", { name: "Open case D", exact: true }).click();
  await capture.getByRole("textbox", { name: "Prescriber", exact: true }).fill("Dr Demo (synthetic)");
  await capture.getByRole("checkbox", { name: "I have reconciled the declaration with the available evidence, including the dispensing date", exact: true }).check();
  await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
  await expect(capture.getByRole("heading", { name: "Human capture confirmed", exact: true })).toBeFocused();
  await chooseProcessChapter(page, 4);
  await expect(d).toHaveAttribute("data-case-routing", "type2_endorsement");
  await expect(d.locator("[data-outcome]")).toBeVisible();
  await expect(d.getByRole("region", { name: "Awaiting Type 1 capture", exact: true })).toHaveCount(0);
  await page.getByRole("banner").getByRole("switch").setChecked(false);
  await expect(d).toHaveAttribute("data-case-routing", "type2_endorsement");
  await expect(d.locator("[data-manual-tasks]")).toBeVisible();
  await confirmReset(page);
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await expect(d.locator("[data-outcome], [data-manual-tasks]")).toHaveCount(0);
});

test("one sourcing footer and concise qualifications replace documentary disclosures", async ({ page }) => {
  await page.goto("./#scene");
  await expect(page.locator("[data-key-figure]")).toHaveCount(3);
  await expect(page.locator('footer[aria-label="Sources"]')).toHaveText(`Sources: ${SOURCES_FOOTER}`);
  await expect(page.locator("[data-source-disclosure]")).toHaveCount(0);
  for (const figure of TOUR_CONTENT.keyFigures) {
    const fact = page.locator(`[data-key-figure="${figure.id}"]`);
    await expect(fact).toContainText(figure.value);
    await fact.getByRole("button", { name: `${figure.label}: figure context`, exact: true }).focus();
    await expect(page.getByRole("tooltip", { name: `Public: ${figure.qualifier}`, exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await page.goto("./#close");
  await page.getByText(TOUR_CONTENT.questionsDisclosure.title, { exact: true }).click();
  const questions = page.getByRole("list", { name: "Seven discovery questions" }).locator(":scope > li");
  await expect(questions).toHaveCount(7);
  for (const [index, question] of TOUR_CONTENT.questionsDisclosure.questions.entries()) await expect(questions.nth(index).locator(":scope > p")).toHaveText(question.text);
  await expect(page.locator("main")).not.toContainText(/\.pdf|\.docx|P0686|source:/i);
  await page.getByText(TOUR_CONTENT.assumptionsDisclosure.title, { exact: true }).click();
  await expect(page.getByText("Stop if no repeatable pattern.", { exact: false })).toBeVisible();
});

test("Exit preserves session presentation; re-entry starts step one; reload restores defaults", async ({ page }) => {
  await enterDesktopDemo(page, true);
  await page.getByRole("combobox", { name: "Jump to demo step" }).selectOption("4");
  const seed = await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).inputValue();
  await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO RK human draft");
  await page.getByRole("button", { name: /Synthetic demonstration data throughout/ }).click();
  await expect(page.locator("#synthetic-disclaimer")).toBeHidden();
  await expect(page.locator("[data-principle]")).toBeVisible();
  await page.getByRole("button", { name: "Exit demo", exact: true }).click();
  await expect(page.getByTestId("demo-step-screen")).toHaveCount(0);
  const url = page.url();
  await expect(page.getByRole("textbox", { name: "Dispenser endorsement", exact: true })).toHaveValue("NCSO RK human draft");
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(url);
  await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
  await page.getByRole("combobox", { name: "Jump to demo step" }).selectOption("4");
  await expect(page.getByRole("textbox", { name: "Dispenser endorsement", exact: true })).toHaveValue("NCSO RK human draft");
  await expect(page.locator("#synthetic-disclaimer")).toBeHidden();
  await expect(page.locator("[data-principle]")).toBeVisible();
  await page.reload();
  await expect(page.locator("#synthetic-disclaimer")).toBeVisible();
  await expect(page.getByTestId("demo-step-screen")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enter demo mode", exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.getByRole("textbox", { name: "Dispenser endorsement", exact: true })).toHaveValue(seed);
});

test("reset cancel and Escape preserve edits and records; confirm resets local and global state", async ({ page }) => {
  await page.goto("pharmacy");
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24112");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
  await expect(operatorRadio(page, "REFER_BACK")).toBeChecked();
  await expect(page.getByRole("combobox", { name: "RB code (required)", exact: true })).toHaveValue("SYN-NCSO");
  const approvedReason = await decisionNote(page).inputValue();
  await performDecision(page, "REFER_BACK");
  await expect(page.getByRole("main")).toContainText(approvedReason);
  await expect(page).toHaveURL(/\/case\/EX-24112\/record$/);
  await assertInlineDecisionRecorded(page, "REFER_BACK");
  await openHistory(page);
  const decisionHistory = await historyIdentity(page);
  await navigatePrimary(page, "Pharmacy check");
  const field = page.getByRole("textbox", { name: "Dispenser endorsement" });
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
    await navigatePrimary(page, "Pharmacy claims");
    await page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row")
      .filter({ hasText: "EX-24112" }).getByRole("button").click();
    await openHistory(page);
    expect(await historyIdentity(page)).toEqual(decisionHistory);
    await navigatePrimary(page, "Pharmacy check");
    await expect(field).toHaveValue("NCSO RK 21/08/26");
  }
  await confirmReset(page);
  await expect(field).toHaveValue(seed);
  await expect(page.getByRole("switch", { name: "Agent: Off" })).not.toBeChecked();
  await navigatePrimary(page, "NHSBSA queue");
  await page.locator("a[href='/case/EX-24112']").first().click();
  await expect(operatorActionButtons(page)).toHaveCount(0);
  await navigatePrimary(page, "Pharmacy check");
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24112");
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status")).toHaveText(LIFECYCLE_LABELS.submitted.pharmacy);
  await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(operatorAction(page, "REFER_BACK")).toBeVisible();
});

test("keyboard shortcuts ignore fields, combined modifiers, menus and confirmation dialogs", async ({ page }) => {
  await enterDesktopDemo(page, true);
  const jump = page.getByRole("combobox", { name: "Jump to demo step" });
  await jump.selectOption("4");
  const url = page.url();
  const field = page.getByRole("textbox", { name: "Dispenser endorsement" });
  await field.focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(url);
  await page.getByRole("button", { name: "Next", exact: true }).focus();
  for (const key of ["Control+Alt+ArrowRight", "Meta+Alt+ArrowRight", "Shift+Alt+ArrowRight"]) {
    await page.keyboard.press(key);
    await expect(page).toHaveURL(url);
  }
  await jump.focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(url);
  await page.getByRole("button", { name: "Exit demo", exact: true }).click();
  await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("button", { name: "Operations", exact: true }).click();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(url);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page).toHaveURL(url);
  await page.keyboard.press("Escape");
  await page.getByRole("switch", { name: "Agent: On" }).focus();
  await expect(page.getByRole("switch", { name: "Agent: On" })).toHaveAccessibleDescription(/Off withholds recommendations/);
  await expect(page.getByRole("switch", { name: "Agent: On" })).toHaveAttribute("title", /Off withholds recommendations/);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Agent: On" })).toHaveAttribute("data-state", "checked");
  await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await expect(page).toHaveURL(/#pipeline$/);
  await expect(page.getByRole("heading", { level: 1, name: "1. The real process", exact: true })).toBeFocused();
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(/#pipeline$/);
});

test("unknown ordinary routes retain home recovery and explicit demo entry", async ({ page }) => {
  await page.goto("not-a-tour-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  const rail = page.getByTestId("demo-strip");
  await expect(rail.getByRole("button", { name: "Back", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Overview", exact: true })).toBeVisible();
  await rail.getByRole("button", { name: "Enter demo mode", exact: true }).click();
  await expect(page).toHaveURL(/#pipeline$/);
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
});

test("chapter narrative and responsive presentation in both states; selected QA screenshots", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  for (const width of [1440, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: width === 1440 ? "light" : "dark" });
    for (const fragment of ["scene", "month", "pipeline", "cases", "two-places", "close"]) {
      await page.goto(`./#${fragment}`);
      for (const enabled of [true, false]) {
        // Hash navigation preserves session state, unlike a full page reload.
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await expect(page.locator("[data-tour-prose] > p")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        if (width === 1440) await page.screenshot({ path: testInfo.outputPath(`${fragment}-${width}-light-${enabled ? "on" : "off"}.png`), fullPage: true });
      }
    }
  }
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const width of [1280, 1440]) {
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
        const rail = page.getByRole("navigation", { name: "Demo mode", exact: true });
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
        await banner.getByRole("button", { name: "NHSBSA view", exact: true }).press("Enter");
        await expect(page).toHaveURL(/\/case\/EX-24123$/);
        const pharmacyView = page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Pharmacy view", exact: true });
        await expect(pharmacyView).toHaveAttribute("href", "/pharmacy/claims?case=EX-24123");
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
        if (width === 1440) await page.screenshot({ path: testInfo.outputPath("follow-reset.png"), fullPage: true });
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
  await expect(banner.getByRole("button", { name: "Pharmacy view", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Case views" }).getByRole("link", { name: "Pharmacy view", exact: true })).toHaveAttribute("href", "/pharmacy/claims?case=EX-24112");
  await banner.getByRole("button", { name: "Pharmacy view", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/pharmacy\/claims\?case=EX-24123$/);
  await expect(page.getByRole("heading", { name: "Claim detail: EX-24123", exact: true })).toBeFocused();
});
