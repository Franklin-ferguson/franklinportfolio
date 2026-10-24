import { useEffect, useRef, useState, type CSSProperties } from 'react';
import manifest from '../media.json';
import type { Media, Row } from '../content';
import { Icon } from '../components/Icon';

type Entry = { w: number; h: number; sizes: number[]; tone: string };
const media = manifest as Record<string, Entry>;

export function mediaInfo(name: string): Entry {
  const m = media[name];
  if (!m) throw new Error(`Unknown media "${name}". Run npm run images.`);
  return m;
}

export const src = (name: string, w?: number, ext = 'webp') => {
  const m = mediaInfo(name);
  const size = w ? m.sizes.find((s) => s >= w) ?? m.sizes[m.sizes.length - 1] : m.sizes[m.sizes.length - 1];
  return `media/${name}-${size}.${ext}`;
};

interface PictureProps {
  name: string;
  alt: string;
  sizes?: string;
  className?: string;
  eager?: boolean;
  style?: CSSProperties;
}

/** Responsive AVIF/WebP picture with its intrinsic size reserved (no layout shift). */
export function Picture({ name, alt, sizes = '100vw', className, eager, style }: PictureProps) {
  const m = mediaInfo(name);
  const set = (ext: string) => m.sizes.map((w) => `media/${name}-${w}.${ext} ${w}w`).join(', ');
  return (
    <picture className={className} style={{ backgroundColor: m.tone, ...style }}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img
        src={`media/${name}-${m.sizes[Math.min(1, m.sizes.length - 1)]}.webp`}
        srcSet={set('webp')}
        sizes={sizes}
        width={m.w}
        height={m.h}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}

/** Muted looping clip: loads when near the screen, plays while visible, with a pause control. */
export function Clip({ name, poster, label, className }: { name: string; poster: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);
  const m = mediaInfo(poster);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) userPaused.current = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.getAttribute('src')) v.src = `media/${name}.mp4`;
          if (!userPaused.current) v.play().catch(() => {});
        } else v.pause();
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(v);
    const on = () => setPlaying(true);
    const off = () => setPlaying(false);
    v.addEventListener('play', on);
    v.addEventListener('pause', off);
    return () => {
      io.disconnect();
      v.removeEventListener('play', on);
      v.removeEventListener('pause', off);
    };
  }, [name]);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (!v.getAttribute('src')) v.src = `media/${name}.mp4`;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };
  return (
    <div className={`clip ${className ?? ''}`}>
      <video
        ref={ref}
        poster={src(poster, 960)}
        width={m.w}
        height={m.h}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        style={{ backgroundColor: m.tone }}
      />
      <button type="button" className="clip__btn" onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'}>
        <Icon name={playing ? 'pause' : 'play'} size={14} />
      </button>
    </div>
  );
}

const ratio = (item: Media) => {
  const m = mediaInfo(item.kind === 'video' ? item.poster : item.src);
  return m.w / m.h;
};
const orient = (r: number) => (r > 1.15 ? 'l' : r < 0.87 ? 'p' : 's');

/**
 * A justified row: every item shares one height and takes a width in proportion to its own
 * aspect ratio, so the row fills its width exactly and nothing is cropped or turned sideways.
 */
export function MediaRow({ row, maxWidth = 1320 }: { row: Row; maxWidth?: number }) {
  const total = row.items.reduce((s, i) => s + ratio(i), 0);
  const limit = row.maxWidth ?? maxWidth;
  return (
    <div className="mrow" style={row.maxWidth ? { maxWidth: row.maxWidth } : undefined}>
      {row.items.map((item) => {
        const r = ratio(item);
        const share = r / total;
        const style = { '--r': r.toFixed(4), flexGrow: r.toFixed(4) } as CSSProperties;
        return (
          <figure className="m" key={item.src} data-o={orient(r)} style={style}>
            <div className="m__frame" style={{ aspectRatio: r.toFixed(4) }}>
              {item.kind === 'video' ? (
                <Clip name={item.src} poster={item.poster} label={item.alt} />
              ) : (
                <Picture name={item.src} alt={item.alt} sizes={`(max-width: 760px) ${share > 0.6 ? 100 : 50}vw, ${Math.round(share * limit)}px`} />
              )}
            </div>
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
        );
      })}
    </div>
  );
}

export function MediaRows({ rows }: { rows: Row[] }) {
  return (
    <div className="mrows">
      {rows.map((row, i) => (
        <MediaRow key={i} row={row} />
      ))}
    </div>
  );
}
