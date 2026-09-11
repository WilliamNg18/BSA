# Azure Static Web Apps deployment

The only hosting target is Azure Static Web Apps Free, at `/`. The application
is in `BSA`; infrastructure and the authoritative `staticwebapp.config.json`
are at repository root. Every production build copies that configuration into
`BSA/dist`. Nothing provisions authentication, telemetry, Front Door, custom
domains, a backend or another Azure service.

## Once, by the subscription owner

Install Azure CLI if needed (`winget install -e --id Microsoft.AzureCLI` on
Windows), install GitHub CLI, and sign in with `az login` and `gh auth login`.
Select the intended subscription explicitly:

```powershell
az account set --subscription <your-subscription-id>
```

From repository root, create the resource and store its deployment token:

```powershell
az group create --name rg-bsa-demo --location uksouth
az deployment group create --resource-group rg-bsa-demo --template-file .\infra\staticwebapp.bicep --parameters name=bsa-demo --query properties.outputs
az staticwebapp secrets list --name bsa-demo --resource-group rg-bsa-demo --query properties.apiKey --output tsv | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo WilliamNg18/BSA
```

Alternatively copy the token into repository Settings > Secrets and variables >
Actions as `AZURE_STATIC_WEB_APPS_API_TOKEN`. Never commit it or include it in
an issue, screenshot or command log. Resource-group creation and site deployment
need appropriate Contributor access; reading the deployment token also needs
the staticSites listSecrets action. Repository secret creation needs write access.

The resource group is in UK South. The Free site is in West Europe, where
Static Web Apps is offered. The template returns the HTTPS site URL.

## Automatic after setup

Pushes to `main` build with `npm ci` and `npm run build`, then deploy `BSA/dist`.
Pull requests create or update previews, and closing a pull request removes its
preview. Free-tier preview quotas and fork pull requests without access to
repository secrets remain platform limitations; CI still verifies their code.

If setup is not complete, the workflow still builds and fails at the deployment
prerequisite with a named-secret error. After setup, rerun that failed workflow
or run `gh workflow run azure-static-web-apps.yml --repo WilliamNg18/BSA`.

CI runs typecheck, lint, production build, Vitest and the production browser
regressions including crash/dead-control/six-outcome coverage and zero-violation
axe checks. No size or performance budget exists. A single CI summary line
reports gzip size. Word counts, Lighthouse scores and screenshot differences
are informational. Proven flaky tests require an issue and quarantine tag;
their separate run is non-blocking. Failed-run artifact upload is best-effort
with one-day retention, so storage/upload failures do not fail acceptance.

## Provider limits, not project gates

All pull requests trigger preview upload and close events trigger cleanup.
The Free service permits only three concurrent preview environments, 250 MB
per environment and 500 MB total; these provider quotas cannot be removed in
repository configuration. Tokenless/fork pull requests cannot deploy a preview.
This does not block application work or require changing the settled host.
Merge and close completed stream PRs promptly to release preview slots.

GitHub Actions is enabled and permits all actions. Billing usage and stored
artifact totals were readable, but those do not prove unlimited minutes,
remaining storage or absence of an account-level spending cap. No paid plan,
billing limit, old artifact or live resource was changed. Duplicate CI runs are
cancelled, successful-run artifacts are not uploaded, and uploads cannot fail CI.
See [SWA quotas](https://learn.microsoft.com/azure/static-web-apps/quotas).

## Verification and current provisioning status

Open `/`, `/pharmacy/claims` and `/case/EX-24112/trace` directly and reload each.
Check response headers and asset caching on the deployed host. The strict
self-only CSP must also be verified there, not inferred from Vite preview.

For local header-enforced acceptance, run `npm run test:a11y` from `BSA`.
It builds production assets and serves the emitted global headers on port 4183.
The default `npm run test:e2e` uses the same server on port 4173; set
`$env:PLAYWRIGHT_PORT = "4183"` in PowerShell for an isolated functional run.
The server fails on a busy port rather than attaching to another stream.
This verifies browser behaviour under the configured policy, not Azure resource
provisioning, platform routing/caching parity or a deployed HTTPS endpoint.

At preparation on 11 September 2026, Azure CLI was unavailable, Azure discovery
returned multiple subscriptions without a default, and GitHub had no repository
deployment secret. No subscription was guessed, no resource was created and no
deployment URL is claimed. Run the commands above in the intended subscription.
