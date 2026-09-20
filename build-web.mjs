/* Copies the site into www/ for Capacitor. The website at the repo root stays
   the single source of truth: this just gathers what the app bundle needs. */
import { cp, mkdir, rm, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'www');

const FILES = [
  'index.html', 'privacy.html', 'terms.html',
  'styles.css', 'floor.css', 'legal.css',
  'charts.js', 'data.js', 'app.js', 'landing.js', 'native.js',
  'favicon.svg', 'favicon.ico', 'apple-touch-icon.png',
  'icon-192.png', 'icon-512.png', 'site.webmanifest',
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const missing = [];
for (const f of FILES) {
  const src = join(root, f);
  if (!existsSync(src)) { missing.push(f); continue; }
  await cp(src, join(out, f));
}

if (missing.length) {
  console.error('Missing files, the app bundle would be incomplete:', missing.join(', '));
  process.exit(1);
}

const list = await readdir(out);
await writeFile(join(out, 'build-info.json'), JSON.stringify({ built: new Date().toISOString(), files: list.length }, null, 2));
console.log(`www/ ready: ${list.length} files`);
