#!/usr/bin/env pwsh
# Copyright (c) Microsoft Corporation.
# SPDX-License-Identifier: MIT
#Requires -Version 7.0
<#
.SYNOPSIS
    Configure secretless App Service authentication after provisioning.
.DESCRIPTION
    Registers the actual callback URL and trusts the dedicated managed identity.
    Does not grant Microsoft Graph API permissions or create secrets.
.EXAMPLE
    ./scripts/Set-DemoFederation.ps1
.NOTES
    All application data is synthetic. Called by the azd postprovision hook.
#>
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'

#region Main Execution
if ($MyInvocation.InvocationName -ne '.') {
    try {
        . (Join-Path $PSScriptRoot 'Initialize-AzureDemo.ps1')
        $Values = & azd env get-values --output json | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw 'Could not read deployment outputs.' }
        if ($Values.AZURE_SUBSCRIPTION_ID -ne '8b02c7be-06b9-4d15-a916-eba62a775f02') { throw 'Unexpected deployment subscription.' }
        foreach ($Key in @('AZURE_AUTH_OBJECT_ID', 'AZURE_AUTH_CLIENT_ID', 'SERVICE_WEB_ENDPOINT_URL', 'AUTH_IDENTITY_PRINCIPAL_ID', 'AZURE_TENANT_ID')) {
            if (-not $Values.$Key) { throw "Missing deployment output $Key" }
        }
        $null = Invoke-AzureCli @('ad', 'app', 'update', '--id', $Values.AZURE_AUTH_OBJECT_ID,
            '--web-redirect-uris', "$($Values.SERVICE_WEB_ENDPOINT_URL)/.auth/login/aad/callback",
            '--enable-id-token-issuance', 'true', '--enable-access-token-issuance', 'false')
        $Credential = @{
            name = 'appservice-managed-identity'
            issuer = "https://login.microsoftonline.com/$($Values.AZURE_TENANT_ID)/v2.0"
            subject = $Values.AUTH_IDENTITY_PRINCIPAL_ID
            audiences = @('api://AzureADTokenExchange')
            description = 'Dedicated identity for the synthetic BSA demo Easy Auth only.'
        }
        $Existing = @(Invoke-AzureCli @('ad', 'app', 'federated-credential', 'list', '--id', $Values.AZURE_AUTH_OBJECT_ID, '-o', 'json') | ConvertFrom-Json | ForEach-Object { $_ })
        $Match = $Existing | Where-Object name -EQ $Credential.name
        # File input avoids JSON quote stripping by az.cmd on Windows.
        $ParameterFile = [System.IO.Path]::GetTempFileName()
        try {
            $Credential | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ParameterFile -Encoding utf8
            if ($Match) {
                $null = Invoke-AzureCli @('ad', 'app', 'federated-credential', 'update', '--id', $Values.AZURE_AUTH_OBJECT_ID,
                    '--federated-credential-id', $Match.id, '--parameters', "@$ParameterFile", '-o', 'none')
            } else {
                $null = Invoke-AzureCli @('ad', 'app', 'federated-credential', 'create', '--id', $Values.AZURE_AUTH_OBJECT_ID,
                    '--parameters', "@$ParameterFile", '-o', 'none')
            }
        } finally {
            Remove-Item -LiteralPath $ParameterFile -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Federated authentication configured for $($Values.SERVICE_WEB_ENDPOINT_URL). No client secret exists."
    } catch {
        Write-Error -ErrorAction Continue $_
        exit 1
    }
}
#endregion Main Execution