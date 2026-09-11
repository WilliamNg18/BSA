import { readFile, readdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { gzipSync } from "node:zlib";
import type { Plugin } from "vite";

export const RUNTIME_BUDGET_BYTES = 200_000;

export function measureRuntime(files: { file: string; bytes: Uint8Array }[]) {
  // Count every emitted payload, even fonts/chunks not requested in the default
  // scene. Only the empty hosting marker is not a browser resource.
  const assets = files.filter(({ file, bytes }) => file !== ".nojekyll" || bytes.length > 0)
    .map(({ file, bytes }) => ({ file, raw: bytes.length, gzip: gzipSync(bytes).length }));
  return { assets, gzipTotal: assets.reduce((sum, asset) => sum + asset.gzip, 0), limit: RUNTIME_BUDGET_BYTES };
}

export function assertRuntimeBudget(report: ReturnType<typeof measureRuntime>) {
  if (!report.assets.some(({ file }) => file.endsWith(".js")) || !report.assets.some(({ file }) => file.endsWith(".css")) || !report.assets.some(({ file }) => file.endsWith(".html"))) throw new Error("Runtime budget requires HTML, CSS and JavaScript");
  if (report.gzipTotal >= RUNTIME_BUDGET_BYTES) throw new Error(`Runtime payload ${report.gzipTotal} gzip bytes must be below ${RUNTIME_BUDGET_BYTES}`);
}

export function runtimeBudget(): Plugin {
  let outDir: string;
  return {
    name: "complete-eager-runtime-budget",
    apply: "build",
    enforce: "post",
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.dynamicImports.length) this.error(`Asynchronous runtime chunks are forbidden: ${chunk.fileName}`);
      }
    },
    async writeBundle() {
      const entries = await readdir(outDir, { recursive: true, withFileTypes: true });
      const files = await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
        const path = resolve(entry.parentPath, entry.name);
        return { file: relative(outDir, path).replaceAll("\\", "/"), bytes: await readFile(path) };
      }));
      const report = measureRuntime(files);
      console.log(`Runtime payload: ${report.gzipTotal}/${report.limit} gzip bytes (all emitted assets; decimal bytes)`);
      assertRuntimeBudget(report);
    },
  };
}