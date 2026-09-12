# Existing App Service

`appservice.bicep` describes the owner-selected F1 Linux App Service in
`rg-bsa-bsa-demo`, Sweden Central. It preserves the existing URL and Node 24
runtime; CI deployment builds use the latest Node 20 patch (>=20.19).
No slots or tier upgrade.

Routine deployment uploads the built `BSA/dist` contents through OIDC; it does
not apply infrastructure. Recovery changes require coordinator review/what-if:

```powershell
az deployment group what-if --resource-group rg-bsa-bsa-demo --template-file .\infra\appservice.bicep
```

Optional identity/federation/RBAC bootstrap defaults off to preserve the
already-created deployment identity and site-scoped grant. Do not create a
duplicate role assignment. See [deployment](../BSA/docs/DEPLOYMENT.md) for actual
resource names, startup, variables and verification. The unselected SWA template
is retained under `alternatives`, not provisioned by the current workflow.
