import { readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{name:'lc-precache-manifest',closeBundle(){
    const dir=resolve('dist');
    const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(d,e.name)):[resolve(d,e.name)]);
    const files=walk(dir).map(f=>relative(dir,f).replaceAll('\\','/')).filter(f=>f.startsWith('assets/'));
    writeFileSync(resolve(dir,'lc-assets.json'),JSON.stringify(files.sort()));
  }}],
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
