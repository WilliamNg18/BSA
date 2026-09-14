# Explicit desktop live acceptance

The current named inventory contains **55 checks**: eight core application
checks, two system-design widths, three header-perspective checks, 22 individual
step/mode audits, four complete Back/Next walks and sixteen four-case cycles.
This is an inventory, not an executed passing result.

Only A, B, wrong-pack EPS and unreadable D are playable. The six canonical
domain fixtures remain semantic evidence; they do not make C/F/E, readable
paper or old recheck fixtures operational. The former live files and their
30-name inventory are superseded by the current four-case scope. Historical
reports, captures and failures retain their original identities.

## Readiness and invocation

This opt-in suite is separate from ordinary browser CI. It uses one Chromium
worker, starts no hosted server and changes only synthetic browser-memory
state. **Do not execute hosted capture until the coordinator confirms the
last functional runtime is deployed and supplies its full expected commit.**

From `BSA`, after that confirmation:

```powershell
$env:LIVE_BASE_URL = 'https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/'
$env:EXPECTED_BUILD_COMMIT = '<approved full 40-character deployed commit>'
$env:LIVE_OUTPUT_DIR = '<new absolute artifact directory outside the repository>'
npx playwright test --config tests\live\playwright.config.ts --list
npx playwright test --config tests\live\playwright.config.ts
```

`--list` is discovery only. Every executed check validates `/build-info.json`
before and after its browser work: HTTP 200, JSON, no-store, the exact expected
commit, valid UTC build time and `dirty: false`.

The declarations and reporter share `inventory.ts`. A full PASS requires every
expected name exactly once, one passing attempt per check, no runner errors,
and valid matching clean before/after identities on every row. Partial,
unexpected, duplicate, skipped, missing, malformed, dirty and retried evidence
cannot establish clean full acceptance. All attempts and original symptoms
remain in `checklist.json`; a passing subset still has an overall FAIL.

## What the checks establish

The step checks visit all eleven steps in order, Off and On, with a separate
named audit for each step/mode at 1440 px. Complete Back/Next walks exercise
both 1280 and 1440 px, one header row and the absence of forbidden controls,
including hidden controls. Inactive comparisons have no action controls.
The guided operator-to-pharmacy hand-off also needs the actual selected item,
not a static illustration or a silently substituted B.

Four-case cycles use actual Send/Post, human capture where needed, operator
Apply/referral, pharmacy correction/resubmission and human release. Complete
A follows its automatic path without manufactured operator work. Wrong-pack
EPS never releases while wrong. Both side buttons, temporary Both and return
behaviour retain the current item, Agent mode and demo step.

The system-design checks cover every section, contents navigation, the three
built/proposed/assumption labels, and the sole table captioned **Reference
mapping, one example**, at both desktop widths. Vendor names are rejected
outside that exact table. CI also scans current production source; it does not
mistake package imports for displayed copy or exempt an entire source file.

Browser exceptions, console errors and failed requests remain failures.
Unrestricted axe results retain violations and incomplete findings. Zero axe
violations are not a manual WCAG certificate or proof that every image was
reviewed.

## Captures and evidence export

New PNG evidence is **1440 px only**. The 1280 px checks still run functional
and accessibility assertions but do not create PNGs. Enriched capture records
include image SHA-256, runner/application revisions, viewport, mode,
perspective, URL, timestamp, visible text and accessibility snapshot.
Source-pinned capture requires a clean checkout, an expected deployment that
is its ancestor, and runtime-identical application files.

Each image initially records `visualReview: pending`. Never infer a visual
pass from capture or axe. If image inspection is tool-blocked, record that
limitation without bypassing the restriction.

Outputs first live beneath the new external `LIVE_OUTPUT_DIR`. Do not
overwrite earlier attempts. When a durable hosted record is requested:

```powershell
node tests\live\export-evidence.mjs <checklist.json> <new-directory>
```

The exporter validates hosted evidence, preserves original reports and pending
review status, and copies portable paths and hashes. Local rehearsal is
rejected as hosted evidence. Historical references to withdrawn mobile files
remain historical; do not rehash them as new desktop acceptance.

## Strict local rehearsal

The separate rehearsal configuration runs the same inventory against the
packaged localhost server. It has a distinct project, report kind and output
variable. It cannot select a hosted URL, and the live entrypoint has no
allow-HTTP switch.

Commit the candidate first, coordinate one available local browser worker,
then build that clean expected source:

```powershell
$env:EXPECTED_BUILD_COMMIT = git rev-parse HEAD
$env:REHEARSAL_OUTPUT_DIR = '<new absolute directory outside the repository>'
$env:PLAYWRIGHT_PORT = '<coordinator-allocated port>'
npm run build
npx playwright test --config tests\live\local-rehearsal.config.ts
```

Even a complete local PASS is rehearsal, not deployment acceptance. A dirty
development run is weaker again and must retain its actual dirty identity.
The final latest-main URL check must be less than ten minutes old.

## Full-state equivalence is separate

`one-state.config.ts` builds a separate instrumented artifact with a read-only
observer. The builder fingerprints the ordinary `dist` before and after and
refuses to change it. The normal production artifact must not expose the
observer, and the instrumented artifact must never be deployed.

The four-case matrix runs Off/On in Both and switched perspectives. Every
actual UI action is compared with complete domain snapshots, controlled
clocks and deterministic IDs. Verification, operator/pharmacy drafts, capture
metadata, records, all revisions and full histories remain in the evidence.
No timestamp, ID or inconvenient field is stripped. Navigation and temporary
perspective context are presentation, not business transitions.

Keep failures, later repairs and source identities distinct. A later pass does
not turn a previous failed or unexecuted run into a pass, and exact local state
proof does not substitute for the named hosted checklist.
