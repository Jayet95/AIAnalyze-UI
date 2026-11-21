import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
// Standalone static build only; the managed Lovable preview retains TanStack Start.
export default defineConfig({
  root: "desktop",
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "../dist-local", emptyOutDir: true },
  publicDir: false,
});
