// The hero scene: a hybrid VTOL quadplane flying a planned photogrammetry survey over West African
// farmland and savanna at golden hour. Everything is procedural (no downloaded models or textures):
// a physically lit terrain whose colour is generated in the shader (fields, savanna, laterite roads,
// a river, drifting cloud shadows), instanced trees and village roofs with long evening shadows,
// a dusk sky that also lights and reflects on the aircraft, and a chase camera at true scale.
// The aircraft is generic, not a model of any product. Loaded on demand after first paint.
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  FogExp2,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { BLOCK, plan as makePlan, terrainHeight, track, type Plan } from './survey';

export interface Telemetry {
  agl: number;
  gs: number;
  hdg: number;
  line: number;
  lines: number;
  photos: number;
  totalPhotos: number;
}

export interface SceneOptions {
  reducedMotion: boolean;
  compact: boolean;
  onTelemetry?: (t: Telemetry) => void;
}

const U = 10; // metres per world unit
const SIZE = 1800; // terrain size in units (18 km)
const SUN = new Vector3(-0.82, 0.2, -0.54).normalize(); // low evening sun
const COL = {
  zenith: new Color('#16294a'),
  upper: new Color('#4f6f9c'),
  horizon: new Color('#d8a27a'),
  glow: new Color('#ffb36b'),
  haze: new Color('#a98e83'),
  sun: new Color('#ffcf9a'),
  accent: new Color('#ff7a45'),
  plan: new Color('#ffffff'),
};

const h = (x: number, z: number) => terrainHeight(x, z) / U; // metres in, units out

// ---------- shared GLSL ----------
const NOISE = /* glsl */ `
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;

// JS twins of the field layout, so trees and roofs stay off cultivated fields.
const hash12 = (x: number, y: number) => {
  let a = (x * 0.1031) % 1, b = (y * 0.1031) % 1, c = (x * 0.1031) % 1;
  if (a < 0) a += 1; if (b < 0) b += 1; if (c < 0) c += 1;
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a = (a + d) % 1; b = (b + d) % 1; c = (c + d) % 1;
  const r = ((a + b) * c) % 1;
  return r < 0 ? r + 1 : r;
};
const FIELD = 26; // units per field cell (≈260 m)
const farmZone = (x: number, z: number) => 0.5 + 0.5 * Math.sin(x * 0.0042 + 0.8) * Math.cos(z * 0.0051 - 0.3);
const isField = (x: number, z: number) => {
  // fields cover the survey block and a belt around it, thinning out into savanna
  const r = Math.hypot(x / 1.4, z) / 230;
  if (farmZone(x, z) + 0.55 - r < 0.45) return false;
  const rx = x * 0.966 - z * 0.259, rz = x * 0.259 + z * 0.966; // farm grid is rotated 15°
  return hash12(Math.floor(rx / FIELD), Math.floor(rz / (FIELD * 0.7))) < 0.72;
};
const roadZ = (x: number) => 48 * Math.sin(x / 150) + 18 * Math.sin(x / 47) - 70;
const riverX = (z: number) => 150 * Math.sin(z / 210 + 1.2) + 40 * Math.sin(z / 63) + 340;

// ---------- sky ----------
function sky(radius = 2600) {
  const mat = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: SUN },
      uZenith: { value: COL.zenith },
      uUpper: { value: COL.upper },
      uHorizon: { value: COL.horizon },
      uGlow: { value: COL.glow },
      uHaze: { value: COL.haze },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, uZenith, uUpper, uHorizon, uGlow, uHaze;
      varying vec3 vDir;
      #include <common>
      #include <logdepthbuf_pars_fragment>
      void main() {
        #include <logdepthbuf_fragment>
        vec3 d = normalize(vDir);
        float y = d.y;
        float t = clamp(y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uUpper, smoothstep(0.0, 0.28, t));
        col = mix(col, uZenith, smoothstep(0.22, 0.9, t));
        float s = max(dot(d, uSun), 0.0);
        col += uGlow * (pow(s, 6.0) * 0.55 + pow(s, 40.0) * 0.6) * (1.0 - smoothstep(0.0, 0.6, t));
        col += vec3(1.0, 0.86, 0.65) * smoothstep(0.9993, 0.99965, s) * 4.0;
        col = mix(col, uHaze, smoothstep(0.0, -0.08, y));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new Mesh(new SphereGeometry(radius, 48, 24), mat);
  m.frustumCulled = false;
  return m;
}

// ---------- terrain ----------
function terrain(compact: boolean) {
  const seg = compact ? 180 : 320;
  const g = new PlaneGeometry(SIZE, SIZE, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    let y = h(x * U, z * U);
    // the river cuts a shallow channel
    const dr = Math.abs(x - riverX(z));
    y -= 1.4 * Math.exp(-(dr * dr) / 120);
    p.setY(i, y);
  }
  g.computeVertexNormals();

  const uniforms = {
    uTime: { value: 0 },
    uBlock: { value: new Vector2(BLOCK.length / 2 / U, BLOCK.width / 2 / U) },
    uFoot: { value: new Vector3() },
    uFootSize: { value: new Vector2(1, 1) },
    uFootOn: { value: 0 },
    uAccent: { value: COL.accent },
    uOverlay: { value: 1 },
  };
  const mat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.96, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorld = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWorld;
        uniform float uTime, uFootOn, uOverlay;
        uniform vec2 uBlock, uFootSize;
        uniform vec3 uFoot, uAccent;
        ${NOISE}
        float farmZone(vec2 p) { return 0.5 + 0.5 * sin(p.x * 0.0042 + 0.8) * cos(p.y * 0.0051 - 0.3); }
        float roadZ(float x) { return 48.0 * sin(x / 150.0) + 18.0 * sin(x / 47.0) - 70.0; }
        float riverX(float z) { return 150.0 * sin(z / 210.0 + 1.2) + 40.0 * sin(z / 63.0) + 340.0; }
        float waterMask = 0.0;
        vec3 overlay = vec3(0.0);`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          vec2 p = vWorld.xz;
          float n1 = fbm(p * 0.035);
          float n2 = fbm(p * 0.21 + 7.0);
          float n3 = vnoise(p * 1.6);
          // savanna: dry grass, green patches, bare red earth, dark tree cover
          vec3 dry = vec3(0.47, 0.40, 0.22);
          vec3 green = vec3(0.24, 0.30, 0.12);
          vec3 earth = vec3(0.50, 0.29, 0.17);
          vec3 bush = vec3(0.12, 0.16, 0.07);
          vec3 col = mix(green, dry, smoothstep(0.35, 0.65, n1));
          col = mix(col, earth, smoothstep(0.66, 0.8, n2) * 0.55);
          col = mix(col, bush, smoothstep(0.55, 0.75, fbm(p * 0.09 + 3.0)) * 0.75);
          col *= 0.86 + 0.28 * n3;
          // farm fields on a rotated grid, with paths between them
          float r = length(vec2(p.x / 1.4, p.y)) / 230.0;
          float zone = farmZone(p) + 0.55 - r;
          vec2 rp = vec2(p.x * 0.966 - p.y * 0.259, p.x * 0.259 + p.y * 0.966);
          vec2 cellSize = vec2(${FIELD.toFixed(1)}, ${(FIELD * 0.7).toFixed(1)});
          vec2 cell = floor(rp / cellSize);
          vec2 f = fract(rp / cellSize);
          float pick = hash12(cell);
          float isField = step(0.45, zone) * step(pick, 0.72);
          float crop = hash12(cell + 19.7);
          vec3 fieldCol = crop < 0.25 ? vec3(0.30, 0.38, 0.13) :
                          crop < 0.5  ? vec3(0.52, 0.45, 0.22) :
                          crop < 0.72 ? vec3(0.38, 0.27, 0.16) : vec3(0.20, 0.30, 0.10);
          float rc = (crop > 0.5 ? rp.x : rp.y) * 9.0;
          float rows = (0.5 + 0.5 * sin(rc)) * (1.0 - smoothstep(0.25, 0.9, fwidth(rc)));
          fieldCol *= 0.94 + 0.08 * rows + 0.12 * (vnoise(p * 0.6) - 0.5);
          float border = smoothstep(0.0, 0.035, f.x) * smoothstep(0.0, 0.035, 1.0 - f.x) * smoothstep(0.0, 0.05, f.y) * smoothstep(0.0, 0.05, 1.0 - f.y);
          fieldCol = mix(vec3(0.42, 0.31, 0.19), fieldCol, border);
          col = mix(col, fieldCol, isField);
          // laterite road
          float rd = abs(p.y - roadZ(p.x));
          col = mix(col, vec3(0.58, 0.33, 0.19), 1.0 - smoothstep(0.35, 0.8, rd));
          // river with muddy banks
          float wd = abs(p.x - riverX(p.y));
          col = mix(col, vec3(0.30, 0.24, 0.16), 1.0 - smoothstep(4.0, 6.5, wd));
          waterMask = 1.0 - smoothstep(3.0, 4.0, wd);
          col = mix(col, vec3(0.06, 0.08, 0.08), waterMask);
          // drifting cloud shadows
          float cs = smoothstep(0.52, 0.72, fbm(p * 0.006 + vec2(uTime * 0.004, uTime * 0.0015)));
          col *= 1.0 - 0.42 * cs;
          diffuseColor.rgb = col;

          // survey overlays: block outline and the camera footprint
          vec2 d = abs(p) - uBlock;
          float edge = 1.0 - smoothstep(0.0, 0.5, abs(max(d.x, d.y)));
          overlay += vec3(1.0, 0.92, 0.85) * edge * 0.35 * uOverlay;
          vec2 q = (p - uFoot.xz) * mat2(cos(uFoot.y), -sin(uFoot.y), sin(uFoot.y), cos(uFoot.y));
          vec2 fq = abs(q) - uFootSize;
          float inside = step(max(fq.x, fq.y), 0.0);
          float fEdge = 1.0 - smoothstep(0.0, 0.25, abs(max(fq.x, fq.y)));
          overlay += uAccent * (inside * 0.05 + fEdge * 0.55) * uFootOn * uOverlay;
        }`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.06, waterMask);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += overlay;');
  };
  const mesh = new Mesh(g, mat);
  return { mesh, uniforms };
}

// ---------- trees, roofs and their shadows ----------
function scatter(seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return rnd;
}

function vegetation(compact: boolean) {
  const rnd = scatter(7);
  const N = compact ? 2600 : 6500;
  // flat-topped savanna canopies (shea, acacia, neem) from a squashed, slightly lumpy icosphere
  const canopy = new IcosahedronGeometry(1, 1);
  {
    const cp = canopy.attributes.position as BufferAttribute;
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
      const lump = 1 + 0.16 * Math.sin(x * 5.1 + z * 3.7) * Math.cos(y * 4.3 + x * 2.1);
      cp.setXYZ(i, x * lump, (y > 0 ? y * 0.5 : y * 0.22) * lump, z * lump);
    }
    canopy.computeVertexNormals();
  }
  const treeMat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: false });
  const trees = new InstancedMesh(canopy, treeMat, N);
  const shadowGeo = new CircleGeometry(1, 14);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new MeshBasicMaterial({ color: '#0a0806', transparent: true, opacity: 0.42, depthWrite: false });
  const shadows = new InstancedMesh(shadowGeo, shadowMat, N);
  const m = new Matrix4();
  const q = new Quaternion();
  const sc = new Vector3();
  const pos = new Vector3();
  const c = new Color();
  const len = 1 / Math.tan(Math.asin(SUN.y)); // shadow length per unit of height
  const shadowYaw = Math.atan2(SUN.x, SUN.z);
  let n = 0;
  let guard = 0;
  while (n < N && guard++ < N * 8) {
    // denser near the block, thinning outwards
    const a = rnd() * Math.PI * 2;
    const r = 30 + Math.pow(rnd(), 0.85) * 420;
    const x = Math.cos(a) * r * 1.3;
    const z = Math.sin(a) * r;
    if (isField(x, z) && rnd() > 0.04) continue; // the odd tree is left standing in a field
    if (Math.abs(z - roadZ(x)) < 1.4 || Math.abs(x - riverX(z)) < 5) continue;
    const size = 0.25 + rnd() * rnd() * 0.75; // canopy radius 2.5–10 m
    const y = h(x * U, z * U);
    pos.set(x, y + size * 0.55, z);
    q.setFromAxisAngle(new Vector3(0, 1, 0), rnd() * 6.28);
    sc.set(size * (0.9 + rnd() * 0.3), size * (0.8 + rnd() * 0.4), size * (0.9 + rnd() * 0.3));
    m.compose(pos, q, sc);
    trees.setMatrixAt(n, m);
    const t = rnd();
    c.setRGB(0.09 + t * 0.07, 0.13 + t * 0.07, 0.045 + t * 0.03);
    trees.setColorAt(n, c);
    // a long evening shadow, cast away from the sun
    const sl = (size * 1.6) * len;
    pos.set(x - SUN.x / Math.hypot(SUN.x, SUN.z) * sl * 0.5, y + 0.07, z - SUN.z / Math.hypot(SUN.x, SUN.z) * sl * 0.5);
    q.setFromAxisAngle(new Vector3(0, 1, 0), shadowYaw);
    sc.set(size, 1, sl * 0.55 + size * 0.5);
    m.compose(pos, q, sc);
    shadows.setMatrixAt(n, m);
    n++;
  }
  trees.count = n;
  shadows.count = n;

  // village roofs along the road: corrugated metal catching the low sun
  const R = compact ? 140 : 260;
  const roof = new InstancedMesh(new BoxGeometry(1, 0.35, 1), new MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.75 }), R);
  const roofShadow = new InstancedMesh(shadowGeo, shadowMat, R);
  let k = 0;
  const villages = [-420, -150, 260, 520];
  for (let i = 0; i < R * 4 && k < R; i++) {
    const vx = villages[i % villages.length] + (rnd() - 0.5) * 70;
    const vz = roadZ(vx) + (rnd() - 0.5) * 34;
    if (Math.abs(vz - roadZ(vx)) < 1.6) continue;
    const y = h(vx * U, vz * U);
    const w = 0.7 + rnd() * 0.8;
    const d = 0.6 + rnd() * 0.6;
    q.setFromAxisAngle(new Vector3(0, 1, 0), (rnd() - 0.5) * 0.4 + 0.2);
    pos.set(vx, y + 0.35, vz);
    sc.set(w, 1, d);
    m.compose(pos, q, sc);
    roof.setMatrixAt(k, m);
    const t = rnd();
    c.setRGB(0.55 + t * 0.25, 0.55 + t * 0.2, 0.55 + t * 0.15);
    if (rnd() < 0.18) c.setRGB(0.55, 0.22, 0.14); // a few painted roofs
    roof.setColorAt(k, c);
    pos.set(vx - (SUN.x / Math.hypot(SUN.x, SUN.z)) * 1.4, y + 0.06, vz - (SUN.z / Math.hypot(SUN.x, SUN.z)) * 1.4);
    sc.set(w * 0.7, 1, d * 0.7 + 1.2);
    m.compose(pos, q, sc);
    roofShadow.setMatrixAt(k, m);
    k++;
  }
  roof.count = k;
  roofShadow.count = k;
  return [shadows, roofShadow, trees, roof];
}

// ---------- clouds ----------
function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  let s = 3;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 28; i++) {
    const x = 128 + (rnd() - 0.5) * 150;
    const y = 140 + (rnd() - 0.5) * 60 - Math.abs(x - 128) * 0.15;
    const r = 30 + rnd() * 46;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function clouds() {
  const tex = cloudTexture();
  const group = new Group();
  const rnd = scatter(11);
  for (let i = 0; i < 26; i++) {
    const mat = new SpriteMaterial({ map: tex, color: new Color('#ffd7b5').lerp(new Color('#9fb2cc'), rnd() * 0.5), transparent: true, opacity: 0.55 + rnd() * 0.3, depthWrite: false, fog: true });
    const sp = new Sprite(mat);
    const a = rnd() * Math.PI * 2;
    const r = 260 + rnd() * 900;
    sp.position.set(Math.cos(a) * r, 70 + rnd() * 70, Math.sin(a) * r);
    const s = 120 + rnd() * 220;
    sp.scale.set(s, s * 0.45, 1);
    group.add(sp);
  }
  return group;
}

// ---------- the aircraft (modelled at ×1 in its own units, then scaled to a 3.6 m span) ----------
function wingGeometry(span: number, root: number, tip: number, thick: number, dihedral: number, sweep: number) {
  const nS = 16;
  const nC = 20;
  const pos: number[] = [];
  const idx: number[] = [];
  const yt = (x: number) => 5 * thick * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  for (let s = 0; s <= nS; s++) {
    const t = s / nS;
    const z = (t - 0.5) * span;
    const a = Math.abs(z) / (span / 2);
    const chord = root + (tip - root) * a;
    const xLE = -sweep * a;
    const y = Math.abs(z) * Math.tan(dihedral);
    for (const sign of [1, -1]) {
      for (let c = 0; c <= nC; c++) {
        const u = 0.5 - Math.cos((c / nC) * Math.PI) * 0.5;
        pos.push(xLE - u * chord + chord * 0.35, y + sign * yt(u) * chord * (sign > 0 ? 1 : 0.55), z);
      }
    }
  }
  const row = (nC + 1) * 2;
  for (let s = 0; s < nS; s++) {
    for (let c = 0; c < nC; c++) {
      const a = s * row + c;
      const b = (s + 1) * row + c;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
      const la = a + nC + 1;
      const lb = b + nC + 1;
      idx.push(la, la + 1, lb, lb, la + 1, lb + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function blade(len: number, root: number) {
  const g = new BoxGeometry(len, 0.02, root);
  const p = g.attributes.position as BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const taper = 1 - Math.abs(x) / (len / 2) * 0.55;
    p.setZ(i, p.getZ(i) * taper + (x > 0 ? 0.015 : -0.015));
  }
  g.computeVertexNormals();
  return g;
}

function aircraft() {
  const skin = new MeshPhysicalMaterial({ color: '#f1f3f5', roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 1.1 });
  const carbon = new MeshPhysicalMaterial({ color: '#1a1e24', roughness: 0.42, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const metal = new MeshStandardMaterial({ color: '#a7b0ba', roughness: 0.28, metalness: 1 });
  const stripe = new MeshStandardMaterial({ color: '#e5602e', roughness: 0.5 });
  const seam = new MeshStandardMaterial({ color: '#c3c9cf', roughness: 0.6 });
  const glass = new MeshPhysicalMaterial({ color: '#060a10', roughness: 0.04, metalness: 0.4, clearcoat: 1 });
  const g = new Group();

  // fuselage: a smooth lathed pod along +x
  const prof: Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const nose = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.25) * 0.5), 0.55);
    const tail = 1 - 0.62 * Math.pow(Math.max(0, t - 0.5) / 0.5, 1.4);
    prof.push(new Vector2(Math.max(0.46 * nose * tail, 0.015), 2.7 - t * 4.9));
  }
  const fus = new Mesh(new LatheGeometry(prof, 48), skin);
  fus.rotation.z = -Math.PI / 2;
  fus.scale.set(1, 1, 0.92);
  g.add(fus);
  const band = new Mesh(new CylinderGeometry(0.455, 0.462, 0.12, 40, 1, true), stripe);
  band.rotation.z = Math.PI / 2;
  band.position.x = 1.7;
  g.add(band);
  const hatch = new Mesh(new BoxGeometry(1.3, 0.012, 0.5), seam);
  hatch.position.set(0.9, 0.455, 0);
  g.add(hatch);

  const wing = new Mesh(wingGeometry(8.2, 1.2, 0.58, 0.14, 0.04, 0.34), skin);
  wing.position.set(0.3, 0.14, 0);
  g.add(wing);
  for (const s of [-1, 1]) {
    // aileron hinge line and orange tips
    const hinge = new Mesh(new BoxGeometry(0.012, 0.012, 1.7), seam);
    hinge.position.set(-0.55, 0.14 + 3.0 * Math.tan(0.04) + 0.03, s * 3.0);
    g.add(hinge);
    const tipZ = s * 4.08;
    const tip = new Mesh(new BoxGeometry(0.62, 0.045, 0.1), stripe);
    tip.position.set(-0.08, 0.14 + 4.1 * Math.tan(0.04), tipZ);
    g.add(tip);
    const winglet = new Mesh(new BoxGeometry(0.5, 0.38, 0.03), skin);
    winglet.position.set(-0.22, 0.32 + 4.1 * Math.tan(0.04), s * 4.12);
    winglet.rotation.z = -0.25;
    g.add(winglet);

    const boom = new Mesh(new CylinderGeometry(0.06, 0.075, 4.9, 16), carbon);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(-0.6, 0.04, s * 1.4);
    g.add(boom);
    for (const bx of [1.55, -2.65]) {
      const motor = new Mesh(new CylinderGeometry(0.14, 0.15, 0.22, 20), metal);
      motor.position.set(bx, 0.17, s * 1.4);
      g.add(motor);
      const cap = new Mesh(new SphereGeometry(0.06, 12, 8), carbon);
      cap.position.set(bx, 0.3, s * 1.4);
      g.add(cap);
      // lift propellers stop aligned with the booms in cruise
      const prop = new Mesh(blade(1.35, 0.13), carbon);
      prop.position.set(bx, 0.31, s * 1.4);
      prop.rotation.y = 0.05 * s;
      g.add(prop);
    }
  }
  // inverted-V tail joining the two boom ends
  {
    const rise = 0.5, half = 1.4;
    const span = Math.hypot(rise, half);
    const ang = Math.atan2(rise, half);
    for (const sgn of [-1, 1]) {
      const panel = new Mesh(wingGeometry(span, 0.5, 0.38, 0.1, 0, 0.1), skin);
      panel.position.set(-2.85, 0.04 + rise / 2, sgn * half / 2);
      panel.rotation.x = sgn < 0 ? -ang : ang;
      g.add(panel);
    }
  }

  // gimballed mapping camera under the nose
  const mount = new Mesh(new CylinderGeometry(0.12, 0.12, 0.08, 18), carbon);
  mount.position.set(1.55, -0.42, 0);
  g.add(mount);
  const ball = new Mesh(new SphereGeometry(0.2, 24, 16), carbon);
  ball.position.set(1.55, -0.58, 0);
  g.add(ball);
  const lens = new Mesh(new CircleGeometry(0.085, 24), glass);
  lens.position.set(1.62, -0.7, 0);
  lens.rotation.set(-Math.PI / 2 + 0.4, 0, 0);
  lens.rotation.y = Math.PI / 2;
  g.add(lens);
  const gps = new Mesh(new CylinderGeometry(0.11, 0.11, 0.05, 18), seam);
  gps.position.set(0.2, 0.47, 0);
  g.add(gps);

  // pusher: blades plus a faint motion-blur disc
  const hub = new Mesh(new CylinderGeometry(0.07, 0.13, 0.28, 16), metal);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(-2.24, 0, 0);
  g.add(hub);
  const pusher = new Group();
  pusher.position.set(-2.4, 0, 0);
  for (const r of [0, Math.PI]) {
    const b = new Mesh(blade(0.72, 0.1), carbon);
    b.rotation.z = Math.PI / 2;
    b.rotation.x = r;
    b.position.y = Math.cos(r) * 0.36;
    pusher.add(b);
  }
  const disc = new Mesh(
    new CircleGeometry(0.74, 40),
    new MeshBasicMaterial({ color: '#d8dee6', transparent: true, opacity: 0.1, side: DoubleSide, depthWrite: false }),
  );
  disc.rotation.y = Math.PI / 2;
  pusher.add(disc);
  g.add(pusher);

  // navigation lights: soft additive glows
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d')!;
    const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.5)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = grd;
    x.fillRect(0, 0, 64, 64);
    return new CanvasTexture(c);
  })();
  const light = (color: string, size: number) => {
    const sp = new Sprite(new SpriteMaterial({ map: glowTex, color, blending: AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.setScalar(size);
    return sp;
  };
  const red = light('#ff4040', 0.55);
  red.position.set(0.02, 0.32, -4.16);
  const green = light('#3dff8a', 0.55);
  green.position.set(0.02, 0.32, 4.16);
  const strobe = light('#ffffff', 1.4);
  strobe.position.set(-0.4, 0.5, 0);
  g.add(red, green, strobe);

  return { group: g, pusher, strobe, glowTex };
}

function fatLine(color: Color, width: number, opacity: number) {
  const m = new LineMaterial({ linewidth: width, transparent: true, opacity, worldUnits: false, toneMapped: false, depthWrite: false });
  m.color.copy(color);
  const geo = new LineGeometry();
  geo.setPositions([0, 0, 0, 1, 0, 0]);
  const l = new Line2(geo, m);
  l.computeLineDistances();
  return { line: l, mat: m };
}

// Building the scene is split into short steps that yield to the browser between them, so taps
// and clicks stay responsive while the 3D loads.
const yieldNow = () =>
  new Promise<void>((r) => {
    const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (sch?.yield) sch.yield().then(r);
    else setTimeout(r, 0);
  });

export async function createFlightScene(canvas: HTMLCanvasElement, opts: SceneOptions) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.compact ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new Scene();
  scene.fog = new FogExp2(COL.haze.clone(), 0.00135);
  const skyMesh = sky();
  scene.add(skyMesh);

  // the sky also lights and reflects: bake it into an environment map
  await yieldNow();
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene();
  const envSky = sky(60);
  envScene.add(envSky);
  const envTex = pmrem.fromScene(envScene, 0.02).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.75;
  pmrem.dispose();
  envSky.geometry.dispose();
  (envSky.material as Material).dispose();

  const camera = new PerspectiveCamera(opts.compact ? 52 : 34, 1, 0.02, 4000);
  scene.add(new HemisphereLight('#8fa9d6', '#3b2a1c', 0.55));
  const sun = new DirectionalLight(COL.sun, 3.1);
  sun.position.copy(SUN).multiplyScalar(500);
  scene.add(sun);

  await yieldNow();
  const ground = terrain(opts.compact);
  scene.add(ground.mesh);
  await yieldNow();
  for (const m of vegetation(opts.compact)) scene.add(m);
  await yieldNow();
  const cloudLayer = clouds();
  scene.add(cloudLayer);

  // ground control points: small white-and-orange targets
  const gcpMat = new MeshBasicMaterial({ color: '#f4f1ea' });
  const L = BLOCK.length / 2 - 60;
  const W = BLOCK.width / 2 - 60;
  for (const [x, z] of [[-L, -W], [L, -W], [L, W], [-L, W], [40, 10]]) {
    for (const rot of [0, Math.PI / 2]) {
      const bar = new Mesh(new BoxGeometry(0.9, 0.02, 0.18), gcpMat);
      bar.position.set(x / U, h(x, z) + 0.06, z / U);
      bar.rotation.y = rot + Math.PI / 4;
      scene.add(bar);
    }
  }

  const planned = fatLine(COL.plan, 1.1, 0.32);
  const flown = fatLine(COL.accent, 1.6, 0.7);
  scene.add(planned.line, flown.line);

  const MAX = 4000;
  const photoPos = new Float32Array(MAX * 3);
  const photoGeo = new BufferGeometry();
  const photoAttr = new BufferAttribute(photoPos, 3);
  photoAttr.setUsage(DynamicDrawUsage);
  photoGeo.setAttribute('position', photoAttr);
  photoGeo.setDrawRange(0, 0);
  const photos = new Points(photoGeo, new PointsMaterial({ color: '#ffd2b0', size: opts.compact ? 2.2 : 2.6, sizeAttenuation: false, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false, fog: false }));
  photos.frustumCulled = false;
  scene.add(photos);

  await yieldNow();
  const { group: plane, pusher, strobe, glowTex } = aircraft();
  plane.scale.setScalar(3.6 / 8.4 / U); // 3.6 m span, true scale
  scene.add(plane);

  let current: Plan = makePlan({ altitude: 100, sideOverlap: 0.7 });
  let path: Vector3[] = [];
  let cum: number[] = [];
  let total = 0;
  let flightY = 0;
  let blockTop = 0;
  {
    // fly a constant altitude set from the block's mean ground level, as a mapping mission does
    let sum = 0, n = 0;
    for (let x = -BLOCK.length / 2; x <= BLOCK.length / 2; x += 25) for (let z = -BLOCK.width / 2; z <= BLOCK.width / 2; z += 25) { sum += terrainHeight(x, z); n++; }
    blockTop = sum / n / U;
  }
  let s = 0;
  let photoCount = 0;
  let lastPhoto = -Infinity;

  const sample = (dist: number) => {
    let lo = 1;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < dist) lo = mid + 1;
      else hi = mid;
    }
    const k = Math.max(1, lo);
    const t = (dist - cum[k - 1]) / Math.max(cum[k] - cum[k - 1], 1e-6);
    const p = path[k - 1].clone().lerp(path[k], Math.min(Math.max(t, 0), 1));
    const dir = path[k].clone().sub(path[k - 1]).normalize();
    return { p, dir, k };
  };
  const inBlock = (v: Vector3) => Math.abs(v.x * U) <= BLOCK.length / 2 && Math.abs(v.z * U) <= BLOCK.width / 2 + 1;

  // a smooth path: Chaikin-rounded turns so the aircraft banks through them like a fixed wing
  const smooth = (pts: Vector3[]) => {
    let out = pts;
    for (let it = 0; it < 2; it++) {
      const next: Vector3[] = [out[0]];
      for (let i = 0; i < out.length - 1; i++) {
        next.push(out[i].clone().lerp(out[i + 1], 0.25), out[i].clone().lerp(out[i + 1], 0.75));
      }
      next.push(out[out.length - 1]);
      out = next;
    }
    return out;
  };

  function setPlan(p: Plan) {
    current = p;
    const pts = track(p);
    flightY = blockTop + p.altitude / U;
    path = smooth(pts.map((q) => new Vector3(q.x / U, flightY, q.z / U)));
    cum = [0];
    for (let k = 1; k < path.length; k++) cum.push(cum[k - 1] + path[k].distanceTo(path[k - 1]) * U);
    total = cum[cum.length - 1];
    const draped: number[] = [];
    for (const q of pts) draped.push(q.x / U, h(q.x, q.z) + 0.12, q.z / U);
    planned.line.geometry.dispose();
    const pg = new LineGeometry();
    pg.setPositions(draped);
    planned.line.geometry = pg;
    planned.line.computeLineDistances();
    ground.uniforms.uFootSize.value.set(p.footprintH / U / 2, p.footprintW / U / 2);
    s = opts.reducedMotion ? total * 0.38 : 140;
    photoCount = 0;
    lastPhoto = -Infinity;
    if (opts.reducedMotion) {
      for (let d = 0; d <= s; d += p.interval) {
        const { p: v, dir } = sample(d);
        if (inBlock(v) && Math.abs(dir.z) < 0.2) addPhoto(v);
      }
    }
    photoGeo.setDrawRange(0, photoCount);
    photoAttr.needsUpdate = true;
    rebuildFlown(true);
    camInit = false;
    place(0);
    render();
  }

  function addPhoto(v: Vector3) {
    if (photoCount >= MAX) return;
    photoPos.set([v.x, h(v.x * U, v.z * U) + 0.15, v.z], photoCount * 3);
    photoCount++;
  }

  let flownK = -1;
  function rebuildFlown(force = false) {
    const { k, p } = sample(Math.max(s, 0.01));
    if (!force && k === flownK) {
      const end = flown.line.geometry.attributes.instanceEnd as unknown as { data: { array: Float32Array; needsUpdate: boolean } } | undefined;
      if (end) {
        const arr = end.data.array;
        arr[arr.length - 3] = p.x;
        arr[arr.length - 2] = p.y - 0.06;
        arr[arr.length - 1] = p.z;
        end.data.needsUpdate = true;
      }
      return;
    }
    flownK = k;
    const tailStart = Math.max(0, k - 900);
    const pos: number[] = [];
    for (let i = tailStart; i < k; i++) pos.push(path[i].x, path[i].y - 0.06, path[i].z);
    pos.push(p.x, p.y - 0.06, p.z);
    if (pos.length < 6) pos.push(p.x + 0.01, p.y, p.z);
    flown.line.geometry.dispose();
    const g = new LineGeometry();
    g.setPositions(pos);
    flown.line.geometry = g;
  }

  let roll = 0;
  let pitch = 0;
  let yawS = 0;
  let latest: Telemetry | null = null;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let clock = 0;
  function place(dt: number) {
    const { p, dir } = sample(s);
    const yaw = Math.atan2(-dir.z, dir.x);
    let dYaw = yaw - yawS;
    if (dYaw > Math.PI) dYaw -= Math.PI * 2;
    if (dYaw < -Math.PI) dYaw += Math.PI * 2;
    yawS = dt > 0 ? yawS + dYaw * Math.min(1, dt * 6) : yaw;
    const rate = dt > 0 ? dYaw * Math.min(1, dt * 6) / dt : 0;
    const target = Math.max(-0.6, Math.min(0.6, -rate * 0.55));
    roll += (target - roll) * Math.min(1, dt * 2.2);
    // light turbulence
    const turb = opts.reducedMotion ? 0 : 1;
    const bob = turb * (Math.sin(clock * 0.9) * 0.025 + Math.sin(clock * 2.3) * 0.008);
    pitch = turb * (Math.sin(clock * 0.7) * 0.015 + Math.sin(clock * 1.9) * 0.006);
    plane.position.set(p.x, p.y + bob, p.z);
    plane.rotation.set(roll + turb * Math.sin(clock * 1.3) * 0.02, yawS, pitch + 0.03, 'YXZ');

    const visible = inBlock(p) && Math.abs(dir.z) < 0.2;
    ground.uniforms.uFoot.value.set(p.x, yaw, p.z);
    ground.uniforms.uFootOn.value += ((visible ? 1 : 0) - ground.uniforms.uFootOn.value) * Math.min(1, dt * 6 || 1);
    if (visible && s - lastPhoto >= current.interval) {
      addPhoto(p);
      lastPhoto = s;
      photoAttr.needsUpdate = true;
      photoGeo.setDrawRange(0, photoCount);
    }
    rebuildFlown();
    const line = Math.min(current.lines, Math.max(1, Math.round((p.z * U + BLOCK.width / 2) / current.spacing) + 1));
    latest = {
      agl: (p.y - h(p.x * U, p.z * U)) * U,
      gs: 18 + Math.sin(s / 300) * 0.6,
      hdg: ((Math.atan2(dir.x, -dir.z) * 180) / Math.PI + 360) % 360,
      line,
      lines: current.lines,
      photos: photoCount,
      totalPhotos: current.photos,
    };
  }

  // camera: a close chase view, like footage from a following aircraft, that rises to a plan view
  // of the whole survey as the page scrolls
  let scroll = 0;
  const camPos = new Vector3();
  const camLook = new Vector3();
  let camInit = false;
  const FRAME = opts.compact ? { x: -0.04, y: 0.7 } : { x: 0.3, y: 0.3 };
  const chaseOff = opts.compact ? { back: 1.05, side: 0.42, up: 0.12 } : { back: 1.2, side: 0.6, up: 0.1 };
  function placeCamera(dt: number) {
    const e = scroll * scroll * (3 - 2 * scroll);
    const p = plane.position.clone();
    const heading = yawS;
    const fwd = new Vector3(Math.cos(heading), 0, -Math.sin(heading));
    const side = new Vector3(Math.sin(heading), 0, Math.cos(heading));
    const drift = opts.reducedMotion ? 0 : Math.sin(clock * 0.21) * 0.12;
    const chase = p.clone()
      .addScaledVector(fwd, -chaseOff.back)
      .addScaledVector(side, chaseOff.side + drift + pointer.x * 0.15)
      .add(new Vector3(0, chaseOff.up - pointer.y * 0.08, 0));
    const over = new Vector3(0.01, opts.compact ? 320 : 230, 60);
    const k = camInit && dt > 0 ? Math.min(1, dt * 2.4) : 1;
    camPos.lerp(chase.lerp(over, e), k);
    camLook.lerp(p.clone().lerp(new Vector3(0, 0, 0), e), Math.min(1, k * 2));
    camInit = true;
    camera.position.copy(camPos);
    camera.up.set(0, 1, 0);
    camera.lookAt(camLook);
    const d = camPos.distanceTo(camLook);
    const halfH = d * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const w = 1 - e;
    const look = camLook.clone().addScaledVector(right, -FRAME.x * halfW * w).addScaledVector(up, -FRAME.y * halfH * w);
    camera.lookAt(look);
    // a touch of banking with the aircraft for a filmed feel
    camera.rotateZ(roll * 0.18 * w);
    skyMesh.position.copy(camera.position);
    ground.uniforms.uOverlay.value = 0.65 + 0.35 * e;
  }

  function resize() {
    const w = canvas.clientWidth;
    const hh = canvas.clientHeight;
    if (!w || !hh) return;
    renderer.setSize(w, hh, false);
    camera.aspect = w / hh;
    camera.updateProjectionMatrix();
    planned.mat.resolution.set(w, hh);
    flown.mat.resolution.set(w, hh);
    render();
  }

  // nothing is drawn until the hero reports it is on screen (setPaused(false))
  let paused = true;
  function render(dt = 0) {
    placeCamera(dt);
    if (paused && !opts.reducedMotion && !firstShown) return;
    renderer.render(scene, camera);
  }
  let firstShown = false;

  let raf = 0;
  let last = performance.now();
  let tClock = 0;
  let slowT = 0;
  let pixelRatio = renderer.getPixelRatio();
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;
    // adaptive quality: if frames are slow for a couple of seconds, render fewer pixels
    slowT = dt > 1 / 34 ? slowT + dt : Math.max(0, slowT - dt * 0.5);
    if (slowT > 2 && pixelRatio > 0.75) {
      pixelRatio = Math.max(0.75, pixelRatio - 0.5);
      renderer.setPixelRatio(pixelRatio);
      resize();
      slowT = 0;
    }
    s += 34 * dt; // m/s along track, a little brisker than real so the survey progresses
    if (s > total) {
      s = 140;
      photoCount = 0;
      lastPhoto = -Infinity;
      photoGeo.setDrawRange(0, 0);
      flownK = -1;
      camInit = false;
    }
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 1.5);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 1.5);
    pusher.rotation.x += dt * 70;
    strobe.material.opacity = now % 1500 < 70 ? 1 : 0;
    ground.uniforms.uTime.value = clock;
    cloudLayer.children.forEach((c, i) => {
      c.position.x += dt * (0.8 + (i % 3) * 0.3);
      if (c.position.x > 1300) c.position.x = -1300;
    });
    place(dt);
    render(dt);
    tClock += dt;
    if (latest && opts.onTelemetry && tClock > 0.12) {
      tClock = 0;
      opts.onTelemetry(latest);
    }
  }
  const start = () => {
    if (opts.reducedMotion || raf || paused) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  await yieldNow();
  // compile shaders one object at a time, yielding in between, instead of one long block
  camera.aspect = Math.max(canvas.clientWidth, 1) / Math.max(canvas.clientHeight, 1);
  camera.updateProjectionMatrix();
  const seen = new Set<string>();
  for (const child of [...scene.children]) {
    const mats: Material[] = [];
    child.traverse((o) => {
      const m = (o as Mesh).material as Material | Material[] | undefined;
      if (m) mats.push(...(Array.isArray(m) ? m : [m]));
    });
    const key = mats.map((m) => m.type + (m.defines ? JSON.stringify(m.defines) : '')).join('|');
    if (seen.has(key) && !(child as Mesh).isMesh) continue;
    seen.add(key);
    try {
      renderer.compile(child, camera, scene);
    } catch {
      /* compiled on first render instead */
    }
    await yieldNow();
  }
  await yieldNow();
  setPlan(current);
  resize();
  if (latest && opts.onTelemetry) opts.onTelemetry(latest);

  return {
    setPlan(p: Plan) {
      setPlan(p);
      if (latest && opts.onTelemetry) opts.onTelemetry(latest);
    },
    setScroll(p: number) {
      scroll = Math.min(Math.max(p, 0), 1);
      if (!raf) render();
    },
    setPaused(v: boolean) {
      paused = v;
      if (v) stop();
      else {
        firstShown = true;
        if (opts.reducedMotion) render();
        else start();
      }
    },
    dispose() {
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((o: Object3D) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as Material | Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      glowTex.dispose();
      envTex.dispose();
      renderer.dispose();
    },
  };
}

export type FlightScene = Awaited<ReturnType<typeof createFlightScene>>;
