# Content to confirm before launch

Everything on the site comes from your CVs, your previous website, your GitHub repositories and
your corrections. Where CV versions disagreed, the October 2026 v2 CV won.

## Applied from your corrections (Oct 2026)

- Crop spraying is shown at both **Kundungu and Asamankese**.
- The white **flying-wing VTOL** photos are captioned as your undergraduate research group's work,
  in the Research section.
- **SKT Live** is shown as "formerly SKT Aero", and the SKTAERO aircraft photos and clip are
  captioned "SKT Aero (now SKT Live)".
- The **Salis Global** review is removed everywhere.
- The line "When a tool does not exist, I build it" and its variants are removed.

## Decisions I made

1. **Downloadable CV**: `public/docs/Franklin_Ferguson_CV.pdf` is your general UAV Systems / Drone
   Survey CV, because the Engineers & Planners versions are addressed to one employer. Replace the
   file to change it.
2. **Mine work detail**: follows your v2 CV's discretion ("three active pit areas", "a flight-test
   incident"); no mine imagery or client screens; those projects use labelled diagrams.
3. **Dates**: Wingxtra Feb 2022 – Dec 2023, SKT Live Jan 2023 – Dec 2025 (v2 CV).
4. **Address**: only "Accra, Ghana" is shown.
5. **Transcript**: still linked, as on your old site. Remove it from `credentials` in
   `src/content.ts` if you prefer to share it on request.

## New in v3

- All copy rewritten. The facts are unchanged and come from the CVs and your corrections.
- **Video**: a Kundungu spraying clip (from your portrait phone video), a rice-field clip from
  Asamankese, a fixed-wing VTOL test flight and a multirotor test flight.
- **Photographs**: the spraying photos (fleet, tablet, operator, field base) are shown under
  Kundungu, because they match the Kundungu video. Tell me if any are from Asamankese instead.
- **People in photos** are not named in the alt text, apart from your own portrait. The operator in
  the plaid shirt is described neutrally.
- The **gallery** (multirotor test flight, workshop and test-field photos) has neutral captions,
  because the source files do not say which company or project they belong to. Confirm, and I can
  attach them to a project.
- The **contact form** is replaced by direct email, phone and GitHub links.

## Still open

- **LinkedIn**: add your URL to `person.linkedin` in `src/content.ts` and it appears in Contact.
- **Seed-dispersal years** are shown as 2023–25 (your SKT period). Adjust if the UNDP trial had a
  specific year.
