# Explicit live acceptance

This opt-in checklist is outside `tests/e2e`. It contains the 13 base checks,
one same-item perspective round trip and three header-only Agent checks (one
per perspective, each visiting every route). Default production CI does
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

The six explicit root deep links are `/pharmacy`, `/pharmacy/claims`, `/queue`,
`/case/EX-24112`, `/case/EX-24112/trace` and `/case/EX-24112/record`. Route toggling
also visits every current static route, tour stop and canonical case view.
The header-only checks count hidden switches too and verify that the single
header state controls each permitted page while opposite-side guards remain.
Default-rule axe is actually run for Overview, pharmacy and claims in both
modes; each audit has its own URL, mode, timestamp and violation report.
Those checks do not claim universal accessibility conformance.

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
