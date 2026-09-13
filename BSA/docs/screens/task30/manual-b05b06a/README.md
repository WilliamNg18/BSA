# Direct keyboard and contrast observations

**Bounded observations, not WCAG certification.** This record is separate from
the automated hosted checklist and the independent full-height image review.
It does not resolve every automated incomplete result or approve the final
release. The Type 1 prose finding below remains a candidate acceptance defect.

Source: `b05b06ad67860fea9d9809eed09b5f1636168f66`, built
`2026-09-13T20:59:24.062Z`. Direct browser checks from
`2026-09-13T21:12:21.640Z` to `2026-09-13T21:30:26.620Z` verified the same clean
build before and after; the ordinary state observer was absent. All actions
used the deployed synthetic application. No real claim or medical action occurred.

## Keyboard observations

| Direct interaction | Observed result | Raw evidence |
| --- | --- | --- |
| Alt+Right from scene | Reached chapter 2; heading received a solid 2px outline, below the sticky header | `manual-keyboard-chapter.json` |
| Shift+Tab to chapter selector; ArrowDown, End, Enter | Six menu entries were exposed; chapter 6 opened, menu closed and heading received focus | `manual-keyboard-menu-close.json` |
| At 360px, Enter opens mobile navigation; Tab from Close | Labelled Navigation dialog opened, background was hidden from assistive navigation, focus remained within the dialog | `manual-mobile-dialog-open.json`, `manual-mobile-link-focus.json` |
| Escape from mobile navigation | Dialog closed; focus returned to Open navigation; document width 345px within a 360px viewport | `manual-mobile-dialog-return.json` |
| Space toggles the focused header switch Off/On | One switch remained, with focus on `agent-flag`; the chosen case URL remained unchanged | `manual-keyboard-agent-toggle.json` |
| Attempt Type 1 confirmation without reconciliation | The explicit rejection alert received focus; capture stayed pending and no Record decision control appeared | `manual-capture-rejection-focus.json` |
| Tab/Shift+Tab to reconciliation; Space; Shift+Tab to prescriber; type `D` | Editing cleared reconciliation; the field kept focus with a solid 2px outline and remained below the sticky area. No capture or decision was recorded | `manual-capture-keyboard-invalidation.json` |
| Alt+Right within that input | Stayed on the same case and input; the tour did not steal the editing shortcut | `manual-input-shortcut-not-stolen.json` |
| Escape on the header explanation tooltip | Tooltip closed without moving focus from the Agent switch | `manual-tooltip-dismissal.json` |

Dark mode and reduced motion were selected through browser media emulation,
not by changing application source. This is a browser observation, not a
screen-reader or touch-device certification.

## Computed contrast samples

Measurements read current computed colours, convert CSS colours through a
detached canvas, composite solid ancestor backgrounds and calculate relative
luminance. They are text/background samples, not image-pixel or focus-indicator
conformance measurements. Sample records retain raw colours and limitations.

| Surface | Sample result |
| --- | --- |
| Light, 1440px, close heading and central bet | 19.80:1 |
| Light muted chapter narrative, 16px | 4.74:1 |
| Light chapter selector text | 19.80:1 |
| Light governing principle | 19.14:1 |
| Dark, 360px, queue heading, guide and empty-state text | 18.97:1 |
| Dark selected Decided filter text | 16.28:1 |
| Dark governing principle | 17.97:1 |
| Header explanation tooltip, 12px white on opaque `rgb(10,10,10)` | 19.80:1 |

The sample calculations reported no background-image or ancestor-opacity
limitations. These results do not establish contrast for every captured node.

## Actual incomplete-audit disposition

The immutable hosted manifest contains **18 audits with incomplete items**:
129 `color-contrast` node occurrences and four `th-has-data-cells` occurrences.
These are occurrence counts, not unique affected elements.

The four table occurrences were the Type 2 and Referred back tables in the
completed-capture Decided filter, Off and On. Directly selecting Decided showed
empty table bodies alongside explicit “No ... items match this filter” status
messages, while the Decided lane retained its row. Headers and horizontal
table scroll regions remained present. This explains the missing-data-cell
finding in that filtered state; it does not claim a general table accessibility
certification. See `manual-empty-filter-tables.json`.

Of the 129 contrast occurrences, 96 were SVG text inside the deliberately poor
synthetic paper illustration; the rest were six tooltip containers and 27
header/link/button/label occurrences affected by overlap analysis. The tooltip
sample was opaque, readable and Escape-dismissible. Representative header and
focus observations were readable and operable, but the original overlap
uncertainties remain recorded rather than being converted to automated passes.
No formal contrast ratio was established for the textured, opacity-modified
SVG text. The independent image review must assess its presentation and the
available declared/readable evidence; this record does not waive that review.

## Nonblocking implementation limitation

The mobile sheet's Overview link has a serialized callback in its `class`
attribute. It retained `aria-current`, keyboard operation and visible native
1px `auto` outline during inspection, but its intended conditional active/focus
classes cannot be certified from that implementation. Parent source assessment
identified the pre-existing SheetClose/NavLink composition issue and classified
it as a nonblocking styling risk because no actual functional or visible-focus
failure was demonstrated. Do not describe its intended 2px indicator as verified.

## Candidate prose defect sent to independent QA

The existing received-declaration check panel contains these two explanatory
paragraphs, even excluding its structured status, rule reference, quote and
requirement list:

> Declaration complete; human confirmation and prescriber evidence are still required.
>
> These checks use the pharmacy declaration, not the image. Only explicit human confirmation can establish captured evidence.

They total **27 words** (10 + 17), exceeding the required fewer-than-25 limit.
The same independent reviewer was asked to verify this and finish the complete
image set before any bounded repair plan. No application changes or evidence
rewrites were made during this manual inspection.
