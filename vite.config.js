import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },
  worker: {
    // PowerSync web workers require ES module output when Rollup code-splitting is used.
    // Vite defaults to IIFE for workers, which fails with @powersync/web.
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['@journeyapps/wa-sqlite', '@powersync/web']
  }
});
