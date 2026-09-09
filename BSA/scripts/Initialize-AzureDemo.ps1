#!/usr/bin/env pwsh
# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0
<#
.SYNOPSIS
    Prepare the dedicated synthetic demo group and secretless Entra application.
.DESCRIPTION
    Runs before azd provisioning. Fails closed on a subscription mismatch.
    Uses Azure CLI authentication and never creates a password or client secret.
.EXAMPLE
    ./scripts/Initialize-AzureDemo.ps1
.NOTES
    Called by azure.yaml. All application data is synthetic.
#>
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'

#region Functions
function Invoke-AzureCli {
    param([string[]]$Arguments)
    $Result = & az @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Azure CLI failed: $($Arguments[0..1] -join ' ')" }
    return $Result
}

function Set-DemoEnvironment {
    param([string]$Name, [string]$Value)
    & azd env set $Name $Value
    if ($LASTEXITCODE -ne 0) { throw "Could not set azd environment value $Name" }
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}
#endregion Functions

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $ExpectedSubscription = '8b02c7be-06b9-4d15-a916-eba62a775f02'
        if ($env:AZURE_SUBSCRIPTION_ID -ne $ExpectedSubscription) {
            throw "This deployment is authorised only for subscription $ExpectedSubscription."
        }
        if ($env:AZURE_ENV_NAME -notmatch '^[a-z][a-z0-9-]{1,19}$') {
            throw 'Environment name must be 2 to 20 lower-case letters, digits or hyphens, starting with a letter.'
        }
        $Account = Invoke-AzureCli @('account', 'show', '--output', 'json') | ConvertFrom-Json
        if ($Account.id -ne $ExpectedSubscription) { throw 'Azure CLI subscription does not match the authorised target.' }
        $Location = if ($env:AZURE_LOCATION) { $env:AZURE_LOCATION } else { 'swedencentral' }
        if ($Location -notin @('uksouth', 'swedencentral')) {
            throw 'Select UK South or Sweden Central for this synthetic deployment.'
        }
        Set-DemoEnvironment 'AZURE_LOCATION' $Location
        $Group = "rg-bsa-$($env:AZURE_ENV_NAME)"
        if ($env:AZURE_RESOURCE_GROUP -and $env:AZURE_RESOURCE_GROUP -ne $Group) {
            throw "Use dedicated resource group $Group. Existing unrelated groups are not deployment targets."
        }
        Set-DemoEnvironment 'AZURE_RESOURCE_GROUP' $Group
        $Principal = Invoke-AzureCli @('ad', 'signed-in-user', 'show', '--query', 'id', '-o', 'tsv')
        Set-DemoEnvironment 'AZURE_ALLOWED_PRINCIPAL_ID' "$Principal"
        $Existing = Invoke-AzureCli @('group', 'exists', '--name', $Group, '--subscription', $ExpectedSubscription)
        if ($Existing -eq 'true') {
            $ResourceGroup = Invoke-AzureCli @('group', 'show', '--name', $Group, '--subscription', $ExpectedSubscription, '-o', 'json') | ConvertFrom-Json
            if ($ResourceGroup.tags.project -ne 'bsa-prescription-exceptions') {
                throw 'Refusing to reuse a resource group without the expected project tag.'
            }
        } else {
            $null = Invoke-AzureCli @('group', 'create', '--name', $Group, '--location', $Location, '--subscription', $ExpectedSubscription,
                '--tags', 'project=bsa-prescription-exceptions', "environment=$($env:AZURE_ENV_NAME)", "owner=$Principal", 'costCentre=synthetic-mvp', 'synthetic-data=true')
        }
        if ($env:AZURE_AUTH_CLIENT_ID) {
            $App = Invoke-AzureCli @('ad', 'app', 'show', '--id', $env:AZURE_AUTH_CLIENT_ID, '-o', 'json') | ConvertFrom-Json
        } else {
            $AppName = "bsa-$($env:AZURE_ENV_NAME)-$($ExpectedSubscription.Substring(0, 8))"
            $Matches = @(Invoke-AzureCli @('ad', 'app', 'list', '--display-name', $AppName, '-o', 'json') | ConvertFrom-Json | ForEach-Object { $_ })
            if ($Matches.Count -gt 0) { throw 'A matching Entra application already exists. Verify ownership and set AZURE_AUTH_CLIENT_ID explicitly before retrying.' }
            $App = Invoke-AzureCli @('ad', 'app', 'create', '--display-name', $AppName, '--sign-in-audience', 'AzureADMyOrg', '-o', 'json') | ConvertFrom-Json
            Set-DemoEnvironment 'AZURE_AUTH_CLIENT_ID' $App.appId
        }
        Set-DemoEnvironment 'AZURE_AUTH_OBJECT_ID' $App.id
        $ServicePrincipals = @(Invoke-AzureCli @('ad', 'sp', 'list', '--filter', "appId eq '$($App.appId)'", '-o', 'json') | ConvertFrom-Json | ForEach-Object { $_ })
        if ($ServicePrincipals.Count -eq 0) {
            $null = Invoke-AzureCli @('ad', 'sp', 'create', '--id', $App.appId, '-o', 'none')
        }
        Write-Host "Prepared synthetic demo in $Group. Access limited to the signed-in tenant principal."
    } catch {
        Write-Error -ErrorAction Continue $_
        exit 1
    }
}
#endregion Main Execution