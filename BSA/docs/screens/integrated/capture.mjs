import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const baseURL = "http://localhost:4193";
const resume = process.argv.includes("--resume");
const previous = resume ? JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) : null;
const results = previous?.captures ?? [];
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (previous && previous.sourceRevision !== revision) throw new Error("Cannot resume captures from a different source revision");
const browser = await chromium.launch();
let runtimeError = null;
let completed = false;
const surfaces = [
  ["overview-scene", "/#scene"],
  ["overview-month", "/#month"],
  ["overview-pipeline", "/#pipeline"],
  ["overview-four-cases", "/#cases"],
  ["overview-two-places", "/#two-places"],
  ["overview-close", "/#close"],
  ["pharmacy-b", "/pharmacy"],
  ["claims", "/pharmacy/claims"],
  ["queue", "/queue"],
  ...["evaluation", "boundary", "assumptions", "architecture"].map((name) => [name, `/${name}`]),
  ...["EX-24107", "EX-24112", "EX-24119", "EX-24123", "EX-24101", "EX-24088"].flatMap((id) =>
    [["pack", ""], ["trace", "/trace"], ["record", "/record"]].map(([name, suffix]) => [`${id}-${name}`, `/case/${id}${suffix}`])),
  ["not-found", "/not-a-route"],
];
const states = ["submitted", "in_review", "information_requested", "referred_back", "resubmitted", "paid", "escalated"];
const controlStates = ["operations-menu", "reset-dialog", "queue-today", "queue-compare"];
const expectedCaptureCount = 2 * (surfaces.length + states.length + 2 + controlStates.length + 8) + 1;
await mkdir(directory, { recursive: true });

function failed(entry) {
  return entry.horizontalOverflow || entry.axeViolations.length > 0 || entry.browserErrors.length > 0;
}

async function saveManifest() {
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify({
    sourceRevision: revision, capturedAt: new Date().toISOString(),
    baseURL, build: "BSA/dist, root-path production build",
    viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    colorScheme: "light", reducedMotion: "reduce", fullPage: true,
    expectedCaptureCount, completed,
    captures: results, failures: results.filter(failed).map((entry) => entry.filename), runtimeError,
  }, null, 2)}\n`);
}

async function session(run) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await run(page, errors);
  } finally {
    await context.close();
  }
}

async function settle(page) {
  await expect(page.locator("h1")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2300);
}

async function capture(page, name, enabled, errors) {
  const filename = `${name}-${enabled ? "on" : "off"}-1440.png`;
  const existing = results.findIndex((entry) => entry.filename === filename);
  if (resume && existing >= 0 && !failed(results[existing]) && !name.startsWith("claims-detail-")) return;
  await settle(page);
  if (name === "overview-scene" && enabled) {
    const numbers = page.getByRole("region", { name: "Shared scenario estimates", exact: true }).getByRole("img");
    await expect(numbers).toHaveCount(5);
    await expect.poll(async () => numbers.evaluateAll((elements) =>
      elements.every((element) => element.textContent === element.getAttribute("aria-label")),
    )).toBe(true);
  }
  await page.mouse.move(0, 0);
  const dismiss = page.getByRole("button", { name: "Dismiss notification", exact: true });
  if (await dismiss.count()) await dismiss.click();
  await page.evaluate(() => window.scrollTo(0, 0));
  const axe = await new AxeBuilder({ page }).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await page.screenshot({ path: join(directory, filename), fullPage: true });
  const entry = {
    filename, url: page.url().replace(baseURL, ""), agent: enabled ? "on" : "off",
    heading: await page.locator("h1").innerText(),
    sha256: createHash("sha256").update(await readFile(join(directory, filename))).digest("hex"),
    horizontalOverflow: overflow,
    axeViolations: axe.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
    browserErrors: [...errors],
  };
  if (existing >= 0) results[existing] = entry;
  else results.push(entry);
  await saveManifest();
  console.log(`${results.length}: ${filename} (axe ${axe.violations.length}, overflow ${overflow}, errors ${errors.length})`);
}

async function history(page) {
  const region = page.getByRole("region", { name: "Shared case history", exact: true });
  await expect(region).toBeVisible();
  const disclosure = region.locator(":scope > details");
  if (await disclosure.getAttribute("open") === null) await disclosure.locator(":scope > summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
}

try {
  await saveManifest();
  for (const enabled of [false, true]) {
    for (const [name, path] of surfaces) {
      await session(async (page, errors) => {
        await page.goto(`${baseURL}${path}`);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await capture(page, name, enabled, errors);
      });
    }
    if (results.length !== expectedCaptureCount || new Set(results.map((entry) => entry.filename)).size !== expectedCaptureCount) {
      throw new Error(`Expected ${expectedCaptureCount} unique captures, found ${results.length}`);
    }
    completed = true;
    for (const state of states) {
      await session(async (page, errors) => {
        await page.goto(`${baseURL}/pharmacy/claims`);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await page.getByRole("combobox", { name: "Claim state", exact: true }).selectOption(state);
        await page.getByRole("list", { name: "Pharmacy claims", exact: true }).getByRole("button").first().click();
        await history(page);
        await capture(page, `claims-detail-${state}`, enabled, errors);
      });
    }
    for (const [name, label] of [["a", "Complete endorsement"], ["d", "Unreadable form"]]) {
      await session(async (page, errors) => {
        await page.goto(`${baseURL}/pharmacy`);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        await page.getByRole("radio", { name: label, exact: true }).click();
        await capture(page, `pharmacy-${name}`, enabled, errors);
      });
    }
    for (const overlay of controlStates) {
      await session(async (page, errors) => {
        await page.goto(`${baseURL}${overlay.startsWith("queue-") ? "/queue" : "/"}`);
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        if (overlay === "operations-menu") {
          await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("button", { name: "Operations", exact: true }).click();
          await expect(page.getByRole("menu")).toBeVisible();
        } else if (overlay === "reset-dialog") {
          await page.getByRole("button", { name: "Reset demo", exact: true }).click();
          await expect(page.getByRole("alertdialog")).toBeVisible();
        } else if (overlay === "queue-today") {
          await page.getByRole("button", { name: "Today", exact: true }).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
        } else {
          await page.getByRole("button", { name: "Jump to 17:00", exact: true }).click();
          await page.getByRole("region", { name: "Queue controls", exact: true }).getByRole("button", { name: "Compare", exact: true }).click();
          await expect(page.getByRole("region", { name: "Today versus With agent", exact: true })).toBeVisible();
        }
        await capture(page, overlay, enabled, errors);
      });
    }
    await session(async (page, errors) => {
      await page.goto(`${baseURL}/pharmacy`);
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await settle(page);
      await page.getByRole("button", { name: "Continue with submission", exact: true }).click();
      await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
      await page.getByRole("button", { name: "Follow this case", exact: true }).click();
      await capture(page, "roundtrip-1-submitted", enabled, errors);
      await page.getByRole("link", { name: "Switch side: NHSBSA", exact: true }).click();
      await page.getByRole("button", { name: "Start review", exact: true }).click();
      await capture(page, "roundtrip-2-review", enabled, errors);
      await page.getByRole("radio", { name: /^Refer back / }).check();
      if (enabled) await page.getByRole("checkbox", { name: "Approve this draft for the pharmacy", exact: true }).check();
      await page.getByRole("textbox", { name: /^Reason/ }).fill("Please add the dispensing date beside the initials");
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await capture(page, "roundtrip-3-referral-record", enabled, errors);
      if (enabled) {
        await page.getByRole("combobox", { name: "Replay with", exact: true }).selectOption("2026-07");
        await expect(page.getByRole("status", { name: "Replay outcome", exact: true })).toContainText("Sufficient");
        await capture(page, "roundtrip-july-sufficient", enabled, errors);
      }
      await page.getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
      await capture(page, "roundtrip-4-referral-received", enabled, errors);
      if (enabled) {
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
        await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
        await page.getByRole("button", { name: "Re-check endorsement", exact: true }).click();
      } else {
        await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill("NCSO  RK 21/08/26");
      }
      await capture(page, "roundtrip-5-corrected", enabled, errors);
      await page.getByRole("button", { name: "Resubmit claim", exact: true }).click();
      await capture(page, "roundtrip-6-resubmitted", enabled, errors);
      await page.getByRole("link", { name: "Open shared queue", exact: true }).click();
      await page.locator('[data-shared-case="EX-24112"]').getByRole("button", { name: "Open for review", exact: true }).click();
      await settle(page);
      if (!enabled) await page.getByRole("radio", { name: /^Sufficient \(human choice\)/ }).check();
      await page.getByRole("textbox", { name: /^Reason/ }).fill("Human reviewed the corrected date and complete evidence");
      await page.getByRole("button", { name: "Record decision", exact: true }).click();
      await history(page);
      await capture(page, "roundtrip-7-human-record", enabled, errors);
      await page.getByRole("link", { name: "Switch side: Pharmacy", exact: true }).click();
      await expect(page.getByRole("region", { name: "Claim detail", exact: true })).toContainText("Payment approved (synthetic)");
      await history(page);
      await capture(page, "roundtrip-8-synthetic-paid", enabled, errors);
    });
  }
} catch (error) {
  runtimeError = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  await browser.close();
  await saveManifest();
}
if (results.some(failed)) process.exitCode = 1;
