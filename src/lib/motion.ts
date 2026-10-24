// One motion system for the whole page.
// - Lenis smooths wheel scrolling on desktop only (touch keeps native scrolling) and is driven by
//   GSAP's ticker, so ScrollTrigger and Lenis never disagree about the scroll position.
// - Section entrances: heading, then text, then picture, staggered, triggered once.
// - Everything is reverted on cleanup; nothing runs under prefers-reduced-motion.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

let lenis: Lenis | null = null;
let registered = false;

export function register() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function startSmoothScroll() {
  register();
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reducedMotion() || !fine) return () => {};
  const { default: LenisCtor } = await import('lenis');
  lenis = new LenisCtor({ duration: 1.05, smoothWheel: true, anchors: false, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add('lenis');
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
    document.documentElement.classList.remove('lenis');
  };
}

/** Scroll to an in-page anchor through Lenis when active, natively otherwise; moves focus. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const done = () => {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };
  if (lenis) {
    lenis.scrollTo(el, { offset: -8, onComplete: done });
  } else {
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    done();
  }
  history.replaceState(null, '', `#${id}`);
}

export function stopScroll(stop: boolean) {
  if (!lenis) return;
  if (stop) lenis.stop();
  else lenis.start();
}

/** Entrance for every [data-reveal] group: children marked [data-r] rise in order. */
export function revealSections(root: HTMLElement) {
  register();
  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((group) => {
        const parts = group.querySelectorAll<HTMLElement>('[data-r]');
        const targets = parts.length ? parts : [group];
        gsap.set(targets, { autoAlpha: 0, y: 28 });
        ScrollTrigger.create({
          trigger: group,
          start: 'top 86%',
          once: true,
          onEnter: () =>
            gsap.to(targets, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.075,
              clearProps: 'transform,opacity,visibility',
            }),
        });
      });
    });
  }, root);
  return () => ctx.revert();
}

export { gsap, ScrollTrigger };
