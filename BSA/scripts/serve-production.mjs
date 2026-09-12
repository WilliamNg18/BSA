import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Local acceptance server, not a replacement Azure host. Read the built policy,
// so browser tests exercise exactly the security headers shipped for deployment.
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const config = JSON.parse(await readFile(resolve(root, "staticwebapp.config.json"), "utf8"));
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4183);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid PLAYWRIGHT_PORT");
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  for (const [name, value] of Object.entries(config.globalHeaders)) response.setHeader(name, value);
  response.setHeader("Cache-Control", "no-store");
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = resolve(root, `.${pathname}`);
    if (!file.startsWith(root.endsWith(sep) ? root : `${root}${sep}`) && file !== resolve(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if (!(await stat(file)).isFile()) file = resolve(root, "index.html");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      // Deep links use the configured SPA fallback. Missing assets fail loudly.
      if (extname(pathname) || /^\/(assets|images|fonts)\//.test(pathname)) {
        response.writeHead(404).end("Asset not found");
        return;
      }
      file = resolve(root, `.${config.navigationFallback.rewrite}`);
    }
    const body = await readFile(file);
    response.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    response.writeHead(200).end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    console.error("Production acceptance request failed", error);
    response.writeHead(500).end("Production acceptance request failed");
  }
}).listen(port, "localhost", () => console.log(`Production headers: http://localhost:${port}/`));
