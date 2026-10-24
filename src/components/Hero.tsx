import { useEffect, useMemo, useRef, useState } from 'react';
import { person } from '../content';
import { BLOCK, CAMERA, FRONT_OVERLAP, CRUISE, fmt, plan, track } from '../scene/survey';
import type { FlightScene, Telemetry } from '../scene/FlightScene';
import { gsap, ScrollTrigger, reducedMotion, register, scrollToId } from '../lib/motion';
import { Icon } from './Icon';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Plan view in SVG: shown before WebGL is ready and instead of it when unavailable. */
function PlanView({ altitude, side }: { altitude: number; side: number }) {
  const p = plan({ altitude, sideOverlap: side });
  const d = track(p).map((q, i) => `${i ? 'L' : 'M'}${(q.x / 10).toFixed(1)} ${(q.z / 10).toFixed(1)}`).join('');
  const L = BLOCK.length / 20;
  const W = BLOCK.width / 20;
  return (
    <svg className="hero__plan" viewBox="-130 -80 260 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {[...Array(9)].map((_, i) => (
        <ellipse key={i} cx={40 - i * 3} cy={-10 + i * 2} rx={18 + i * 13} ry={10 + i * 8} className="plan__contour" />
      ))}
      <rect x={-L} y={-W} width={L * 2} height={W * 2} className="plan__block" />
      <path d={d} className="plan__track" />
    </svg>
  );
}

export default function Hero() {
  const [altitude, setAltitude] = useState(100);
  const [side, setSide] = useState(0.7);
  const [mode, setMode] = useState<'loading' | 'webgl' | 'static'>('loading');
  const p = useMemo(() => plan({ altitude, sideOverlap: side }), [altitude, side]);

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<FlightScene | null>(null);
  const telRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    let disposed = false;
    if (!hasWebGL()) {
      setMode('static');
      return;
    }
    const write = (t: Telemetry) => {
      const el = telRef.current;
      if (!el) return;
      const set = (k: string, v: string) => {
        const n = el.querySelector<HTMLElement>(`[data-t="${k}"]`);
        if (n && n.textContent !== v) n.textContent = v;
      };
      set('agl', fmt.n(t.agl));
      set('gs', fmt.n(t.gs, 1));
      set('hdg', String(Math.round(t.hdg)).padStart(3, '0'));
      set('line', `${t.line}/${t.lines}`);
      set('photos', fmt.n(t.photos));
    };
    const load = () =>
      import('../scene/FlightScene')
        .then(async ({ createFlightScene }) => {
          if (disposed || !canvasRef.current) return;
          const sc = await createFlightScene(canvasRef.current, {
            reducedMotion: reducedMotion(),
            compact: window.innerWidth < 760,
            onTelemetry: write,
          });
          if (disposed) {
            sc.dispose();
            return;
          }
          sceneRef.current = sc;
          setMode('webgl');
        })
        .catch(() => setMode('static'));
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => number }).requestIdleCallback;
    const handle = idle ? idle(load, { timeout: 1200 }) : window.setTimeout(load, 300);
    return () => {
      disposed = true;
      if (!idle) clearTimeout(handle);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setPlan(p);
  }, [p, mode]);

  // Scroll couples the camera (chase view → plan view) and fades the copy; render only on screen.
  useEffect(() => {
    register();
    const section = sectionRef.current;
    if (!section || mode !== 'webgl') return;
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => sceneRef.current?.setScroll(self.progress),
    });
    let onScreen = true;
    const sync = () => sceneRef.current?.setPaused(document.hidden || !onScreen);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    io.observe(section);
    document.addEventListener('visibilitychange', sync);
    return () => {
      st.kill();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [mode]);

  // Entrance and scroll-out choreography.
  useEffect(() => {
    register();
    const root = sectionRef.current;
    if (!root || reducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.hero__name-line > span', { yPercent: 110, duration: 1.3, stagger: 0.1 })
        .from('.hero__kicker', { autoAlpha: 0, y: 12, duration: 0.8 }, 0.15)
        .from('[data-hero-in]', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.45)
        .from('.hero__instruments', { y: 32, autoAlpha: 0, duration: 1.1 }, 0.7);
      gsap.to('.hero__copy', {
        yPercent: -10,
        autoAlpha: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom 30%', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <section className="hero" id="top" ref={sectionRef} aria-labelledby="hero-title" data-mode={mode} data-dark>
      <div className="hero__stage" aria-hidden="true">
        <PlanView altitude={altitude} side={side} />
        <canvas ref={canvasRef} className="hero__canvas" />
        <div className="hero__shade" />
      </div>

      <div className="hero__inner container">
        <div className="hero__copy">
          <p className="hero__kicker eyebrow">{person.role} · {person.location}</p>
          <h1 id="hero-title" className="hero__name">
            <span className="hero__name-line"><span>Franklin</span></span>
            <span className="hero__name-line"><span>Ferguson</span></span>
          </h1>
          <p className="hero__tagline" data-hero-in>{person.tagline}</p>
          <p className="hero__lead" data-hero-in>{person.lead}</p>
          <div className="hero__actions" data-hero-in>
            <a className="btn btn--accent" href="#work" onClick={go('work')}>
              <span>View projects</span>
              <Icon name="arrow-down" />
            </a>
            <a className="btn btn--ghost" href={`mailto:${person.email}`}>
              <Icon name="mail" />
              <span>Get in touch</span>
            </a>
          </div>
          <p className="hero__now" data-hero-in>
            <span className="dot" aria-hidden="true" />
            {person.now}
          </p>
        </div>

        <aside className="hero__instruments" aria-labelledby="planner-title">
          <div className="planner">
            <div className="planner__head">
              <h2 id="planner-title" className="planner__title">Live survey · {fmt.n(p.hectares)} ha</h2>
              <p className="planner__intro">Change the plan and the aircraft re-flies it.</p>
            </div>
            <div className="planner__controls">
              <label className="slider" htmlFor="alt">
                <span className="slider__label">Flight height</span>
                <output className="slider__value" htmlFor="alt">{altitude} m</output>
                <input id="alt" type="range" min={60} max={150} step={10} value={altitude}
                  style={{ '--fill': `${((altitude - 60) / 90) * 100}%` } as React.CSSProperties}
                  onChange={(e) => setAltitude(Number(e.target.value))} aria-describedby="planner-note" />
              </label>
              <label className="slider" htmlFor="ovl">
                <span className="slider__label">Side overlap</span>
                <output className="slider__value" htmlFor="ovl">{Math.round(side * 100)}%</output>
                <input id="ovl" type="range" min={50} max={85} step={5} value={Math.round(side * 100)}
                  style={{ '--fill': `${((side * 100 - 50) / 35) * 100}%` } as React.CSSProperties}
                  onChange={(e) => setSide(Number(e.target.value) / 100)} aria-describedby="planner-note" />
              </label>
            </div>
            <dl className="planner__out" aria-live="polite">
              <div><dt>GSD</dt><dd>{fmt.n(p.gsd, 2)}<small> cm</small></dd></div>
              <div><dt>Spacing</dt><dd>{fmt.n(p.spacing)}<small> m</small></dd></div>
              <div><dt>Lines</dt><dd>{p.lines}</dd></div>
              <div><dt>Photos</dt><dd>{fmt.n(p.photos)}</dd></div>
            </dl>
            <dl className="telemetry" ref={telRef} aria-label="Simulated flight telemetry">
              <div><dt>AGL</dt><dd><span data-t="agl">100</span> m</dd></div>
              <div><dt>GS</dt><dd><span data-t="gs">18.0</span> m/s</dd></div>
              <div><dt>HDG</dt><dd><span data-t="hdg">090</span>°</dd></div>
              <div><dt>LINE</dt><dd><span data-t="line">1</span></dd></div>
              <div><dt>IMG</dt><dd><span data-t="photos">0</span></dd></div>
            </dl>
            <p className="planner__note" id="planner-note">
              {CAMERA.label} camera, {CAMERA.focal} mm lens, {Math.round(FRONT_OVERLAP * 100)}% forward overlap, {CRUISE} m/s, about {fmt.n(p.minutes)} min. Illustrative scene.
            </p>
          </div>
        </aside>
      </div>
      <a className="hero__scroll" href="#about" onClick={go('about')} aria-label="Scroll to About">
        <span />
      </a>
    </section>
  );
}
