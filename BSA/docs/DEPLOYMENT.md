# App Service static deployment

## Current target and ownership

The owner explicitly selected the existing Linux App Service on 12 September
2026, superseding the earlier Static Web Apps decision (#48).

| Setting | Existing value |
| --- | --- |
| URL | https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/ |
| Subscription | `8b02c7be-06b9-4d15-a916-eba62a775f02` |
| Resource group | `rg-bsa-bsa-demo` |
| App | `bsa-bsa-demo-r2j2l3dxhtohy` |
| Plan | `bsa-bsa-demo-r2j2l3dxhtohy-plan`, F1, capacity 1 |
| Region / runtime | Sweden Central / `NODE|24-lts` |
| Authentication | Disabled, anonymous static site; SCM/FTP basic credentials disabled |

Keep this resource, URL, Free tier and runtime; do not recreate or delete them
for a routine release. Deployment builds use the latest Node **20** patch, satisfying
Vite's >=20.19 requirement; the existing serving runtime stays Node 24.
This remains a browser-only synthetic demonstration. The Node process delivers
static files, not business logic, model requests or payment calculations.

**Owner actions for me: none for repository deployment setup.** The coordinator
has authenticated Azure access and configured the OIDC identity/variables.
It owns actual Azure mutations and the first deployment from a clean committed
artifact. URL reachability alone is not proof of the current release: the old
artifact returned HTTP 200 but lacked CSP. Current commit/header verification
must succeed before hosted acceptance is claimed.

## Portable artifact and startup

From `BSA`, run `npm ci` then `npm run build`. `dist` contains:

- `index.html` and fingerprinted assets, with the SPA rooted at `/`;
- `server.mjs`, a dependency-free Node static server;
- `hosting.config.json`, copied from the provider-neutral root policy;
- `build-info.json`, containing the actual Git commit, UTC build time and
  dirty-tree flag. Never identify a dirty artifact as a verified release.

Package the **contents** of `dist` at the zip root, not a containing `dist`
directory. No node_modules, source checkout or secrets belong in that zip.

App Service settings/startup:

```text
SCM_DO_BUILD_DURING_DEPLOYMENT=false
WEBSITE_RUN_FROM_PACKAGE=0
pm2 start /home/site/wwwroot/server.mjs --no-daemon
```

PM2's built-in `serve --spa` does not provide the required custom CSP/security
headers. Run the same tested static server **under PM2** instead of silently
dropping the security policy or injecting unsafe inline styles. The server
uses `PORT`, then `SERVER_PORT`, then 8080 and binds `0.0.0.0` on App Service.
Local acceptance uses `PLAYWRIGHT_PORT` and binds only `localhost`.

Root `hosting.config.json` preserves the exact self-only CSP, nosniff,
referrer and frame headers. Client deep links return `index.html`; missing
assets stay 404. Fingerprinted `/assets/` responses cache immutably for a year;
HTML and build metadata use `no-store`. All response statuses carry the
security headers. Server source, hidden paths and policy files are not public.
`/build-info.json` intentionally exposes only non-secret release provenance.

## Main/manual workflow with OIDC

`.github/workflows/deploy-appservice.yml` runs on main pushes and manual
dispatch **on main**. It does not deploy pull requests or create preview slots.
The existing CI workflow and `npm run verify` remain the functional gates;
this migration does not change their runner, four shards or test outcomes.

The following **repository variables**, not secrets, are configured:

| Variable | Value |
| --- | --- |
| `AZURE_CLIENT_ID` | `c83aea33-0f59-40a2-9422-df596ed84da9` |
| `AZURE_TENANT_ID` | `ab64b745-fa60-492a-8b66-5c3511563829` |
| `AZURE_SUBSCRIPTION_ID` | Subscription above |
| `AZURE_RESOURCE_GROUP` | Resource group above |
| `AZURE_WEBAPP_NAME` | App above |

The `bsa-github-deploy` user-assigned identity uses federation issuer
`https://token.actions.githubusercontent.com`, subject
`repo:WilliamNg18@101734401/BSA@1362745159:ref:refs/heads/main`, audience
`api://AzureADTokenExchange`. GitHub's actual signed assertion includes the
immutable owner and repository IDs; the older name-only subject did not match.
Both IDs were independently checked against the repository API. Keep the
exact main-only subject; do not replace it with a wildcard to resolve login.
Website Contributor is scoped **only to this app**. The workflow requests
`id-token: write`, uses `azure/login@v2`, and calls `az webapp deploy --type zip`.
Missing identifiers fail preflight explicitly. No publish profile, basic-auth
fallback, SWA token or long-lived Azure credential is used.

After deploy, `verify-deployment.mjs` retries bounded cold-start probes and
requires root, pharmacy claims and trace deep links to return the same SPA,
all strict headers to match, and `/build-info.json` to match the clean workflow
commit. The summary records the actual hostname and verified commit.
This smoke check does not replace the browser round trip or accessibility gates.

## Coordinator's first deployment from the committed branch

Do not race this with a main workflow deployment. The coordinator first builds
and deploys the clean, committed candidate using its current Azure login,
verifies it, and then enables the main workflow through the reviewed merge.

```powershell
# From the candidate repository root; select the verified subscription explicitly.
az account set --subscription 8b02c7be-06b9-4d15-a916-eba62a775f02
if ($LASTEXITCODE -ne 0) { throw 'Subscription selection failed' }
# Stop on each failed command before continuing.
Set-Location BSA
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency restore failed' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
if ((Get-Content .\dist\build-info.json -Raw | ConvertFrom-Json).dirty) { throw 'Commit the candidate before deploying' }
$archive = Join-Path $env:TEMP ('bsa-site-' + [guid]::NewGuid() + '.zip')
Compress-Archive -Path .\dist\* -DestinationPath $archive
az webapp config set --resource-group rg-bsa-bsa-demo --name bsa-bsa-demo-r2j2l3dxhtohy --startup-file 'pm2 start /home/site/wwwroot/server.mjs --no-daemon'
if ($LASTEXITCODE -ne 0) { throw 'Startup configuration failed' }
az webapp deploy --resource-group rg-bsa-bsa-demo --name bsa-bsa-demo-r2j2l3dxhtohy --src-path $archive --type zip --clean true --restart true
if ($LASTEXITCODE -ne 0) { throw 'Deployment failed' }
node .\scripts\verify-deployment.mjs https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net (git rev-parse HEAD)
if ($LASTEXITCODE -ne 0) { throw 'Hosted verification failed' }
```

Azure settings are coordinator-owned. Do not run those commands as an incidental
local verification step. Preserve any failed response/startup log rather than
claiming a successful deploy from a build or token-presence check.

## Recovery infrastructure and provider limits

`infra/appservice.bicep` describes the actual F1 Linux plan, app, anonymous
access, HTTPS/TLS, startup and static deployment settings. Use a group-scoped
what-if before any recovery apply. It is not executed by the deploy workflow.
The deployment identity/federation/site-role bootstrap is optional and defaults
**off** because those resources already exist. Its role-assignment name is
parameterised to avoid creating a duplicate grant.

F1 has no deployment slots or Always On. PRs get CI and build artifacts, not
fabricated live previews. Cold starts and Free-tier limits remain real platform
constraints. Slots require an explicitly approved S1-or-higher upgrade; no
automatic spend, tier change or separate hosting service is introduced.
Recovery duration has not been measured, so a ten-minute target is not a pass.

## Local verification and historical hosting

`npm run verify` runs the same check/unit/browser phases as CI. For a narrow
already-built header check use `tests/e2e/production-artifact.config.ts`;
default port is 4173, `PLAYWRIGHT_PORT=4183` isolates another run. The existing
`serve-production.mjs` entry point delegates to the packaged server source.
No byte, performance, copy or screenshot metric becomes a blocking gate.

The former SWA-only policy, absent SWA token and unsuccessful SWA workflow
records remain historical evidence, not current owner instructions. Root
`staticwebapp.config.json` and its active workflow are removed. The old template
is preserved only in `infra/alternatives/`; switching back requires a new
explicit hosting decision. The owner-approved public reference material and
all checkpoint/rollback refs remain untouched.

References: [Node App Service configuration](https://learn.microsoft.com/azure/app-service/configure-language-nodejs?pivots=platform-linux),
[ZIP deployment](https://learn.microsoft.com/azure/app-service/deploy-zip),
[OIDC with GitHub Actions](https://learn.microsoft.com/azure/app-service/deploy-github-actions?tabs=openid).
