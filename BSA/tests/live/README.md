# Explicit live acceptance

This opt-in checklist is outside `tests/e2e`. It contains 16 process checks,
one same-item perspective round trip and three header-only Agent checks (one
per perspective, each visiting every route): 20 tests in total. Default production CI does
not discover it. It starts no server, uses one Chromium worker, and only changes
synthetic browser-memory state. Do not execute until the coordinator confirms
the deployed artifact is ready and supplies its full expected commit.

From the `BSA` application directory:

```powershell
$env:LIVE_BASE_URL = 'https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/'
$env:EXPECTED_BUILD_COMMIT = '<coordinator-provided 40-character deployed commit>'
$env:LIVE_OUTPUT_DIR = '<absolute session artifact directory outside the repository>'
npx playwright test --config tests/live/playwright.config.ts --list
# Only after explicit readiness approval:
npx playwright test --config tests/live/playwright.config.ts
```

`--list` performs discovery only. Every executed checklist item verifies
`/build-info.json` before and after its browser work: HTTP 200, JSON, no-store,
exact expected commit, valid UTC build time and `dirty: false`. A changed,
malformed or stale identity fails acceptance. `checklist.json` reports all
executed items, PASS/FAIL/NOT_RUN, symptoms, timestamps, duration, URL, identity
attachments and evidence paths. Timing is informational, not a performance
budget. No skipped item counts as a pass.

The test declarations and reporter share the named inventory in `inventory.ts`.
Only a complete, unique inventory with one passing attempt per check can report
full `PASS`. A passing `--grep` selection retains its passing rows but reports
`selection: partial` and overall `FAIL`, with the missing checks listed.
Skipped, unrun, duplicate, unexpected and retried checks cannot imply clean full
acceptance. All retry attempts and their original symptoms remain in the report.

The six explicit root deep links are `/pharmacy`, `/pharmacy/claims`, `/queue`,
`/case/EX-24112`, `/case/EX-24112/trace` and `/case/EX-24112/record`. Route toggling
also visits every current static route, tour stop and canonical case view.
The header-only checks count hidden switches too and verify that the single
header state controls each permitted page while opposite-side guards remain.
Default-rule axe is run for Overview, pharmacy, claims, actual staff work and
unconfirmed Type 1 capture in both modes; each audit has its own URL, mode,
timestamp and violation report.
Those checks do not claim universal accessibility conformance.

The checklist targets the integrated N/P/Q/U interface: shared whole-process
monthly inputs and both outcome columns, truthful case-card routing, actual
Type 1 and Type 2 work rather than a virtual queue, and explicit referral RB
codes. Canonical A/E traces and complete EPS resubmissions require automatic
pricing without another operator approval. D's Off/On flow retains initial
uncertainty, explicit human capture, the RB2B referral, original history and
fresh capture required by a new paper revision.
C's pharmacy confirmation retains both conflicting quantities for another human
review. F's original record survives mode changes and rule replay. An edited
monthly scenario is checked across Chapter 2, the scene, queue and pharmacy
projection rather than checking unrelated defaults on each page.

Do not run this version against an earlier M-only deployment. Select only
checks compatible with the coordinator's exact deployed stage; omitted checks
remain NOT_RUN, and a partial smoke run is not full live acceptance. Local
rehearsal verifies test compatibility only, never deployed acceptance; the
committed live configuration continues to require HTTPS and a clean exact
coordinator-provided build identity.

Screenshots, traces and JSON live beneath `LIVE_OUTPUT_DIR`; do not commit
generated evidence. Existing crash/console/network guards and navigation/reset
helpers are reused without altering the production suite. The deployed
build-info contract comes from the App Service strict static server; the
harness does not load or change hosting policy files.

## Instrumented one-state checks are not live acceptance

`npm run verify` also runs a blocking, shard-aware `one-state.config.ts` suite
after the ordinary production browser checks. It builds a separate
`test-results/one-state-site` artifact with `VITE_E2E_STATE_OBSERVER=true` and
serves it with the packaged strict-policy server. The builder fingerprints
every ordinary `dist` file before and after and fails if any file changes.
After building, the launcher resolves the packaged server's real filesystem
path before starting Node. Output-directory junctions therefore retain the
server's strict entry-point identity check rather than bypassing it.
The ordinary artifact test separately requires the observer to be absent.
Never deploy or label the instrumented artifact as the live release.

The observer returns complete domain snapshots, never actions. Tests use only
UI actions to submit or edit, fix the clock rather than erase timestamps, and
retain deterministic IDs, actors, revisions, approvals and entire histories.
Each flow runs in Both and again with opposite-side/back perspective switches
before every action, separately with Agent Off and On. Snapshots are compared
after every action and every presentation switch; failure attachments retain
the snapshots collected before the failure. The first M-stage coverage is
complete EPS automatic pricing using B's explicit typed correction, and
incomplete EPS draft/submission. B retains its recorded EPS channel; these
checks do not reinterpret A's paper seed as EPS.

The integrated U/Q stage additionally covers D's explicit Type 1 confirmation:
blank manual capture Off and the prior pharmacy declaration On, including a
rejected unreconciled confirmation. Stopwatch actions, opening work and reading
the resulting Type 2 case cannot change domain state. Capture must retain every
original pharmacy attempt and append capture evidence without a Type 2 decision.
These cases require the integrated capture/worklist UI; they are not an M-only
compatibility patch or evidence for the full referral-cycle and capture-edit flows.

`one-state-capture.spec.ts` expands that integrated contract in both Agent modes:
new paper with no declaration, corrected fields and renewed reconciliation,
missing-prescriber withholding, invalid quantities, manual/declaration mode
changes, and uncommitted draft clearing on Reset. It retains all original
attempts and capture history, checks unrelated cases exactly, and audits the
capture surface with default axe rules at desktop/light and phone/dark sizes.
Missing mandatory evidence must fail the compliance gate even if other fields
support an interpretation; this is distinct from abstention before interpretation.

A blocking Reset dialog is one explicit confirmation transaction: perspective
switches happen before opening it, the complete state is checked unchanged while
it is open, and the confirmed result is compared afterward. The harness never
forces interaction with the inert header behind the modal.

`one-state-lifecycle.spec.ts` covers explicit B referral reasons and RB codes,
manual/unchecked/approved draft authority, immutable July/August record replay,
and corrected EPS pricing without a second human decision. It also checks an
explicit A EPS channel choice and keeps human-released items in decided staff
work rather than misclassifying them as no-human automatic items.

`one-state-handoff.spec.ts` covers C's human information request and pharmacy
confirmation without resolving its 56/84 conflict, plus D capture followed by
an RB2B referral and a new paper revision. The new revision requires fresh
capture; the old capture, declaration, human record and history remain intact.
Each case is exercised in both Agent modes and both perspective sequences.
`one-state-completed-type1.spec.ts` adds complete paper B through manual or
declaration-confirmed capture to existing pricing without Type 2 judgement.
The card and queue must retain completed human-capture provenance, never an
awaiting-capture or no-person label; reading and switching leave state unchanged.
The full instrumented family contains 32 tests. Live check 18 covers the same
completed-only path in both Agent modes without using a domain observer.
All `one-state*.spec.ts` files are excluded from ordinary production discovery
and included only by the blocking instrumented configuration.

To repeat only these checks locally after an ordinary build:

```powershell
npm run build
$env:PLAYWRIGHT_PORT = '4206'
npm run test:e2e -- --config tests/e2e/one-state.config.ts --workers=1
```

Offline readiness checks, with no browsers or live requests:

The standard `npm test` also discovers the offline `*.test.ts` contracts here,
but never the live `checklist.spec.ts` browser suite.

```powershell
npm run typecheck
npx eslint tests/live --max-warnings 0
npx vitest run --config tests/live/unit.config.ts
```
