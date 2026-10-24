// Photogrammetry flight planning, the arithmetic behind the hero.
// Pure functions: used by the planner readout (server-rendered too) and by the 3D scene.

/** Example camera: a typical 1-inch, 20-megapixel mapping camera. */
export const CAMERA = {
  label: '1-inch 20 MP',
  sensorW: 13.2, // mm, across track
  sensorH: 8.8, // mm, along track
  focal: 8.8, // mm
  pxW: 5472,
  pxH: 3648,
};

/** The block being mapped: 1.2 km × 0.8 km = 96 ha. Lines run along the long (x) side. */
export const BLOCK = { length: 1200, width: 800 };

export const CRUISE = 18; // m/s, a typical fixed-wing VTOL mapping cruise speed
export const FRONT_OVERLAP = 0.75;

export interface PlanInput {
  altitude: number; // m above ground
  sideOverlap: number; // 0..1
}

export interface Plan extends PlanInput {
  gsd: number; // cm per pixel
  footprintW: number; // m across track
  footprintH: number; // m along track
  spacing: number; // m between flight lines
  interval: number; // m between photos
  lines: number;
  photos: number;
  distance: number; // m flown over the block, turns included
  minutes: number;
  hectares: number;
}

export function plan({ altitude, sideOverlap }: PlanInput): Plan {
  const footprintW = (altitude * CAMERA.sensorW) / CAMERA.focal;
  const footprintH = (altitude * CAMERA.sensorH) / CAMERA.focal;
  const gsd = (CAMERA.sensorW * altitude * 100) / (CAMERA.focal * CAMERA.pxW);
  const spacing = footprintW * (1 - sideOverlap);
  const interval = footprintH * (1 - FRONT_OVERLAP);
  const lines = Math.ceil(BLOCK.width / spacing) + 1;
  const perLine = Math.ceil(BLOCK.length / interval) + 1;
  const turns = (lines - 1) * (Math.PI * spacing * 0.5 + spacing * 0.5);
  const distance = lines * BLOCK.length + turns;
  return {
    altitude,
    sideOverlap,
    gsd,
    footprintW,
    footprintH,
    spacing,
    interval,
    lines,
    photos: lines * perLine,
    distance,
    minutes: distance / CRUISE / 60,
    hectares: (BLOCK.length * BLOCK.width) / 10000,
  };
}

/** Boustrophedon ("lawnmower") track in block metres, origin at block centre. */
export function track(p: Plan): { x: number; z: number }[] {
  const pts: { x: number; z: number }[] = [];
  const halfL = BLOCK.length / 2;
  const z0 = -BLOCK.width / 2;
  const runIn = 120; // m of straight flight before and after each line
  for (let i = 0; i < p.lines; i++) {
    const z = Math.min(z0 + i * p.spacing, BLOCK.width / 2 + p.spacing * 0.4);
    const dir = i % 2 === 0 ? 1 : -1;
    const xs = -dir * (halfL + runIn);
    const xe = dir * (halfL + runIn);
    const steps = 24;
    for (let s = 0; s <= steps; s++) pts.push({ x: xs + ((xe - xs) * s) / steps, z });
    if (i < p.lines - 1) {
      // fixed-wing turn: a semicircle to the next line
      const nz = Math.min(z0 + (i + 1) * p.spacing, BLOCK.width / 2 + p.spacing * 0.4);
      const r = (nz - z) / 2;
      const cz = z + r;
      for (let a = 1; a < 16; a++) {
        const t = (a / 16) * Math.PI;
        pts.push({ x: xe + dir * Math.sin(t) * Math.max(r, 40), z: cz - Math.cos(t) * r });
      }
    }
  }
  return pts;
}

/** Deterministic terrain height in metres for world coordinates in metres. */
export function terrainHeight(x: number, z: number): number {
  const u = x / 1000;
  const v = z / 1000;
  return (
    46 * Math.sin(u * 1.7 + 0.6) * Math.cos(v * 1.3 - 0.4) +
    28 * Math.sin(u * 3.1 - v * 2.2 + 1.3) +
    14 * Math.cos(u * 5.3 + v * 4.1) +
    7 * Math.sin(u * 9.7 - v * 7.9 + 2.1) +
    60 * Math.exp(-((u - 0.75) ** 2 + (v + 0.35) ** 2) * 2.2) -
    38 * Math.exp(-((u + 0.9) ** 2 + (v - 0.45) ** 2) * 1.6)
  );
}

export const fmt = {
  n: (v: number, d = 0) => v.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }),
};
