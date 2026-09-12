---
title: Settled route parity after the opacity repair
description: Scoped old/new image comparison, independent build hashes and accurate capture provenance.
ms.date: 2026-09-12
---

## Result

**64 of 64 route screenshots are byte-identical**, 32 Agent Off and 32 On,
completed `2026-09-12T14:05:50.955Z`, exit 0. There were no differing images,
so no image binary was added or replaced and no targeted old/new fallback
was needed. Every old/new SHA-256 pair was independently reconciled.

All 64 new unrestricted axe reports have zero violations, and every comparison
has zero page/console/CSP errors and no horizontal overflow. The route wrapper
had computed opacity 1, no transform and no animation in the recorded
reduced-motion setting. Thirty-nine reports retain incomplete color-contrast
checks; zero reported violations does not establish full manual conformance.
The original 107 PNGs, manifest, old audits and build report remain unchanged.

## Source boundary

The original [107-image manifest](../integrated/manifest.json), PNGs, audit
JSONs and [203,723-byte build report](../integrated/build-evidence.json) remain
unchanged at runtime `898cda594d0dcb34376bddab7112edcddb172440`. They are not
new-code captures. The original images use light theme, reduced motion,
1440 x 1000 viewport, scale 1 and full-page capture.

This scoped comparison targets released main
`82c18e49e7d1c765e5392b1bec5c028c8f89fd16`. The
[runtime diff](runtime-diff.patch) shows only removal of
`motion-safe:fade-in` from the AppShell route wrapper. The 6px slide, 150ms
timing, focus and reduced-motion guard remain; scripts, dependency manifests
and Vite configuration are unchanged. PR #40 changes test tags, not runtime.

Under the original reduced-motion setting the removed motion-safe fade is
inactive. That explains why settled equivalence is expected, but byte results
come from reproduction, not from that expectation.

## Comparison record

[route-equivalence.json](route-equivalence.json) records 64 comparisons:
32 route destinations in Off and On. Each row contains the original image
path/hash, reproduced hash, exact-byte result, any differing new-image path,
source/build metadata, actual computed wrapper opacity/transform/animation
count and one unrestricted axe output. `completed: false` or `runtimeError`
means the run is not a completed acceptance result.

For byte-identical results, one existing image binary is retained and the
ledger records its independent reproduction on the new source. Its original
capture time and source remain unchanged. Different images are retained under
`differences` for inspection, never silently masked or given a pixel tolerance.
No original PNG or old audit is overwritten.

The other **43 stateful images** are not recaptured: 14 expanded claim states,
four extra pharmacy scenarios, 16 round-trip checkpoints, one July replay and
eight menu/modal/Compare states. They remain explicitly labelled old-source
evidence. Their recorded reduced-motion setting and unchanged control/domain
code support retaining them, not claiming fresh image or audit provenance.

## Reproduction

From repository root, after dependencies are available:

```powershell
Set-Location BSA
npm run check
$env:PLAYWRIGHT_PORT = "4193"
node scripts\serve-production.mjs
```

Keep that server running. From another PowerShell at repository root:

```powershell
node BSA\docs\screens\route-opacity-parity\compare.mjs
```

The script uses one sequential Chromium context at a time, the original
viewport/theme/motion settings and the same interaction procedure: direct
route, explicit Agent state, fonts/presentation settled, scene final-value
check, pointer moved, notification dismissal, top scroll and default-rule axe.
Response headers must equal the emitted policy; CSP and console errors fail.
The computed reduced-motion wrapper must have opacity 1, no transform and
zero animations. No styles, timestamps, pixels or DOM evidence are replaced.

The completed build was performed once. Before it, any available original
assets were copied to session storage only after their complete file set and
SHA-256 values matched the old build record, allowing a narrowly controlled
old/new comparison if a difference needed investigation. They are not shipped
as duplicate build output or a second host.

## Resource sizes and frame safety are separate evidence

The new [build evidence](build-evidence.json) lists every emitted file and hash.
Python `gzip.compress(data, mtime=0)` at its default level 9 gives the directly
comparable total of **203,721 bytes**, versus the original **203,723 bytes**.
The new JavaScript is 638,952 raw bytes; CSS and policy hashes are unchanged,
while HTML points to the new JavaScript asset. Node's bundled zlib produces
203,964 bytes at level 9 on these same resources. Both methods and versions
are recorded rather than calling different compressor outputs identical.
These are informational measurements, not thresholds or budgets.

The real defect was normal-motion text contrast during route entry, not a
settled layout change. #42 used held real animation frames at 0/75/135/150ms;
32 scoped frame tests produced 40 unrestricted axe audits with zero violations.
Original midpoint contrast failures remain in the issue's evidence. Current
[CI 34696637977](https://github.com/WilliamNg18/BSA/actions/runs/34696637977)
at `f295d7f19363cd101af7401f0ba03188ee7d0b2b` passed check, 607 units and all
1,054 blocking browser tests. There are zero quarantined cases and no extra
informational passes. #34, #35 and #41 are closed.

Settled byte parity cannot prove intermediate-frame contrast, full manual
WCAG conformance or deployed Azure behaviour. Only actual new audit files
count as new audits; no CI artifact-deduplication total is inferred. Owner-run
token setup and live verification remain [#37](https://github.com/WilliamNg18/BSA/issues/37).
