import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

const commit = process.env.CAPTURE_EXPECTED_COMMIT;
const output = process.env.WALK_OUTPUT;
if (!/^[a-f0-9]{40}$/.test(commit ?? "") || !output || !isAbsolute(output)) {
  throw new Error("Set the authorised CAPTURE_EXPECTED_COMMIT and a fresh absolute WALK_OUTPUT.");
}
const baseURL = "https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net";
await mkdir(output);
const report = {
  kind: "Actual live UI walkthrough, AI novice-perspective evaluation, not timed human testing",
  expectedLiveCommit: commit, baseURL, startedAt: new Date().toISOString(),
  viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce",
  completed: false, checkpoints: [], errors: [],
};
const save = () => writeFile(join(output, "walk.json"), `${JSON.stringify(report, null, 2)}\n`);
const browser = await chromium.launch();
const guard = "This view belongs to the other side; switch perspective to see it";

async function session(name, run) {
  const context = await browser.newContext({
    viewport: report.viewport, colorScheme: report.colorScheme, reducedMotion: report.reducedMotion,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push({ session: name, type: "page", message: error.message }));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push({ session: name, type: "console", message: message.text() });
  });
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (event) => console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`));
  });
  const identity = async () => {
    const response = await context.request.get(`${baseURL}/build-info.json`, { headers: { "Cache-Control": "no-cache" } });
    expect(response.status()).toBe(200);
    const build = await response.json();
    expect(build.commit).toBe(commit);
    expect(build.dirty).toBe(false);
    return { ...build, checkedAt: new Date().toISOString() };
  };
  const checkpoint = async (label, evidence = {}) => {
    await expect(page.locator("h1")).toBeVisible();
    const entry = {
      session: name, label, observedAt: new Date().toISOString(), url: page.url(),
      build: await identity(), evidence, snapshot: await page.locator("body").ariaSnapshot(),
      horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    };
    report.checkpoints.push(entry);
    await save();
    console.log(`${name}: ${label}`);
  };
  try {
    await identity();
    await run(page, checkpoint);
    await identity();
  } finally {
    await context.close();
    await save();
  }
}

const flag = (page) => page.getByRole("banner").getByRole("switch");
const side = async (page, name) => {
  const radio = page.getByRole("group", { name: "Perspective", exact: true }).getByRole("radio", { name, exact: true });
  await radio.check();
  await expect(radio).toBeChecked();
};
async function nav(page, name) {
  const primary = page.getByRole("navigation", { name: "Primary", exact: true });
  const mobile = primary.getByRole("button", { name: "Open navigation", exact: true });
  if (await mobile.isVisible()) {
    await mobile.click();
    await page.getByRole("dialog", { name: "Navigation", exact: true }).getByRole("link", { name, exact: true }).click();
  } else {
    await primary.getByRole("button", { name: "Operations", exact: true }).click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  }
}
const history = (page) => page.getByRole("region", { name: "Shared case history", exact: true });
async function attempts(page) {
  const disclosure = history(page).locator("details").filter({ has: page.locator("summary", { hasText: /^History and attempts/ }) }).first();
  if (await disclosure.getAttribute("open") === null) await disclosure.locator(":scope > summary").click();
  return history(page).getByRole("list", { name: "Immutable pharmacy attempts", exact: true }).innerText();
}
const claim = (page) => page.getByRole("region", { name: "Claim detail", exact: true });
const metric = (page, label) => page.getByRole("region", { name: "Selected pharmacy this month", exact: true })
  .locator("dl > div").filter({ hasText: label }).getByRole("definition");
async function openClaim(page, id) {
  const row = page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row").filter({ hasText: id });
  await row.getByRole("button").click();
  await expect(claim(page).getByRole("heading", { name: `Claim detail: ${id}`, exact: true })).toBeVisible();
}

try {
  await session("clarity-and-approved-round-trip", async (page, checkpoint) => {
    await page.goto(`${baseURL}/#month`);
    await expect(page.locator("[data-month-hours]")).toHaveText("17,000");
    await expect(page.locator("[data-month-capacity]")).toHaveText("630");
    await expect(page.locator("[data-month-detail]")).not.toHaveAttribute("open", "");
    await page.getByRole("button", { name: "About the public volume default", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toContainText("not measured total queue");
    await checkpoint("2.1 Today qualifications and primary inputs", { todayHours: 17000, manualCapacity: 630 });
    await page.keyboard.press("Escape");
    await flag(page).setChecked(true);
    await expect(page.locator("[data-month-hours]")).toHaveText("4,250");
    await expect(page.locator("[data-month-capacity]")).toHaveText("3,780");
    await checkpoint("2.2 and 2.3 one-click assistance difference", { assistedMinutes: 255002, builtCapacity: 3780 });
    await side(page, "NHSBSA");
    await nav(page, "NHSBSA queue");
    const queue = page.getByRole("region", { name: "Queue items", exact: true });
    await expect(queue.locator("thead th")).toHaveCount(6);
    await checkpoint("6.1 single counted six-column queue");
    const cleared = queue.getByRole("button").filter({ hasText: "Cleared by rules" }).first();
    await cleared.click();
    await expect(cleared).toHaveAttribute("aria-pressed", "true");
    await checkpoint("6.1 counted filter changes selected rows");
    await queue.getByRole("button").filter({ hasText: "All items" }).first().click();
    await flag(page).setChecked(false);
    await expect(page.locator('[data-queue-seed="EX-24123"]')).toContainText("Known abstention; manual work");
    await checkpoint("6.2 competent manual queue and known abstention");
    await flag(page).setChecked(true);
    await page.getByRole("button", { name: "Queue evidence and assumptions", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toContainText("assumptions");
    await checkpoint("6.2 On evidence phases and source qualification");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Compare", exact: true }).click();
    await page.getByRole("button", { name: "Run one hour", exact: true }).click();
    await expect(page.locator("[data-comparison-clock]")).toContainText("60 synthetic minutes");
    await checkpoint("6.3 real Compare then Run one hour", {
      today: await page.locator('[data-comparison-summary="today"]').innerText(),
      assisted: await page.locator('[data-comparison-summary="assisted"]').innerText(),
    });
    await page.getByRole("button", { name: "Close comparison", exact: true }).click();
    await side(page, "Pharmacy");
    await expect(page.getByRole("heading", { name: guard, exact: true })).toBeVisible();
    await nav(page, "Pharmacy claims");
    await expect(page.getByRole("table", { name: "Pharmacy claims", exact: true }).locator("thead th")).toHaveCount(5);
    await checkpoint("7.1 counted claims filters, synthetic claimed amounts and separate model");
    await openClaim(page, "EX-24112");
    await expect(claim(page)).toContainText("No operator-approved draft");
    await checkpoint("7.2 seeded unapproved reason is not relabelled");
    await flag(page).setChecked(false);
    await expect(claim(page)).toContainText("Human decision reason");
    await page.getByRole("button", { name: "How was this sent?", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toContainText("assumptions, not published");
    await checkpoint("7.2 raw reason and process provenance Off");
    await page.keyboard.press("Escape");
    await nav(page, "Pharmacy check");
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Not checked: manual submission");
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    const id = new URL(page.url()).searchParams.get("caseId");
    expect(id).toBe("EX-24112");
    const originalAttempts = await attempts(page);
    await checkpoint("Manual submission creates new immutable attempt", { id, originalAttempts });
    await side(page, "NHSBSA");
    await nav(page, "NHSBSA queue");
    await page.locator(`[data-shared-case="${id}"]`).getByRole("button", { name: "Open for review", exact: true }).click();
    await flag(page).setChecked(true);
    await page.getByRole("radio", { name: /^Refer back / }).check();
    await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
    const reason = "Live viewer review: add the dispensing date beside the initials";
    await page.getByRole("textbox", { name: /^Reason/ }).fill(reason);
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}/record$`));
    await checkpoint("Human explicitly approves draft and records referral", { id, reason });
    await side(page, "Pharmacy");
    await nav(page, "Pharmacy claims");
    await openClaim(page, id);
    await expect(page.getByRole("region", { name: "Operator-approved pharmacy note", exact: true })).toBeVisible();
    await flag(page).setChecked(false);
    await expect(claim(page)).toContainText(reason);
    await checkpoint("7.3 same recorded referral raw reason Off", { id });
    await flag(page).setChecked(true);
    await expect(page.getByRole("region", { name: "Operator-approved pharmacy note", exact: true })).toBeVisible();
    await checkpoint("7.3 one-click approved note On, actual clause/version/approver", { id });
    await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
    await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
    await expect(claim(page)).toContainText("Not checked for this edit");
    await expect(history(page).getByRole("status")).toContainText("Referred back");
    await checkpoint("Applying suggested text does not resubmit", { id });
    await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
    await expect(claim(page)).toContainText("Ready to resubmit");
    await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
    await expect(history(page).getByRole("status")).toContainText("Resubmitted");
    const resubmittedAttempts = await attempts(page);
    expect(resubmittedAttempts).toContain("21/08/26");
    await checkpoint("Explicit resubmission retains original and corrected attempts", { id, resubmittedAttempts });
    await side(page, "NHSBSA");
    await nav(page, "NHSBSA queue");
    await page.locator(`[data-shared-case="${id}"]`).getByRole("button", { name: "Open for review", exact: true }).click();
    await page.getByRole("radio", { name: /^Accept / }).check();
    await page.getByRole("textbox", { name: /^Reason/ }).fill("Human reviewed corrected endorsement and complete evidence");
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/case/${id}/record$`));
    await side(page, "Pharmacy");
    await nav(page, "Pharmacy claims");
    await page.getByRole("button").filter({ has: page.getByText("All", { exact: true }) }).click();
    await openClaim(page, id);
    await expect(history(page).getByRole("status")).toContainText("Payment approved (synthetic)");
    const finalAttempts = await attempts(page);
    expect(finalAttempts).toBe(resubmittedAttempts);
    await flag(page).setChecked(false);
    await side(page, "Both");
    expect(await attempts(page)).toBe(finalAttempts);
    await checkpoint("Same-item final synthetic disposition survives Off and Both without Reset", { id, finalAttempts });
  });
  await session("pre-submission-catch-counter", async (page, checkpoint) => {
    await page.goto(`${baseURL}/pharmacy/claims`);
    await side(page, "Pharmacy");
    await flag(page).setChecked(true);
    await expect(metric(page, "Caught before submission")).toHaveText("0");
    await openClaim(page, "EX-24112");
    const beforeAttempts = await attempts(page);
    const beforeState = await history(page).getByRole("status").innerText();
    await checkpoint("Catch starts at zero with seeded history", { beforeAttempts, beforeState });
    await nav(page, "Pharmacy check");
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
    await page.getByRole("button", { name: "Apply correction", exact: true }).click();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
    await expect(page.getByRole("link", { name: "View submitted claim", exact: true })).toHaveCount(0);
    await checkpoint("Real Apply correction followed by ready check, no receipt");
    await nav(page, "Pharmacy claims");
    await expect(metric(page, "Caught before submission")).toHaveText("1");
    await openClaim(page, "EX-24112");
    expect(await attempts(page)).toBe(beforeAttempts);
    await expect(history(page).getByRole("status")).toHaveText(beforeState);
    await checkpoint("Caught 0 to 1, unchanged lifecycle and attempts");
    await nav(page, "Pharmacy check");
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Information may be missing");
    await page.getByRole("button", { name: "Apply correction", exact: true }).click();
    await expect(page.locator("[data-pharmacy-status]")).toHaveText("Ready to submit");
    await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await expect(history(page).getByRole("status")).toContainText("Submitted");
    await expect(metric(page, "Caught before submission")).toHaveText("1");
    await checkpoint("Explicit Submit adds attempt and keeps unique caught count one");
    await side(page, "NHSBSA");
    await nav(page, "NHSBSA queue");
    const row = page.locator('[data-shared-case="EX-24112"]');
    await expect(row).toContainText("New");
    await expect(row).toContainText("Submitted, awaiting review");
    await expect(row.getByRole("button", { name: "Open for review", exact: true })).toBeVisible();
    await checkpoint("Same EX-24112 visible as actual New queue arrival");
  });
  expect(report.errors).toEqual([]);
  report.completed = true;
} catch (error) {
  report.error = error.stack ?? String(error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await save();
  await browser.close();
}
