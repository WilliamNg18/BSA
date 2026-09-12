# Live App Service evidence

[appservice-b813c62.json](appservice-b813c62.json) records the completed live
checklist at build `b813c6241cc084957a30c6bf48fdd65f623f33f6`, from
16:25:18.335 to 16:28:07.940 UTC on 12 September 2026.

All 13 named checks passed on the first run with one Chromium worker and no
retries. All 26 before/after identity observations matched the expected clean
build. Six actual default-rule axe audits covered Overview, pharmacy and
selected claims in both modes, with zero violations. Timing is informational.

This compact record retains statuses, symptoms, timestamps, URL, exact commit
and four explicitly whitelisted security headers. It contains no raw cookies,
credentials, unrestricted headers or local account paths. The original
`live-main-acceptance-b813c62/checklist.json` and its `test-results` directory
remain preserved in the executing session's external artifact directory;
the coordinator has their exact location. The contemporaneous public summary
is [issue #37's acceptance comment](https://github.com/WilliamNg18/BSA/issues/37#issuecomment-5647178673).

Do not attribute this run to a later commit or deployment. These scoped checks
are not universal accessibility certification or the full production matrix.
Recovery configuration, subsequent deployment proof and final documentation
are separate work. This documentation update performs no new browser run,
deployment, application change or acceptance reclassification.
