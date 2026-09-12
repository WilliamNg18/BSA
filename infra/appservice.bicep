targetScope = 'resourceGroup'

@description('Existing app name. Recovery deployments must use the existing resource group and plan name.')
param appName string = 'bsa-bsa-demo-r2j2l3dxhtohy'
param planName string = 'bsa-bsa-demo-r2j2l3dxhtohy-plan'
param location string = 'swedencentral'
@description('Pass the existing site tags unchanged for recovery; defaults apply only to a fresh site.')
param siteTags object = {
  project: 'bsa'
  'synthetic-data': 'true'
}
@description('Pass the existing plan tags unchanged for recovery; defaults apply only to a fresh plan.')
param planTags object = {
  project: 'bsa'
  'synthetic-data': 'true'
}
@allowed(['NODE|24-lts', 'NODE|20-lts'])
@description('Preserve the existing runtime by default; deployment builds use the latest Node 20 patch (>=20.19).')
param linuxFxVersion string = 'NODE|24-lts'
@description('Optional bootstrap only. Existing deployment identity and site grant already exist; leave false for routine recovery.')
param provisionDeploymentIdentity bool = false
param deploymentIdentityName string = 'bsa-github-deploy'
@description('Exact ID-bound GitHub OIDC subject observed and verified for this repository main branch.')
param federatedSubject string = 'repo:WilliamNg18@101734401/BSA@1362745159:ref:refs/heads/main'
@description('Use the existing assignment name when adopting an existing identity grant.')
param deploymentRoleAssignmentName string = '3e003756-0f4b-4ffb-b415-e6a731fd4cca'

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  tags: planTags
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource site 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  tags: siteTags
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: 'pm2 start /home/site/wwwroot/server.mjs --no-daemon'
      alwaysOn: false
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '0'
        }
      ]
    }
  }
}

resource auth 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: site
  name: 'authsettingsV2'
  properties: {
    platform: {
      enabled: false
    }
    globalValidation: {
      unauthenticatedClientAction: 'AllowAnonymous'
    }
  }
}

resource scmCredentials 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: site
  name: 'scm'
  properties: {
    allow: false
  }
}
resource ftpCredentials 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: site
  name: 'ftp'
  properties: {
    allow: false
  }
}

resource deployIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = if (provisionDeploymentIdentity) {
  name: deploymentIdentityName
  location: location
}
resource federation 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = if (provisionDeploymentIdentity) {
  parent: deployIdentity
  name: 'github-main'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: federatedSubject
    audiences: ['api://AzureADTokenExchange']
  }
}
resource deployRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (provisionDeploymentIdentity) {
  name: deploymentRoleAssignmentName
  scope: site
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'de139f84-1756-47ae-9be6-808fbbe84772')
    principalId: deployIdentity!.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

output hostname string = site.properties.defaultHostName
output url string = 'https://${site.properties.defaultHostName}'
