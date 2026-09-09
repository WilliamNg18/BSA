---
title: Azure deployment of the synthetic demo
description: Deploy the existing browser-only demonstration, not the future live agent backend.
---

## Scope

All case data, rule text, readings and performance figures are synthetic.
Nothing calculates or approves payments. This deployment hosts the existing
React application; it does not implement the full Azure agentic MVP brief.

The application remains browser-only after loading. Decisions are session memory,
not a durable server-side audit record. Model calls, Search retrieval, Storage
queues and Functions are not deployed. No model billing is incurred.

## Prerequisites

* Node.js 24 LTS, npm, PowerShell 7, Azure CLI and Azure Developer CLI
* Azure CLI sign-in to the target tenant
* Resource deployment rights in subscription `8b02c7be-06b9-4d15-a916-eba62a775f02`
* Permission to create an Entra app registration and service principal
* Registered `Microsoft.Web` and `Microsoft.ManagedIdentity` providers

Run commands from the application directory containing `azure.yaml`, which is
the nested `BSA` directory in this workspace. The selected environment is
`bsa-demo`, resource location `swedencentral`, resource group `rg-bsa-bsa-demo`.
The existing resource group's metadata location remains UK South. The App Service,
plan and identity are explicitly deployed in Sweden Central. The customer waived
the original UK South requirement for this synthetic demonstration on 9 September 2026.

## Provision and deploy

The configured environment deploys with `azd up`. Azure Developer CLI uses the
existing Azure CLI identity via `azd config set auth.useAzCliAuth true`.
For a new checkout, create an azd environment and set `AZURE_SUBSCRIPTION_ID`,
`AZURE_LOCATION=swedencentral` and `AZURE_RESOURCE_GROUP=rg-bsa-<environment-name>`.

The preup and preprovision hooks refuse any other subscription, create a dedicated tagged
resource group, registers a single-tenant application without a secret, and
restricts access to the signed-in user's object ID. The group must carry the
expected project tag if it already exists.

Bicep provisions a B1 Linux plan, App Service and dedicated user-assigned identity.
The site also has a system-assigned identity, without unnecessary role grants.
Easy Auth is required from initial provisioning; there is no anonymous deployment
window. The postprovision hook configures the actual callback URL and a federated
credential trusting only the dedicated identity. Then azd builds and deploys the
static assets. PM2 serves SPA deep links.

The Entra application and service principal are tenant objects, not regional
resource-group resources. This unavoidable authentication dependency is tracked
in the azd environment. No Key Vault is provisioned because there are no secrets.

## Verification

### Initial UK South attempt on 9 September 2026

`azd up --no-prompt` completed identity bootstrap but failed ARM validation:
`InternalSubscriptionIsOverQuotaForSku`. Azure reported a UK South B1 limit of
zero and one instance required. A subsequent App Service usage query also showed
zero limits for F1, D1, B2 and S1. Changing to one of those tiers would not resolve
the quota blocker.

At the end of the UK South attempt the dedicated resource group was empty. Entra registration
`bsa-bsa-demo-8b02c7be` was created with client ID
`a63f34a0-090c-42d3-89ae-99a2e8b7d04e`, together with its service principal.
No App Service, plan or managed identity was deployed in that attempt.

The user subsequently authorised a region change to prioritise the demonstration.
Sweden Central provisioning passed the B1 plan creation step. Deployment and
verification results are recorded below when completed. Azure CLI authentication
was already working; reconnecting was unnecessary.

### Hosted verification checklist

* Confirm the resource location is Sweden Central and HTTPS is required.
* An anonymous request must redirect to Entra, not return the application.
* Complete a fresh sign-in with the allowed tenant account.
* Open the queue and directly reload `/case/EX-24112/trace`.
* Walk Cases A to F, including July replay for Case B and the feature flag.
* Verify an unlisted account is denied. Do not broaden the allowlist to fix sign-in.

Build validation has three pre-existing React Fast Refresh lint warnings and a
large-bundle warning. These do not prevent bundling; they remain known issues.
Authenticated sign-in and the hosted UI are not considered verified until tested.

## Teardown and cost

The B1 plan accrues charges while provisioned, even when nobody opens the demo.
Use `azd down` to remove the resource-group deployment. Preserve the non-secret
`AZURE_AUTH_CLIENT_ID` before teardown, then delete that specific Entra application
through Entra App registrations or `az ad app delete --id <client-id>`.
Verify the corresponding enterprise application is removed. Directory objects
are not removed by resource-group teardown. Never delete an unrelated app.

Complete single-command directory teardown, the full backend, model availability,
evaluation telemetry and the under-30-minute clean-subscription target remain
unimplemented or unverified. Do not describe this increment as the completed MVP.