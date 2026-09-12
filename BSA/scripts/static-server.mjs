import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
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

export async function startStaticServer(directory) {
  const root = await realpath(directory);
  const policy = JSON.parse(await readFile(resolve(root, "hosting.config.json"), "utf8"));
  const protectedPaths = new Set([
    resolve(root, "hosting.config.json"), resolve(root, "server.mjs"), resolve(root, "staticwebapp.config.json"),
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
