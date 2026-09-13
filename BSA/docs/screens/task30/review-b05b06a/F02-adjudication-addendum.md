# F02-only adjudication addendum

**Disposition: retract F02’s required-three-failed-signals finding. Overall review remains FAIL.**

This is a separate addendum to the unchanged review archived in `3ba2eee`. It does not edit or replace that review, the original manifest, or any PNG.

## Source and error

I cannot cite a current Task25–30 repository source requiring exactly three failed structural signals. My F02 adjudication applied an unsupported current-contract criterion. The observed four failures were real; treating that count as a defect was the review-criteria error.

The test at `BSA/tests/e2e/case-presentation.spec.ts:219–240` is present **at capture source `b05b06ad67860fea9d9809eed09b5f1636168f66`**, not merely added after the review. Its title is:

> Task6 D keeps three reasons, four failed signals and unestablished reconciliation; E remains no-call On

Its assertions distinguish:
- Line222: **three abstention reasons** in the alert.
- Line224: **five structural signals** overall.
- Line225: **four failed structural signals**.
- Lines226–231: reconciliation **Not established**, not satisfied or falsely agreeing.
- Line233: gate **NOT RUN**.

## Bounded corrected adjudication

The previously inspected images25/26 show four failed structural signals, an unestablished fifth reconciliation signal, and NOT RUN. Those observations match this count/reconciliation/gate contract. **Do not hide a real signal or change unknown reconciliation into agreement.**

Affected paths, original inspected y span `[2850,3900)`:
- `check-09/09-audit-unconfirmed-capture-on.png`
- `check-09/11-d-fresh-capture-after-referral-on.png`

Retract **only F02 and derivative claims that these four signals fail a required-three-signals beat**. The observations themselves remain in the historic record.

## What does not change

- F01/F03/F04/F05/F06 and all prose findings stand pending parent adjudication/repair.
- Images25/26 remain FAIL because P04/P05/P06/P07 prose failures remain.
- Overall **FAIL**; **24 image PASS /34 FAIL /0 unreviewed**.
- **58 paths /53 unique hashes /58 hash matches /202 full-height native tiles**.
- **46 failing explanatory-panel occurrences**.
- No new browser/test/runtime/image review was performed. Reading assertions is not a new executed-test pass.
- The parent retains final adjudication ownership.

## Read-only commands

```powershell
Set-Location BSA
Select-String -Path tests/e2e/case-presentation.spec.ts -Pattern 'three reasons|four failed|unestablished' -Context 8,65
git --no-pager show b05b06ad67860fea9d9809eed09b5f1636168f66:BSA/tests/e2e/case-presentation.spec.ts | Select-Object -Skip 218 -First 23
git --no-pager show 3ba2eee --stat --oneline
git --no-pager status --short
```

The accompanying JSON records SHA256 values of the unchanged archived review files. Only these new session-artifact addendum files were written.
