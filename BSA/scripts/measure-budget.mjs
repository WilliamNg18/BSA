import { readFile, readdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

// Independent disk check complements Vite's generation-time dynamic-import
// guard. Count each HTTP resource separately, including fonts and public files.
const directory = resolve(process.argv[2] ?? fileURLToPath(new URL("../dist", import.meta.url)));
try {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  const assets = [];
  for (const entry of entries.filter((item) => item.isFile())) {
    const path = resolve(entry.parentPath, entry.name);
    const file = relative(directory, path).replaceAll("\\", "/");
    const bytes = await readFile(path);
    if (file === ".nojekyll" && bytes.length === 0) continue;
    assets.push({ file, raw: bytes.length, gzip: gzipSync(bytes).length });
  }
  assets.sort((a, b) => a.file.localeCompare(b.file));
  const gzipTotal = assets.reduce((sum, asset) => sum + asset.gzip, 0);
  const limit = 200_000;
  const complete = [".js", ".css", ".html"].every((suffix) => assets.some(({ file }) => file.endsWith(suffix)));
  const passed = complete && gzipTotal < limit;
  console.log(JSON.stringify({ directory, assets, gzipTotal, limit, headroom: limit - gzipTotal, complete, passed }, null, 2));
  if (!complete) throw new Error("Runtime budget requires HTML, CSS and JavaScript");
  if (!passed) throw new Error(`Runtime payload ${gzipTotal} gzip bytes must be below ${limit}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}