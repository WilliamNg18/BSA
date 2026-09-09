param name string
param location string
param tags object
param authClientId string
param allowedPrincipalIds string[]
@allowed(['required', 'public-demo'])
param authMode string = 'required'

var authenticationEnabled = authMode == 'required'

// Dedicated to Easy Auth federation, not shared with another resource.
resource authIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: '${name}-auth'
  location: location
  tags: tags
}

resource plan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: '${name}-plan'
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource site 'Microsoft.Web/sites@2024-11-01' = {
  name: name
  location: location
  tags: union(tags, { 'azd-service-name': 'web' })
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${authIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'NODE|24-lts'
      appCommandLine: 'pm2 serve /home/site/wwwroot --no-daemon --spa'
      alwaysOn: true
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      appSettings: [
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID', value: authIdentity.properties.clientId }
        { name: 'WEBSITE_AUTH_AAD_ALLOWED_TENANTS', value: tenant().tenantId }
        { name: 'DEMO_MODE', value: 'synthetic-offline' }
      ]
    }
  }
}

resource auth 'Microsoft.Web/sites/config@2024-11-01' = {
  parent: site
  name: 'authsettingsV2'
  properties: {
    platform: { enabled: authenticationEnabled }
    globalValidation: {
      requireAuthentication: authenticationEnabled
      unauthenticatedClientAction: authenticationEnabled ? 'RedirectToLoginPage' : 'AllowAnonymous'
      redirectToProvider: 'azureActiveDirectory'
    }
    httpSettings: { requireHttps: true }
    identityProviders: {
      azureActiveDirectory: {
        enabled: authenticationEnabled
        registration: {
          clientId: authClientId
          openIdIssuer: '${environment().authentication.loginEndpoint}${tenant().tenantId}/v2.0'
          clientSecretSettingName: 'OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID'
        }
        login: { loginParameters: ['scope=openid profile email'] }
        validation: {
          defaultAuthorizationPolicy: {
            allowedPrincipals: { identities: allowedPrincipalIds }
          }
        }
      }
    }
    login: { tokenStore: { enabled: false } }
  }
}

resource stickySettings 'Microsoft.Web/sites/config@2024-11-01' = {
  parent: site
  name: 'slotConfigNames'
  properties: {
    appSettingNames: ['OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID']
  }
}

resource disableScmPassword 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-11-01' = {
  parent: site
  name: 'scm'
  properties: { allow: false }
}

resource disableFtpPassword 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-11-01' = {
  parent: site
  name: 'ftp'
  properties: { allow: false }
}

output name string = site.name
output endpoint string = 'https://${site.properties.defaultHostName}'
output authIdentityPrincipalId string = authIdentity.properties.principalId