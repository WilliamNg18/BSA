# Task 18 chapter and perspective captures

**Captured and reviewed:** [manifest](c0203fc/manifest.json), clean live
`c0203fc73991c0968329dbc2f4bbfb4aa8c1781f`, built
`2026-09-12T21:16:45.865Z`. The actual live run was
**2026-09-12 21:21:35 to 21:23:54 UTC**, after the coordinator released
the functional-merge/deployment gate. The manifest's `sourceRevision`
`e850dab1e2596f0d8429f63998538b49c4e53183` is the then-current rebased V
documentation/capture-runner commit; `applicationSourceRevision` and every live
identity are c0203fc. They are deliberately not interchangeable.
All 18 images were individually viewed
at full height: expected chapter or guard, readable selected perspective/mode,
no clipping or root overflow. The immutable capture manifest's
`visualReview: pending` is the runner's initial state; this dated review is
the subsequent visual verdict, not a rewrite of capture metadata.

There are **18 real unrestricted axe reports, zero violations, zero recorded
page/console/CSP errors and zero horizontal overflow**. Thirteen reports retain
incomplete results: 11 color-contrast and 8 aria-prohibited-attr, overlapping.
Those are manual-review candidates, not a claim of full WCAG conformance.
Chromium 153.0.8010.12, 1440 x 1000, light, reduced motion, device scale 1,
full-page images; no dark/mobile/cross-browser coverage is inferred.
On screenshots retain the natural focused Agent tooltip. No masking or hidden
style overrides were applied. The 512px queue scroll window is intentionally
bounded: a full-page image is not a capture of all 50 mounted rows.

| Chapter | Pharmacy Off / On | NHSBSA Off / On | Both Off / On |
| --- | --- | --- | --- |
| 2 | [Off](c0203fc/chapter-2-pharmacy-off-1440.png) / [On](c0203fc/chapter-2-pharmacy-on-1440.png) | [Off](c0203fc/chapter-2-nhsbsa-off-1440.png) / [On](c0203fc/chapter-2-nhsbsa-on-1440.png) | [Off](c0203fc/chapter-2-both-off-1440.png) / [On](c0203fc/chapter-2-both-on-1440.png) |
| 6 | [Guard Off](c0203fc/chapter-6-pharmacy-off-1440.png) / [Guard On](c0203fc/chapter-6-pharmacy-on-1440.png) | [Off](c0203fc/chapter-6-nhsbsa-off-1440.png) / [On](c0203fc/chapter-6-nhsbsa-on-1440.png) | [Off](c0203fc/chapter-6-both-off-1440.png) / [On](c0203fc/chapter-6-both-on-1440.png) |
| 7 | [Off](c0203fc/chapter-7-pharmacy-off-1440.png) / [On](c0203fc/chapter-7-pharmacy-on-1440.png) | [Guard Off](c0203fc/chapter-7-nhsbsa-off-1440.png) / [Guard On](c0203fc/chapter-7-nhsbsa-on-1440.png) | [Off](c0203fc/chapter-7-both-off-1440.png) / [On](c0203fc/chapter-7-both-on-1440.png) |

The separate [completed live walk](c0203fc/walk-completed.json) has 22
checkpoints for nine clarity points, the approved B round trip and the real
pre-submission catch count 0 to 1 before explicit submission/New queue arrival.
It ran 21:23:55 to 21:24:13 UTC with no errors/overflow. The
[first attempt](c0203fc/walk-attempt-1.json) is retained: its All-tile whitespace
selector timed out; after correcting only the harness, the whole walk passed.
No application defect or timing-budget failure is inferred from that retry.
Neither walk executed axe; do not add checkpoint counts to the 18 audit count.

## Reproduction procedure

The selector follows X's confirmed native radio group
named **Perspective**, with **Pharmacy**, **NHSBSA** and **Both** radios.
Do not run final captures before
the coordinator explicitly confirms those functional streams have merged.

The matrix contains chapters 2, 6 and 7 in Agent Off/On and
Pharmacy/NHSBSA/Both: 18 images, including four expected opposite-side guards.
The runner asserts the exact other-side heading and switch action, then checks
that the switch exposes permitted content without changing the URL. Inspect
the actual content and screenshot before marking visual review complete;
navigation checks do not establish preserved same-item history.

Use one isolated Chromium instance and a new output directory outside OneDrive.
The runner refuses an existing run directory, wrong/dirty live identity, or
application-source differences from the expected released commit. A later docs
commit may capture identical runtime source without relabelling its live build.
Errors and partial captures remain in their original run directory; no resume
mixes source revisions or silently discards a failed attempt.

From the repository root, after release authorisation:

```powershell
$env:CAPTURE_EXPECTED_COMMIT = "<full coordinator-released main SHA>"
$env:CAPTURE_OUTPUT = "<new absolute directory outside OneDrive>"
$env:CAPTURE_BASE_URL = "https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net"
node BSA\docs\screens\task18\capture.mjs
```

Use `--inventory` to print the planned combinations without launching a browser.
For an explicitly needed local preview, the only allocated port is
`http://localhost:4193`; a local capture must remain labelled local, not live.

The generated manifest records source and live identities, build/observation
times, resource and PNG hashes, four selected security headers, browser version,
actual table headers, browser/CSP errors, overflow and one unrestricted axe
audit per image. It also preserves the accessibility snapshot and main text.
Chapter 2 additionally verifies both visible numbers against the default model
targets (17,000 hours / 630 items Off; 255,002 / 60 hours / 3,780 items On,
formatted to at most one decimal) and their accessible final-value labels.
Reduced motion is explicit; checking Agent alone does not prove settled values.
The `completed` flag means capture enumeration finished, not human comprehension,
visual acceptance or full manual WCAG conformance. Inspect axe incomplete rules.

After reviewing all full-height images and exact guard/content states, copy the
selected run's images, audits and manifest into a new source-named directory
here and link them from FIRST-TIME-VIEWER. Keep failed runs separately identified.
Do not overwrite the original [integrated](../integrated/README.md) captures
or the [route-opacity reproduction](../route-opacity-parity/README.md) record.
The same-item no-Reset live walkthrough is a separate observation record,
not something inferred from static screenshots or this capture enumeration.
To reproduce that walk after release authorisation, set the same expected
commit and a fresh absolute `WALK_OUTPUT`, then run
`node BSA\docs\screens\task18\walk.mjs`.
