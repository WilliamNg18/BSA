[CmdletBinding()]
param(
    [string]$ResourceGroup = 'rg-bsa-bsa-demo',
    [string]$AppName = 'bsa-bsa-demo-r2j2l3dxhtohy',
    [string]$PlanName = 'bsa-bsa-demo-r2j2l3dxhtohy-plan'
)

$ErrorActionPreference = 'Stop'
# Read only names/types/tags, never app settings, publishing credentials or secrets.
$json = & az resource list --resource-group $ResourceGroup --query '[].{name:name,type:type,tags:tags}' --output json --only-show-errors
if ($LASTEXITCODE -ne 0) { throw 'Cannot read existing resource tags; no recovery parameters written.' }
$resources = ConvertFrom-Json -InputObject ($json -join "`n")
$parameters = @{
    appName = @{ value = $AppName }
    planName = @{ value = $PlanName }
}
foreach ($target in @(
    @{ Name = $AppName; Type = 'Microsoft.Web/sites'; Parameter = 'siteTags' },
    @{ Name = $PlanName; Type = 'Microsoft.Web/serverfarms'; Parameter = 'planTags' }
)) {
    $matches = @($resources | Where-Object { $_.name -eq $target.Name -and $_.type -eq $target.Type })
    if ($matches.Count -gt 1) { throw 'Ambiguous resource lookup; no recovery parameters written.' }
    if ($matches.Count -eq 1) {
        # An existing untagged resource must stay untagged, not acquire defaults.
        $tags = if ($null -eq $matches[0].tags) { @{} } else { $matches[0].tags }
        $parameters[$target.Parameter] = @{ value = $tags }
    }
}
$document = @{
    '$schema' = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'
    contentVersion = '1.0.0.0'
    parameters = $parameters
}
$path = Join-Path ([IO.Path]::GetTempPath()) ('bsa-recovery-' + [guid]::NewGuid() + '.json')
try {
    $document | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $path -Encoding utf8
} catch {
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path }
    throw
}
# Only the temporary filename is returned. Tag values never go to stdout.
Write-Output $path
