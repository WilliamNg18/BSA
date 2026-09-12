# Infrastructure completion evidence

**Not complete or frozen.** Application acceptance is established, but the
resource/token/live checks and several operational measurements remain open.
Do not substitute targets, workflow definitions or old App Service evidence
for actual Static Web Apps deployment.

Snapshot: 12 September 2026, application main
`271fb06437587c93225e442951441a41738747e7` before these operational changes.

## Checklist

- [ ] **Static Web App exists, Free, valid repository token, main/manual
  deployment.** Authenticated `az staticwebapp list` in subscription
  `8b02c7be-06b9-4d15-a916-eba62a775f02` returned `[]`; `gh secret list`
  returned no `AZURE_STATIC_WEB_APPS_API_TOKEN`. Issue #37 owns setup.
  Root `.github/workflows/azure-static-web-apps.yml` has main push and
  `workflow_dispatch`, an explicit preflight and actual URL output.
  [Run 34698759100](https://github.com/WilliamNg18/BSA/actions/runs/34698759100)
  failed before deployment; no live URL is verified.
- [ ] **PR previews are deployed and removed on close.** The same workflow
  handles opened/synchronise/reopened/closed events and `action: close`;
  no preview has been verified without the resource/token. Free SWA has
  three concurrent preview slots, so an unlimited simultaneous-preview
  claim would be false. Evidence: workflow and
  [provider quotas](https://learn.microsoft.com/azure/static-web-apps/quotas).
- [x] **SPA fallback, strict headers and asset caching are configured.**
  Root `staticwebapp.config.json` rewrites client navigation to `/index.html`,
  supplies 404 fallback, strict self-only CSP without `unsafe-inline`,
  nosniff/referrer/frame headers and immutable hashed-asset caching.
  `hosting.test.ts` and production-header browser tests cover the current
  application. Current route-transition frame tests also preserve contrast.
  No access restriction or backend is introduced. This does not guarantee
  that an unspecified future network/embedding feature needs no policy change.
- [x] **No size/performance/copy/screenshot metric blocks acceptance.**
  `BSA/package.json` check is typecheck/lint/build; Vite disables compressed
  size reporting and has an infinite warning threshold. CI reports gzip
  informationally; content reporting and artifact uploads are non-blocking.
  Functional, six-outcome, crash/control and axe assertions stay blocking.
  [Accepted run 34696637977](https://github.com/WilliamNg18/BSA/actions/runs/34696637977)
  passed 607 units and all 1,054 browser tests; no quarantined cases remain.
- [ ] **CI end-to-end verdict is under fifteen minutes.** The accepted
  unsharded suite took 15.1 minutes for browsers alone; the complete verdict
  was longer. Issue #46 is implementing four Playwright shards and shared
  local/CI verification. Record actual completed-run duration before ticking;
  do not impose a fifteen-minute failure timeout.
- [x] **Public standard Actions and credential protections.** GitHub API
  confirms public visibility, Actions enabled/all actions allowed, secret
  scanning and push protection enabled. Root `.gitignore` contains `.env*`.
  The local tree/reachable-history scan found no actionable credential;
  reference material remains public by the owner's explicit decision.
  Standard public-repository hosted Actions do not consume private-repository
  minute allowance; runner concurrency, storage and service availability
  still have limits. No paid/larger runner or billing change is assumed.
- [ ] **Coding-agent preinstallation and within-minute build readiness are
  currently verified.** The previous setup workflow was incorrectly nested
  under `BSA/.github` and would not be discovered. It is moved to root
  `.github/workflows/copilot-setup-steps.yml`, with the required single job,
  Node 22/npm cache and `npm ci` in `BSA`. A setup run and its actual duration
  are pending. Historical [PR #8](https://github.com/WilliamNg18/BSA/pull/8)
  was authored by `app/copilot-swe-agent`; a generic assignee probe returned
  404 and does not establish present agent entitlement. Do not infer current
  enablement or guaranteed first-minute model behaviour from a YAML file.
- [ ] **Recovery has been exercised in under ten minutes.**
  `DEPLOYMENT.md` starts with one syntax-checked PowerShell Cloud Shell block
  for subscription/group/Bicep/token reset/retrieval and one GitHub secret step.
  Resource creation and token upload have not been executed by the owner here,
  so a measured recovery and live smoke test remain pending #37.
- [ ] **One `npm run verify` matches CI.** Issue #46 owns the command,
  blocking failure propagation, informational reporting and validated shard
  forwarding. Do not document a successful invocation before implementation
  and actual validation.

## Owner action and release gate

Run the single Azure Cloud Shell PowerShell block at the top of DEPLOYMENT.md,
then save its output as the repository secret. The coordinator polls every
fifteen minutes, deploys when setup is available, and verifies Overview, six
deep links, both modes and the full round trip. Only then close #37, tick
Task 13/SCOPE I/PARITY 31 and consider ALL DONE.

Once **every** checklist item above is true, replace the pending heading with
the requested completed/frozen declaration and copy it into MEMORY and
DECISIONS. It is deliberately not asserted now. The working rhythm is recorded
in MEMORY under "How changes land"; targets are not evidence or permission
to skip functional checks.
