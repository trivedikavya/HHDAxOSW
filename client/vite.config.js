import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Load .env files from the monorepo root instead of client/, so a
  // single root .env (copied from .env.example) can configure both the
  // server and the client consistently. This only affects local .env
  // FILE loading - real environment variables set by a host (e.g.
  // Vercel project settings) are picked up regardless of this setting.
  envDir: path.resolve(__dirname, ".."),
  server: {
    port: 5173,
  },
});
