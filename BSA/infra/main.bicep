targetScope = 'resourceGroup'

@minLength(2)
@maxLength(20)
param environmentName string

@description('Resource region. Sweden Central is authorised for this synthetic demonstration.')
@allowed(['uksouth', 'swedencentral'])
param location string = 'swedencentral'

@description('Single-tenant Entra application client ID. Not a secret.')
@minLength(36)
param authClientId string

@description('Only these tenant principal object IDs may open this synthetic demo.')
@minLength(1)
param allowedPrincipalIds string[]

@description('Public access is only for the synthetic demo. Restore required before using non-synthetic data.')
@allowed(['required', 'public-demo'])
param authMode string = 'required'

param owner string = 'demo-owner'
param costCentre string = 'synthetic-mvp'

var suffix = uniqueString(resourceGroup().id, environmentName)
var tags = {
  project: 'bsa-prescription-exceptions'
  environment: environmentName
  owner: owner
  costCentre: costCentre
  'synthetic-data': 'true'
}

module web './modules/appservice.bicep' = {
  params: {
    name: 'bsa-${environmentName}-${suffix}'
    location: location
    tags: tags
    authClientId: authClientId
    allowedPrincipalIds: allowedPrincipalIds
    authMode: authMode
  }
}

output AZURE_LOCATION string = location
output AZURE_RESOURCE_GROUP string = resourceGroup().name
output AZURE_WEB_NAME string = web.outputs.name
output SERVICE_WEB_ENDPOINT_URL string = web.outputs.endpoint
output AUTH_IDENTITY_PRINCIPAL_ID string = web.outputs.authIdentityPrincipalId
output AZURE_TENANT_ID string = tenant().tenantId