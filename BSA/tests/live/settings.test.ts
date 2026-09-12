import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { isBuildInfo, liveSettings } from "./settings";

const root = resolve("repository");
const valid = {
  LIVE_BASE_URL: "https://example.test/",
  EXPECTED_BUILD_COMMIT: "a".repeat(40),
  LIVE_OUTPUT_DIR: resolve("external-evidence"),
};

describe("live acceptance configuration", () => {
  it("requires an explicit HTTPS host, expected commit and external artifacts", () => {
    expect(liveSettings(valid, root)).toEqual({ baseURL: valid.LIVE_BASE_URL, expectedCommit: valid.EXPECTED_BUILD_COMMIT, output: valid.LIVE_OUTPUT_DIR });
  });
  it.each(["http://example.test", "https://user:secret@example.test", "https://example.test/app", "https://example.test/?token=secret", "https://example.test/#scene"])("rejects unsafe or non-root URL %s", (url) => {
    expect(() => liveSettings({ ...valid, LIVE_BASE_URL: url }, root)).toThrow();
  });
  it.each(["LIVE_BASE_URL", "EXPECTED_BUILD_COMMIT", "LIVE_OUTPUT_DIR"])("rejects missing %s", (key) => {
    expect(() => liveSettings({ ...valid, [key]: "" }, root)).toThrow();
  });
  it.each(["main", "HEAD", "a".repeat(7)])("rejects unpinned build %s", (commit) => {
    expect(() => liveSettings({ ...valid, EXPECTED_BUILD_COMMIT: commit }, root)).toThrow();
  });
  it.each([root, resolve(root, "test-results"), "relative-artifacts"])("rejects repository or relative output %s", (output) => {
    expect(() => liveSettings({ ...valid, LIVE_OUTPUT_DIR: output }, root)).toThrow();
  });
  it("validates the exact public build-info shape, including dirty", () => {
    const build = { commit: valid.EXPECTED_BUILD_COMMIT, builtAt: "2026-09-12T16:00:00.000Z", dirty: false };
    expect(isBuildInfo(build)).toBe(true);
    expect(isBuildInfo({ ...build, dirty: true })).toBe(true);
    for (const bad of [null, {}, { ...build, dirty: "false" }, { ...build, commit: "main" }, { ...build, builtAt: "today" }]) expect(isBuildInfo(bad)).toBe(false);
  });
});
