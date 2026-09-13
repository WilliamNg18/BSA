import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { executeStage, parseShard, runVerification, verificationStages, type Stage } from "../../scripts/verify.mjs";
import { artifactDigest, buildOneStateArtifact } from "../e2e/one-state-artifact.mjs";

vi.mock("node:child_process", async (original) => ({
  ...await original<typeof import("node:child_process")>(),
  spawnSync: vi.fn(),
}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
const childResult = (values: Partial<ReturnType<typeof spawnSync>>): ReturnType<typeof spawnSync> => ({
  pid: 1, output: [], stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), signal: null, status: 0, ...values,
});

describe("verification shard arguments", () => {
  it("defaults to the full suite", () => expect(parseShard([])).toBeNull());
  it.each([["--shard", "2/4"], ["--shard=2/4"]])("accepts %j", (...args) => {
    expect(parseShard(args)).toEqual({ index: 2, total: 4 });
  });
  it.each([
    ["--shard"], ["--shard=0/4"], ["--shard=5/4"], ["--shard=1/0"],
    ["--shard=01/4"], ["--shard=1/4;echo secret"], ["--shard=1/4", "--shard=2/4"],
    ["--shard=1/9007199254740992"], ["--workers=4"], ["--shard=1.5/4"],
  ])("rejects malformed input %j before execution", async (...args) => {
    const execute = vi.fn();
    const log = vi.fn();
    expect(await runVerification(args, execute, log)).toBe(2);
    expect(execute).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/Usage|Shard/));
  });
  it("actual CLI returns usage exit 2 without npm or child commands", () => {
    const script = fileURLToPath(new URL("../../scripts/verify.mjs", import.meta.url));
    expect(() => execFileSync(process.execPath, [script, "--shard=1/0"], { stdio: "pipe" }))
      .toThrow(expect.objectContaining({ status: 2 }));
  });
});

describe("shared verification stages", () => {
  it("retains the ordinary artifact browsers before a separate instrumented equivalence stage", () => {
    const stages = verificationStages(null);
    expect(stages.slice(0, 2).map((stage) => stage.args)).toEqual([["run", "check"], ["test"]]);
    const browser = stages.filter((stage) => stage.args.includes("test:e2e"));
    expect(browser).toHaveLength(3);
    for (const stage of browser.slice(0, 2)) {
      expect(stage.args).toContain("tests/e2e/production-artifact.config.ts");
      expect(stage.args).toContain("--project=chromium");
      expect(stage.args.some((arg) => arg.startsWith("--shard"))).toBe(false);
    }
    expect(browser[0].args).toContain("--grep-invert");
    expect(browser[0].informational).toBe(false);
    expect(browser[1].args).toEqual(expect.arrayContaining(["--grep", "@quarantine", "--pass-with-no-tests"]));
    expect(browser[1].informational).toBe(true);
    expect(browser[0].args.at(-1)).not.toBe(browser[1].args.at(-1));
    expect(browser[2].args).toContain("tests/e2e/one-state.config.ts");
    expect(browser[2].args).not.toContain("--pass-with-no-tests");
    expect(browser[2].informational).toBe(false);
    expect(browser[2].args.some((arg) => arg.startsWith("--shard"))).toBe(false);
  });
  it.each([1, 2, 3, 4])("forwards shard %i/4 to every browser stage", (index) => {
    const stages = verificationStages({ index, total: 4 });
    for (const stage of stages.filter((stage) => stage.args.includes("test:e2e"))) {
      expect(stage.args.filter((arg) => arg.startsWith("--shard="))).toEqual([`--shard=${index}/4`]);
    }
    expect(stages.some((stage) => stage.name === "Gzip report")).toBe(index === 1);
    expect(stages.some((stage) => stage.name === "Content report")).toBe(index === 1);
  });
  it.each(["Check (typecheck, lint, build)", "Unit tests", "Blocking production browsers", "Blocking instrumented one-state equivalence"])(
    "propagates %s failure and stops later stages", async (name) => {
      const visited: string[] = [];
      const result = await runVerification([], (stage) => {
        visited.push(stage.name);
        return stage.name === name ? 7 : 0;
      }, vi.fn());
      expect(result).toBe(7);
      expect(visited.at(-1)).toBe(name);
    },
  );
  it.each(["Content report", "Gzip report", "Informational quarantined browsers"])(
    "retains %s failure as informational", async (name) => {
      const execute = vi.fn((stage: Stage) => stage.name === name ? 9 : 0);
      const log = vi.fn();
      expect(await runVerification([], execute, log)).toBe(0);
      expect(execute).toHaveBeenCalledTimes(7);
      expect(log).toHaveBeenCalledWith(expect.stringContaining("informational failure retained"));
    },
  );
  it.each([false, true])("handles thrown process errors according to stage classification: %s", async (informational) => {
    const name = informational ? "Gzip report" : "Unit tests";
    const log = vi.fn();
    expect(await runVerification([], (stage) => {
      if (stage.name === name) throw new Error("Spawn failed");
      return 0;
    }, log)).toBe(informational ? 0 : 1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Spawn failed"));
  });

  describe("instrumented artifact isolation", () => {
    const temporaryDirectories: string[] = [];
    afterEach(() => {
      for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true });
    });
    const workspace = () => {
      const directory = mkdtempSync(join(tmpdir(), "bsa-one-state-"));
      temporaryDirectories.push(directory);
      mkdirSync(join(directory, "dist", "assets"), { recursive: true });
      writeFileSync(join(directory, "dist", "index.html"), "ordinary production page");
      writeFileSync(join(directory, "dist", "assets", "app.js"), "ordinary production bundle");
      vi.stubEnv("npm_execpath", "npm-cli.js");
      return directory;
    };
    it("uses a separate output and build-only flag without changing ordinary files or the parent environment", () => {
      const directory = workspace();
      vi.stubEnv("VITE_E2E_STATE_OBSERVER", "");
      const before = artifactDigest(join(directory, "dist"));
      vi.mocked(spawnSync).mockReturnValue(childResult({ status: 0 }));
      buildOneStateArtifact(spawnSync, directory);
      expect(spawnSync).toHaveBeenCalledWith(process.execPath,
        ["npm-cli.js", "run", "build", "--", "--outDir", join(directory, "test-results", "one-state-site")],
        expect.objectContaining({ cwd: directory, shell: false, env: expect.objectContaining({ VITE_E2E_STATE_OBSERVER: "true" }) }));
      expect(artifactDigest(join(directory, "dist"))).toBe(before);
      expect(process.env.VITE_E2E_STATE_OBSERVER).toBe("");
    });
    it("fails closed when the ordinary artifact changes during the instrumented build", () => {
      const directory = workspace();
      vi.mocked(spawnSync).mockImplementation(() => {
        writeFileSync(join(directory, "dist", "assets", "app.js"), "unexpected instrumented bundle");
        return childResult({ status: 0 });
      });
      expect(() => buildOneStateArtifact(spawnSync, directory)).toThrow("changed the ordinary deployment artifact");
    });
    it.each([1, 7, null])("propagates instrumented build failure %s", (status) => {
      const directory = workspace();
      vi.mocked(spawnSync).mockReturnValue(childResult({ status }));
      expect(() => buildOneStateArtifact(spawnSync, directory)).toThrow("One-state build failed");
    });
    it("retains the exact production server and hosting policy, not a permissive test server", () => {
      const config = readFileSync(new URL("../e2e/one-state.config.ts", import.meta.url), "utf8");
      expect(config).toContain('join(instrumentedDirectory, "server.mjs")');
      expect(config).not.toContain("npm run dev");
      expect(config).toContain("reuseExistingServer: false");
      expect(config).toContain("retries: 0");
    });
  });
  it("rejects an invalid blocking exit status rather than claiming success", async () => {
    expect(await runVerification([], () => NaN, vi.fn())).toBe(1);
  });
  it("prints explicit browser installation guidance and succeeds after all stages", async () => {
    const log = vi.fn();
    expect(await runVerification([], () => 0, log)).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("npm exec -- playwright install chromium"));
    expect(log).toHaveBeenLastCalledWith("[verify] All blocking checks passed.");
  });
});

describe("cross-platform process execution", () => {
  it("propagates an actual Node child exit status without a shell", async () => {
    const actual = await vi.importActual<typeof import("node:child_process")>("node:child_process");
    vi.mocked(spawnSync).mockImplementation(actual.spawnSync);
    expect(executeStage({ name: "Failure control", script: "--eval", args: ["process.exit(7)"], informational: false })).toBe(7);
  });
  it("uses Node plus argv, not a shell or an interpolated .cmd invocation", () => {
    vi.stubEnv("npm_execpath", "C:\\Program Files\\nodejs\\npm-cli.js");
    vi.mocked(spawnSync).mockReturnValue(childResult({ status: 0 }));
    const stage = verificationStages({ index: 2, total: 4 })[2];
    expect(executeStage(stage)).toBe(0);
    expect(spawnSync).toHaveBeenCalledWith(process.execPath,
      ["C:\\Program Files\\nodejs\\npm-cli.js", ...stage.args],
      expect.objectContaining({ shell: false, stdio: "inherit" }));
  });
  it.each<{ message: string } & Partial<ReturnType<typeof spawnSync>>>([
    { error: new Error("ENOENT"), message: "ENOENT" },
    { signal: "SIGTERM", message: "terminated by SIGTERM" },
    { status: null, message: "did not return an exit status" },
  ])("does not disguise a child process failure: $message", ({ message, ...result }) => {
    vi.stubEnv("npm_execpath", "/usr/bin/npm-cli.js");
    vi.mocked(spawnSync).mockReturnValue(childResult(result));
    expect(() => executeStage(verificationStages(null)[0])).toThrow(message);
  });
  it("has a clear entry-point error when npm is unavailable", () => {
    vi.stubEnv("npm_execpath", "");
    expect(() => executeStage(verificationStages(null)[0])).toThrow("npm run verify");
    expect(spawnSync).not.toHaveBeenCalled();
  });
});

describe("CI verification contract", () => {
  it("publishes only the PR shard-one build with short, best-effort retention", () => {
    const workflow = readFileSync(new URL("../../../.github/workflows/ci.yml", import.meta.url), "utf8");
    const upload = workflow.split("      - name: Upload PR build (not a live deployment)")[1].split("      - name: Link available PR build")[0];
    expect(upload).toContain("id: pr-build");
    expect(upload).toContain("uses: actions/upload-artifact@v4");
    expect(upload).toContain("if: ${{ !cancelled() && github.event_name == 'pull_request' && matrix.shard == 1 }}");
    expect(upload).toContain("continue-on-error: true");
    expect(upload).toContain("path: BSA/dist/");
    expect(upload).toContain("retention-days: 7");
    expect(upload).toContain("if-no-files-found: warn");
    expect(workflow.match(/path: BSA\/dist\//g)).toHaveLength(1);
  });
  it("links only an actually available artifact without PR write permissions", () => {
    const workflow = readFileSync(new URL("../../../.github/workflows/ci.yml", import.meta.url), "utf8");
    const summary = workflow.split("      - name: Link available PR build")[1].split("      - uses: actions/upload-artifact@v4")[0];
    expect(summary).toContain("if: ${{ !cancelled() && steps.pr-build.outputs.artifact-url != '' }}");
    expect(summary).toContain("continue-on-error: true");
    expect(summary).toContain("PR_BUILD_URL: ${{ steps.pr-build.outputs.artifact-url }}");
    expect(summary).toContain('"$PR_BUILD_URL" >> "$GITHUB_STEP_SUMMARY"');
    expect(workflow).toMatch(/permissions:\r?\n {2}contents: read/);
    expect(workflow).not.toMatch(/(?:pull-requests|contents|actions): write|pull_request_target/);
  });
  it("uses one bounded four-shard entry point without duplicate branch-push runs", () => {
    const workflow = readFileSync(new URL("../../../.github/workflows/ci.yml", import.meta.url), "utf8");
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("shard: [1, 2, 3, 4]");
    expect(workflow).toContain("fail-fast: false");
    expect(workflow).toContain("cancel-in-progress: true");
    expect(workflow).toContain("npm run verify -- --shard=${{ matrix.shard }}/4");
    expect(workflow).not.toMatch(/run: npm (test|run check|run test:e2e)/);
    expect(workflow).not.toContain("timeout-minutes:");
    expect(workflow).toContain("name: browser-test-results-${{ matrix.shard }}");
    expect(workflow).toContain("continue-on-error: true");
  });
});
