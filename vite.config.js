import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function inlineProductionApp() {
  return {
    name: "inline-production-app",
    apply: "build",
    closeBundle() {
      const outputDir = path.resolve("dist");
      const indexPath = path.join(outputDir, "index.html");
      const appPath = path.join(outputDir, "app.js");
      const index = readFileSync(indexPath, "utf8");
      const app = readFileSync(appPath, "utf8");
      // Raw HTML templates are bundled into the app and can contain closing
      // script tags. Escape them so they cannot terminate this inline script.
      const safeApp = app.replace(/<\/script/gi, "<\\/script");
      const inlineScript = `<script type="module">${safeApp}</script>`;
      const externalScript = /\s*<script type="module" crossorigin src="\/app\.js"><\/script>/;

      writeFileSync(indexPath, index.replace(externalScript, () => `\n  ${inlineScript}`));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineProductionApp()],
  build: {
    // The cPanel host currently returns 403 for files under /assets.
    // Emit the application bundle at the document root instead.
    assetsDir: "",
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: false,
    watch: {
      ignored: [
        "**/public/**",
        "**/node_modules/**",
        "**/.git/**",
      ],
    },
  },
});
