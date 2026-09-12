import { fileURLToPath, URL } from "node:url";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { runtimeCss } from "./build/runtime-css";
import { radixTreeShaking } from "./build/radix-tree-shaking";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const routerRoot = dirname(createRequire(import.meta.url).resolve("react-router/package.json"));

export default defineConfig(({ command }) => ({
  base: "/",
  plugins: [runtimeCss(fileURLToPath(new URL(".", import.meta.url))), radixTreeShaking(), react(), tailwindcss(), {
    name: "portable-static-delivery",
    generateBundle() {
      const cwd = fileURLToPath(new URL(".", import.meta.url));
      const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();
      if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Build requires an exact Git commit");
      this.emitFile({ type: "asset", fileName: "hosting.config.json", source: readFileSync(fileURLToPath(new URL("../hosting.config.json", import.meta.url))) });
      this.emitFile({ type: "asset", fileName: "server.mjs", source: readFileSync(fileURLToPath(new URL("./scripts/static-server.mjs", import.meta.url))) });
      this.emitFile({ type: "asset", fileName: "build-info.json", source: JSON.stringify({
        commit,
        builtAt: new Date().toISOString(),
        dirty: execFileSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" }).trim().length > 0,
      }, null, 2) });
    },
  }],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // Keep Radix interactions, but do not inject react-remove-scroll-bar's
      // inline stylesheet under the deployment's strict style-src 'self'.
      { find: /^react-remove-scroll-bar$/, replacement: fileURLToPath(new URL("./src/lib/csp-scroll-lock.ts", import.meta.url)) },
      // Router 7.18 exports its development entry even for production builds.
      // Use the package's own production files, not a warning-stripping shim.
      ...(command === "build" ? [
        { find: /^react-router$/, replacement: resolve(routerRoot, "dist/production/index.mjs") },
        { find: /^react-router\/dom$/, replacement: resolve(routerRoot, "dist/production/dom-export.mjs") },
      ] : []),
    ],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    cssMinify: "esbuild",
    terserOptions: { compress: { passes: 3 }, format: { comments: false } },
    reportCompressedSize: false,
    chunkSizeWarningLimit: Number.POSITIVE_INFINITY,
  },
}));
