import { defineConfig } from 'vite';
import { cpSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The game uses ordered classic scripts and standalone HTML demos. Vite leaves
// those script tags untouched, so their files must accompany dist/index.html.
function copyClassicAssets() {
  return {
    name: 'copy-classic-game-assets',
    closeBundle() {
      for (const folder of ['js', 'css', 'assets', 'public']) {
        if (existsSync(folder)) cpSync(folder, join('dist', folder), { recursive: true });
      }
      for (const file of ['main.js', 'style.css']) {
        if (existsSync(file)) copyFileSync(file, join('dist', file));
      }
      for (const file of readdirSync('.').filter(name => name.endsWith('.html') && name !== 'index.html')) {
        copyFileSync(file, join('dist', file));
      }
    }
  };
}

export default defineConfig({ plugins: [copyClassicAssets()] });
