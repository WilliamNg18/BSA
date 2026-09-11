# Static Web Apps

Only the Free Static Web App is provisioned. Resource-group metadata lives in
UK South; the site lives in West Europe because UK South is not supported.
Choose the intended subscription with `az account set --subscription <id>`
after `az login`, then run these three commands from the repository root:

```powershell
az group create --name rg-bsa-demo --location uksouth
az deployment group create --resource-group rg-bsa-demo --template-file .\infra\staticwebapp.bicep --parameters name=bsa-demo --query properties.outputs
az staticwebapp secrets list --name bsa-demo --resource-group rg-bsa-demo --query properties.apiKey --output tsv | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo WilliamNg18/BSA
```

The final command pipes the token directly into the GitHub repository secret;
do not print, commit or paste it into logs. See
[deployment](../BSA/docs/DEPLOYMENT.md) for prerequisites and automatic behaviour.
