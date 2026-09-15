import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Server } from "node:http";
import { createServer } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

const verifier = await import(pathToFileURL(resolve("scripts/verify-offline-backup.mjs")).href);
const commit = "a".repeat(40);
const builtAt = "2026-09-15T18:00:00.000Z";
const liveUrl = "https://example.invalid/";
const temporary: string[] = [];
const hash = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
type FileRecord = { path: string; bytes: number; sha256: string };

async function list(directory: string, prefix = ""): Promise<FileRecord[]> {
  const result: FileRecord[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await list(join(directory, entry.name), path));
    else {
      const bytes = await readFile(join(directory, entry.name));
      result.push({ path, bytes: bytes.length, sha256: hash(bytes) });
    }
  }
  return result.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

async function seal(root: string) {
  const runtimeFiles = await list(join(root, "runtime"));
  const auxiliaryFiles = (await list(root)).filter((file) =>
    !file.path.startsWith("runtime/") && file.path !== "backup-manifest.json");
  const manifest = {
    schemaVersion: 1, commit, builtAt, liveUrl, runtimeFiles, auxiliaryFiles,
    runtimeHash: hash(JSON.stringify(runtimeFiles)),
  };
  await writeFile(join(root, "backup-manifest.json"), JSON.stringify(manifest));
  return manifest;
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "bsa-offline-verifier-"));
  temporary.push(root);
  await mkdir(join(root, "runtime", "assets"), { recursive: true });
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "data"));
  await copyFile(fileURLToPath(new URL("../../scripts/static-server.mjs", import.meta.url)), join(root, "runtime", "server.mjs"));
  await copyFile(resolve("..", "hosting.config.json"), join(root, "runtime", "hosting.config.json"));
  await writeFile(join(root, "runtime", "index.html"), '<!doctype html><html><body><div id="root">Synthetic fixture</div></body></html>');
  await writeFile(join(root, "runtime", "assets", "app.js"), "console.log('synthetic');");
  await writeFile(join(root, "runtime", "build-info.json"), JSON.stringify({ commit, builtAt, dirty: false }));
  await writeFile(join(root, "serve.mjs"), "import { fileURLToPath } from 'node:url'; import { startStaticServer } from './runtime/server.mjs'; await startStaticServer(fileURLToPath(new URL('./runtime', import.meta.url)));");
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, type: "module" }));
  await writeFile(join(root, "README"), `commit=${commit} builtAt=${builtAt} live=${liveUrl}\n`);
  for (const name of ["MEMORY", "PROGRESS", "SCOPE", "ALIGNMENT", "DECISIONS", "LEARNINGS", "DEPLOYMENT"]) {
    await writeFile(join(root, "docs", `${name}.md`), `Synthetic ${name}`);
  }
  const cases = ["EX-24107", "EX-24112", "EX-24123", "SYN-FQ123-MISMATCH"].map((id) => ({
    id, title: `Synthetic ${id}`, pharmacy: { name: "Synthetic pharmacy" },
    extracted: { productCode: "SYN-EXAMPLE" }, claim: { quantity: 1 }, readings: [], regions: [],
  }));
  await writeFile(join(root, "data", "playable-cases.json"), JSON.stringify({ schemaVersion: 1, commit, cases }));
  await seal(root);
  return root;
}

afterEach(async () => {
  for (const directory of temporary.splice(0)) await rm(directory, { recursive: true, force: true });
});

describe("standalone offline backup verification", () => {
  it("checks the complete actual file sets using independent canonical records", async () => {
    const root = await fixture();
    const result = await verifier.verifyBackupFiles(root, commit, liveUrl);
    const bytes = await readFile(join(root, "backup-manifest.json"));
    expect(result.backupManifestSha256).toBe(hash(bytes));
    expect(result.manifest.runtimeHash).toBe(hash(JSON.stringify(await list(join(root, "runtime")))));
    expect(result.runtimeFiles).toHaveLength(5);
    expect(result.auxiliaryFiles).toHaveLength(11);
  });

  it.each(["../outside", "/absolute", "a\\b", "a//b", "a/./b", "C:escape", "a\u0000b"])(
    "rejects unsafe manifest path %s", (path) => {
      expect(() => verifier.canonicalFileList([{ path, bytes: 0, sha256: "a".repeat(64) }])).toThrow("Unsafe manifest path");
    },
  );

  it("rejects duplicate entries and invalid metadata", () => {
    const file = { path: "index.html", bytes: 0, sha256: "a".repeat(64) };
    expect(() => verifier.canonicalFileList([file, file])).toThrow("Duplicate");
    expect(() => verifier.canonicalFileList([{ ...file, bytes: -1 }])).toThrow("byte count");
    expect(() => verifier.canonicalFileList([{ ...file, sha256: "invalid" }])).toThrow("SHA256");
  });

  it("normalizes key and file ordering without adding a newline", () => {
    const files = [{ sha256: "b".repeat(64), bytes: 2, path: "z" }, { path: "a", sha256: "a".repeat(64), bytes: 1 }];
    expect(verifier.runtimeHash(files)).toBe(hash(JSON.stringify([
      { path: "a", bytes: 1, sha256: "a".repeat(64) }, { path: "z", bytes: 2, sha256: "b".repeat(64) },
    ])));
  });

  it.each(["runtime/assets/app.js", "docs/MEMORY.md"])("rejects modified bytes in %s", async (file) => {
    const root = await fixture();
    await writeFile(join(root, file), "tampered");
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("content hashes differ");
  });

  it("rejects extra files and symlinks even outside the manifest", async () => {
    const root = await fixture();
    await writeFile(join(root, "extra.txt"), "unlisted");
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("Auxiliary");
    await rm(join(root, "extra.txt"));
    await symlink(join(root, "docs"), join(root, "alias"), process.platform === "win32" ? "junction" : "dir");
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("Symlink");
    await rm(join(root, "alias"));
  });

  it("rejects a backup that includes node_modules", async () => {
    const root = await fixture();
    await mkdir(join(root, "node_modules"));
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("Forbidden");
  });

  it("rejects wrong commit, dirty runtime and a forged canonical hash", async () => {
    const root = await fixture();
    await expect(verifier.verifyBackupFiles(root, "b".repeat(40), liveUrl)).rejects.toThrow("commit mismatch");
    await writeFile(join(root, "runtime", "build-info.json"), JSON.stringify({ commit, builtAt, dirty: true }));
    await seal(root);
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("clean build");
    const manifest = await seal(root);
    await writeFile(join(root, "backup-manifest.json"), JSON.stringify({ ...manifest, runtimeHash: "0".repeat(64) }));
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("runtimeHash");
  });

  it("rejects malformed README and wrong or duplicate seed IDs", async () => {
    const root = await fixture();
    await writeFile(join(root, "README"), "Different branch build\nextra line");
    await seal(root);
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("README");
    await writeFile(join(root, "README"), `commit=${commit} builtAt=${builtAt} live=${liveUrl}`);
    const path = join(root, "data", "playable-cases.json");
    const seeds = JSON.parse(await readFile(path, "utf8"));
    seeds.cases[0].id = seeds.cases[1].id;
    await writeFile(path, JSON.stringify(seeds));
    await seal(root);
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("four unique");
  });

  it("rejects added dependencies and weakened CSP even when hashes are refreshed", async () => {
    const root = await fixture();
    await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { server: "*" } }));
    await seal(root);
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("dependencies");
    await writeFile(join(root, "package.json"), "{}");
    const file = join(root, "runtime", "hosting.config.json");
    const policy = JSON.parse(await readFile(file, "utf8"));
    policy.globalHeaders["Content-Security-Policy"] = "default-src *";
    await writeFile(file, JSON.stringify(policy));
    await seal(root);
    await expect(verifier.verifyBackupFiles(root, commit, liveUrl)).rejects.toThrow("security policy");
  });

  it("requires network isolation rather than assuming localhost implies offline", () => {
    expect(verifier.verifyOfflineEnvironment({ lo: [{ internal: true, address: "127.0.0.1" }] }).externalInterfaces).toEqual([]);
    expect(() => verifier.verifyOfflineEnvironment({ eth0: [{ internal: false, address: "172.17.0.2" }] })).toThrow("network-isolated");
  });

  it("checks root, deep links, all public bytes, protected paths and missing assets on the copied server", async () => {
    const root = await fixture();
    const checked = await verifier.verifyBackupFiles(root, commit, liveUrl);
    const previous = process.env.PLAYWRIGHT_PORT;
    process.env.PLAYWRIGHT_PORT = "0";
    let server: Server | undefined;
    try {
      const module = await import(pathToFileURL(join(root, "runtime", "server.mjs")).href);
      server = await module.startStaticServer(join(root, "runtime"));
      const address = server!.address();
      if (!address || typeof address === "string") throw new Error("Expected TCP address");
      const result = await verifier.verifyHttpRuntime(`http://localhost:${address.port}`, checked);
      expect(result.routes).toContain("/case/SYN-FQ123-MISMATCH");
      expect(result.checkedFiles).toBe(3);
    } finally {
      if (previous === undefined) delete process.env.PLAYWRIGHT_PORT;
      else process.env.PLAYWRIGHT_PORT = previous;
      if (server) await new Promise<void>((done, reject) => server!.close((error) => error ? reject(error) : done()));
    }
  });

  it("parses the frozen CLI and rejects ambiguous or in-backup report paths", () => {
    const backup = resolve("backup");
    const report = resolve("report.json");
    const args = ["--backup", backup, "--expected-commit", commit, "--live-url", liveUrl, "--report", report, "--port", "4333"];
    expect(verifier.parseArguments(args)).toMatchObject({ backup, report, port: 4333, expectedCommit: commit });
    expect(() => verifier.parseArguments([...args, "--port", "4334"])).toThrow("duplicate");
    expect(() => verifier.parseArguments(args.map((value) => value === report ? join(backup, "result.json") : value))).toThrow("outside backup");
    expect(() => verifier.parseArguments([...args, "--unknown", "value"])).toThrow("Unknown");
  });

  it("persists an explicit failed report rather than claiming offline success after a mismatch", async () => {
    const root = await fixture();
    const output = await mkdtemp(join(tmpdir(), "bsa-offline-report-"));
    temporary.push(output);
    const report = join(output, "result.json");
    const result = await verifier.verifyOfflineBackup({
      backup: root, expectedCommit: "b".repeat(40), liveUrl, report, port: 4333,
    });
    expect(result.passed).toBe(false);
    expect(result.offline).toBe(false);
    expect(result.checks).toEqual([expect.objectContaining({ name: "file-list-and-content", passed: false })]);
    expect(JSON.parse(await readFile(report, "utf8"))).toMatchObject({ passed: false, offline: false });
    await expect(verifier.verifyOfflineBackup({
      backup: root, expectedCommit: "b".repeat(40), liveUrl, report, port: 4333,
    })).rejects.toThrow("EEXIST");
  });

  it("starts and stops a fresh dependency-free backup process with no source-checkout imports", async () => {
    const root = await fixture();
    const probe = createServer();
    await new Promise<void>((done) => probe.listen(0, "localhost", done));
    const address = probe.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address");
    await new Promise<void>((done, reject) => probe.close((error) => error ? reject(error) : done()));
    const server = await verifier.startBackup(root, address.port);
    try {
      const response = await fetch(`${server.base}/build-info.json`);
      expect(await response.json()).toMatchObject({ commit, dirty: false });
    } finally {
      await server.stop();
    }
    await expect(fetch(`${server.base}/build-info.json`)).rejects.toThrow();
  });

  it("refuses to count an already-listening process as fresh recovery", async () => {
    const root = await fixture();
    const existing = createServer((socket) => socket.end());
    await new Promise<void>((done) => existing.listen(0, "localhost", done));
    const address = existing.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address");
    try {
      await expect(verifier.startBackup(root, address.port)).rejects.toThrow("already occupied");
    } finally {
      await new Promise<void>((done, reject) => existing.close((error) => error ? reject(error) : done()));
    }
  });

  it("cannot write its report into a backup reached through a parent-directory alias", async () => {
    const root = await fixture();
    const wrapper = await mkdtemp(join(tmpdir(), "bsa-offline-alias-"));
    temporary.push(wrapper);
    const physical = join(wrapper, "physical");
    await mkdir(physical);
    await rename(root, join(physical, "backup"));
    const alias = join(wrapper, "alias");
    await symlink(physical, alias, process.platform === "win32" ? "junction" : "dir");
    try {
      await expect(verifier.verifyOfflineBackup({
        backup: join(alias, "backup"), expectedCommit: commit, liveUrl,
        report: join(physical, "backup", "result.json"), port: 4333,
      })).rejects.toThrow("outside backup");
      await expect(readFile(join(physical, "backup", "result.json"))).rejects.toThrow("ENOENT");
    } finally {
      await rm(alias);
    }
  });
});
