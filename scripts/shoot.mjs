// Screenshot the built site at several widths and report console errors and overflow.
//   node scripts/shoot.mjs [url] [outdir] [--reduced]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? '.shots';
const reduced = process.argv.includes('--reduced');
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const sizes = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844, mobile: true },
];
for (const s of sizes) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 1,
    isMobile: !!s.mobile,
    hasTouch: !!s.mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const mode = await page.locator('.hero').getAttribute('data-mode');
  await page.screenshot({ path: `${out}/${s.name}-hero.jpg`, quality: 70 });
  // scroll through to trigger entrances and lazy media
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(s.height * 0.8)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(220);
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed') {
        const clip = el.closest('.hero__stage, .footer, .case, dialog, .sr-only, .form__hp, .skip');
        if (!clip) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    });
    return { scrollW: document.documentElement.scrollWidth, w, bad: bad.slice(0, 12) };
  });
  const sections = await page.locator('main > section, footer').all();
  let i = 0;
  for (const sec of sections) {
    const id = (await sec.getAttribute('id')) ?? 'footer';
    await sec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await sec.screenshot({ path: `${out}/${s.name}-${String(i++).padStart(2, '0')}-${id}.jpg`, quality: 62 });
  }
  console.log(`\n[${s.name}] scene=${mode} height=${total} scrollWidth=${overflow.scrollW}/${overflow.w}`);
  if (overflow.bad.length) console.log('  overflow:', overflow.bad.join('\n   '));
  if (errors.length) console.log('  errors:\n   ' + errors.join('\n   '));
  await ctx.close();
}
await browser.close();
