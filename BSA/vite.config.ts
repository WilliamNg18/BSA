import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { runtimeCss } from "./build/runtime-css";
import { runtimeBudget } from "./build/runtime-budget";

// `base` is "/" for local development and "/<repo-name>/" on GitHub Pages
// (the deploy workflow sets VITE_BASE from the repository name).
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [runtimeCss(fileURLToPath(new URL(".", import.meta.url))), react(), tailwindcss(), runtimeBudget()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
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
});
