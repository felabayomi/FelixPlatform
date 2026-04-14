[CmdletBinding()]
param(
    [ValidateSet('list', 'run', 'build', 'deploy', 'domains')]
    [string]$Action = 'list',

    [string]$App,

    [switch]$All,

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Fail {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

function Resolve-RootPath {
    $scriptsDir = Split-Path -Parent $PSCommandPath
    return (Split-Path -Parent $scriptsDir)
}

function Get-Registry {
    param([string]$RootPath)

    $registryPath = Join-Path $RootPath 'scripts/app-registry.json'
    if (-not (Test-Path $registryPath)) {
        Fail "Registry file not found at $registryPath"
    }

    try {
        $registry = Get-Content -Raw -Path $registryPath | ConvertFrom-Json
    }
    catch {
        Fail "Invalid JSON in registry file: $registryPath"
    }

    if (-not $registry.apps) {
        Fail "Registry file has no 'apps' array: $registryPath"
    }

    return $registry.apps
}

function Select-Apps {
    param(
        [object[]]$Apps,
        [string]$AppId,
        [switch]$AllFlag
    )

    if ($AllFlag) {
        return $Apps
    }

    if (-not $AppId) {
        Fail "Specify -App <id> or use -All. Try: -Action list"
    }

    $matches = @($Apps | Where-Object { $_.id -eq $AppId })
    if ($matches.Count -eq 0) {
        $valid = ($Apps | ForEach-Object { $_.id }) -join ', '
        Fail "Unknown app id '$AppId'. Valid ids: $valid"
    }

    return $matches
}

function Invoke-AppCommand {
    param(
        [string]$RootPath,
        [object]$AppEntry,
        [string]$CommandName,
        [switch]$DryRunFlag
    )

    $command = $AppEntry.commands.$CommandName
    if (-not $command) {
        Write-Host "- [$($AppEntry.id)] no '$CommandName' command configured" -ForegroundColor Yellow
        return
    }

    $targetPath = Join-Path $RootPath $AppEntry.path
    if (-not (Test-Path $targetPath)) {
        Fail "Configured path does not exist for app '$($AppEntry.id)': $targetPath"
    }

    Write-Host "- [$($AppEntry.id)] $CommandName @ $targetPath"
    Write-Host "  $command" -ForegroundColor DarkGray

    if ($DryRunFlag) {
        return
    }

    Push-Location $targetPath
    try {
        Invoke-Expression $command
        if ($LASTEXITCODE -ne 0) {
            Fail "Command failed for '$($AppEntry.id)': $command"
        }
    }
    finally {
        Pop-Location
    }
}

function Show-List {
    param([object[]]$Apps)

    $rows = $Apps | ForEach-Object {
        [PSCustomObject]@{
            id      = $_.id
            path    = $_.path
            run     = [bool]$_.commands.run
            build   = [bool]$_.commands.build
            deploy  = [bool]$_.commands.deploy
            domains = ($_.domains -join ', ')
        }
    }

    $rows | Sort-Object id | Format-Table -AutoSize
}

function Show-Domains {
    param([object[]]$Apps)

    $rows = foreach ($app in ($Apps | Sort-Object id)) {
        foreach ($domain in $app.domains) {
            [PSCustomObject]@{
                domain = $domain
                app    = $app.id
                path   = $app.path
            }
        }
    }

    if (-not $rows) {
        Write-Host "No domains configured."
        return
    }

    $rows | Sort-Object domain | Format-Table -AutoSize
}

$root = Resolve-RootPath
$apps = Get-Registry -RootPath $root

switch ($Action) {
    'list' {
        Write-Step "Registered apps"
        Show-List -Apps $apps
    }
    'domains' {
        if ($App) {
            $selected = Select-Apps -Apps $apps -AppId $App
            Write-Step "Domains for $App"
            Show-Domains -Apps $selected
        }
        else {
            Write-Step "All domain mappings"
            Show-Domains -Apps $apps
        }
    }
    'run' {
        $selected = Select-Apps -Apps $apps -AppId $App -AllFlag:$All
        Write-Step "Run command"
        foreach ($entry in $selected) {
            Invoke-AppCommand -RootPath $root -AppEntry $entry -CommandName 'run' -DryRunFlag:$DryRun
        }
    }
    'build' {
        $selected = Select-Apps -Apps $apps -AppId $App -AllFlag:$All
        Write-Step "Build command"
        foreach ($entry in $selected) {
            Invoke-AppCommand -RootPath $root -AppEntry $entry -CommandName 'build' -DryRunFlag:$DryRun
        }
    }
    'deploy' {
        $selected = Select-Apps -Apps $apps -AppId $App -AllFlag:$All
        Write-Step "Deploy command"
        foreach ($entry in $selected) {
            Invoke-AppCommand -RootPath $root -AppEntry $entry -CommandName 'deploy' -DryRunFlag:$DryRun
        }
    }
}
