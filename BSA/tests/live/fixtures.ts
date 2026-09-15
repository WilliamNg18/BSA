import AxeBuilder from "@axe-core/playwright";
import type { APIRequestContext, Page, TestInfo } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { captureJson, test as existingTest, expect } from "../e2e/fixtures";
import { isBuildInfo } from "./settings";
import { installRouteCommitDiagnostics, routeDiagnosticsEnabled } from "../support/route-commit-diagnostics";
import {
  runtimeProfileEnabled, RuntimeProfileSetupError, startChromiumRuntimeProfile, type RuntimeProfileManifest,
} from "../support/chromium-runtime-profile";
import { THIN_TIMED_TRACE } from "../support/timed-trace-policy";

async function verifyBuild(request: APIRequestContext, info: TestInfo, phase: string) {
  const response = await request.get("/build-info.json");
  const text = await response.text();
  await captureJson(info, `build-${phase}`, {
    checkedAt: new Date().toISOString(), url: response.url(), status: response.status(),
    expectedCommit: process.env.EXPECTED_BUILD_COMMIT, body: text,
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json\b/);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const body: unknown = JSON.parse(text);
  expect(isBuildInfo(body), "Build identity must contain commit, UTC builtAt and dirty").toBe(true);
  if (!isBuildInfo(body)) throw new Error("Invalid deployed build identity.");
  await captureJson(info, `identity-${phase}`, { url: response.url(), actualBuildCommit: body.commit, ...body });
  expect(body.commit).toBe(process.env.EXPECTED_BUILD_COMMIT?.toLowerCase());
  expect(body.dirty, "A release must be built from a clean commit").toBe(false);
}

export const test = existingTest.extend<{ buildIdentity: void; routeDiagnostics: void; runtimeProfile: void }>({
  buildIdentity: [async ({ request }, use, info) => {
    await verifyBuild(request, info, "before");
    await use();
    await verifyBuild(request, info, "after");
  }, { auto: true }],
  routeDiagnostics: [async ({ page }, use, info) => {
    if (!routeDiagnosticsEnabled(info.config.metadata, info.project.use.baseURL)) {
      await use();
      return;
    }
    const diagnostics = await installRouteCommitDiagnostics(page);
    diagnostics.mark("test-start");
    const collect = async () => {
      const originalStatus = info.status;
      diagnostics.mark(`test-outcome:${originalStatus}`);
      try {
        await captureJson(info, "route-commit-diagnostics", {
          originalStatus, expectedCommit: process.env.EXPECTED_BUILD_COMMIT,
          ...await diagnostics.collect(),
        });
      } catch (error) {
        await captureJson(info, "route-commit-diagnostic-error", {
          originalStatus, message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
    try {
      await use();
    } finally {
      await collect();
    }
  }, { auto: true }],
  runtimeProfile: [async ({ page }, use, info) => {
    const baseURL = info.project.use.baseURL;
    if (!runtimeProfileEnabled(info.config.metadata, baseURL)) {
      await use();
      return;
    }
    const expectedCommit = process.env.EXPECTED_BUILD_COMMIT;
    if (!baseURL || !expectedCommit) throw new Error("Runtime profiling requires an exact build and local URL.");
    const attachProfile = async (manifest: RuntimeProfileManifest, originalStatus: string | undefined, phase: "setup" | "after-outcome") => {
      await captureJson(info, "runtime-profile-manifest", { originalStatus: originalStatus ?? "not-reported", phase, ...manifest });
      if (manifest.cpu) await info.attach("cpu-profile", { path: manifest.cpu.path, contentType: "application/json" });
      if (manifest.trace.path) await info.attach("chromium-runtime-trace", { path: manifest.trace.path, contentType: "application/json" });
    };
    let profile: Awaited<ReturnType<typeof startChromiumRuntimeProfile>>;
    try {
      profile = await startChromiumRuntimeProfile(page, info.outputPath("runtime-profile"), baseURL, expectedCommit);
    } catch (error) {
      if (error instanceof RuntimeProfileSetupError) await attachProfile(error.manifest, "not-run", "setup");
      await captureJson(info, "runtime-profile-error", {
        originalStatus: "not-run", phase: "setup", message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    const collect = async () => {
      const originalStatus = info.status;
      try {
        const manifest = await profile.collect();
        await attachProfile(manifest, originalStatus, "after-outcome");
        if (!manifest.complete) {
          throw new Error(`Runtime profile is incomplete (${manifest.stopReason}): ${manifest.errors.map((error) => error.message).join("\n")}`);
        }
      } catch (error) {
        await captureJson(info, "runtime-profile-error", {
          originalStatus, message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
    try { await use(); } finally { await collect(); }
  }, { auto: true }],
});

export const timedTest = test.extend({ trace: THIN_TIMED_TRACE, timedArtifactsExpected: true });

async function dismissDecisionNotice(page: Page) {
  const notices = page.getByRole("complementary", { name: "Decision notifications", exact: true });
  const dismiss = notices.getByRole("button", { name: "Dismiss notification", exact: true });
  if (await dismiss.count() === 0) return null;
  const text = await notices.innerText();
  const main = page.getByRole("main");
  const evidence = await main.innerText();
  await dismiss.click();
  await expect(dismiss).toHaveCount(0);
  await expect(main).toHaveText(evidence, { useInnerText: true });
  return text;
}

export async function audit(page: Page, info: TestInfo, name: string, enabled: boolean, capture = true) {
  const dismissedNotification = await dismissDecisionNotice(page);
  const result = await new AxeBuilder({ page }).analyze();
  await captureJson(info, `axe-${name}-${enabled ? "on" : "off"}`, {
    url: page.url(), auditedAt: new Date().toISOString(), agentEnabled: enabled,
    violations: result.violations, passes: result.passes.length, incomplete: result.incomplete, dismissedNotification,
  });
  expect(result.violations).toEqual([]);
  if (capture) await captureView(page, info, `audit-${name}-${enabled ? "on" : "off"}`);
}

export async function captureView(page: Page, info: TestInfo, name: string) {
  const dismissedNotification = await dismissDecisionNotice(page);
  const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const sourceRevision = git("rev-parse", "HEAD");
  if (git("status", "--porcelain")) throw new Error("Source-pinned live captures require a clean checkout.");
  const applicationSourceRevision = process.env.EXPECTED_BUILD_COMMIT;
  if (!applicationSourceRevision) throw new Error("Capture requires the expected deployed source identity.");
  git("merge-base", "--is-ancestor", applicationSourceRevision, sourceRevision);
  git("diff", "--exit-code", applicationSourceRevision, "--",
    ":(top)BSA/src", ":(top)BSA/public", ":(top)BSA/scripts", ":(top)BSA/build",
    ":(top)BSA/package.json", ":(top)BSA/package-lock.json", ":(top)BSA/index.html",
    ":(top)BSA/vite.config.ts", ":(top)hosting.config.json");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Capture requires an explicit viewport.");
  if (viewport.width !== 1440) throw new Error("New screenshot evidence is restricted to 1440 px; run other widths without capture.");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, "Captured views must not overflow the page horizontally").toBeLessThanOrEqual(viewport.width);
  const perspectiveGroup = page.getByRole("group", { name: "Perspective", exact: true });
  let perspective: string | undefined;
  for (const label of ["Pharmacy", "NHSBSA", "Both"]) {
    if (await perspectiveGroup.getByRole("radio", { name: label, exact: true }).isChecked()) perspective = label;
  }
  if (!perspective) throw new Error("Capture requires an explicit selected perspective.");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.getByRole("banner")).toBeInViewport();
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
  await captureJson(info, `view-${name}`, {
    kind: new URL(page.url()).protocol === "https:" ? "live view" : "local rehearsal view",
    sourceRevision, applicationSourceRevision, sourceDirty: false,
    capturedAt: new Date().toISOString(), url: page.url(), screenshot: name,
    sha256: createHash("sha256").update(await readFile(path)).digest("hex"),
    viewport, scrollWidth, documentHeight, fullPage: true, perspective, dismissedNotification,
    agentEnabled: await page.getByRole("banner").getByRole("switch").isChecked(),
    browserVersion: page.context().browser()?.version(),
    reducedMotion: await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    mainText: await page.getByRole("main").innerText(),
    accessibilitySnapshot: await page.locator("body").ariaSnapshot(),
    visualReview: "pending",
  });
}

export { expect, captureJson };
