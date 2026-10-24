// Explanatory figures for work whose real imagery cannot be published (mine security, client maps).
// Each is labelled on the page as an illustration of the method, never presented as client data.

type Variant = 'routes' | 'pipeline' | 'investigation' | 'parcels';

const contours = [
  'M-10 120 C 60 90, 120 140, 200 110 S 330 60, 420 90',
  'M-10 150 C 70 120, 130 170, 210 140 S 330 95, 420 125',
  'M-10 180 C 80 155, 140 200, 220 172 S 335 130, 420 160',
  'M-10 210 C 90 190, 150 232, 230 205 S 340 170, 420 196',
  'M-10 90 C 50 60, 115 105, 190 80 S 320 30, 420 55',
  'M-10 60 C 45 30, 110 72, 180 50 S 310 5, 420 22',
  'M-10 240 C 95 222, 160 262, 240 236 S 345 205, 420 228',
];

function Routes() {
  return (
    <svg viewBox="0 0 400 260" className="diagram__svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="260" className="d-ground" />
      {contours.map((d, i) => <path key={i} d={d} className={i % 3 === 0 ? 'd-contour d-contour--major' : 'd-contour'} />)}
      <path d="M150 70 h120 l30 50 -20 70 h-130 l-25 -60z" className="d-pit" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M100 ${40 + i * 26} H330`} className="d-line" />
      ))}
      <path d="M0 30 C 60 50, 90 70, 140 100" className="d-route" />
      <path d="M400 230 C 350 215, 320 205, 290 180" className="d-route" />
      <path d="M210 260 C 215 235, 212 215, 205 190" className="d-route" />
      {[[110, 32], [320, 32], [320, 228], [110, 228]].map(([x, y], i) => (
        <path key={i} d={`M${x - 6} ${y}h12M${x} ${y - 6}v12`} className="d-gcp" />
      ))}
    </svg>
  );
}

function Parcels() {
  const cells = [
    'M20 30 L120 22 L130 95 L28 104Z', 'M120 22 L230 30 L224 88 L130 95Z', 'M230 30 L380 18 L372 92 L224 88Z',
    'M28 104 L130 95 L140 170 L36 182Z', 'M130 95 L224 88 L240 160 L140 170Z', 'M224 88 L372 92 L380 170 L240 160Z',
    'M36 182 L140 170 L150 240 L30 246Z', 'M140 170 L240 160 L250 236 L150 240Z', 'M240 160 L380 170 L376 244 L250 236Z',
  ];
  return (
    <svg viewBox="0 0 400 260" className="diagram__svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="260" className="d-ground" />
      {cells.map((d, i) => <path key={i} d={d} className={i === 4 ? 'd-parcel d-parcel--on' : 'd-parcel'} />)}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M0 ${20 + i * 37} H400`} className="d-line" />)}
      {[[28, 104], [230, 30], [376, 244], [140, 170]].map(([x, y], i) => (
        <path key={i} d={`M${x - 6} ${y}h12M${x} ${y - 6}v12`} className="d-gcp" />
      ))}
    </svg>
  );
}

const flows: Record<'pipeline' | 'investigation', { title: string; body: string }[]> = {
  pipeline: [
    { title: 'Aerostat and UAV missions', body: 'EO/IR video and aerial imagery' },
    { title: 'YOLOv8 detection', body: 'Flags encroachment and illegal-mining activity' },
    { title: 'Power App and inspection web app', body: 'Flight hours, maintenance, helium top-ups, PDF inspection reports' },
    { title: 'Power BI command view', body: 'Detections, threat classes, patrols, incidents and KPIs in one place' },
  ],
  investigation: [
    { title: 'DataFlash and telemetry logs', body: 'Everything the aircraft recorded' },
    { title: 'Control, sensors, power', body: 'Attitude tuning, navigation sensor agreement, current sensing' },
    { title: 'Failsafe configuration', body: 'Every parameter checked against the procedure' },
    { title: 'Corrective actions', body: 'Set out before the next flight' },
  ],
};

export default function Diagram({ variant, caption }: { variant: Variant; caption: string }) {
  if (variant === 'routes' || variant === 'parcels') {
    return (
      <figure className="diagram diagram--drawing">
        {variant === 'routes' ? <Routes /> : <Parcels />}
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }
  return (
    <figure className="diagram diagram--flow">
      <ol className="flow">
        {flows[variant].map((s) => (
          <li key={s.title} className="flow__step">
            <span className="flow__title">{s.title}</span>
            <span className="flow__body">{s.body}</span>
          </li>
        ))}
      </ol>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
