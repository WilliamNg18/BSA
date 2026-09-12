# Stream R account-transfer checkpoint

Work is frozen. Resume only after the new owner sends exactly:
`Resume from docs/HANDOVER.md`.

## Identity

- Repository: WilliamNg18/BSA.
- Branch: `williamng18-production-round-trip`.
- Pull request: #33, open, not merged.
- Issues: #14, #19, #29; transient axe timeout follow-up #35.
- Source before the checkpoint: `696f077e9dcd5ca356634bf58b208575f5635397`.
- Integrated base: `98c888184db1df9c03539413b5e3b1db47f1ebfe`.
- The account-transfer commit uses the exact subject `Checkpoint before account transfer`.
  Its full SHA is recorded in the final issue comments and parent handover.

## Implemented

Root-path functional assertions; eight-chapter/nine-stop tour expectations;
separate Pipeline and Four Cases matrix coverage; keyboard skip navigation from
intentional heading autofocus; immutable mixed-mode pharmacy/NHSBSA round trip.

Issue #19 hides unapproved manual reasons on both On pharmacy response/history
surfaces without changing stored history. Approved drafts remain labelled.
Off pharmacy and NHSBSA retain the original human reasons.

Issue #29 adds a truthful synthetic unchecked-resubmission comparison.
Its marker resolves only with an approved instruction and a current Ready check;
edits invalidate it. No domain/store/payment authority changed.

The final three deterministic CI mismatches are fixed in source 696f077:
kernel phase assertions stay on Pipeline; canonical D is checked separately
through all phases on Four Cases, with ABSTAIN and NOT RUN; keyboard focus
expects the new chapter-three heading. No assertions were quarantined.

## Actual evidence and limits

| Evidence | Actual result |
| --- | --- |
| Final assembled `npm run check` | Exit 0, typecheck/lint/build passed; production unchanged by subsequent test-only corrections |
| `npm run test -- --maxWorkers=1` | 607 passed in 22 files, 15.59 seconds, exit 0 |
| Actual browser `--list` | 1,022 tests in 26 files; inventory, not execution |
| Full Linux CI 34687220652 at 1c2a3ba | 1,016 passed / 3 failed, 20.8 minutes, exit 1; three quarantine tests excluded |
| Downloaded failed-CI artifact | 673 unique axe reports, zero violations; 193 unique CSP reports, zero entries; attachment copies excluded |
| Corrected three-test strict-header local run | 3 passed, 45.5 seconds, exit 0, one worker/no retries |
| Replacement CI 34688435023 and 34688433548 at 696f077 | Jobs did not start: account billing/spending-limit annotation; no test execution |
| Final Windows fallback at exact 696f077 | **INTERRUPTED for account transfer**, after runner announced 1,019 tests/two workers; retained log has no completed-test markers or final exit |
| Earlier seven-chapter Linux baseline | 761 passed / 33 failed; 32 phone overflow failures subsequently fixed by S, one destination-snapshot test subsequently fixed by R |
| Earlier focused R run | 20/21 passed; one local axe timeout; bounded comparison repeat 4/4 passed; follow-up #35, axe remains blocking |

Do not claim an exact-696f077 full production pass, Linux CI pass, hosted
acceptance, or successful quarantine execution. No Azure token is configured;
this does not justify weakening local functional gates.

## Stopped processes and retained files

The only active owned execution at freeze was PowerShell shell `r-exact-final`.
It ran the complete production command on 4173 with the repository's real-CSP
server. It was stopped by exact shell ID, including its owned process tree.
Port 4173 was subsequently verified released. No other user's processes were
stopped. No tests, rebase, merge or account actions were started after freeze.

Compact raw logs and summaries are committed beside this handoff:
`r-exact-final.log`, `r-final-check.log`, `r-final-units.log`,
`r-final-ci-failed.log`, `r-chapter-fixes.log`, `r-focused-2.log`,
`r-focused-3.log`, `r-full-browser-1.log`, baseline reproduction logs and
`evidence-summary.json`.

Large traces, screenshots and downloaded CI artifacts remain only in the old
session's files directory, and may not survive account transfer:
`C:\Users\williamng\.copilot\session-state\c860b133-a590-4e09-97c6-e61fa5a4e0d3\files`.
Important subfolders: `r-exact-final-results`, `r-ci-34687220652-results`,
`r-chapter-fixes-results`, `r-focused-2-results`, `r-focused-3-results`,
`r-full-browser-1-results`, and `r-full-browser-1-dist`.
No large archives, node_modules, built dist, browser profiles or credentials are
included in this checkpoint.

## Next action after authorised resume

Read the parent's `docs/HANDOVER.md`, this handoff and the three linked issue
comments. Verify branch/checkpoint SHA and PR state before changing anything.
The remaining blocker is complete exact-head production acceptance:
run all 1,019 blocking tests with strict production headers, root hosting,
unchanged per-test guards and outputs outside OneDrive; then run the three
existing quarantined tests separately as informational evidence.
If GitHub CI is still billing-blocked, use the coordinator-approved local
fallback and label its Windows scope honestly. Do not change billing.

Investigate actual failures; keep crash/control/six-outcome/axe gates blocking.
Count actual unique axe and CSP files, excluding attachment copies. Report
counts/exit codes to the coordinator, which owns merge and release. V owns final
captures/document closeout. Do not independently merge or tag.
