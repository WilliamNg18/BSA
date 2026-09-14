# Prescription Exception Case Builder

A browser-only demonstration of governed evidence gathering for prescription
exceptions. All case data, pharmacies, readings and rule examples are synthetic;
reference material is public by the owner's decision. Public-source figures are
attributed, not presented as independently verified measurements.

> The agent gathers evidence and recommends; deterministic code validates and
> calculates; a human decides. Nothing here calculates or approves a payment.

**Verified demo URL:** https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/
on the existing Azure App Service F1. The owner selected this target in #48.
Tasks 25-30 implement one continuous Hillcrest Pharmacy cycle, visible EPS
prescriptions, proposed paper declarations and a shared referral-loop estimate.
Repaired runtime `34d7567917a4c2fcdb447e2a9a0239d2c8cebe0e` passed the complete
30-check hosted checklist. [Current progress](BSA/docs/PROGRESS.md) distinguishes
that functional result from visual review and final documentation-release checks.
The earlier `b05b06a` visual/prose failure and its images remain preserved.
The historical Tasks 14-18 release is
`80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`.
The annotated checkpoint **`lkg-2026-09-13`** and rollback branch
`last-known-good` pin that release. Older tags and `cowork-v1` are unchanged.
Each subsequent deployment verifies its own build identity and strict headers.

## Explore the demo

**Current work: desktop-only Tasks 31-36.** The next release replaces the
chapter rail with eleven focused demo steps and adds two-gate verification and
explicit operator/pharmacy controls. Supported widths are 1280 and 1440 px;
small-screen layouts and active screenshot/test coverage are retired.
The following six-chapter description records the implementation baseline
until the new streams merge. See PROGRESS for actual current acceptance.

The header's **Pharmacy | NHSBSA | Both** perspective switch filters the same
pages and shared history. Both shows six chapters across nine stops: real
process, numbers, pipeline, cases and boundaries, the continuous cycle
(including Pharmacy check, queue and claims), then the central bet.
Pharmacy and NHSBSA show their own navigation; opposite-side deep links offer
a perspective switch. Hillcrest (FQ123) owns every operational item; other
pharmacies are fixed, unclickable background.

**Agent On/Off exists only in the header, at the top right.** It controls every
page, including pharmacy checks and queue evidence. Page controls never override
it. Projections never change assistance or record decisions. Reset restores
Agent Off and the eight seeded items but retains
perspective. Follow one item from explicit submission through human review,
approved correction and resubmission without Reset.

Complete new EPS submissions can bypass staff. Corrected referrals retain
explicit human recheck; declared paper never becomes a pretend image reading.
The editable model estimates 5,100 referrals and 297.5 operator hours at defaults,
including manual gathering for abstentions. These are labelled assumptions,
not measured NHSBSA savings or calculated payments.

See [current progress](BSA/docs/PROGRESS.md), the
[first-time-viewer review](BSA/docs/FIRST-TIME-VIEWER.md) and
[rollback references](BSA/docs/BRANCHES.md) for source-pinned evidence and limits.

The application is in [`BSA`](BSA). To run it:

```powershell
Set-Location .\BSA
npm ci
npm run dev
```

See the [application guide](BSA/README.md), [deployment setup](BSA/docs/DEPLOYMENT.md)
and [current handover](BSA/docs/HANDOVER.md). Only functional and accessibility
checks block acceptance; size, performance and visual metrics are informational.
