import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm, symlink, unlink } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const source = fileURLToPath(new URL("../../scripts/static-server.mjs", import.meta.url));
const policyFile = fileURLToPath(new URL("../../../hosting.config.json", import.meta.url));
let directory: string;
let child: ChildProcess;
let base: string;
let errors = "";
let headers: Record<string, string>;

function waitForServer(app: ChildProcess, stderr: () => string) {
  return new Promise<string>((resolve, reject) => {
    app.once("error", reject);
    app.once("exit", (code) => reject(new Error(`Server exited ${code}: ${stderr()}`)));
    app.stdout!.on("data", (data) => {
      const match = data.toString().match(/http:\/\/localhost:(\d+)/);
      if (match) resolve(match[0]);
    });
  });
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "bsa-static-server-"));
  await mkdir(join(directory, "assets"));
  await copyFile(source, join(directory, "server.mjs"));
  await copyFile(policyFile, join(directory, "hosting.config.json"));
  await symlink(directory, join(directory, "alias"), process.platform === "win32" ? "junction" : "dir");
  headers = JSON.parse(await readFile(policyFile, "utf8")).globalHeaders;
  await writeFile(join(directory, "index.html"), '<html><div id="root">Synthetic SPA</div></html>');
  await writeFile(join(directory, "assets", "entry-123.js"), 'console.log("synthetic");');
  await writeFile(join(directory, "assets", "entry-123.css"), "body{color:black}");
  await writeFile(join(directory, "build-info.json"), JSON.stringify({ commit: "a".repeat(40), dirty: false }));
  await writeFile(join(directory, ".env"), "DO_NOT_SERVE");
  await writeFile(join(directory, "fork-container.mjs"), 'import { pathToFileURL } from "node:url"; await import(pathToFileURL(process.env.TEST_MODULE)); console.log("Module imported");');
  child = spawn(process.execPath, [join(directory, "server.mjs")], {
    env: { ...process.env, PLAYWRIGHT_PORT: "0" }, stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr!.on("data", (data) => { errors += data.toString(); });
  base = await waitForServer(child, () => errors);
});

describe("actual runtime release inventory", () => {
  let root: string, url: string, app: ChildProcess;
  let stderr = "", expectedFailures = 0;
  const build = { commit: "b".repeat(40), builtAt: "2026-09-15T20:21:08.983Z", dirty: false };
  const paths = [
    "assets/entry.js", "build-info.json", "hosting.config.json", "index.html",
    "private-helper.mjs", "server.mjs", "staticwebapp.config.json",
  ];
  interface RuntimeFile { path: string; bytes: number; sha256: string; public: boolean }
  interface ReleaseManifest { schemaVersion: number; commit: string; builtAt: string; files: RuntimeFile[] }
  const fetchManifest = async (): Promise<ReleaseManifest> => {
    const response = await fetch(`${url}/release-manifest.json`);
    expect(response.status, stderr).toBe(200);
    return response.json();
  };
  const expectFailure = async () => {
    const response = await fetch(`${url}/release-manifest.json`);
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    for (const [name, value] of Object.entries(headers)) expect(response.headers.get(name)).toBe(value);
    expect(await response.text()).toBe("Static request failed");
    expectedFailures++;
  };

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "bsa-runtime-inventory-"));
    await mkdir(join(root, "assets"));
    await copyFile(source, join(root, "server.mjs"));
    await copyFile(policyFile, join(root, "hosting.config.json"));
    await writeFile(join(root, "index.html"), "<html>Synthetic runtime</html>");
    await writeFile(join(root, "assets", "entry.js"), "export const synthetic = true;");
    await writeFile(join(root, "private-helper.mjs"), "export const privateHelper = true;");
    await writeFile(join(root, "staticwebapp.config.json"), "{}");
    await writeFile(join(root, "build-info.json"), JSON.stringify(build));
    app = spawn(process.execPath, [join(root, "server.mjs")], {
      env: { ...process.env, PLAYWRIGHT_PORT: "0" }, stdio: ["ignore", "pipe", "pipe"],
    });
    app.stderr!.on("data", (data) => { stderr += data.toString(); });
    url = await waitForServer(app, () => stderr);
  });

  afterAll(async () => {
    if (app && app.exitCode === null) {
      const exit = new Promise<void>((resolve) => app.once("exit", () => resolve()));
      app.kill(); await exit;
    }
    if (root) await rm(root, { recursive: true });
    expect(stderr.match(/Static request failed/g) ?? [], stderr).toHaveLength(expectedFailures);
  });

  it("enumerates and hashes every actual public and private runtime file", async () => {
    const result = await fetchManifest();
    expect(Object.keys(result)).toEqual(["schemaVersion", "commit", "builtAt", "files"]);
    expect(result).toMatchObject({ schemaVersion: 1, commit: build.commit, builtAt: build.builtAt });
    expect(result.files.map((file) => file.path)).toEqual(paths);
    for (const file of result.files) {
      expect(Object.keys(file)).toEqual(["path", "bytes", "sha256", "public"]);
      const bytes = await readFile(join(root, file.path));
      expect(file.bytes).toBe(bytes.length);
      expect(file.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
      expect(file.public).toBe(["assets/entry.js", "build-info.json", "index.html"].includes(file.path));
      expect((await fetch(`${url}/${file.path}`)).status).toBe(file.public ? 200 : 404);
    }
    expect(result.files.some((file) => file.path === "release-manifest.json")).toBe(false);
  });

  it("keeps strict headers, no-store and exact HEAD parity on the virtual endpoint", async () => {
    const get = await fetch(`${url}/release-manifest.json?fresh=1`);
    const body = await get.text();
    const head = await fetch(`${url}/release-manifest.json`, { method: "HEAD" });
    expect(head.status, stderr).toBe(200);
    expect(head.headers.get("content-length")).toBe(String(Buffer.byteLength(body)));
    expect(head.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(head.headers.get("cache-control")).toBe("no-store");
    for (const [name, value] of Object.entries(headers)) expect(head.headers.get(name)).toBe(value);
    expect(await head.text()).toBe("");
    const post = await fetch(`${url}/release-manifest.json`, { method: "POST" });
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD");
  });

  it("observes changed content and added files rather than trusting a stale manifest", async () => {
    const first = await fetchManifest();
    const entry = join(root, "assets", "entry.js");
    const original = await readFile(entry);
    try {
      await writeFile(entry, "export const synthetic = false;");
      await writeFile(join(root, "assets", "later.css"), "body{color:blue}");
      const next = await fetchManifest();
      expect(next.files.find((file) => file.path === "assets/entry.js")?.sha256)
        .not.toBe(first.files.find((file) => file.path === "assets/entry.js")?.sha256);
      expect(next.files.find((file) => file.path === "assets/later.css")).toMatchObject({ public: true });
    } finally {
      await writeFile(entry, original);
      await unlink(join(root, "assets", "later.css"));
    }
  });

  for (const name of [".env", "release-manifest.json"]) {
    it(`fails closed for the unsupported runtime entry ${name}`, async () => {
      await writeFile(join(root, name), "DO_NOT_EXPOSE");
      try { await expectFailure(); }
      finally { await unlink(join(root, name)); }
    });
  }

  it("rejects a directory symlink without following it or returning partial hashes", async () => {
    await symlink(directory, join(root, "linked"), process.platform === "win32" ? "junction" : "dir");
    try { await expectFailure(); }
    finally { await unlink(join(root, "linked")); }
  });

  for (const [name, value] of [
    ["dirty", JSON.stringify({ ...build, dirty: true })],
    ["invalid commit", JSON.stringify({ ...build, commit: "unknown" })],
    ["non-string commit", JSON.stringify({ ...build, commit: [build.commit] })],
    ["missing build time", JSON.stringify({ commit: build.commit, dirty: false })],
    ["noncanonical build time", JSON.stringify({ ...build, builtAt: "2026-09-15" })],
    ["malformed JSON", "{"],
  ]) {
    it(`rejects ${name} provenance without a success-shaped fallback`, async () => {
      await writeFile(join(root, "build-info.json"), value);
      try { await expectFailure(); }
      finally { await writeFile(join(root, "build-info.json"), JSON.stringify(build)); }
    });
  }
});

afterAll(async () => {
  if (child && child.exitCode === null) {
    const exit = new Promise<void>((resolve) => child.once("exit", () => resolve()));
    child.kill();
    await exit;
  }
  if (directory) {
    await unlink(join(directory, "alias"));
    await rm(directory, { recursive: true });
  }
  expect(errors).toBe("");
});

describe("standalone packaged static server", () => {
  it("starts when a PM2-style ESM container imports the matching pm_exec_path", async () => {
    const module = join(directory, "server.mjs");
    const app = spawn(process.execPath, [join(directory, "fork-container.mjs")], {
      env: { ...process.env, PLAYWRIGHT_PORT: "0", TEST_MODULE: module, pm_exec_path: module },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    app.stderr!.on("data", (data) => { stderr += data; });
    try {
      const url = await new Promise<string>((resolve, reject) => {
        app.once("error", reject);
        app.once("exit", (code) => reject(new Error(`PM2-shaped import exited ${code}: ${stderr}`)));
        app.stdout!.on("data", (data) => {
          const match = data.toString().match(/http:\/\/localhost:\d+/);
          if (match) resolve(match[0]);
        });
      });
      const response = await fetch(`${url}/pharmacy/claims`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-security-policy")).toBe(headers["Content-Security-Policy"]);
      expect(await response.text()).toContain("Synthetic SPA");
    } finally {
      if (app.exitCode === null) {
        const exit = new Promise<void>((resolve) => app.once("exit", () => resolve()));
        app.kill(); await exit;
      }
    }
    expect(stderr).toBe("");
  });

  it("does not auto-start when another PM2 application imports the server helper", async () => {
    const launcher = join(directory, "fork-container.mjs");
    const app = spawn(process.execPath, [launcher], {
      env: { ...process.env, PLAYWRIGHT_PORT: "0", TEST_MODULE: join(directory, "server.mjs"), pm_exec_path: launcher },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    app.stdout!.on("data", (data) => { stdout += data; });
    app.stderr!.on("data", (data) => { stderr += data; });
    const code = await new Promise<number | null>((resolve, reject) => {
      app.once("error", reject);
      app.once("exit", resolve);
    });
    expect(code).toBe(0);
    expect(stdout.trim()).toBe("Module imported");
    expect(stderr).toBe("");
  });

  for (const variable of ["PORT", "SERVER_PORT"]) {
    it(`binds on all interfaces using App Service ${variable} without a local override`, async () => {
      const env = { ...process.env };
      delete env.PLAYWRIGHT_PORT;
      delete env.PORT;
      delete env.SERVER_PORT;
      env[variable] = "0";
      const app = spawn(process.execPath, [join(directory, "server.mjs")], { env, stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      app.stderr!.on("data", (data) => { stderr += data; });
      try {
        const port = await new Promise<string>((resolve, reject) => {
          app.once("error", reject);
          app.once("exit", (code) => reject(new Error(`App server exited ${code}: ${stderr}`)));
          app.stdout!.on("data", (data) => {
            const match = data.toString().match(/http:\/\/0\.0\.0\.0:(\d+)/);
            if (match) resolve(match[1]);
          });
        });
        expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(200);
      } finally {
        if (app.exitCode === null) {
          const exit = new Promise<void>((resolve) => app.once("exit", () => resolve()));
          app.kill(); await exit;
        }
      }
      expect(stderr).toBe("");
    });
  }

  for (const path of ["/", "/pharmacy/claims?caseId=EX-24112", "/case/EX-24112/trace"]) {
    it(`returns the identical SPA with strict headers for ${path}`, async () => {
      const response = await fetch(`${base}${path}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<html><div id="root">Synthetic SPA</div></html>');
      for (const [name, value] of Object.entries(headers)) expect(response.headers.get(name)).toBe(value);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    });
  }

  for (const [path, mime] of [["/assets/entry-123.js", "text/javascript"], ["/assets/entry-123.css", "text/css"]]) {
    it(`serves immutable fingerprinted ${mime} with HEAD parity`, async () => {
      const get = await fetch(`${base}${path}`);
      const head = await fetch(`${base}${path}`, { method: "HEAD" });
      expect(get.headers.get("content-type")).toContain(mime);
      expect(get.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
      expect(head.headers.get("content-length")).toBe(get.headers.get("content-length"));
      expect(await head.text()).toBe("");
    });
  }

  it("exposes only public build provenance without caching a stale commit", async () => {
    const response = await fetch(`${base}/build-info.json`);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ commit: "a".repeat(40), dirty: false });
  });

  for (const path of ["/assets/missing.js", "/assets/", "/images/missing", "/missing.json", "/server.mjs", "/hosting.config.json", "/staticwebapp.config.json"]) {
    it(`does not substitute HTML or expose server metadata for ${path}`, async () => {
      const response = await fetch(`${base}${path}`);
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.text()).not.toContain("Synthetic SPA");
    });
  }

  for (const path of ["/%2e%2e/secret", "/.env", "/%5csecret", "/%00", "/%ZZ"]) {
    it(`rejects invalid or hidden raw path ${path}`, async () => {
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const req = request(base, { path }, (res) => {
          let body = "";
          res.on("data", (data) => { body += data; });
          res.on("end", () => resolve({ status: res.statusCode!, body }));
        });
        req.on("error", reject); req.end();
      });
      expect(response.status).toBe(400);
      expect(response.body).not.toContain("DO_NOT_SERVE");
    });
  }

  for (const path of ["//hosting.config.json", "/%2fhosting.config.json", "/alias/hosting.config.json", "//server.mjs", "/%2fserver.mjs", "/alias/server.mjs"]) {
    it(`denies the resolved private file through raw alias ${path}`, async () => {
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const req = request(base, { path }, (res) => {
          let body = "";
          res.on("data", (data) => { body += data; });
          res.on("end", () => resolve({ status: res.statusCode!, body }));
        });
        req.on("error", reject); req.end();
      });
      expect(response.status).toBe(404);
      expect(response.body).toBe("");
    });
  }

  it("rejects writes while retaining security headers", async () => {
    const response = await fetch(base, { method: "POST", body: "not accepted" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("content-security-policy")).toBe(headers["Content-Security-Policy"]);
  });
});
