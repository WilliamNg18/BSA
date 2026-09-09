# Known issues and rough edges in the initial build (v0.6)

The initial build was assembled in a sandbox without a browser. It was verified by type-checking, a build, a server-side render of every route and logic tests on the six cases, but **never visually inspected**. Treat everything below as a starting list, not a complete one, and run the application before trusting any screen.

## Certain

1. **Never seen in a browser.** Spacing, wrapping, overflow, colour balance and dark-mode contrast have not been checked by eye on any screen. Expect long strings in tables (tool inputs, clause text, routing reasons) to wrap badly or overflow on narrow widths.
2. **Handwriting fonts are assumed.** `src/components/demo/prescription-form.tsx` asks for `Segoe Script`, `Bradley Hand` or `Comic Sans MS` for handwritten endorsements. None ships with the application, so on most machines the "handwritten" note renders in a generic cursive or in the fallback sans. The poor scan (Case D) relies on a CSS blur and rotation that may look crude. Replace with a bundled open-licence handwriting face or an SVG treatment.
3. **Fixed colours in places.** Several components use fixed Tailwind colours (`bg-teal-50`, `bg-amber-50`, `bg-rose-50`, `text-slate-*`) for alerts, banners and the presenter bar, with hand-added `dark:` variants. Some combinations will fall below 4.5:1 contrast in dark mode. Move accents onto tokens or audit every pair.
4. **Pharmacy interpretation is a regex.** The pharmacy check's `interpret()` recognises the endorsement type by keyword, a date by a `d/m` or `d/m/y` pattern and initials as a two-or-three capital-letter token. It will misread ordinary text (for example a batch code) as initials and does not agree with the scripted readings used on the NHSBSA side. Either share one interpretation function across both sides or make the mock visibly a mock.
5. **Trace replay timing is fixed.** Steps reveal every 900 ms with no pause, no per-step step-through and no keyboard shortcut. The replay also restarts from zero whenever the case pack recomputes.
6. **The Evaluation page is illustrative.** Every figure is invented and labelled synthetic. There is no chart, only tables; the go/reshape/stop section is prose. It reads as a placeholder next to the real logic elsewhere.
7. **No unit tests.** The rules, gate, composite and case outcomes are pinned only by an ad hoc script run once during development. Add tests before refactoring.
8. **Queue filler rows are dead.** Six rows exist only to fill the queue and have no case pages; clicking them does nothing useful. Either give them minimal case packs or make them clearly non-interactive.
9. **Overview counts double as marketing.** "Average evidence-assembly time" is a synthetic constant plus tool latencies; it should be labelled more plainly or removed.
10. **The seeded record uses a fixed timestamp** (2026-09-03) and the cases use fixed `receivedAt` and `minutesInQueue` values, so the queue never ages. Consider deriving from the current date so the demonstration always looks like today.
11. **Bundle is one chunk (~750 kB minified).** No code splitting; first load on a slow connection is noticeable. Split by route.
12. **No favicon, no Open Graph metadata, no print stylesheet.** The case pack is exactly the kind of screen someone will try to print.
13. **Not-found page is generic.** It does not offer the six known cases.
14. **Presenter bar overlaps content** at the foot of the page on short viewports; the main area does not reserve space for it when it is open.
15. **Discussion sheet prompts match routes by prefix** (`/case` matches every case route), so the same prompts appear on the trace, pack and record views.

## Likely

- Focus order after "Record decision" navigates to the record page without moving focus to the new heading.
- Toast messages (sonner) are not announced consistently by screen readers.
- Table headers do not stick when tables scroll horizontally on small screens.
- The synthetic form's SVG text does not scale its font when the figure is narrow, so labels collide in the right-hand column of the case pack on tablets.
- The header wraps into three lines between 768 and 1024 px because the navigation and the three controls compete for width.

## Deliberately not built (see the Architecture page)

Real capture integration; a live queue; the model call (the interpretation step is scripted); pricing (never, by design); authentication, networking, secrets and lineage; dispensing-system integration; monitoring dashboards; calibrated confidence thresholds.
