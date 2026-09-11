import { fileURLToPath, URL } from "node:url";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { runtimeCss } from "./build/runtime-css";
import { runtimeBudget } from "./build/runtime-budget";
import { radixTreeShaking } from "./build/radix-tree-shaking";

const routerRoot = dirname(createRequire(import.meta.url).resolve("react-router/package.json"));

// `base` is "/" for local development and "/<repo-name>/" on GitHub Pages
// (the deploy workflow sets VITE_BASE from the repository name).
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? "/",
  plugins: [runtimeCss(fileURLToPath(new URL(".", import.meta.url))), radixTreeShaking(), react(), tailwindcss(), runtimeBudget()],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
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
    // The hard 200,000-byte total gzip gate above replaces the generic 500 kB
    // raw-chunk advice to lazy-load. Retain a separate 650 kB raw-chunk warning.
    chunkSizeWarningLimit: 650,
  },
}));
