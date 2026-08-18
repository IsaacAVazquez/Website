import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const extensionRoot = fileURLToPath(new URL(".", import.meta.url));
const repositoryRoot = resolve(extensionRoot, "..");

export default defineConfig({
  root: extensionRoot,
  publicDir: resolve(extensionRoot, "public"),
  plugins: [react()],
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
          chunk.name === "service-worker" ? "service-worker.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
