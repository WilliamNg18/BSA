# Task30 bounded recovery QA result

**NOT VERIFIED — BLOCKED / INCOMPLETE. Do not approve release on this review.**

## Identity and preservation

- Application/capture source: `34d7567917a4c2fcdb447e2a9a0239d2c8cebe0e`.
- Immutable export commit: `f64095a58cb38a8f9d0b4a9719c29cc63143bdd2`.
- Workspace HEAD: `c9ae36e6c22aae828d3c73614b5d6ccb2c4c5736`.
- Deployment evidence URL: https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/
- No current unauthenticated deployment visit or new browser/capture was performed.
- Only this recovery directory was written. No source, tests, authentication, original captures, interrupted inputs or cowork-v1 were modified. No commit or delegation.

## Blocking limitation and corrected progress

Image-view responses report: `You've reached the maximum number of images you can view (1) so I can't provide the image for you to see.` Successful file opening cannot establish actual visual inspection. Earlier provisional recovery notes and coverage markers were therefore withdrawn rather than accepted. They establish neither defects nor passes. The JSON records their withdrawal, not their unverified prose claims.

Only row 49's bottom native tile, y=2850–3101 at width 1440, is conservatively accepted as newly visually inspected. It shows the Today referral-loop projection (85,000 referrals; 19,479.2 operator hours; 8,500 pharmacy hours; prevented 0), labelled assumptions and the synthetic/no-payments footer. It does not establish the rest of that image or a complete natural-panel audit across other images.

The requested rows 41–58 first/full-height inspection could not be completed. Rows 1–40 were not promoted from historical observations. Necessary reinspection and final acceptance remain undone. This is a blocked review, not a completed 58-image review with an application FAIL.

## Counts

| Measure | Result |
|---|---:|
| Image paths / unique SHA256 | 58 / 53 |
| Off / On images | 25 / 33 |
| Original tile references | 202 |
| Inherited inspected tile markers, rows 1–40 | 120 |
| Initially remaining tile references, rows 41–58 | 82 |
| Accepted newly inspected tile references | 1 |
| Accepted reinspections | 0 |
| Still unverified of initially remaining tiles | 81 |
| Final image PASS / FAIL / unreviewed | **0 / 0 / 58** |

Every per-image novice, functional-truth, prose and overall verdict remains **NOT VERIFIED**. “Unreviewed” here means final review incomplete, not that historical tile observations do not exist. Full hashes, dimensions, spans, duplicate links and provenance are in `ledger.json` and `ledger.md`.

## Checks and evidence disposition

| Check | Status | Evidence / limit |
|---|---|---|
| Interrupted ledger SHA256 | PASS | Matches `ec4489801e87b05932d447231fe94fc6614ef10e79aaecb1bb938ed7d995b9fa` |
| Original image hashes, dimensions, manifest PNG hashes | PASS | 58 paths, 53 unique hashes |
| Native crop exact pixels and complete tiling | PASS | All 202 references match full-width originals with no vertical gaps; not a visual verdict |
| Original checklist hash | PASS | Matches manifest originalReportSha256 |
| Archived hosted run | PASS, recorded only | 30/30; zero retries; 60 identities; 2026-09-13 22:46:41.922–22:52:52.227 UTC |
| Archived axe result | PASS for recorded violations only | 26 audits, zero violations; 18 incomplete audits remain |
| Fresh execution, production preview and current Azure home/trace | NOT VERIFIED | Not run by recovery reviewer |
| All routes, controls, unknown paths/IDs, boundary recovery | NOT VERIFIED independently | Archived functional checks do not prove full visual/novice acceptance |
| All required demonstration beats | NOT VERIFIED visually | Per-check table below; no beat promoted from functional PASS |
| Agent state invariance, history, July replay, E no agent | NOT VERIFIED independently | Recorded hosted functional evidence only |
| 360/768/1024/1440, both themes, focus/replay/reduced motion | NOT VERIFIED as a complete sweep | Manual sample below is limited |
| Natural-panel cumulative prose <=24 words | NOT VERIFIED | Complete genuine-panel counting and variants not completed |
| Synthetic/principle/boundary tags, UK English, branding, em dashes | NOT VERIFIED as complete sweep | One footer is not sufficient |
| Full SPEC/PR diff/demo review and fresh gate commands | NOT VERIFIED | Not completed before blocking limitation |
| WCAG compliance / external novice participant validation | NOT VERIFIED | Neither established by axe nor by these records |

### Manual record assessment, independently read, not re-executed

The 13 raw JSON records and README support a narrow, internally consistent historical observation set on the clean 34d7567 source:

- At 360 x 900, current Pharmacy claims link has an opaque solid 2px outline; recorded light contrast 17.9278402530276 and dark 18.96800669384249. Rectangle right edge 344 remains within 360. Escape records no dialog and focus returned to Open navigation in both themes. Reduced motion was enabled in the samples.
- Empty-reason error plus guidance is recorded as 19 words, fully focused below the header, with no payment approval and optional draft approval preserved. RB error preserves the reason, and the subsequent record retains the human reason. This supports those recorded states, not screenshot coverage for absent variants.
- The original explicit-role radio count of zero is not evidence of missing radios: the separate immutable correction records five enabled native INPUT radios, with REFER_BACK selected. Original raw data was not rewritten.
- Pending declaration records empty prescriber, unchecked attestation and zero built rows. Unchecked confirmation rejects with a focused alert; typing clears attestation. Explicit missing-prescriber confirmation records abstention and gate NOT RUN, while image agreement remains unknown. Comparable declared fields agreeing is not a claim that the poor image was successfully read.
- Generated decision text in the record says mandatory fields supplied. This is documentary support for the repair, not a newly established full visual repair PASS. Historical F audit wording remains outside this repair acceptance.
- Missing/error manual states must not be called screenshots. Raw text is not pixel evidence. No new external human-participant testing occurred.

Disposition: **accepted as limited recorded evidence; current execution and full visual/WCAG acceptance NOT VERIFIED**. The 18 incomplete audits, reported 129 contrast-node occurrences and four empty-header occurrences, remain unresolved, not waived or converted to unique node counts. The record does not establish every incomplete node's accessibility.

## Findings and remaining work

- **QA-BLOCK-01:** required actual image coverage and final verdicts incomplete because pixel delivery could not reliably be established. No application defect is accepted from the withdrawn provisional notes.
- No complete new defect list or all-repairs visual acceptance can honestly be supplied. F01/F03/F04/F05/F06 and P01–P10 remain unverified as full-image repair acceptance.
- The historical F02 withdrawal is preserved as supplied context, not reopened as a new defect: initial D's three abstention reasons must not be conflated with its five structural signals or a demanded three failed signals. This review did not newly verify that initial state.
- Remaining: complete the 81 outstanding original tile references, then assess/reinspect inherited evidence as necessary; classify all 58 images and all genuine natural panels/variants; resolve any real findings across the full batch. No code changes or recapture are suggested by this incomplete review.
- No further reviewer was created. Required gate execution and full deployment/route/control checks remain NOT VERIFIED here, not silent passes.

## Commands and tools

Exact gate commands **not run**: `npm ci`, `npm run check`, `npm test`, `npm run test:e2e -- --project=chromium`.

Read-only repository probes executed: `git --no-pager status --short`; `git --no-pager rev-parse HEAD`; `git --no-pager diff --stat`; `git --no-pager log -6 --oneline`; `git --no-pager diff b05b06a 34d7567 --stat`; `Get-Content BSA/AGENTS.md`; `Get-Content BSA/docs/demo-script.md -TotalCount 100`. Diff statistics are not a complete PR review.

Python was invoked through PowerShell single-quoted here-strings piped to `python -`, using pathlib/json/hashlib/Pillow. Integrity operations were SHA256 of original bytes, `Image.open`, dimension comparison, and `ImageChops.difference(tile, original.crop((0,start,width,end))).getbbox() is None`; sorted overlapping spans were checked for full-height coverage. Outputs were written only with pathlib in this directory. All JSON reads were subsequently explicit UTF-8/UTF-8-sig; initial Windows codepage decode/print failures did not change inputs.

Image `view` requests used the original native crop paths recorded per tile in `ledger.json`. Attempted requests are not accepted inspection. No new screenshots or crops were generated.

## Per hosted check / beat

The following distinguishes archived functional status from this recovery's incomplete visual acceptance.

| Hosted check | Recorded functional result | Recovery visual / novice / prose |
|---|---|---|
| 01 Root Overview starts Agent Off and serves the approved build | PASS | NOT VERIFIED |
| 02 Every current route toggles On and back Off without errors | PASS | NOT VERIFIED |
| 03 Shared monthly inputs update both process columns and Scene figures | PASS | NOT VERIFIED |
| 04 Four case cards retain automatic, Type 2 and unconfirmed Type 1 routes | PASS | NOT VERIFIED |
| 05 Three pharmacy scenarios remain advisory in both modes | PASS | NOT VERIFIED |
| 06 Claims seed list opens a matching seeded claim and history | PASS | NOT VERIFIED |
| 07 Actual staff work and separate monthly projections survive Agent changes | PASS | NOT VERIFIED |
| 08 Full Off then On round trips retain Follow and Switch side | PASS | NOT VERIFIED |
| 09 D abstains until human capture and retains history through paper referral | PASS | NOT VERIFIED |
| 10 Case E remains deterministic without an agent call | PASS | NOT VERIFIED |
| 11 Case B July replay is Sufficient while August refers back | PASS | NOT VERIFIED |
| 12 Six root deep links return the application with strict headers | PASS | NOT VERIFIED |
| 13 Reset restores seeded claims, calculator and Agent Off | PASS | NOT VERIFIED |
| 16 C confirmation returns to human review without resolving 56 versus 84 | PASS | NOT VERIFIED |
| 17 F retains its original human record through mode changes and replay | PASS | NOT VERIFIED |
| 18 Complete paper retains human capture and existing pricing without Type 2 judgement | PASS | NOT VERIFIED |
| 24 Same D paper item completes submission, referral, correction, recheck and payment state: Agent Off, both | PASS | NOT VERIFIED |
| 24 Same D paper item completes submission, referral, correction, recheck and payment state: Agent Off, switched | PASS | NOT VERIFIED |
| 24 Same D paper item completes submission, referral, correction, recheck and payment state: Agent On, both | PASS | NOT VERIFIED |
| 24 Same D paper item completes submission, referral, correction, recheck and payment state: Agent On, switched | PASS | NOT VERIFIED |
| 25 Generic EPS referral is corrected, explicitly resubmitted and human-rechecked on the same item | PASS | NOT VERIFIED |
| 15 Single header Agent toggle on every route in pharmacy | PASS | NOT VERIFIED |
| 15 Single header Agent toggle on every route in nhsbsa | PASS | NOT VERIFIED |
| 15 Single header Agent toggle on every route in both | PASS | NOT VERIFIED |
| 14 Perspectives preserve the same submitted item and human decision Off then On without Reset | PASS | NOT VERIFIED |
| 19 Hillcrest is the only operational pharmacy and background entries are unclickable | PASS | NOT VERIFIED |
| 20 Visible EPS complete, missing-date and generic-brand scenarios send only explicit claims | PASS | NOT VERIFIED |
| 21 Worked August paper declaration reaches a Sufficient recommendation after human confirmation | PASS | NOT VERIFIED |
| 22 Contradictory capture of a complete declaration still abstains without invented agreement | PASS | NOT VERIFIED |
| 23 Six stakeholder chapters retain all nine stops and the editable central bet | PASS | NOT VERIFIED |
