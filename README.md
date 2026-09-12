# Prescription Exception Case Builder

A browser-only demonstration of governed evidence gathering for prescription
exceptions. All case data, pharmacies, readings and rule examples are synthetic;
reference material is public by the owner's decision. Public-source figures are
attributed, not presented as independently verified measurements.

> The agent gathers evidence and recommends; deterministic code validates and
> calculates; a human decides. Nothing here calculates or approves a payment.

**Verified demo URL:** https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/
on the existing Azure App Service F1. The owner selected this target in #48.
Clean release `b813c6241cc084957a30c6bf48fdd65f623f33f6` passed the
[source-pinned live checks](BSA/docs/live-verification/README.md), including
exact build identity, strict headers, deep links and both-mode round trips.
Each later deployment must verify its own commit; this evidence does not
claim that a future documentation revision is already live.

The application is in [`BSA`](BSA). To run it:

```powershell
Set-Location .\BSA
npm ci
npm run dev
```

See the [application guide](BSA/README.md), [deployment setup](BSA/docs/DEPLOYMENT.md)
and [current handover](BSA/docs/HANDOVER.md). Only functional and accessibility
checks block acceptance; size, performance and visual metrics are informational.
