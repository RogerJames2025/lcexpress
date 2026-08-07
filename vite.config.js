import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true
  },

  optimizeDeps: {
    exclude: [
      "@journeyapps/wa-sqlite",
      "@powersync/web"
    ]
  },

  worker: {
    format: "es"
  }
});
