import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

const surfaces = [
  { chapter: 2, route: "/#month", side: "both" },
  { chapter: 6, route: "/queue", side: "nhsbsa" },
  { chapter: 7, route: "/pharmacy/claims", side: "pharmacy" },
];
const perspectives = ["pharmacy", "nhsbsa", "both"];
const inventory = surfaces.flatMap((surface) => perspectives.flatMap((perspective) =>
  [false, true].map((enabled) => ({
    ...surface, perspective, enabled,
    guardExpected: surface.side !== "both" && perspective !== "both" && surface.side !== perspective,
  }))));

if (process.argv.includes("--inventory")) {
  console.log(JSON.stringify(inventory, null, 2));
} else {
  await run();
}

async function run() {
  const expectedCommit = process.env.CAPTURE_EXPECTED_COMMIT;
  const output = process.env.CAPTURE_OUTPUT;
  const baseURL = process.env.CAPTURE_BASE_URL ?? "https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net";
  if (!/^[a-f0-9]{40}$/.test(expectedCommit ?? "")) throw new Error("Set CAPTURE_EXPECTED_COMMIT to the coordinator-released full source SHA.");
  if (!output || !isAbsolute(output) || /onedrive/i.test(output)) throw new Error("Set CAPTURE_OUTPUT to a new absolute run directory outside OneDrive.");
  const origin = new URL(baseURL);
  if (origin.protocol !== "https:" && !(origin.protocol === "http:" && origin.hostname === "localhost" && origin.port === "4193")) {
    throw new Error("Use HTTPS live hosting or the allocated http://localhost:4193 preview.");
  }
  const repository = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  execFileSync("git", ["merge-base", "--is-ancestor", expectedCommit, sourceRevision], { stdio: "pipe" });
  execFileSync("git", ["diff", "--exit-code", expectedCommit, "--",
    "BSA/src", "BSA/public", "BSA/scripts", "BSA/build", "BSA/package.json",
    "BSA/package-lock.json", "BSA/index.html", "BSA/vite.config.ts", "hosting.config.json",
  ], { stdio: "pipe" });
  if (resolve(output).toLowerCase().startsWith(`${resolve(repository).toLowerCase()}\\`)) {
    throw new Error("Capture outside the worktree; copy reviewed evidence into docs only after completion.");
  }
  await mkdir(output);
  await mkdir(join(output, "axe"));
  const report = {
    kind: origin.hostname === "localhost" ? "local production capture" : "live capture",
    sourceRevision, applicationSourceRevision: expectedCommit, baseURL,
    startedAt: new Date().toISOString(), completed: false,
    viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    colorScheme: "light", reducedMotion: "reduce",
    expectedCaptureCount: inventory.length, captures: [], error: null,
  };
  const save = () => writeFile(join(output, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await save();
  const browser = await chromium.launch();
  report.browserVersion = browser.version();
  try {
    for (const item of inventory) {
      const context = await browser.newContext({
        viewport: report.viewport, deviceScaleFactor: report.deviceScaleFactor,
        colorScheme: report.colorScheme, reducedMotion: report.reducedMotion,
      });
      try {
        const page = await context.newPage();
        const errors = [];
        const resources = new Map();
        page.on("pageerror", (error) => errors.push({ type: "page", message: error.message }));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push({ type: "console", message: message.text() });
        });
        await page.addInitScript(() => {
          window.addEventListener("securitypolicyviolation", (event) => {
            console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`);
          });
        });
        page.on("response", (response) => {
          const url = new URL(response.url());
          if (url.origin === origin.origin && /\/assets\/|\/favicon\.ico$/.test(url.pathname)) {
            resources.set(url.pathname, response);
          }
        });
        const identityBefore = await identity(context.request, baseURL, expectedCommit);
        const response = await page.goto(new URL(item.route, baseURL).href);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toBeVisible();
        const perspectiveName = { pharmacy: "Pharmacy", nhsbsa: "NHSBSA", both: "Both" }[item.perspective];
        const selectedPerspective = page.getByRole("group", { name: "Perspective", exact: true })
          .getByRole("radio", { name: perspectiveName, exact: true });
        await selectedPerspective.check();
        await expect(selectedPerspective).toBeChecked();
        await page.getByRole("switch", { name: /^Agent: / }).setChecked(item.enabled);
        await expect(page).toHaveURL(new URL(item.route, baseURL).href);
        await expect(page.locator("h1")).toBeVisible();
        const guardHeading = page.getByRole("heading", {
          name: "This view belongs to the other side; switch perspective to see it", exact: true,
        });
        if (item.guardExpected) {
          await expect(guardHeading).toBeVisible();
          await expect(page.getByRole("button", {
            name: item.side === "nhsbsa" ? "Switch to NHSBSA" : "Switch to Pharmacy", exact: true,
          })).toBeVisible();
        } else {
          await expect(guardHeading).toHaveCount(0);
          await expect(page.locator("h1")).toHaveText(
            item.chapter === 2 ? "A month in numbers" : item.chapter === 6 ? "NHSBSA exception queue" : "Pharmacy claims",
          );
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(2500);
        const monthlyTargets = item.chapter === 2 ? {
          hours: new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(item.enabled ? 255002 / 60 : 17000),
          capacity: new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(item.enabled ? 3780 : 630),
        } : null;
        if (item.chapter === 2) {
          const hours = page.locator("[data-month-hours]");
          const capacity = page.locator("[data-month-capacity]");
          await expect(hours).toHaveText(monthlyTargets.hours);
          await expect(capacity).toHaveText(monthlyTargets.capacity);
          for (const tile of [hours, capacity]) {
            const number = tile.getByRole("img");
            await expect.poll(async () => number.evaluate((element) =>
              element.textContent === element.getAttribute("aria-label"),
            )).toBe(true);
          }
        }
        await page.mouse.move(0, 0);
        await page.evaluate(() => window.scrollTo(0, 0));
        const observedAt = new Date().toISOString();
        const snapshot = await page.locator("body").ariaSnapshot();
        const heading = await page.locator("h1").innerText();
        const text = await page.locator("main").innerText();
        const audit = await new AxeBuilder({ page }).analyze();
        const name = `chapter-${item.chapter}-${item.perspective}-${item.enabled ? "on" : "off"}`;
        const filename = `${name}-1440.png`;
        await page.screenshot({ path: join(output, filename), fullPage: true });
        await writeFile(join(output, `${name}.aria.txt`), snapshot);
        const auditFile = `axe/${name}.json`;
        await writeFile(join(output, "axe", `${name}.json`), `${JSON.stringify({
          sourceRevision, applicationSourceRevision: expectedCommit, url: page.url(),
          testEngine: audit.testEngine, timestamp: audit.timestamp,
          violations: audit.violations, incomplete: audit.incomplete,
          passes: audit.passes.map(({ id, nodes }) => ({ id, nodeCount: nodes.length })),
          inapplicable: audit.inapplicable.map(({ id }) => id),
        }, null, 2)}\n`);
        const resourceHashes = [];
        for (const [path, resource] of resources) {
          const body = await resource.body();
          resourceHashes.push({ path, status: resource.status(), bytes: body.length, sha256: hash(body) });
        }
        const headers = await response.allHeaders();
        const entry = {
          ...item, filename, observedAt, url: page.url(), heading, text,
          expectedPresentation: item.guardExpected ? "opposite-side guard" : "chapter content",
          presentationVerified: true,
          monthlyTargetsVerified: monthlyTargets ? { ...monthlyTargets, visualMatchesAccessibleValue: true } : null,
          visualReview: "pending", identityBefore,
          identityAfter: await identity(context.request, baseURL, expectedCommit),
          sha256: hash(await readFile(join(output, filename))),
          auditFile, axeViolations: audit.violations.length, axeIncomplete: audit.incomplete.length,
          horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          tableHeaders: await page.locator("table").evaluateAll((tables) =>
            tables.map((table) => [...table.querySelectorAll("thead th")].map((cell) => cell.textContent))),
          errors, resourceHashes,
          headers: Object.fromEntries(["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"]
            .map((name) => [name, headers[name] ?? null])),
        };
        report.captures.push(entry);
        if (item.guardExpected) {
          await page.getByRole("button", {
            name: item.side === "nhsbsa" ? "Switch to NHSBSA" : "Switch to Pharmacy", exact: true,
          }).click();
          await expect(guardHeading).toHaveCount(0);
          await expect(page).toHaveURL(new URL(item.route, baseURL).href);
          entry.guardRecovery = "Visible switch exposed the permitted chapter without changing the URL.";
        }
        await save();
        console.log(`${report.captures.length}/${inventory.length}: ${name}; expected ${entry.expectedPresentation}; axe ${entry.axeViolations}; errors ${errors.length}`);
      } finally {
        await context.close();
      }
    }
    report.completed = report.captures.length === inventory.length;
    report.completedAt = new Date().toISOString();
    report.failures = report.captures.filter((entry) =>
      entry.axeViolations || entry.horizontalOverflow || entry.errors.length ||
      !entry.headers["content-security-policy"] || entry.resourceHashes.some((resource) => resource.status !== 200),
    ).map((entry) => entry.filename);
    if (!report.completed || report.failures.length) process.exitCode = 1;
  } catch (error) {
    report.error = error.stack ?? String(error);
    process.exitCode = 1;
  } finally {
    await save();
    await browser.close();
  }
}

async function identity(request, baseURL, expectedCommit) {
  const response = await request.get(new URL("/build-info.json", baseURL).href, { headers: { "Cache-Control": "no-cache" } });
  expect(response.status()).toBe(200);
  const build = await response.json();
  expect(build.commit).toBe(expectedCommit);
  expect(build.dirty).toBe(false);
  expect(Number.isFinite(Date.parse(build.builtAt))).toBe(true);
  return build;
}

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
