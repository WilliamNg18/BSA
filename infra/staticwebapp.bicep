targetScope = 'resourceGroup'

@description('Name of the synthetic BSA demonstration Static Web App.')
param name string

resource site 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: 'westeurope'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  tags: {
    project: 'bsa'
    'synthetic-data': 'true'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'Custom'
  }
}

output hostname string = site.properties.defaultHostname
output url string = 'https://${site.properties.defaultHostname}'
