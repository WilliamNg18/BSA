# Prescription Exception Case Builder

A browser-only demonstration of governed evidence gathering for prescription
exceptions. All case data, pharmacies, readings and rule examples are synthetic;
reference material is public by the owner's decision. Public-source figures are
attributed, not presented as independently verified measurements.

> The agent gathers evidence and recommends; deterministic code validates and
> calculates; a human decides. Nothing here calculates or approves a payment.

**Verified demo URL:** https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/
on the existing Azure App Service F1. The owner selected this target in #48.
Tasks 14-18 were accepted at `80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`
with 14 live checks, 774 unique unit tests and 1,086 blocking browser tests.
The annotated checkpoint **`lkg-2026-09-13`** and rollback branch
`last-known-good` pin that release. Older tags and `cowork-v1` are unchanged.
Each subsequent deployment verifies its own build identity and strict headers.

## Explore the demo

The header's **Pharmacy | NHSBSA | Both** perspective switch filters the same
pages and shared history. Both shows the eight-chapter tour: scene, month,
pipeline, four cases, two places (including Pharmacy check), queue, pharmacy
claims and close. Pharmacy and NHSBSA show their own navigation; opposite-side
deep links offer a perspective switch.

**Agent On/Off exists only in the header, at the top right.** It controls every
page, including pharmacy checks and queue evidence. Page controls never override
it; Compare shows labelled read-only projections without changing assistance
or recording decisions. Reset restores Agent Off and seeded data but retains
perspective. Follow one item from explicit submission through human review,
approved correction and resubmission without Reset.

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
