// Functional and performance checks against the built site (dist/), in headless Chromium.
//   node scripts/test-site.mjs [url]
// Starts its own static server when no URL is given.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from './serve.mjs';

let url = process.argv[2];
let server;
if (!url) {
  server = createServer('dist', 4317);
  url = 'http://localhost:4317/';
}
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

// ---------- 1. structure, links and media ----------
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const h1 = await page.locator('h1').count();
  ok('exactly one h1', h1 === 1, `found ${h1}`);
  const sectionsWithoutHeading = await page.$$eval('main > section', (els) =>
    els.filter((s) => !s.querySelector('h1, h2')).map((s) => s.id));
  ok('every section has a heading', sectionsWithoutHeading.length === 0, sectionsWithoutHeading.join(', '));
  const imgsNoAlt = await page.$$eval('img', (els) => els.filter((i) => !i.hasAttribute('alt')).length);
  ok('every img has an alt attribute', imgsNoAlt === 0, `${imgsNoAlt} missing`);
  const noSize = await page.$$eval('img', (els) => els.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length);
  ok('every img reserves its size', noSize === 0, `${noSize} without width/height`);

  const refs = await page.$$eval('a[href], img[src], source[srcset], img[srcset], video[poster], link[href], script[src]', (els) => {
    const out = new Set();
    for (const el of els) {
      for (const attr of ['href', 'src', 'poster']) {
        const v = el.getAttribute(attr);
        if (v) out.add(v);
      }
      const ss = el.getAttribute('srcset');
      if (ss) ss.split(',').forEach((p) => out.add(p.trim().split(' ')[0]));
    }
    return [...out];
  });
  const local = refs.filter((r) => !/^(https?:|mailto:|tel:|#|data:)/.test(r));
  const missing = local.filter((r) => !existsSync(join('dist', r.replace(/^\.\//, '').split('#')[0])));
  ok('all local links and media exist', missing.length === 0, missing.join(', ') || `${local.length} checked`);
  const videos = await page.$$eval('video', (vs) => vs.map((v) => v.outerHTML.match(/media\/[\w-]+/)?.[0]));
  const vidMissing = ['media/kundungu.mp4', 'media/asamankese.mp4', 'media/vtol-test.mp4', 'media/multirotor-test.mp4', 'media/seed-module.mp4'].filter((v) => !existsSync(join('dist', v)));
  ok('video files present', vidMissing.length === 0, vidMissing.join(', ') || `${videos.length} players`);
  const anchors = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => h.length > 1));
  const missingAnchors = [];
  for (const a of new Set(anchors)) if (!(await page.locator(a).count())) missingAnchors.push(a);
  ok('in-page anchors resolve', missingAnchors.length === 0, missingAnchors.join(', '));
  const cv = await page.request.get(new URL('docs/Franklin_Ferguson_CV.pdf', url).href);
  ok('CV download serves a PDF', cv.ok() && (await cv.body()).subarray(0, 4).toString() === '%PDF');

  // nav link scrolls to section
  await page.click('.bar__nav a[href="#research"]');
  await page.waitForFunction(() => Math.abs(document.getElementById('research').getBoundingClientRect().top) < 120, null, { timeout: 15000 }).catch(() => {});
  const top = await page.evaluate(() => document.getElementById('research').getBoundingClientRect().top);
  ok('nav link scrolls to its section', Math.abs(top) < 120, `section top at ${Math.round(top)}px`);

  // planner re-plans
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  const before = await page.locator('.planner__out dd').nth(2).textContent();
  await page.locator('.slider input').first().fill('150');
  await page.locator('.slider input').first().dispatchEvent('input');
  await page.waitForTimeout(300);
  const after = await page.locator('.planner__out dd').nth(2).textContent();
  ok('planner re-plans flight lines', before !== after, `lines ${before} → ${after}`);
  await page.waitForFunction(() => /\d+\/\d+/.test(document.querySelector('[data-t="line"]')?.textContent ?? ''), null, { timeout: 20000 }).catch(() => {});
  const tel = await page.locator('[data-t="line"]').textContent();
  ok('telemetry updates from the 3D scene', /\d+\/\d+/.test(tel ?? ''), `line ${tel}`);

  // media rows: every frame in a row shares one height, rows fill their width, nothing is upscaled much
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  });
  await page.waitForTimeout(1500);
  const rowsReport = await page.$$eval('.mrow', (rows) => rows.map((row) => {
    const frames = [...row.querySelectorAll(':scope > .m > .m__frame')];
    const hs = frames.map((f) => f.getBoundingClientRect().height);
    const w = frames.reduce((s, f) => s + f.getBoundingClientRect().width, 0) + (frames.length - 1) * parseFloat(getComputedStyle(row).columnGap || '0');
    return { spread: Math.max(...hs) - Math.min(...hs), fill: w / row.getBoundingClientRect().width, inCard: !!row.closest('.card') };
  }));
  const uneven = rowsReport.filter((r) => !r.inCard && (r.spread > 2 || Math.abs(r.fill - 1) > 0.01));
  ok('media rows are justified (equal heights, full width)', uneven.length === 0, uneven.length ? JSON.stringify(uneven.slice(0, 3)) : `${rowsReport.length} rows`);
  const upscaled = await page.$$eval('.m__frame img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth && i.getBoundingClientRect().width > i.naturalWidth * 1.5).map((i) => i.currentSrc.split('/').pop()));
  ok('no photo is blown up beyond 1.5× its file size', upscaled.length === 0, upscaled.join(', '));
  const badOrient = await page.$$eval('.m', (ms) => ms.filter((m) => {
    if (m.closest('.card')) return false; // card thumbnails share one 16:10 frame by design
    const r = parseFloat(m.style.getPropertyValue('--r'));
    const b = m.querySelector('.m__frame').getBoundingClientRect();
    return Math.abs(b.width / b.height - r) / r > 0.02;
  }).map((m) => m.querySelector('img, video')?.getAttribute('alt') ?? m.querySelector('video')?.getAttribute('aria-label')));
  ok('every picture and video keeps its own aspect ratio', badOrient.length === 0, badOrient.join(' | '));

  // video toggle (gallery strip)
  const clip = page.locator('.strip .clip').first();
  await clip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await clip.hover();
  const playing0 = await clip.locator('video').evaluate((v) => !v.paused);
  await clip.locator('.clip__btn').click();
  await page.waitForTimeout(300);
  const playing1 = await clip.locator('video').evaluate((v) => !v.paused);
  ok('videos play on screen and the button pauses them', playing0 && !playing1, `before ${playing0}, after ${playing1}`);

  // filters
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.click('.chip:has-text("Aircraft & payloads")');
  await page.waitForTimeout(700);
  const shown = await page.locator('.pcard:not([hidden])').count();
  ok('filter narrows the project grid', shown === 1, `${shown} shown`);
  await page.click('.chip:has-text("All")');
  await page.waitForTimeout(700);

  // case study dialog
  const trigger = page.locator('[data-case="seed-dispersal"]');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page.waitForTimeout(700);
  ok('case study opens as a modal dialog', await page.locator('#case-seed-dispersal').evaluate((d) => d.open));
  const media = await page.locator('#case-seed-dispersal .mrow').count();
  ok('case study shows its photographs and video', media >= 2, `${media} rows`);
  const focusIn = await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'));
  ok('focus moves into the dialog', focusIn);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const back = await page.evaluate(() => document.activeElement?.getAttribute('data-case'));
  ok('Escape closes and returns focus to the card', back === 'seed-dispersal' && (await page.locator('dialog[open]').count()) === 0, `focus on ${back}`);
  await page.goto(url + '#case-crop-spraying', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  ok('deep link opens its case study', (await page.locator('#case-crop-spraying').count()) === 1 && (await page.locator('#case-crop-spraying').evaluate((d) => d.open)));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // experience tabs: arrow keys move between roles
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await page.locator('#xp-tab-0').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  const sel = await page.locator('#xp-tab-1').getAttribute('aria-selected');
  const panelShown = await page.locator('#xp-panel-1').isVisible();
  ok('experience tabs work from the keyboard', sel === 'true' && panelShown);

  // colour contrast of every visible text node against its nearest opaque background (WCAG AA)
  const contrast = await page.evaluate(() => {
    const parse = (c) => { const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c.a > 0.5) return c; } return parse('rgb(238,240,238)'); };
    const bad = [];
    let checked = 0;
    const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (!el || seen.has(el) || !walker.currentNode.textContent.trim()) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('dialog:not([open]), .sr-only, [hidden], .skip, .form__hp, .bar, .hero__instruments, .pcard__diagram')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const fg = parse(cs.color);
      const bg = bgOf(el);
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      checked++;
      if (ratio < (large ? 3 : 4.5)) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 24)} "${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}`);
    }
    return { checked, bad };
  });
  ok('text contrast meets WCAG AA', contrast.bad.length === 0, contrast.bad.slice(0, 6).join(' | ') || `${contrast.checked} text elements`);

  // keyboard: first Tab reaches skip link
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => document.activeElement?.className);
  ok('first Tab reaches the skip link', skip === 'skip', skip ?? '');
  ok('no console or page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await page.close();
}

// ---------- 2. reduced motion and no WebGL ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const lenis = await page.evaluate(() => document.documentElement.classList.contains('lenis'));
  ok('reduced motion: smooth scrolling off', !lenis);
  const hidden = await page.$$eval('[data-r], [data-reveal]', (els) => els.filter((e) => getComputedStyle(e).opacity === '0').length);
  ok('reduced motion: no content left hidden', hidden === 0, `${hidden} hidden`);
  await ctx.close();

  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      if (String(type).startsWith('webgl')) return null;
      return orig.call(this, type, ...a);
    };
  });
  await p2.goto(url, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(1500);
  const mode = await p2.locator('.hero').getAttribute('data-mode');
  const planVisible = await p2.locator('.hero__plan').isVisible();
  ok('without WebGL: falls back to the drawn plan view', mode === 'static' && planVisible, `mode ${mode}`);
  await ctx2.close();

  for (const w of [360, 390, 768, 1024]) {
    const c = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 800, hasTouch: w < 800 });
    const pg = await c.newPage();
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(800);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
    ok(`no sideways scrolling at ${w}px`, sw <= w, `scrollWidth ${sw}`);
    await c.close();
  }

  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const p3 = await ctx3.newPage();
  await p3.goto(url);
  const text = await p3.locator('#work').innerText();
  ok('without JavaScript: content is still in the page', text.includes('Sowing forests from the air') && text.length > 500);
  await ctx3.close();
}

// ---------- 3. Core Web Vitals under mobile-like throttling ----------
// This sandbox has no GPU: the 3D scene would run through SwiftShader (software OpenGL), where a
// single frame takes longer than a whole interaction budget, so it says nothing about real devices.
// These measurements therefore run with WebGL unavailable (the hero shows its drawn plan view) and
// measure the page itself. On real hardware the scene runs on the GPU, builds in small steps,
// lowers its resolution if frames are slow, and stops rendering whenever the hero is off screen.
const perf = await chromium.launch({ args: ['--disable-gpu'] });
for (const profile of [
  { name: 'mobile (4× CPU, ~1.6 Mbps)', width: 390, height: 844, cpu: 4, down: 1.6e6 / 8, up: 750e3 / 8, latency: 150, mobile: true },
  { name: 'desktop (no throttling)', width: 1440, height: 900, cpu: 1, down: 0, up: 0, latency: 0, mobile: false },
]) {
  const ctx = await perf.newContext({ viewport: { width: profile.width, height: profile.height }, isMobile: profile.mobile, hasTouch: profile.mobile });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      return String(type).startsWith('webgl') ? null : orig.call(this, type, ...a);
    };
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (profile.down) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: profile.latency, downloadThroughput: profile.down, uploadThroughput: profile.up });
  if (profile.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
  await page.addInitScript(() => {
    window.__cwv = { lcp: 0, cls: 0, lcpEl: '' };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { window.__cwv.lcp = e.startTime; window.__cwv.lcpEl = e.element?.tagName + '.' + (e.element?.className || ''); }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) {
        window.__cwv.cls += e.value;
        (window.__cwv.shifts ||= []).push(`${e.value.toFixed(3)} @${Math.round(e.startTime)}ms ` + e.sources.map((x) => x.node ? `${x.node.nodeName}.${String(x.node.className).slice(0, 30)}` : '?').join(','));
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000);
  // LCP is final before the visitor scrolls; read it first (programmatic scrolling would not stop it)
  const lcpAtRest = await page.evaluate(() => ({ lcp: window.__cwv.lcp, el: window.__cwv.lcpEl }));
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const cwv = { ...(await page.evaluate(() => window.__cwv)), lcp: lcpAtRest.lcp, lcpEl: lcpAtRest.el };
  // interaction latency (Event Timing API, like INP): real clicks on filters and a slider
  await page.evaluate(() => {
    window.__inp = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.interactionId) window.__inp = Math.max(window.__inp, e.duration);
    }).observe({ type: 'event', durationThreshold: 16, buffered: false });
  });
  await page.locator('.chip').nth(2).click();
  await page.waitForTimeout(700);
  await page.locator('.chip').nth(0).click();
  await page.waitForTimeout(700);
  await page.locator('[data-case]').nth(1).click();
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  if (!profile.mobile) {
    await page.locator('.bar__nav a[href="#experience"]').click();
  } else {
    await page.locator('.bar__menu').click();
    await page.waitForTimeout(500);
    await page.locator('.bar__menu').click();
  }
  await page.waitForTimeout(900);
  const inp = await page.evaluate(() => window.__inp);
  const tbt = await page.evaluate(() => performance.getEntriesByType('longtask')?.length ?? 0);
  const fcp = await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0);
  const bytes = await page.evaluate(() => performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0));
  console.log(`\n${profile.name}: FCP ${Math.round(fcp)} ms · LCP ${Math.round(cwv.lcp)} ms (${cwv.lcpEl}) · CLS ${cwv.cls.toFixed(3)} · INP-like ${Math.round(inp)} ms · transferred ${(bytes / 1024).toFixed(0)} KB · load ${Date.now() - t0} ms`);
  ok(`${profile.name}: LCP ≤ 2.5 s`, cwv.lcp <= 2500, `${Math.round(cwv.lcp)} ms`);
  ok(`${profile.name}: CLS ≤ 0.1`, cwv.cls <= 0.1, cwv.cls.toFixed(3) + (cwv.shifts ? ' ' + cwv.shifts.join(' | ') : ''));
  ok(`${profile.name}: interaction ≤ 200 ms`, inp <= 200, `${Math.round(inp)} ms`);
  void tbt;
  await ctx.close();
}

await perf.close();
await browser.close();
server?.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
