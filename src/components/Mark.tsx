// The identity mark: an F drawn as a flight trajectory. The stem climbs and turns into a swept
// leading edge; the second stroke is a survey line that ends on a waypoint.
// Works in one colour (currentColor) or with the accent waypoint; legible from 16px.
export function Mark({ className = '', title, mono = false }: { className?: string; title?: string; mono?: boolean }) {
  return (
    <svg
      className={`mark ${className}`}
      viewBox="0 0 48 48"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path className="mark__stem" d="M13 41V16q0-5 5-5.8L39 6.8" pathLength={1} />
      <path className="mark__bar" d="M12 25.6 30 22.8" pathLength={1} />
      <circle className="mark__dot" cx="36.2" cy="21.8" r="3.1" fill={mono ? 'currentColor' : 'var(--accent, #FF8A4C)'} />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <Mark className="wordmark__mark" />
      <span className="wordmark__text">
        <span className="wordmark__name">Franklin Ferguson</span>
        <span className="wordmark__role">Aerospace engineer</span>
      </span>
    </span>
  );
}
