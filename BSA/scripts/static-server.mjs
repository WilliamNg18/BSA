import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { lstat, open, readFile, readdir, realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".txt": "text/plain; charset=utf-8",
};

const sameFileState = (left, right) => ["dev", "ino", "size", "mtimeNs", "ctimeNs"]
  .every((key) => left[key] === right[key]);

async function releaseManifest(root, protectedPaths) {
  const files = [], fileStates = [], directories = [];
  let buildBytes;
  const visit = async (directory, prefix = "") => {
    const state = await lstat(directory, { bigint: true });
    if (!state.isDirectory() || state.isSymbolicLink()) throw new Error("Runtime directory must not be a symlink");
    const names = (await readdir(directory)).sort();
    directories.push({ directory, state, names });
    for (const name of names) {
      const path = `${prefix}${name}`;
      if (name.startsWith(".") || /[\\:\0]/.test(name) || path === "release-manifest.json") {
        throw new Error(`Unsupported runtime inventory path: ${path}`);
      }
      const full = resolve(directory, name);
      const before = await lstat(full, { bigint: true });
      if (before.isSymbolicLink()) throw new Error(`Runtime symlink is not permitted: ${path}`);
      if (before.isDirectory()) {
        await visit(full, `${path}/`);
        continue;
      }
      if (!before.isFile() || !(await realpath(full)).startsWith(`${root}${sep}`)) {
        throw new Error(`Runtime file escapes the regular-file boundary: ${path}`);
      }
      const handle = await open(full, "r");
      try {
        const opened = await handle.stat({ bigint: true });
        if (!opened.isFile() || before.dev !== opened.dev || before.ino !== opened.ino) {
          throw new Error(`Runtime file identity changed before reading: ${path}`);
        }
        const body = await handle.readFile();
        if (BigInt(body.length) !== opened.size || !sameFileState(opened, await handle.stat({ bigint: true }))) {
          throw new Error(`Runtime file changed while reading: ${path}`);
        }
        if (path === "build-info.json") buildBytes = body;
        files.push({
          path,
          bytes: body.length,
          sha256: createHash("sha256").update(body).digest("hex"),
          public: !protectedPaths.has(full) && Boolean(types[extname(full)]),
        });
        fileStates.push({ full, state: opened });
      } finally {
        await handle.close();
      }
    }
  };
  await visit(root);
  if (!buildBytes) throw new Error("Runtime build provenance is missing");
  const build = JSON.parse(buildBytes.toString("utf8"));
  if (!build || typeof build.commit !== "string" || !/^[a-f0-9]{40}$/.test(build.commit) || build.dirty !== false
    || typeof build.builtAt !== "string" || !Number.isFinite(Date.parse(build.builtAt))
    || new Date(build.builtAt).toISOString() !== build.builtAt) {
    throw new Error("Runtime build provenance must identify a clean commit and UTC build time");
  }
  // Refuse a mixed deployment rather than returning a cached or partial inventory.
  for (const { directory, state, names } of directories) {
    const current = await lstat(directory, { bigint: true });
    if (!current.isDirectory() || current.isSymbolicLink() || !sameFileState(state, current)
      || JSON.stringify((await readdir(directory)).sort()) !== JSON.stringify(names)) {
      throw new Error("Runtime directory changed during inventory");
    }
  }
  for (const { full, state } of fileStates) {
    const current = await lstat(full, { bigint: true });
    if (!current.isFile() || current.isSymbolicLink() || !sameFileState(state, current)) {
      throw new Error("Runtime file changed during inventory");
    }
  }
  files.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return { schemaVersion: 1, commit: build.commit, builtAt: build.builtAt, files };
}

export async function startStaticServer(directory) {
  const root = await realpath(directory);
  const policy = JSON.parse(await readFile(resolve(root, "hosting.config.json"), "utf8"));
  const protectedPaths = new Set([
    resolve(root, "hosting.config.json"), resolve(root, "server.mjs"), resolve(root, "staticwebapp.config.json"),
    resolve(root, "release-manifest.json"),
    await realpath(resolve(root, "hosting.config.json")), await realpath(resolve(root, "server.mjs")),
  ]);
  const port = Number(process.env.PLAYWRIGHT_PORT ?? process.env.PORT ?? process.env.SERVER_PORT ?? 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid static server port");
  const host = process.env.PLAYWRIGHT_PORT !== undefined ? "localhost" : "0.0.0.0";
  const insideRoot = (file) => file.startsWith(`${root}${sep}`);
  const fallback = resolve(root, `.${policy.spaFallback}`);
  if (!insideRoot(fallback)) throw new Error("SPA fallback must be inside the static root");
  const fallbackReal = await realpath(fallback);
  if (!insideRoot(fallbackReal)) throw new Error("SPA fallback must not escape the static root");
  const server = createServer(async (request, response) => {
    for (const [name, value] of Object.entries(policy.globalHeaders)) response.setHeader(name, value);
    response.setHeader("Cache-Control", "no-store");
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }
      let pathname;
      try { pathname = decodeURIComponent((request.url ?? "/").split("?")[0]); }
      catch { response.writeHead(400).end("Malformed URL"); return; }
      if (!pathname.startsWith("/") || /[\\\0]/.test(pathname) || pathname.split("/").some((part) => part.startsWith("."))) {
        response.writeHead(400).end("Invalid path");
        return;
      }
      if (pathname === "/release-manifest.json") {
        const body = Buffer.from(`${JSON.stringify(await releaseManifest(root, protectedPaths))}\n`);
        response.setHeader("Content-Type", types[".json"]);
        response.setHeader("Content-Length", body.length);
        response.writeHead(200).end(request.method === "HEAD" ? undefined : body);
        return;
      }
      // Server source and deployment policy are not public application assets.
      if (pathname === "/hosting.config.json" || pathname === "/server.mjs" || pathname === "/staticwebapp.config.json") {
        response.writeHead(404).end();
        return;
      }
      let file = resolve(root, `.${pathname}`);
      if (file !== root && !insideRoot(file)) { response.writeHead(400).end("Invalid path"); return; }
      if (protectedPaths.has(file)) { response.writeHead(404).end(); return; }
      let isFallback = false;
      try {
        if (!(await stat(file)).isFile()) {
          if (extname(pathname) || policy.assetPrefixes.some((prefix) => pathname.startsWith(prefix))) {
            response.writeHead(404).end("Asset not found");
            return;
          }
          file = fallback;
          isFallback = true;
        }
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
        if (extname(pathname) || policy.assetPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          response.writeHead(404).end("Asset not found");
          return;
        }
        file = fallback;
        isFallback = true;
      }
      file = await realpath(file);
      if (!insideRoot(file) || protectedPaths.has(file) || !types[extname(file)]) { response.writeHead(404).end(); return; }
      const body = await readFile(file);
      if (!isFallback && pathname.startsWith(policy.immutableAssetPrefix)) {
        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
      response.setHeader("Content-Type", types[extname(file)]);
      response.setHeader("Content-Length", body.length);
      response.writeHead(200).end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      console.error("Static request failed", error);
      response.writeHead(500).end("Static request failed");
    }
  });
  await new Promise((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolveListening);
  });
  console.log(`Static server listening on http://${host}:${server.address().port}`);
  return server;
}

// PM2's fork container imports ESM through pm_exec_path; argv[1] remains the container.
if ([process.argv[1], process.env.pm_exec_path].some((entry) => entry && resolve(entry) === fileURLToPath(import.meta.url))) {
  await startStaticServer(fileURLToPath(new URL(".", import.meta.url)));
}
