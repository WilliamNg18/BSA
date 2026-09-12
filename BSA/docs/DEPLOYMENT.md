# Azure Static Web Apps deployment

## Owner action 1: paste once into Azure Cloud Shell (PowerShell)

Open [Azure Cloud Shell](https://shell.azure.com), select **PowerShell**, and
paste this whole block. It selects the subscription currently verified for this
demo, downloads the public repository into a new temporary directory, creates
the resource group in UK South and the Free Static Web App in West Europe,
resets its deployment token, then prints that token for the next step.
If your Cloud Shell account cannot access this subscription, use the intended
subscription ID from `az account list --output table`; do not select an unrelated
corporate subscription. The block stops on a failed command.

```powershell
$ErrorActionPreference = 'Stop'
function Invoke-DemoAz {
    & az @args
    if ($LASTEXITCODE -ne 0) { throw 'Azure command failed; review the error above before continuing.' }
}
$subscription = '8b02c7be-06b9-4d15-a916-eba62a775f02'
$group = 'rg-bsa-demo'
$site = 'bsa-demo'
Invoke-DemoAz account set --subscription $subscription
Invoke-DemoAz account show --query '{subscription:name,id:id}' --output table
$checkout = Join-Path ([System.IO.Path]::GetTempPath()) ('bsa-demo-' + [guid]::NewGuid())
git clone --depth 1 https://github.com/WilliamNg18/BSA.git $checkout
if ($LASTEXITCODE -ne 0) { throw 'Repository download failed.' }
Set-Location $checkout
Invoke-DemoAz group create --name $group --location uksouth --output none
Invoke-DemoAz deployment group create --resource-group $group --template-file .\infra\staticwebapp.bicep --parameters "name=$site" --query properties.outputs --output json
Invoke-DemoAz staticwebapp secrets reset-api-key --name $site --resource-group $group --output none
Invoke-DemoAz staticwebapp secrets list --name $site --resource-group $group --query properties.apiKey --output tsv
```

The final line is a credential. Copy it only into the repository secret below;
do not paste it into chat, an issue, a source file, a screenshot or a build log.
The reset invalidates any previous token for this Static Web App.

## Owner action 2: save the GitHub secret

Open **WilliamNg18/BSA > Settings > Secrets and variables > Actions >
New repository secret**. Name it **`AZURE_STATIC_WEB_APPS_API_TOKEN`**, paste
the token from Cloud Shell, and select **Add secret**. If it already exists,
edit that secret instead.

The coordinator checks every 15 minutes and can dispatch deployment once the
secret exists. To start it immediately yourself: **Actions > Azure Static Web
Apps > Run workflow**, select **main**, then **Run workflow**. This manual
trigger is already configured. Its successful summary prints the actual site
URL and built commit.

The preflight job rejects a missing or blank token before checkout/build with
`Deployment token missing or invalid; see docs/DEPLOYMENT.md`.
Only Azure's upload step can establish whether a nonblank token is valid for
the resource; no local token-shape heuristic claims to authenticate it. Upload
failures retain their real diagnostic and add plain guidance to the summary.

## Verified hosting state: 12 September 2026

`az staticwebapp list` in the authenticated subscription above returned **[]**.
GitHub has no deployment-secret entry, no SWA workflow has succeeded, and the
latest upload step was skipped before reaching Azure. Therefore the Static
Web App does not exist in this verified subscription and is not deployed.
This does not claim to inventory inaccessible subscriptions.

The historical `bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net` URL is an old
App Service, not Static Web Apps; its current HTTPS probe timed out. Its group
`rg-bsa-bsa-demo` still contains App Service/plan/identity resources, which this
procedure does not alter or delete. They are not the selected hosting target.

The only hosting target is Azure Static Web Apps Free, at `/`. The application
is in `BSA`; infrastructure and the authoritative `staticwebapp.config.json`
are at repository root. Every production build copies that configuration into
`BSA/dist`. Nothing provisions authentication, telemetry, Front Door, custom
domains, a backend or another Azure service.

## Alternative: local CLI setup

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
`tests/e2e/production-artifact.config.ts` applies the same headers to an already
built artifact without rebuilding. The optional development-only lifecycle
configuration excludes the production-header spec; default CI does not exclude it.
This verifies browser behaviour under the configured policy, not Azure resource
provisioning, platform routing/caching parity or a deployed HTTPS endpoint.

Historically, at preparation on 11 September 2026, Azure CLI was unavailable, Azure discovery
returned multiple subscriptions without a default, and GitHub had no repository
deployment secret. No subscription was guessed, no resource was created and no
deployment URL was claimed. The newer authenticated resource lookup and
copy-and-paste owner actions at the top supersede that historical availability.
