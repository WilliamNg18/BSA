import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
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

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "bsa-static-server-"));
  await mkdir(join(directory, "assets"));
  await copyFile(source, join(directory, "server.mjs"));
  await copyFile(policyFile, join(directory, "hosting.config.json"));
  headers = JSON.parse(await readFile(policyFile, "utf8")).globalHeaders;
  await writeFile(join(directory, "index.html"), '<html><div id="root">Synthetic SPA</div></html>');
  await writeFile(join(directory, "assets", "entry-123.js"), 'console.log("synthetic");');
  await writeFile(join(directory, "assets", "entry-123.css"), "body{color:black}");
  await writeFile(join(directory, "build-info.json"), JSON.stringify({ commit: "a".repeat(40), dirty: false }));
  await writeFile(join(directory, ".env"), "DO_NOT_SERVE");
  child = spawn(process.execPath, [join(directory, "server.mjs")], {
    env: { ...process.env, PLAYWRIGHT_PORT: "0" }, stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr!.on("data", (data) => { errors += data.toString(); });
  base = await new Promise<string>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`Server exited ${code}: ${errors}`)));
    child.stdout!.on("data", (data) => {
      const match = data.toString().match(/http:\/\/localhost:(\d+)/);
      if (match) resolve(match[0]);
    });
  });
});

afterAll(async () => {
  if (child && child.exitCode === null) {
    const exit = new Promise<void>((resolve) => child.once("exit", () => resolve()));
    child.kill();
    await exit;
  }
  if (directory) await rm(directory, { recursive: true });
  expect(errors).toBe("");
});

describe("standalone packaged static server", () => {
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

  it("rejects writes while retaining security headers", async () => {
    const response = await fetch(base, { method: "POST", body: "not accepted" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("content-security-policy")).toBe(headers["Content-Security-Policy"]);
  });
});
