// Static build: bundles the client with esbuild, pre-renders the React tree to HTML
// (so content, headings and links are in the page before any JavaScript runs),
// then copies public/ into dist/. The output works from any sub-path, e.g.
// https://<user>.github.io/franklinportfolio/, because every URL is relative.
//
//   node scripts/build.mjs           production build into dist/
//   node scripts/build.mjs --watch   rebuild on change and serve on http://localhost:5173
import { build, context } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const WATCH = process.argv.includes('--watch');
const OUT = 'dist';
const SITE_URL = 'https://franklin-ferguson.github.io/franklinportfolio/';

const shared = {
  bundle: true,
  jsx: 'automatic',
  loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': WATCH || process.env.DEVBUILD ? '"development"' : '"production"' },
  logLevel: 'warning',
};

async function buildClient() {
  const result = await build({
    ...shared,
    entryPoints: { app: 'src/entry-client.tsx' },
    outdir: `${OUT}/assets`,
    format: 'esm',
    splitting: true,
    minify: !WATCH && !process.env.DEVBUILD,
    sourcemap: WATCH,
    target: ['es2020', 'chrome100', 'safari15', 'firefox100'],
    entryNames: '[name]-[hash]',
    chunkNames: 'chunk-[name]-[hash]',
    assetNames: '[name]-[hash]',
    loader: { '.json': 'json', '.woff2': 'file' },
    metafile: true,
    legalComments: 'linked',
  });
  const outputs = Object.entries(result.metafile.outputs);
  const js = outputs.find(([, o]) => o.entryPoint === 'src/entry-client.tsx')[0];
  const css = outputs.find(([p]) => p.endsWith('.css'))?.[0];
  return { js: js.replace(`${OUT}/`, ''), css: css?.replace(`${OUT}/`, '') };
}

async function renderHtml() {
  await build({
    ...shared,
    entryPoints: ['src/entry-server.tsx'],
    outfile: '.build/server.mjs',
    platform: 'node',
    format: 'esm',
    loader: { '.json': 'json', '.css': 'empty' },
    packages: 'external',
  });
  const mod = await import(pathToFileURL('.build/server.mjs').href + `?t=${Date.now()}`);
  return mod.render();
}

async function run() {
  if (!WATCH) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp('public', OUT, { recursive: true });

  const [{ js, css }, appHtml] = await Promise.all([buildClient(), renderHtml()]);
  const template = await readFile('src/index.html', 'utf8');
  const version = createHash('sha1').update(js + (css ?? '')).digest('hex').slice(0, 8);

  const html = template
    .replaceAll('%SITE_URL%', SITE_URL)
    .replace('<!--app-css-->', css ? `<link rel="stylesheet" href="./${css}">` : '')
    .replace('<!--app-js-->', `<script type="module" src="./${js}"></script>`)
    .replace('<!--app-html-->', appHtml)
    .replace('%BUILD%', version);
  await writeFile(`${OUT}/index.html`, html);

  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    `${OUT}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
  );
  await writeFile(`${OUT}/.nojekyll`, '');
  console.log(`built ${OUT}/index.html  js=${js}  css=${css}`);
}

if (!WATCH) {
  await run();
} else {
  const { createServer } = await import('./serve.mjs');
  await run();
  createServer(OUT, 5173);
  const { watch } = await import('node:fs');
  let timer;
  for (const dir of ['src', 'public']) {
    if (!existsSync(dir)) continue;
    watch(dir, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => run().catch((e) => console.error(e.message)), 120);
    });
  }
  console.log('watching src/ and public/ …');
  void context; // kept for parity with esbuild's incremental API if needed later
}
