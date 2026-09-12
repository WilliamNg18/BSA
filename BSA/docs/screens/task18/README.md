# Task 18 chapter and perspective captures

**Not captured yet.** The capture procedure is prepared while N/Q/P/X implement
their owned surfaces. The selector follows X's confirmed native radio group
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
The `completed` flag means capture enumeration finished, not human comprehension,
visual acceptance or full manual WCAG conformance. Inspect axe incomplete rules.

After reviewing all full-height images and exact guard/content states, copy the
selected run's images, audits and manifest into a new source-named directory
here and link them from FIRST-TIME-VIEWER. Keep failed runs separately identified.
Do not overwrite the original [integrated](../integrated/README.md) captures
or the [route-opacity reproduction](../route-opacity-parity/README.md) record.
The final same-item no-Reset live walkthrough is a separate observation record,
not something inferred from static screenshots or this capture enumeration.
