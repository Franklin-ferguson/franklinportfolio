# Design system: Franklin Ferguson portfolio (v4)

## Direction

The site opens on a night survey flight (the live 3D hero), then moves to a calm, editorial page:
warm paper, ink-coloured type and one signal-orange accent. Photographs and video carry the
story. Each project reads like a short case study, with its pictures directly underneath.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `--paper` / `--paper-2` / `--white` | `#F4F3EF` / `#EBE9E3` / `#FFFFFF` | Page, alternate band, cards |
| `--ink` / `--ink-2` / `--ink-3` | `#0E141C` / `#3A4553` / `#5F6A78` | Headings, body, meta |
| `--navy` / `--navy-2` | `#0A1320` / `#111D2E` | Hero, Ahafo South band, contact |
| `--accent` | `#C8461C` | Buttons and links on light (AA with white) |
| `--accent-hi` | `#F2703F` | Highlights on dark, list marks, flight path |
| `--sky` | `#A9CBEA` | Second line of the name, links on dark |

## Type

- **Sora** 600 for headings, tight tracking.
- **Manrope** for text, 17 px base.
- **Geist Mono** for labels, dates and telemetry.
- All are SIL OFL, self-hosted and subset to Latin.

## Pictures and video

- Every item is laid out in a justified row: one shared height, each item's width in proportion to
  its own aspect ratio. Nothing is cropped or turned, and portrait phone footage sits naturally
  beside landscape photographs (`MediaRow` in `src/lib/media.tsx`).
- On phones, landscape items go full width and portrait items pair up.
- Videos are short muted loops that play only while on screen, each with a pause button.
- Mine work uses labelled diagrams, because site data is not published.

## 3D hero

- A golden-hour flight over farmland and savanna, all procedural: a dusk sky that also lights the
  aircraft, terrain coloured in the shader (fields with crop rows, dry grass, laterite roads, a
  river that reflects the sky, drifting cloud shadows), about 6,500 instanced trees and village
  roofs with long evening shadows, and haze with distance.
- The aircraft is a generic VTOL quadplane at true scale (3.6 m span), filmed from a chase position
  like air-to-air footage. It banks through turns and rides light turbulence.
- Scrolling lifts the camera to a plan view of the whole survey.

## Layout

- The container is 1320 px.
- **Projects** sit in a neat 3 × 3 grid with filters. Each card opens a case study dialog with the
  facts, the challenge, what I did, the outcome, tools, and the pictures and video. Deep links
  such as `#case-seed-dispersal` work.
- **Experience** is one panel with tabs for each role, plus education.

## Motion

- Lenis smooth scrolling on desktop.
- GSAP entrances: content rises once, in order.
- The hero name reveals line by line.
- The 3D camera rises to a plan view as you scroll.
- Under reduced motion, all of the above is off and videos start paused.
