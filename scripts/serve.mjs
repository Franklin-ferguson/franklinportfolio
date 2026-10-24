// Tiny static server for previewing dist/ (no dependencies).
//   node scripts/serve.mjs dist 4173
import { createServer as http } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
  '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

export function createServer(root, port) {
  const server = http(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      path = normalize(path).replace(/^(\.\.[/\\])+/, '');
      let file = join(root, path);
      const s = await stat(file).catch(() => null);
      if (s?.isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file).catch(() => null);
      if (!body) {
        res.writeHead(404, { 'content-type': TYPES['.html'] });
        res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
        return;
      }
      const type = TYPES[extname(file)] ?? 'application/octet-stream';
      const range = req.headers.range;
      if (range && type === 'video/mp4') {
        const [a, b] = range.replace('bytes=', '').split('-');
        const start = Number(a);
        const end = b ? Number(b) : body.length - 1;
        res.writeHead(206, {
          'content-type': type, 'accept-ranges': 'bytes',
          'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': end - start + 1,
        });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
      res.end(body);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  server.listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(process.argv[2] ?? 'dist', Number(process.argv[3] ?? 4173));
}
