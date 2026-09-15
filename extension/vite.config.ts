import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { build, defineConfig } from "vite";

const extensionRoot = fileURLToPath(new URL(".", import.meta.url));
const repositoryRoot = resolve(extensionRoot, "..");

export default defineConfig({
  root: extensionRoot,
  publicDir: resolve(extensionRoot, "public"),
  plugins: [react(), {
    name: "bundle-draft-content-script",
    async closeBundle() {
      // Manifest content scripts are classic scripts. Build this entry on its
      // own so shared side-panel modules cannot turn into top-level imports.
      await build({
        configFile: false,
        root: extensionRoot,
        publicDir: false,
        resolve: { alias: { "@": resolve(repositoryRoot, "src") } },
        build: {
          outDir: resolve(extensionRoot, "dist"),
          emptyOutDir: false,
          sourcemap: true,
          lib: {
            entry: resolve(extensionRoot, "autodraft-content.ts"),
            name: "FantasyDraftContent",
            formats: ["iife"],
            fileName: () => "autodraft-content.js",
          },
        },
      });
    },
  }],
  resolve: {
    alias: {
      "@": resolve(repositoryRoot, "src"),
    },
  },
  build: {
    outDir: resolve(extensionRoot, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(extensionRoot, "sidepanel.html"),
        "service-worker": resolve(extensionRoot, "service-worker.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "service-worker"
            ? "service-worker.js"
            : chunk.name === "autodraft-content"
              ? "autodraft-content.js"
              : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
