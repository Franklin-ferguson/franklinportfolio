// Renders the social-sharing image (public/og.jpg) from the live hero. Run after a build:
//   npm run preview & node scripts/og.mjs
import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:4173/';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: 'networkidle' });
await p.addStyleTag({ content: '.bar,.hero__instruments,.hero__now,.hero__actions{display:none!important}.hero__inner{min-height:630px!important;padding-bottom:56px!important}.hero__name{font-size:132px!important}.hero__scroll{display:none!important}' });
await p.waitForTimeout(14000);
await p.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 1200, height: 630 }, timeout: 120000 });
await b.close();
console.log('wrote public/og.jpg');
