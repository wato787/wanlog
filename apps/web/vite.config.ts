/// <reference types="vitest/config" />
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // @tanstack/router-plugin は @vitejs/plugin-react より前に渡す（公式）
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ] as PluginOption[],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
  },
});
