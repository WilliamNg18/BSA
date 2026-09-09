---
title: Host the existing synthetic demo before adding live agent services
description: Deliver a protected URL without claiming that the live agent backend exists.
---

## Decision

Deploy the existing synthetic React demonstration to a B1 Linux App Service in
Sweden Central. The initial UK South attempt was blocked by B1 quota. The customer
explicitly waived the region constraint on 9 September 2026 to prioritise the
synthetic demonstration. Preserve the offline domain behaviour and existing GitHub Pages workflow.
No payment processing is introduced. This supersedes the legacy hosting-only
constraint for this explicitly requested Azure deployment, not for domain logic.

## Customer evidence

A protected demonstration lets operators inspect the evidence pack, rule-version
replay, abstention path and decision controls. It does not measure live model
accuracy, operator savings, cost per exception or durable audit behaviour.

## Identity

Use built-in Easy Auth with a single-tenant registration and explicit principal
allowlist. Use a dedicated user-assigned managed identity and federated credential
instead of a client secret or the discouraged implicit flow. System-assigned
identity alone is not the documented Easy Auth federation pattern. No custom
authentication code, Graph API permissions, client secrets or Key Vault are needed.

The registration and enterprise application are tenant-wide objects outside the
resource group. Their cleanup is documented separately. App Service and the
identity are the only services justified for this increment; live AI services
would incur cost without a connected backend to exercise them.

## Deferred work and risks

The model, Functions, Search index, durable append-only records, generated images,
generated evaluation set, outcome telemetry and notification integration are not
built in this increment. Existing UI performance figures and interpretation
readings remain synthetic. Browser decisions are not protected audit records.

The production path requires completing these components and their tests before
using real data. A CISO should reject treating this deployment as a production
decision system. A sceptical operator should ask whether evidence gathering is
actually their bottleneck; that requires a timed baseline, not this demo.

## References

* [App Service identity-based authentication](https://learn.microsoft.com/azure/app-service/configure-authentication-provider-aad#use-a-managed-identity-instead-of-a-secret)
* [Resource-group-scoped azd deployments](https://learn.microsoft.com/azure/developer/azure-developer-cli/resource-group-scoped-deployments)