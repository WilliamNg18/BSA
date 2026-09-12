# Prescription Exception Case Builder

A browser-only demonstration of governed evidence gathering for prescription
exceptions. All case data, pharmacies, readings and rule examples are synthetic;
reference material is public by the owner's decision. Public-source figures are
attributed, not presented as independently verified measurements.

> The agent gathers evidence and recommends; deterministic code validates and
> calculates; a human decides. Nothing here calculates or approves a payment.

**Live demo:** Azure Static Web Apps URL pending deployment. The site is served
at `/`; no live URL is claimed until deployment succeeds.

The application is in [`BSA`](BSA). To run it:

```powershell
Set-Location .\BSA
npm ci
npm run dev
```

See the [application guide](BSA/README.md), [deployment setup](BSA/docs/DEPLOYMENT.md)
and [current handover](BSA/docs/HANDOVER.md). Only functional and accessibility
checks block acceptance; size, performance and visual metrics are informational.
