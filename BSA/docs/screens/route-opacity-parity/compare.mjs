import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const directory = dirname(fileURLToPath(import.meta.url));
const baselineDirectory = join(directory, "..", "integrated");
const baseline = JSON.parse(await readFile(join(baselineDirectory, "manifest.json"), "utf8"));
const oldBuild = JSON.parse(await readFile(join(baselineDirectory, "build-evidence.json"), "utf8"));
const oldSource = "898cda594d0dcb34376bddab7112edcddb172440";
const newSource = "82c18e49e7d1c765e5392b1bec5c028c8f89fd16";
const baseURL = "http://localhost:4193";
const runtimePaths = ["BSA/src", "BSA/scripts", "BSA/package.json", "BSA/package-lock.json", "BSA/vite.config.ts"];
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
git("diff", "--exit-code", newSource, "--", ...runtimePaths);
const runtimeDiff = git("diff", "--no-ext-diff", `${oldSource}..${newSource}`, "--", ...runtimePaths);
const changedRuntimeFiles = git("diff", "--name-only", `${oldSource}..${newSource}`, "--", ...runtimePaths);
if (changedRuntimeFiles !== "BSA/src/components/app-shell.tsx") throw new Error("Runtime scope differs from the approved one-file comparison");
if (baseline.applicationSourceRevision !== oldSource || !baseline.completed) throw new Error("Unexpected or incomplete baseline manifest");

const names = [
  "overview-scene", "overview-month", "overview-pipeline", "overview-four-cases",
  "overview-two-places", "overview-close", "pharmacy-b", "claims", "queue",
  "evaluation", "boundary", "assumptions", "architecture",
  ...["EX-24107", "EX-24112", "EX-24119", "EX-24123", "EX-24101", "EX-24088"]
    .flatMap((id) => ["pack", "trace", "record"].map((view) => `${id}-${view}`)),
  "not-found",
];
const selectedNames = new Set(names.flatMap((name) => ["off", "on"].map((mode) => `${name}-${mode}-1440.png`)));
const selected = baseline.captures.filter((entry) => selectedNames.has(entry.filename));
if (selected.length !== 64 || selectedNames.size !== 64) throw new Error("Expected exactly 64 route-entry comparisons");

await mkdir(directory, { recursive: true });
await mkdir(join(directory, "differences"), { recursive: true });
await mkdir(join(directory, "axe"), { recursive: true });
await writeFile(join(directory, "runtime-diff.patch"), `${runtimeDiff}\n`);
const dist = join(directory, "..", "..", "..", "dist");
async function emittedFiles(folder, prefix = "") {
  const results = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) results.push(...await emittedFiles(join(folder, entry.name), relative));
    else if (entry.isFile()) {
      const bytes = await readFile(join(folder, entry.name));
      results.push({ file: relative, bytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 9 }).length, sha256: sha256(bytes) });
    }
  }
  return results.sort((a, b) => a.file.localeCompare(b.file));
}
const files = await emittedFiles(dist);
const pythonGzip = JSON.parse(execFileSync("python", ["-c",
  "import pathlib,gzip,json,zlib,sys; p=pathlib.Path(sys.argv[1]); print(json.dumps({'version':zlib.ZLIB_RUNTIME_VERSION,'files':{f.relative_to(p).as_posix():len(gzip.compress(f.read_bytes(),mtime=0)) for f in p.rglob('*') if f.is_file()}}))",
  dist], { encoding: "utf8" }));
for (const file of files) file.pythonComparableGzipBytes = pythonGzip.files[file.file];
const build = {
  applicationSourceRevision: newSource,
  priorBuildEvidence: "../integrated/build-evidence.json",
  priorGzipTotalBytes: oldBuild.gzipTotalBytes,
  method: "Sum of independent Node zlib.gzipSync level9 resources for every emitted dist file; informational only, no threshold",
  files, gzipTotalBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
  nodeZlibVersion: process.versions.zlib,
  pythonComparableMethod: "Independent Python gzip.compress(data,mtime=0), default level9, matching the original build-evidence method",
  pythonComparableGzipTotalBytes: files.reduce((sum, file) => sum + file.pythonComparableGzipBytes, 0),
  pythonZlibVersion: pythonGzip.version,
};
await writeFile(join(directory, "build-evidence.json"), `${JSON.stringify(build, null, 2)}\n`);
const policy = JSON.parse(await readFile(join(dist, "staticwebapp.config.json"), "utf8"));
const comparisons = [];
let completed = false;
let runtimeError = null;
const browser = await chromium.launch();
async function checkpoint() {
  await writeFile(join(directory, "route-equivalence.json"), `${JSON.stringify({
    oldApplicationSourceRevision: oldSource, newApplicationSourceRevision: newSource,
    checkoutRevision: git("rev-parse", "HEAD"), completedAt: completed ? new Date().toISOString() : null,
    baseURL, viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    colorScheme: "light", reducedMotion: "reduce", fullPage: true,
    baselineManifest: "../integrated/manifest.json", buildEvidence: "build-evidence.json",
    runtimeDiff: "runtime-diff.patch", expectedComparisons: 64, completed, runtimeError,
    identicalCount: comparisons.filter((entry) => entry.byteIdentical).length,
    differentCount: comparisons.filter((entry) => !entry.byteIdentical).length,
    retainedOriginalStateImages: 43, comparisons,
  }, null, 2)}\n`);
}
try {
  await checkpoint();
  for (const entry of selected) {
    const originalBytes = await readFile(join(baselineDirectory, entry.filename));
    if (sha256(originalBytes) !== entry.sha256) throw new Error(`Baseline hash mismatch: ${entry.filename}`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
      colorScheme: "light", reducedMotion: "reduce",
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.addInitScript(() => {
        window.addEventListener("securitypolicyviolation", (event) => console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`));
      });
      const response = await page.goto(`${baseURL}${entry.url}`);
      for (const [name, value] of Object.entries(policy.globalHeaders)) {
        expect(response.headers()[name.toLowerCase()], name).toBe(value);
      }
      await page.getByRole("banner").getByRole("switch").setChecked(entry.agent === "on");
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2300);
      if (entry.filename === "overview-scene-on-1440.png") {
        const numbers = page.getByRole("region", { name: "Shared scenario estimates", exact: true }).getByRole("img");
        await expect(numbers).toHaveCount(5);
        await expect.poll(() => numbers.evaluateAll((elements) => elements.every((element) =>
          element.textContent === element.getAttribute("aria-label")))).toBe(true);
      }
      await page.mouse.move(0, 0);
      const dismiss = page.getByRole("button", { name: "Dismiss notification", exact: true });
      if (await dismiss.count()) await dismiss.click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const audit = await new AxeBuilder({ page }).analyze();
      const visualState = await page.locator('main [class*="motion-safe:slide-in-from-bottom-"]').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          opacity: style.opacity, transform: style.transform,
          animationName: style.animationName, animationCount: element.getAnimations().length,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const currentBytes = await page.screenshot({ fullPage: true });
      const currentHash = sha256(currentBytes);
      const byteIdentical = originalBytes.equals(currentBytes);
      const currentImage = byteIdentical ? null : `differences/${entry.filename}`;
      if (currentImage) await writeFile(join(directory, currentImage), currentBytes);
      const auditFile = `axe/${entry.filename.replace(".png", ".json")}`;
      await writeFile(join(directory, auditFile), `${JSON.stringify({
        applicationSourceRevision: newSource, url: entry.url, agent: entry.agent,
        testEngine: audit.testEngine, timestamp: audit.timestamp, violations: audit.violations,
        passes: audit.passes.map(({ id, nodes }) => ({ id, nodeCount: nodes.length })),
        incomplete: audit.incomplete.map(({ id, nodes }) => ({ id, nodeCount: nodes.length })),
        inapplicable: audit.inapplicable.map(({ id }) => id),
      }, null, 2)}\n`);
      comparisons.push({
        filename: entry.filename, url: entry.url, agent: entry.agent,
        originalImage: `../integrated/${entry.filename}`,
        originalSha256: entry.sha256, reproducedSha256: currentHash, byteIdentical,
        currentImage, auditFile, checkedAt: new Date().toISOString(),
        visualState, browserErrors: errors, axeViolations: audit.violations.map(({ id }) => id),
      });
      await checkpoint();
      console.log(`${comparisons.length}/64 ${entry.filename}: ${byteIdentical ? "BYTE IDENTICAL" : "DIFFERENT"}; axe=${audit.violations.length}; errors=${errors.length}`);
      expect(errors).toEqual([]);
      expect(audit.violations).toEqual([]);
      expect(visualState).toMatchObject({ opacity: "1", transform: "none", animationCount: 0, reducedMotion: true, horizontalOverflow: false });
    } finally {
      await context.close();
    }
  }
  completed = comparisons.length === 64;
} catch (error) {
  runtimeError = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  await browser.close();
  await checkpoint();
}
