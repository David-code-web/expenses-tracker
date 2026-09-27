import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-sqlite-wasm',
      closeBundle() {
        const outputDir = resolve('dist');
        mkdirSync(outputDir, { recursive: true });
        copyFileSync(resolve('node_modules/sql.js/dist/sql-wasm.wasm'), resolve(outputDir, 'sql-wasm.wasm'));
      },
    },
  ],
});
