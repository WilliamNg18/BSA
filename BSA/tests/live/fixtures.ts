import AxeBuilder from "@axe-core/playwright";
import type { APIRequestContext, Page, TestInfo } from "@playwright/test";
import { captureJson, test as existingTest, expect } from "../e2e/fixtures";
import { isBuildInfo } from "./settings";

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

export const test = existingTest.extend<{ buildIdentity: void }>({
  buildIdentity: [async ({ request }, use, info) => {
    await verifyBuild(request, info, "before");
    await use();
    await verifyBuild(request, info, "after");
  }, { auto: true }],
});

export async function audit(page: Page, info: TestInfo, name: string, enabled: boolean) {
  const result = await new AxeBuilder({ page }).analyze();
  await captureJson(info, `axe-${name}-${enabled ? "on" : "off"}`, {
    url: page.url(), auditedAt: new Date().toISOString(), agentEnabled: enabled,
    violations: result.violations, passes: result.passes.length, incomplete: result.incomplete,
  });
  expect(result.violations).toEqual([]);
}

export { expect, captureJson };
