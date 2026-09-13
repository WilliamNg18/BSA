import { cases, captureCheckpoint, captureJson, confirmReset, expect, staticRoutes, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";

/** Executes in the rendered page: no source-code word counting or truncation. */
function auditProse() {
  const panelSelector = '[data-prose], section, article, details, [data-slot="card"], li, dd, dl > div';
  const words = (text: string) => (text.match(/[\p{L}\p{N}]+(?:['’/.,-][\p{L}\p{N}]+)*/gu) ?? []).length;
  const visible = (el: Element) => el.getClientRects().length > 0 && !el.closest('[hidden], [aria-hidden="true"]');
  const groups = new Map<Element, string[]>();
  const failures: { kind: string; words: number; text: string }[] = [];
  // Narrative is found independently of data-prose. Semantic headings, control
  // labels, tables of values and tagged status/number labels are not paragraphs.
  const candidates = Array.from(document.querySelectorAll('p, blockquote, [data-slot="card-description"], [data-slot="alert-description"], [data-copy="label"], li'));
  for (const element of candidates) {
    if (!visible(element) || element.closest('nav, [role="listbox"]')) continue;
    if (element.matches('li') && element.querySelector('p, blockquote, dl, li, h2, h3')) continue;
    if (element.matches('blockquote, [data-slot="alert-description"]') && element.querySelector('p, ul, dl')) continue;
    const text = (element as HTMLElement).innerText.trim();
    const count = words(text);
    if (count > 25) failures.push({ kind: "paragraph", words: count, text });
    // Labels and structured table values have an individual cap too: adding
    // a badge, link or label attribute must never exempt an oversized paragraph.
    if (element.closest('table, [role="tooltip"], [data-copy="label"]') || element.querySelector('[data-slot="badge"]')) continue;
    const owner = element.matches('li, [data-prose]') ? element : element.parentElement?.closest(panelSelector) ?? element.parentElement!;
    const texts = groups.get(owner) ?? [];
    texts.push(text);
    groups.set(owner, texts);
  }
  // Structured data is not aggregated as narrative, but cannot conceal a long
  // paragraph by changing its tag from p to dd.
  for (const element of document.querySelectorAll('dd')) {
    if (!visible(element) || element.querySelector('p, dl, ul')) continue;
    const text = (element as HTMLElement).innerText.trim();
    if (words(text) > 25) failures.push({ kind: "structured-prose", words: words(text), text });
  }
  // Catch prose disguised as a plain div/span, including alert/status copy.
  // Inspect direct text nodes only, avoiding duplicate descendant paragraphs.
  for (const element of document.querySelectorAll('main div, main span, main td')) {
    if (!visible(element) || element.closest('button, label, [role="switch"]')) continue;
    const text = Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join(" ").trim();
    if (words(text) > 25) failures.push({ kind: "unmarked-prose", words: words(text), text });
  }
  for (const [panel, texts] of groups) {
    const text = texts.join(" ");
    if (words(text) > 25) failures.push({ kind: `panel:${panel.getAttribute("data-prose") ?? panel.tagName}`, words: words(text), text });
  }
  return { paragraphs: candidates.filter(visible).length, panels: groups.size, failures };
}

for (const enabled of [false, true]) {
  test(`Task4 pharmacy interactive copy cap On=${enabled}`, async ({ page }, info) => {
    await page.goto("pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const audits = [];
    for (const scenario of ["Complete endorsement", "Information missing", "Unreadable form"]) {
      await page.getByRole("radio", { name: scenario, exact: true }).click();
      await expect(page.locator("[data-pharmacy-status]")).not.toHaveText("Scripted check in progress");
      audits.push({ scenario, phase: "check", ...await page.evaluate(auditProse) });
      await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
      const timeline = page.getByRole("list", { name: "Submission timeline", exact: true });
      await expect(timeline.locator(":scope > li")).toHaveCount(scenario === "Complete endorsement" ? 2 : 1);
      const jump = page.getByRole("button", { name: "Jump to end", exact: true });
      if (scenario === "Complete endorsement") await jump.click();
      await expect(jump).toBeDisabled();
      await page.locator("main details").evaluateAll((elements) => elements.forEach((element) => element.setAttribute("open", "")));
      await expect(page.getByLabel("Month end days · Assumption", { exact: true })).toHaveCount(0);
      audits.push({ scenario, phase: "recorded-receipt", ...await page.evaluate(auditProse) });
      if (scenario === "Unreadable form") {
        await page.getByLabel("Declared quantity", { exact: true }).fill("-1");
        await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
        await expect(page.getByRole("alert")).toContainText("Declared quantity must be a positive whole number or left blank.");
        audits.push({ scenario, phase: "invalid-declaration", ...await page.evaluate(auditProse) });
        await page.getByLabel("Declared quantity", { exact: true }).fill("");
      }
      if (enabled && scenario === "Information missing") {
        await page.getByRole("button", { name: "Apply fix", exact: true }).click();
        await expect(page.locator("[data-pharmacy-status]")).toHaveText("Complete: will flow to automated pricing");
        audits.push({ scenario, phase: "corrected", ...await page.evaluate(auditProse) });
      }
    }
    await captureJson(info, "task4-copy", audits);
    console.info("Advisory word budget: 25", audits.flatMap(({ scenario, phase, failures }) => failures.map((failure) => ({ scenario, phase, ...failure }))));
  });
}

for (const enabled of [false, true]) {
  test(`Task6 interactive comparison and recorded decision copy On=${enabled}`, async ({ page }, info) => {
    await page.goto("case/EX-24112");
    await startDemonstrationReview(page);
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    if (enabled) await page.getByRole("button", { name: "Compare manual view", exact: true }).click();
    const audits = [{ state: "pack-comparison", ...await page.evaluate(auditProse) }];
    await page.getByLabel("Reason (required)", { exact: true }).fill("Human review confirms missing evidence");
    if (enabled) await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption("SYN-NCSO");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Record DR-000873", exact: true })).toBeVisible();
    audits.push({ state: "human-record", ...await page.evaluate(auditProse) });
    if (enabled) {
      for (const [version, month, outcome] of [["2026-07", "July", "Sufficient: release to pricing once confirmed"], ["2026-08", "August", "Refer back with the exact fix"], ["2026-09", "September", "Refer back with the exact fix"]]) {
        await page.getByRole("combobox", { name: "Replay with", exact: true }).selectOption(version);
        const card = page.locator('[data-slot="card"]').filter({ has: page.getByText(`Replayed under ${month} 2026`, { exact: true }) });
        await expect(card.getByRole("blockquote")).toHaveText(version === "2026-07"
          ? '"Dispensing-month concession: endorse NCSO, initialled by or on behalf of the contractor."'
          : '"Dispensing-month concession: endorse NCSO, initialled and dated by or on behalf of the contractor."');
        await expect(card.getByRole("listitem")).toHaveText(version === "2026-07"
          ? ["Endorsement present: met", "Initialled by or on behalf of the contractor: met"]
          : ["Endorsement present: met", "Initialled by or on behalf of the contractor: met", "Dated: not met"]);
        await expect(card.getByRole("status", { name: "Replay outcome" })).toHaveText(outcome);
        // Audit aggregate prose without changing the checker or exempting tags.
        audits.push({ state: `${month.toLowerCase()}-replay`, ...await page.evaluate(auditProse) });
        await captureCheckpoint(page, info, `record-${month.toLowerCase()}-replay`);
      }
    }
    await captureJson(info, "task6-copy", audits);
    console.info("Advisory word budget: 25", audits.flatMap((audit) => audit.failures));
  });
}

test("copy cap positive controls reject long prose and split-paragraph evasion", async ({ page }) => {
  await page.setContent(`<main><section data-prose="test"><h1>Heading excluded</h1><p>${"word ".repeat(26)}</p></section><section><p>${"word ".repeat(15)}</p><p>${"word ".repeat(15)}</p></section><p data-copy="label">${"label ".repeat(26)}</p><p><span data-slot="badge">Status</span>${"badge ".repeat(26)}</p><ul><li><a href="#">Link</a>${"linked ".repeat(26)}</li></ul><div>${"untagged ".repeat(26)}</div><dl><dd>${"definition ".repeat(26)}</dd></dl></main>`);
  const result = await page.evaluate(auditProse);
  expect(result.failures).toEqual(expect.arrayContaining([
    expect.objectContaining({ kind: "paragraph", words: 26 }),
    expect.objectContaining({ kind: "panel:SECTION", words: 30 }),
    expect.objectContaining({ kind: "paragraph", text: expect.stringContaining("label label") }),
    expect.objectContaining({ kind: "paragraph", text: expect.stringContaining("badge badge") }),
    expect.objectContaining({ kind: "paragraph", text: expect.stringContaining("linked linked") }),
    expect.objectContaining({ kind: "unmarked-prose", words: 26 }),
    expect.objectContaining({ kind: "structured-prose", words: 26 }),
  ]));
});

for (const enabled of [false, true]) {
  test(`Task9 shared claims narrative cap across every state On=${enabled}`, async ({ page }, info) => {
    await page.goto("pharmacy/claims");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const audits = [];
    for (const [state, labels] of Object.entries(LIFECYCLE_LABELS)) {
      await page.locator('[aria-label="Claim filters"]').getByRole("button", { name: /^All / }).click();
      const row = page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row").filter({ has: page.getByRole("cell", { name: labels.pharmacy, exact: true }) }).first();
      const id = await row.getByRole("rowheader").innerText();
      await row.getByRole("button").click();
      await expect(page.getByRole("heading", { name: `Claim detail: ${id}`, exact: true })).toBeVisible();
      if (enabled && state === "referred_back") await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      await page.locator("main details").evaluateAll((elements) => elements.forEach((el) => el.setAttribute("open", "")));
      audits.push({ state, ...await page.evaluate(auditProse) });
    }
    await captureJson(info, "claims-copy", audits);
    console.info("Advisory word budget: 25", audits.flatMap(({ state, failures }) => failures.map((failure) => ({ state, ...failure }))));
  });
}

for (const enabled of [false, true]) {
  test(`rendered copy cap all routes, expanded panels, assistance=${enabled}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const routes = [...staticRoutes.map((r) => r.path || "./#scene"), ...["month", "pipeline", "cases", "two-places", "close"].map((c) => `./#${c}`), ...cases.flatMap(({ id }) => [`case/${id}`, `case/${id}/trace`, `case/${id}/record`]), "unknown-page", "case/UNKNOWN"];
    const results = [];
    for (const route of routes) {
      await page.goto(route);
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await page.locator("main details").evaluateAll((elements) => elements.forEach((el) => el.setAttribute("open", "")));
      await expect(page.locator("body")).not.toContainText(/\.pdf\b|\.docx?\b|William Ng|Embrace the Change|complete-pack/i);
      if (enabled && route === "case/EX-24123") {
        await expect(page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true }))
          .toContainText("Original source: declared by the pharmacy, not read from the form");
      }
      const result = await page.evaluate(auditProse);
      results.push({ route, ...result });
    }
    await captureJson(testInfo, "rendered-copy", results);
    console.info("Advisory word budget: 25", results.flatMap(({ route, failures }) => failures.map((f) => ({ route, ...f }))));
  });
}

test("fresh session and reset are Off; shared transition is presentation-only and reversible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("queue");
  const flag = page.getByRole("banner").getByRole("switch");
  await expect(flag).not.toBeChecked();
  const states = await page.locator('[data-queue-state]').allTextContents();
  await page.clock.install({ time: new Date("2026-09-10T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-10T12:00:10Z"));
  await flag.setChecked(true);
  const host = page.locator('[data-assistance-host]');
  await expect(host).toHaveAttribute("data-phase", "preparing");
  await expect(page.getByRole("status").filter({ hasText: "Preparing assistance" })).toBeVisible();
  await page.clock.runFor(1999);
  await expect(host).toHaveAttribute("data-phase", "preparing");
  await page.clock.runFor(1);
  await expect(host).toHaveAttribute("data-phase", "assisted");
  await flag.setChecked(false);
  await expect(host).toHaveAttribute("data-phase", "preparing");
  await page.clock.runFor(2000);
  await expect(host).toHaveAttribute("data-phase", "manual");
  await expect(page.locator('[data-queue-state]')).toHaveText(states);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await flag.setChecked(true);
  await expect(host).toHaveAttribute("data-phase", "assisted");
  await flag.setChecked(false);
  await expect(host).toHaveAttribute("data-phase", "manual");
  await flag.setChecked(true);
  await confirmReset(page);
  await expect(flag).not.toBeChecked();
  await expect(host).toHaveAttribute("data-phase", "manual");
  await expect(page.locator('[data-queue-state]')).toHaveText(states);
});

test("pain markers provide keyboard text and do not resolve abstention", async ({ page }) => {
  await page.goto("./#cases");
  // Await the route's initial focus effect before moving keyboard focus away.
  await expect(page.locator("h1[data-tour-heading]")).toBeFocused();
  const marker = page.locator('[data-case="B"] [data-pain-marker]');
  // Focusing an offscreen trigger scrolls it, which dismisses its Radix tooltip.
  // Finish scrolling first, then exercise the same keyboard tooltip assertions.
  await marker.scrollIntoViewIfNeeded();
  await marker.focus();
  await expect(marker).toBeFocused();
  const tooltip = page.getByRole("tooltip", { name: "Evidence needs review", exact: true });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText("Evidence needs review");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await expect(marker).toHaveAttribute("data-pain-marker", "resolved");
  const d = page.locator('[data-case="D"]');
  await expect(d).toHaveAttribute("data-case-routing", "type1_capture");
  await expect(d.locator("[data-outcome], [data-pain-marker]")).toHaveCount(0);
  const capture = d.getByRole("region", { name: "Awaiting Type 1 capture", exact: true });
  await expect(capture).toContainText("Proposed: confirm a pharmacy declaration beside the unreadable image.");
  await expect(capture).toContainText("Unreconciled evidence still abstains. Human-confirmed compatible declarations can support a built case, never invented image certainty.");
});

for (const enabled of [false, true]) {
  test(`Task19 expanded queue and actual historical staff case copy report On=${enabled}`, async ({ page }, info) => {
    await page.goto("queue"); await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.locator("main details").evaluateAll((elements) => elements.forEach((el) => el.setAttribute("open", "")));
    const audits = [{ state: "expanded-queue", ...await page.evaluate(auditProse) }];
    await page.locator('a[href="/case/EX-24088"]').first().click();
    await expect(page).toHaveURL(/\/case\/EX-24088$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Human decision recorded");
    audits.push({ state: "actual-staff-case", ...await page.evaluate(auditProse) });
    await captureJson(info, "task5-copy", audits);
    console.info("Advisory queue word counts", audits.flatMap((audit) => audit.failures));
    await expect(page.getByRole("region", { name: "Shared case history", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Record decision", exact: true })).toHaveCount(0);
  });
}