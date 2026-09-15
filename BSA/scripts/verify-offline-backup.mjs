import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { createConnection } from "node:net";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CASE_IDS = ["EX-24107", "EX-24112", "EX-24123", "SYN-FQ123-MISMATCH"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const comparePath = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
const sameOrInside = (child, parent) => {
  const normalize = (path) => process.platform === "win32" ? path.toLowerCase() : path;
  const target = normalize(resolve(child));
  const root = normalize(resolve(parent));
  return target === root || target.startsWith(`${root}${sep}`);
};
const privateRuntimeFiles = new Set(["server.mjs", "hosting.config.json", "staticwebapp.config.json"]);
const requiredHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

export function canonicalFileList(files) {
  assert(Array.isArray(files), "File list must be an array");
  const seen = new Set();
  const normalized = files.map((file) => {
    assert(file && typeof file === "object", "Invalid file record");
    assert(typeof file.path === "string" && file.path.length > 0
      && !file.path.includes("\\") && !file.path.includes("\0")
      && !file.path.includes(":") && !file.path.startsWith("/")
      && file.path.split("/").every((part) => part !== "" && part !== "." && part !== ".."),
    `Unsafe manifest path: ${file.path}`);
    assert(!seen.has(file.path), `Duplicate manifest path: ${file.path}`);
    seen.add(file.path);
    assert(Number.isSafeInteger(file.bytes) && file.bytes >= 0, `Invalid byte count: ${file.path}`);
    assert(/^[a-f0-9]{64}$/.test(file.sha256), `Invalid SHA256: ${file.path}`);
    return { path: file.path, bytes: file.bytes, sha256: file.sha256 };
  });
  return normalized.sort(comparePath);
}

export function runtimeHash(files) {
  return sha256(JSON.stringify(canonicalFileList(files)));
}

async function inventory(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert(!["node_modules", ".git", ".env"].includes(entry.name), `Forbidden backup entry: ${path}`);
    const full = join(directory, entry.name);
    const metadata = await lstat(full);
    assert(!metadata.isSymbolicLink(), `Symlink is not permitted: ${path}`);
    if (metadata.isDirectory()) files.push(...await inventory(full, path));
    else {
      assert(metadata.isFile(), `Non-regular file: ${path}`);
      const bytes = await readFile(full);
      files.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
    }
  }
  return canonicalFileList(files);
}

function checkIdentity(commit, liveUrl) {
  assert(/^[a-f0-9]{40}$/.test(commit), "Expected commit must be a full lowercase SHA");
  const url = new URL(liveUrl);
  assert(url.protocol === "https:" && !url.username && !url.password
    && url.pathname === "/" && !url.search && !url.hash, "Live URL must be an HTTPS origin");
  return url.origin;
}

export async function verifyBackupFiles(backup, expectedCommit, liveUrl) {
  const origin = checkIdentity(expectedCommit, liveUrl);
  assert(isAbsolute(backup), "Backup path must be absolute");
  assert(!(await lstat(backup)).isSymbolicLink(), "Backup root cannot be a symlink");
  const root = await realpath(backup);
  const actual = await inventory(root);
  const manifestBytes = await readFile(join(root, "backup-manifest.json"));
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.schemaVersion, 1, "Unsupported backup schema");
  assert.equal(manifest.commit, expectedCommit, "Backup commit mismatch");
  assert.equal(checkIdentity(manifest.commit, manifest.liveUrl), origin, "Backup live URL mismatch");
  assert(typeof manifest.builtAt === "string" && Number.isFinite(Date.parse(manifest.builtAt))
    && new Date(manifest.builtAt).toISOString() === manifest.builtAt, "Build time must be canonical UTC ISO");
  const runtimeFiles = canonicalFileList(manifest.runtimeFiles);
  const auxiliaryFiles = canonicalFileList(manifest.auxiliaryFiles);
  assert(runtimeFiles.length > 0, "Empty runtime");
  assert(auxiliaryFiles.every((file) => file.path !== "backup-manifest.json"
    && !file.path.startsWith("runtime/")), "Auxiliary list overlaps runtime or manifest");
  assert.deepEqual(actual.filter((file) => file.path.startsWith("runtime/"))
    .map((file) => ({ ...file, path: file.path.slice("runtime/".length) })), runtimeFiles,
  "Runtime file list/content hashes differ");
  assert.deepEqual(actual.filter((file) => !file.path.startsWith("runtime/")
    && file.path !== "backup-manifest.json"), auxiliaryFiles, "Auxiliary file list/content hashes differ");
  assert.equal(manifest.runtimeHash, runtimeHash(runtimeFiles), "Canonical runtimeHash mismatch");
  for (const name of ["index.html", "build-info.json", "server.mjs", "hosting.config.json"]) {
    assert(runtimeFiles.some((file) => file.path === name), `Missing runtime ${name}`);
  }
  for (const name of ["README", "package.json", "serve.mjs", "data/playable-cases.json",
    "docs/MEMORY.md", "docs/PROGRESS.md", "docs/SCOPE.md", "docs/ALIGNMENT.md",
    "docs/DECISIONS.md", "docs/LEARNINGS.md", "docs/DEPLOYMENT.md"]) {
    assert(auxiliaryFiles.some((file) => file.path === name), `Missing auxiliary ${name}`);
  }
  const build = JSON.parse(await readFile(join(root, "runtime", "build-info.json"), "utf8"));
  assert.equal(build.commit, expectedCommit, "Runtime build commit mismatch");
  assert.equal(build.dirty, false, "Runtime must be a clean build");
  assert.equal(build.builtAt, manifest.builtAt, "Runtime build time mismatch");
  const readme = await readFile(join(root, "README"), "utf8");
  assert.equal(readme.replace(/\r?\n$/, ""),
    `commit=${expectedCommit} builtAt=${manifest.builtAt} live=${manifest.liveUrl}`,
    "README must be exactly one provenance line");
  const seeds = JSON.parse(await readFile(join(root, "data", "playable-cases.json"), "utf8"));
  assert.equal(seeds.schemaVersion, 1, "Unsupported seed schema");
  assert.equal(seeds.commit, expectedCommit, "Seed commit mismatch");
  assert(Array.isArray(seeds.cases), "Seed cases must be an array");
  assert.deepEqual(seeds.cases.map((item) => item.id).sort(), CASE_IDS, "Expected exactly four unique playable IDs");
  for (const item of seeds.cases) {
    assert(typeof item.title === "string" && item.title.length > 0 && item.pharmacy
      && item.extracted && item.claim && Array.isArray(item.readings) && Array.isArray(item.regions),
    `Incomplete playable case object: ${item.id}`);
  }
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    assert(Object.keys(pkg[field] ?? {}).length === 0, `Backup requires ${field}`);
  }
  const policy = JSON.parse(await readFile(join(root, "runtime", "hosting.config.json"), "utf8"));
  for (const [name, value] of Object.entries(requiredHeaders)) {
    assert.equal(policy.globalHeaders?.[name], value, `Unexpected security policy: ${name}`);
  }
  assert.equal(policy.spaFallback, "/index.html", "Unexpected SPA fallback");
  return { root, manifest, backupManifestSha256: sha256(manifestBytes), runtimeFiles, auxiliaryFiles };
}

export function verifyOfflineEnvironment(interfaces = networkInterfaces()) {
  const external = Object.entries(interfaces).flatMap(([name, entries]) =>
    (entries ?? []).filter((entry) => !entry.internal).map((entry) => `${name}:${entry.address}`));
  assert.equal(external.length, 0,
    `Clean offline proof requires a network-isolated container; external interfaces found: ${external.join(", ")}`);
  return { externalInterfaces: [], boundary: "No non-loopback network interfaces; container invocation is retained by CI separately." };
}

export async function startBackup(root, port) {
  await new Promise((done, reject) => {
    const socket = createConnection({ host: "localhost", port });
    const finish = (error) => {
      socket.destroy();
      if (error) reject(error);
      else done();
    };
    socket.setTimeout(1000, () => finish(new Error(`Cannot establish that port${port} is free`)));
    socket.once("connect", () => finish(new Error(`Port${port} is already occupied; refusing an existing server as recovery proof`)));
    socket.once("error", (error) => {
      const failures = error instanceof AggregateError ? error.errors : [error];
      finish(failures.every((failure) => failure.code === "ECONNREFUSED") ? undefined : error);
    });
  });
  const env = { ...process.env, NODE_PATH: "", PORT: String(port) };
  delete env.PLAYWRIGHT_PORT;
  delete env.SERVER_PORT;
  delete env.NODE_OPTIONS;
  const child = spawn(process.execPath, [join(root, "serve.mjs"), "--port", String(port)], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let processError;
  child.on("error", (error) => { processError = error; });
  const append = (data) => { output = (output + data.toString()).slice(-16384); };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  const stop = async () => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
    await new Promise((done) => {
      const killTimer = setTimeout(() => child.kill("SIGKILL"), 2000);
      child.once("exit", () => { clearTimeout(killTimer); done(); });
      child.kill("SIGTERM");
    });
  };
  const base = `http://localhost:${port}`;
  const start = performance.now();
  try {
    while (performance.now() - start < 20000) {
      if (processError) throw processError;
      assert(child.exitCode === null && child.signalCode === null, `Backup server exited: ${output}`);
      try {
        const response = await fetch(`${base}/build-info.json`, { signal: AbortSignal.timeout(1000) });
        if (response.status === 200) return { base, stop, startupMs: performance.now() - start };
      } catch (error) {
        if (error.name !== "TimeoutError" && !(error instanceof TypeError)) throw error;
      }
      await new Promise((done) => setTimeout(done, 100));
    }
    throw new Error(`Backup did not become ready within20s: ${output}`);
  } catch (error) {
    await stop();
    throw error;
  }
}

export async function verifyHttpRuntime(base, verified) {
  const index = await readFile(join(verified.root, "runtime", "index.html"));
  const request = async (path, expectedStatus) => {
    const response = await fetch(new URL(path, base), { redirect: "error", signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, expectedStatus, `${path}: unexpected HTTP status`);
    for (const [name, value] of Object.entries(requiredHeaders)) {
      assert.equal(response.headers.get(name), value, `${path}: unexpected ${name}`);
    }
    return response;
  };
  const routes = ["/", "/pharmacy/claims", ...CASE_IDS.map((id) => `/case/${id}`), "/case/EX-24112/trace"];
  for (const route of routes) {
    const response = await request(route, 200);
    assert(response.headers.get("content-type")?.startsWith("text/html"), `${route}: expected HTML`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), index, `${route}: SPA entry differs`);
  }
  let checkedFiles = 0;
  for (const file of verified.runtimeFiles) {
    if (privateRuntimeFiles.has(file.path)) continue;
    const response = await request(`/${file.path.split("/").map(encodeURIComponent).join("/")}`, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, file.bytes, `${file.path}: served byte count differs`);
    assert.equal(sha256(bytes), file.sha256, `${file.path}: served content differs`);
    checkedFiles++;
  }
  for (const path of ["/assets/offline-missing.js", "/images/offline-missing.png", "/offline-missing.css",
    "/server.mjs", "/hosting.config.json", "/backup-manifest.json", "/data/playable-cases.json"]) {
    await request(path, 404);
  }
  return { routes, checkedFiles, missingAndPrivatePaths: "404 with strict headers; no HTML asset fallback" };
}

export async function verifyBrowserRuntime(base, verified, modulePath) {
  assert(isAbsolute(modulePath), "Playwright module path must be absolute and external to the backup");
  const moduleReal = await realpath(modulePath);
  assert(!sameOrInside(moduleReal, verified.root),
    "Browser tooling must not be supplied by the backup");
  const { chromium } = await import(pathToFileURL(moduleReal).href);
  assert(chromium?.launch, "External module must export Playwright chromium");
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const visited = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    context.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:", "ws:", "wss:"].includes(url.protocol) && url.origin !== new URL(base).origin) {
        failures.push(`External runtime request: ${url.href}`);
      }
    });
    const page = await context.newPage();
    page.on("websocket", (socket) => {
      const url = new URL(socket.url());
      if (url.hostname !== new URL(base).hostname || url.port !== new URL(base).port) {
        failures.push(`External runtime WebSocket: ${url.href}`);
      }
    });
    page.on("pageerror", (error) => failures.push(`Browser error: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") failures.push(`Console error: ${message.text()}`); });
    for (const route of ["/", ...CASE_IDS.map((id) => `/case/${id}`)]) {
      await page.goto(new URL(route, base).href, { waitUntil: "networkidle", timeout: 30000 });
      await page.locator("main h1").first().waitFor({ state: "visible", timeout: 10000 });
      const body = await page.locator("body").innerText();
      assert(body.toLowerCase().includes("synthetic"), `${route}: synthetic marker missing`);
      if (route.startsWith("/case/")) assert(body.includes(route.slice(6)), `${route}: wrong item content`);
      assert.equal(await page.evaluate(() => Object.hasOwn(window, "__BSA_READ_DOMAIN_STATE__")), false,
        "Instrumented observer must not be in the production backup");
      const info = await page.evaluate(async () => (await fetch("/build-info.json")).json());
      assert.equal(info.commit, verified.manifest.commit, `${route}: browser build mismatch`);
      assert.equal(info.dirty, false, `${route}: browser build is dirty`);
      visited.push(route);
    }
    assert.deepEqual(failures, [], "Offline browser errors or external runtime calls");
    return { visited, externalRuntimeCalls: 0, productionObserverAbsent: true };
  } finally {
    await browser.close();
  }
}

export async function verifyOfflineBackup(options) {
  assert(isAbsolute(options.backup) && isAbsolute(options.report), "Backup and report paths must be absolute");
  const reportDirectory = await realpath(dirname(options.report));
  const backupDirectory = await realpath(options.backup);
  assert(!sameOrInside(join(reportDirectory, options.report.split(/[\\/]/).at(-1)), backupDirectory),
    "Report must be outside backup");
  const started = performance.now();
  const report = {
    schemaVersion: 1, commit: options.expectedCommit, liveUrl: options.liveUrl,
    backupManifestSha256: null, runtimeHash: null, passed: false,
    startedAt: new Date().toISOString(), finishedAt: null, elapsedMs: 0, checks: [], offline: false,
    scope: "Fresh-node backup validation, startup and optional browser recovery; production/download/extraction elapsed is recorded separately by the producing CI job. No Azure recreation.",
    browser: { performed: false },
  };
  const check = async (name, action) => {
    try {
      const details = await action();
      report.checks.push({ name, passed: true, details });
      return details;
    } catch (error) {
      report.checks.push({ name, passed: false, details: String(error?.stack ?? error) });
      throw error;
    }
  };
  let server;
  try {
    assert(Number.isInteger(options.port) && options.port > 0 && options.port <= 65535, "Port must be1..65535");
    const verified = await check("file-list-and-content", () =>
      verifyBackupFiles(options.backup, options.expectedCommit, options.liveUrl));
    report.backupManifestSha256 = verified.backupManifestSha256;
    report.runtimeHash = verified.manifest.runtimeHash;
    // Avoid duplicating full manifests in the check report.
    report.checks.at(-1).details = { runtimeFiles: verified.runtimeFiles.length, auxiliaryFiles: verified.auxiliaryFiles.length };
    await check("network-isolation", () => verifyOfflineEnvironment());
    report.offline = true;
    await check("fresh-node-startup", async () => {
      server = await startBackup(verified.root, options.port);
      return { startupMs: server.startupMs };
    });
    await check("http-runtime", () => verifyHttpRuntime(server.base, verified));
    if (options.playwrightModule) {
      await check("browser-runtime", () => verifyBrowserRuntime(server.base, verified, options.playwrightModule));
      report.browser.performed = true;
    }
    await check("recovery-under-ten-minutes", () => {
      assert(performance.now() - started < 600000, "Offline verification exceeded600s");
      return { targetMs: 600000, includesProduction: false };
    });
    report.passed = true;
  } catch (error) {
    report.error = String(error?.stack ?? error);
  } finally {
    if (server) {
      try { await server.stop(); }
      catch (error) {
        report.passed = false;
        report.checks.push({ name: "server-cleanup", passed: false, details: String(error?.stack ?? error) });
      }
    }
    report.finishedAt = new Date().toISOString();
    report.elapsedMs = performance.now() - started;
    if (report.elapsedMs >= 600000) {
      report.passed = false;
      report.checks.push({ name: "total-recovery-deadline", passed: false, details: "Including cleanup exceeded600s" });
    }
    await writeFile(options.report, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  }
  return report;
}

export function parseArguments(args) {
  const names = new Map([
    ["--backup", "backup"], ["--expected-commit", "expectedCommit"], ["--live-url", "liveUrl"],
    ["--report", "report"], ["--port", "port"], ["--playwright-module", "playwrightModule"],
  ]);
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = names.get(args[i]);
    assert(key && args[i + 1] && !args[i + 1].startsWith("--") && !(key in result),
      `Unknown, duplicate or missing option: ${args[i]}`);
    result[key] = args[i + 1];
  }
  for (const key of ["backup", "expectedCommit", "liveUrl", "report", "port"]) assert(result[key], `Missing ${key}`);
  assert(/^\d+$/.test(result.port), "Port must be an integer");
  result.port = Number(result.port);
  assert(isAbsolute(result.backup) && isAbsolute(result.report), "Backup and report paths must be absolute");
  assert(!sameOrInside(result.report, result.backup), "Report must be outside backup");
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyOfflineBackup(parseArguments(process.argv.slice(2)));
    console.log(JSON.stringify({ passed: result.passed, commit: result.commit, elapsedMs: result.elapsedMs }));
    if (!result.passed) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
