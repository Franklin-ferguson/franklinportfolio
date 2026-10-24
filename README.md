# Franklin Ferguson — portfolio

A one-page portfolio for an aerospace engineer working on UAV systems, aerostat operations, survey
and the software around them. The hero is a live 3D survey flight at golden hour: a VTOL
quadplane flies a planned photogrammetry block over West African farmland and savanna (procedural
terrain, trees, villages, a river, cloud shadows and a dusk sky), and two controls re-plan it with
the real arithmetic (ground sample distance, line spacing, flight lines, photos, time).

Static output, no server needed. Built for GitHub Pages at
`https://franklin-ferguson.github.io/franklinportfolio/` but works from any path.

## Stack

| Piece | Why |
| --- | --- |
| React 19 + TypeScript | Components and a typed content model; pre-rendered to static HTML at build time, then hydrated |
| esbuild | One fast bundler for the client and the pre-render; code-splits the 3D scene and Lenis |
| Three.js | The hero scene, loaded only after first paint and only if WebGL works |
| GSAP + ScrollTrigger | Hero entrance, section entrances, camera move on scroll |
| Lenis | Smooth wheel scrolling on desktop, driven by GSAP's ticker; native scrolling on touch |
| Sora, Manrope, Geist Mono | Self-hosted typefaces (SIL OFL), Latin subsets |
| Lucide | Icons, inlined as SVG (`src/components/Icon.tsx`) |

Deliberately not used: React Three Fiber/Drei (one scene does not need a declarative scene graph and
they add weight; the scene uses plain Three.js plus its Line2 and RoomEnvironment add-ons), Theatre.js
(no keyframed sequences to author), Motion for React (GSAP already covers every animation), Tailwind
(plain CSS with design tokens is smaller here).

## Run it

```bash
npm install
npm run dev        # builds, serves http://localhost:5173 and rebuilds on change
npm run build      # production build into dist/
npm run preview    # serves dist/ on http://localhost:4173
npm run typecheck
```

Requires Node 20 or newer.

### Tests

```bash
npx playwright install chromium   # once
npm run check                     # type-check, build, then scripts/test-site.mjs
```

`scripts/test-site.mjs` checks structure, links, media, the CV download, navigation, the survey
planner, that every photo and video keeps its own aspect ratio inside justified rows, video
play/pause, colour contrast, keyboard access, sideways scrolling on phones, reduced motion, the
no-WebGL and no-JavaScript fallbacks, and measures LCP, CLS and interaction latency.

## Editing content

All text lives in **`src/content.ts`**: profile, figures, every project (shown as a filterable
grid; each card opens a case study with its photos and video), the gallery strip, experience
(shown as tabs), expertise, research and credentials.

### How pictures are laid out

Inside a case study, each project lists its pictures and videos in `rows`. Every item in a row is shown at the same
height, with a width in proportion to its own shape, so portrait phone videos and landscape
photos sit side by side without being cropped or turned. Two to four items per row works best;
mix portrait and landscape items so a row is not too tall, or give the row a `maxWidth`. On phones,
landscape items take the full width and portrait items pair up. Lines marked
`// CONFIRM` need your check (see `CONTENT-REVIEW.md`).

### Photos and video

1. Put the original in `media-src/` (JPG or PNG).
2. Run `npm run images`. It writes AVIF and WebP sizes to `public/media/` and records dimensions in
   `src/media.json`.
3. Refer to it by file name without extension, e.g. `{ kind: 'photo', src: 'my-photo', alt: '…', caption: '…' }`.

Video clips are short muted H.264 loops in `public/media/` with a poster image in `media-src/`
named `poster-<clip>.jpg`. They play while on screen and have a pause button. To make one:

```bash
ffmpeg -ss 10 -t 8 -i original.mp4 -an -vf "scale=540:-2,fps=24" -c:v libx264 -crf 28 -pix_fmt yuv420p -movflags +faststart public/media/name.mp4
ffmpeg -i public/media/name.mp4 -frames:v 1 media-src/poster-name.jpg && npm run images
```

### The CV

Replace `public/docs/Franklin_Ferguson_CV.pdf` with any newer PDF of the same name.

## Deploy to GitHub Pages

**Option A — keep your current Pages setup (simplest).** Run `npm run build`, then replace the files in
your `franklinportfolio` repository with the contents of `dist/` (keep `.nojekyll`) and push. The old
template files (`about.html`, `services.html`, `Source/`, `css/`, `js/` …) can be deleted.

**Option B — build on GitHub.** Push this whole project to the repository, then in
*Settings → Pages* set *Source* to *GitHub Actions*. `.github/workflows/deploy.yml` builds and publishes
on every push to `main`.

If the site moves to a different address, change `SITE_URL` in `scripts/build.mjs` (canonical URL,
Open Graph, sitemap) and the `Sitemap:` line in `public/robots.txt`. `public/404.html` uses
`/franklinportfolio/` paths; update those too.

To refresh the social-sharing image after design changes: `npm run preview`, then `node scripts/og.mjs`.

## Structure

```
src/
  content.ts            every word on the site
  App.tsx               page order and the motion system start-up
  components/           Header, Hero, About, Work (filter, project grid, case-study dialogs, gallery
                        strip), Expertise, Experience (tabs), Research, Contact, Footer, Diagram,
                        Mark (logo), Icon
  scene/survey.ts       photogrammetry planning maths (GSD, spacing, lines, photos, track, terrain)
  scene/FlightScene.ts  the Three.js scene (lazy-loaded): sky, terrain shader, trees, aircraft, camera
  lib/motion.ts         GSAP, ScrollTrigger and Lenis set-up, entrances, anchor scrolling
  lib/media.tsx         responsive <picture>, video clips, and the justified media rows
  styles/main.css       design tokens and all styles
public/                 fonts, media, docs (CV, certificates), brand (logo files), icons, 404, robots
media-src/              original photographs and video stills
scripts/                build, dev server, image optimiser, tests, screenshots, OG image
DESIGN.md               the design system and the reasoning behind it
```

## Logo

`public/brand/` holds the mark for dark and light backgrounds, a one-colour version, 1024 px PNGs and
a rounded avatar (`profile-avatar-1024.png`) for LinkedIn, GitHub or your CV header.

## Accessibility and performance notes

- Semantic landmarks, one `h1`, a heading on every section, skip link, visible focus, keyboard-operable
  filters, sliders, experience tabs (arrow keys), video controls and case-study dialogs (native
  `<dialog>`, Escape closes, focus returns, deep links such as `#case-crop-spraying`).
- `prefers-reduced-motion`: no smooth scrolling, no entrances, the 3D scene renders one still frame.
- Without WebGL the hero shows a drawn plan of the same survey; without JavaScript all content,
  including every case study, is in the HTML.
- The 3D scene stops rendering whenever the hero is off screen or the tab is hidden, and releases
  its GPU resources on unmount.

## Credits

Typefaces: Sora (© The Sora Project Authors), Manrope (© The Manrope Project Authors), Geist Mono
(© The Geist Project Authors), all SIL Open Font License. Icons: Lucide (ISC).
GSAP © GreenSock (standard no-charge licence). Lenis © darkroom.engineering (MIT). Three.js (MIT). Photographs and footage are
Franklin's own project material.
