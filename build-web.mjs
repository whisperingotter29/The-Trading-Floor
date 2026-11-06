/* Copies the site into www/ for Capacitor. The website at the repo root stays
   the single source of truth: this just gathers what the app bundle needs. */
import { cp, mkdir, rm, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'www');

/* Only builds of main talk to the production database. On Vercel that is the
   production deployment; for the iOS app it is whichever branch is checked out. */
function backend() {
  if (process.env.TF_ENV) return process.env.TF_ENV === 'production' ? 'production' : 'staging';
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === 'production' ? 'production' : 'staging';
  if (process.env.VERCEL_GIT_COMMIT_REF) return process.env.VERCEL_GIT_COMMIT_REF === 'main' ? 'production' : 'staging';
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: root }).toString().trim() === 'main' ? 'production' : 'staging';
  } catch { return 'staging'; }
}

const FILES = [
  'index.html', 'privacy.html', 'terms.html',
  'styles.css', 'floor.css', 'legal.css',
  'charts.js', 'env.js', 'data.js', 'app.js', 'landing.js', 'native.js',
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

const env = backend();
await writeFile(join(out, 'env.js'), `window.TF_ENV = '${env}';\n`);

const list = await readdir(out);
await writeFile(join(out, 'build-info.json'), JSON.stringify({ built: new Date().toISOString(), files: list.length, backend: env }, null, 2));
console.log(`www/ ready: ${list.length} files, backend: ${env}`);
