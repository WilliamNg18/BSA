# Explicit live acceptance

This opt-in 13-item checklist is outside `tests/e2e`. Default production CI does
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
13 named items, PASS/FAIL/NOT_RUN, symptoms, timestamps, duration, URL, identity
attachments and evidence paths. Timing is informational, not a performance
budget. No skipped item counts as a pass.

The six explicit root deep links are `/pharmacy`, `/pharmacy/claims`, `/queue`,
`/case/EX-24112`, `/case/EX-24112/trace` and `/case/EX-24112/record`. Route toggling
also visits every current static route, tour stop and canonical case view.
Default-rule axe is actually run for Overview, pharmacy and claims in both
modes; each audit has its own URL, mode, timestamp and violation report.
Those checks do not claim universal accessibility conformance.

Screenshots, traces and JSON live beneath `LIVE_OUTPUT_DIR`; do not commit
generated evidence. Existing crash/console/network guards and navigation/reset
helpers are reused without altering the production suite. The deployed
build-info contract comes from the App Service strict static server; the
harness does not load or change hosting policy files.

Offline readiness checks, with no browsers or live requests:

The standard `npm test` also discovers the offline `*.test.ts` contracts here,
but never the live `checklist.spec.ts` browser suite.

```powershell
npm run typecheck
npx eslint tests/live --max-warnings 0
npx vitest run --config tests/live/unit.config.ts
```
