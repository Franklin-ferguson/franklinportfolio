import { chromium } from 'playwright';
const [url='http://localhost:4173/', out='.shots/hero', w='1440', h='900'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, isMobile: +w < 500, hasTouch: +w < 500 });
const errs=[]; p.on('pageerror', e=>errs.push(String(e))); p.on('console', m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(7000);
await p.screenshot({ path: `${out}-${w}.jpg`, quality: 75 });
if (process.argv.includes('--scroll')) { await p.evaluate(()=>window.scrollTo(0, innerHeight*0.6)); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}-${w}-scrolled.jpg`, quality: 75 }); }
console.log(errs.join('\n')||'no errors'); await b.close();
