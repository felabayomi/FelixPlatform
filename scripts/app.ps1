[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'build', 'deploy', 'link', 'clean', 'install', 'list', 'domains', 'promote', 'register')]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$AppName,

    [string]$Slug,
    [string]$AdminPath,
    [string]$SidebarLabel,
    [string]$PublicUrl,
    [string]$Category,
    [ValidateSet('draft', 'in_development', 'ready', 'launched', 'archived')]
    [string]$Status = 'draft',
    [switch]$ShowInSidebar,
    [switch]$ShowInQuickAccess,
    [int]$SortOrder = 0,
    [string]$ApiBaseUrl = 'https://felix-platform-backend.onrender.com',
    [string]$AdminToken,

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Fail {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

function Normalize-Name {
    param([string]$Value)
    if (-not $Value) {
        return ''
    }

    return (($Value.ToLowerInvariant()) -replace '[^a-z0-9]', '')
}

function Get-RootPath {
    $scriptsPath = Split-Path -Parent $PSCommandPath
    return (Split-Path -Parent $scriptsPath)
}

function Get-RegistryApps {
    param([string]$RootPath)

    $registryPath = Join-Path $RootPath 'scripts/app-registry.json'
    if (-not (Test-Path $registryPath)) {
        return @()
    }

    try {
        $registry = Get-Content -Raw -Path $registryPath | ConvertFrom-Json
    }
    catch {
        Fail "Invalid registry JSON: $registryPath"
    }

    if (-not $registry.apps) {
        return @()
    }

    return @($registry.apps)
}

function Save-RegistryApps {
    param(
        [string]$RootPath,
        [object[]]$RegistryApps
    )

    $registryPath = Join-Path $RootPath 'scripts/app-registry.json'
    $payload = [PSCustomObject]@{
        apps = @($RegistryApps)
    }

    $json = $payload | ConvertTo-Json -Depth 20
    Set-Content -Path $registryPath -Value $json
}

function To-KebabCase {
    param([string]$Value)

    if (-not $Value) {
        return ''
    }

    $normalized = ($Value -creplace '([a-z0-9])([A-Z])', '$1-$2')
    $normalized = $normalized -replace '[^a-zA-Z0-9]+', '-'
    $normalized = $normalized.Trim('-').ToLowerInvariant()
    return $normalized
}

function Get-RelativePathFromRoot {
    param(
        [string]$RootPath,
        [string]$AbsolutePath
    )

    $escapedRoot = [regex]::Escape($RootPath)
    $relative = ($AbsolutePath -replace "^$escapedRoot", '')
    $relative = ($relative -replace '^[\\/]+', '')
    return ($relative -replace '\\', '/')
}

function Resolve-FromRegistry {
    param(
        [object[]]$RegistryApps,
        [string]$Name,
        [string]$RootPath
    )

    if (-not $Name) {
        return $null
    }

    $needle = Normalize-Name -Value $Name

    foreach ($entry in $RegistryApps) {
        $parentLeaf = ''
        $parentPath = Split-Path -Parent $entry.path
        if ($parentPath) {
            $parentLeaf = Split-Path -Leaf $parentPath
        }

        $aliasCandidates = @()
        if ($entry.PSObject.Properties.Name -contains 'aliases' -and $entry.aliases) {
            $aliasCandidates = @($entry.aliases)
        }

        $candidates = @(
            $entry.id,
            $entry.name,
            (Split-Path -Leaf $entry.path),
            $parentLeaf
        ) + $aliasCandidates

        foreach ($candidate in $candidates) {
            if ((Normalize-Name -Value $candidate) -eq $needle) {
                $resolvedPath = Join-Path $RootPath $entry.path
                return [PSCustomObject]@{
                    Source  = 'registry'
                    Id      = $entry.id
                    Name    = $entry.name
                    Path    = $resolvedPath
                    Domains = @($entry.domains)
                    Entry   = $entry
                }
            }
        }
    }

    return $null
}

function Resolve-ByFolder {
    param(
        [string]$RootPath,
        [string]$Name
    )

    if (-not $Name) {
        return $null
    }

    $appBase = Join-Path $RootPath (Join-Path 'apps' $Name)
    $webPath = Join-Path $appBase 'web'
    $rootPackage = Join-Path $appBase 'package.json'
    $webPackage = Join-Path $webPath 'package.json'

    if (Test-Path $webPackage) {
        return [PSCustomObject]@{
            Source  = 'folder'
            Id      = $Name
            Name    = $Name
            Path    = $webPath
            Domains = @()
            Entry   = $null
        }
    }

    if (Test-Path $rootPackage) {
        return [PSCustomObject]@{
            Source  = 'folder'
            Id      = $Name
            Name    = $Name
            Path    = $appBase
            Domains = @()
            Entry   = $null
        }
    }

    return $null
}

function Resolve-App {
    param(
        [string]$RootPath,
        [object[]]$RegistryApps,
        [string]$Name
    )

    if (-not $Name) {
        Fail 'AppName is required for this action. Example: .\\scripts\\app.ps1 dev WACI-Project-Hub'
    }

    $fromRegistry = Resolve-FromRegistry -RegistryApps $RegistryApps -Name $Name -RootPath $RootPath
    if ($fromRegistry) {
        return $fromRegistry
    }

    $fromFolder = Resolve-ByFolder -RootPath $RootPath -Name $Name
    if ($fromFolder) {
        return $fromFolder
    }

    $appBase = Join-Path $RootPath (Join-Path 'apps' $Name)
    $webPath = Join-Path $appBase 'web'

    Fail "Could not find a runnable app for '$Name'. Checked: $webPath and $appBase"
}

function Ensure-RegistryEntry {
    param(
        [string]$RootPath,
        [object[]]$RegistryApps,
        [object]$ResolvedApp
    )

    if (-not $RegistryApps -or $RegistryApps.Count -eq 0) {
        return
    }

    $appId = To-KebabCase -Value $ResolvedApp.Name
    $relativePath = Get-RelativePathFromRoot -RootPath $RootPath -AbsolutePath $ResolvedApp.Path

    $alreadyExists = $RegistryApps | Where-Object {
        $_.id -eq $appId -or $_.path -eq $relativePath
    }

    if ($alreadyExists) {
        return
    }

    $newEntry = [PSCustomObject]@{
        id       = $appId
        name     = $ResolvedApp.Name
        path     = $relativePath
        domains  = @()
        commands = [PSCustomObject]@{
            run    = 'npm run dev'
            build  = 'npm run build'
            deploy = 'npx vercel deploy --prod --yes --scope felabayomis-projects'
        }
    }

    $updatedApps = @($RegistryApps) + $newEntry
    Save-RegistryApps -RootPath $RootPath -RegistryApps $updatedApps

    Write-Host "Added registry entry for $($ResolvedApp.Name) as '$appId'" -ForegroundColor Green
}

function Promote-IncomingProject {
    param(
        [string]$RootPath,
        [string]$Name,
        [object[]]$RegistryApps,
        [switch]$DryRunFlag
    )

    if (-not $Name) {
        Fail 'AppName is required for promote. Example: .\\scripts\\app.ps1 promote CityTourHub'
    }

    $incomingPath = Join-Path $RootPath (Join-Path 'incoming' $Name)
    $appsPath = Join-Path $RootPath (Join-Path 'apps' $Name)

    if (-not (Test-Path $incomingPath)) {
        Fail "Incoming project not found: $incomingPath"
    }

    if (Test-Path $appsPath) {
        Fail "Destination already exists: $appsPath"
    }

    Write-Host "" 
    Write-Host "Promoting project" -ForegroundColor Cyan
    Write-Host "From: $incomingPath" -ForegroundColor Cyan
    Write-Host "To:   $appsPath" -ForegroundColor Cyan
    Write-Host ""

    if ($DryRunFlag) {
        Write-Host '[dry-run] Move-Item would execute.'
        return
    }

    Move-Item -Path $incomingPath -Destination $appsPath

    $resolved = Resolve-ByFolder -RootPath $RootPath -Name $Name
    if ($resolved) {
        Ensure-RegistryEntry -RootPath $RootPath -RegistryApps $RegistryApps -ResolvedApp $resolved
    }

    Write-Host "Promotion completed for $Name" -ForegroundColor Green
}

function Register-PlatformProject {
    param(
        [string]$RootPath,
        [object[]]$RegistryApps,
        [string]$Name,
        [string]$ProjectSlug,
        [string]$ProjectAdminPath,
        [string]$ProjectSidebarLabel,
        [string]$ProjectPublicUrl,
        [string]$ProjectCategory,
        [string]$ProjectStatus,
        [switch]$ProjectShowInSidebar,
        [switch]$ProjectShowInQuickAccess,
        [int]$ProjectSortOrder,
        [string]$ApiUrl,
        [string]$Token,
        [switch]$DryRunFlag
    )

    $resolved = Resolve-App -RootPath $RootPath -RegistryApps $RegistryApps -Name $Name
    $derivedSlug = if ($ProjectSlug) { $ProjectSlug } else { To-KebabCase -Value $Name }
    $derivedAdminPath = if ($ProjectAdminPath) { $ProjectAdminPath } else { '/' + $derivedSlug }
    $derivedSidebarLabel = if ($ProjectSidebarLabel) { $ProjectSidebarLabel } else { $resolved.Name }
    $relativePath = Get-RelativePathFromRoot -RootPath $RootPath -AbsolutePath $resolved.Path
    $effectiveToken = if ($Token) { $Token } else { $env:FELIX_ADMIN_TOKEN }

    $payload = [ordered]@{
        name                 = $resolved.Name
        slug                 = $derivedSlug
        app_path             = $relativePath
        public_url           = if ($ProjectPublicUrl) { $ProjectPublicUrl } else { $null }
        admin_path           = $derivedAdminPath
        sidebar_label        = $derivedSidebarLabel
        quick_access_label   = $derivedSidebarLabel
        category             = if ($ProjectCategory) { $ProjectCategory } else { $null }
        status               = $ProjectStatus
        show_in_sidebar      = [bool]$ProjectShowInSidebar
        show_in_quick_access = [bool]$ProjectShowInQuickAccess
        sort_order           = $ProjectSortOrder
    }

    Write-Host ""
    Write-Host "Register project" -ForegroundColor Cyan
    Write-Host "App: $($resolved.Name)" -ForegroundColor Cyan
    Write-Host "Slug: $derivedSlug" -ForegroundColor Cyan
    Write-Host "Admin path: $derivedAdminPath" -ForegroundColor Cyan
    Write-Host "API: $ApiUrl/api/platform/projects" -ForegroundColor Cyan
    Write-Host ""

    if ($DryRunFlag) {
        $payload | ConvertTo-Json -Depth 10
        return
    }

    if (-not $effectiveToken) {
        Fail 'Admin token is required. Pass -AdminToken or set FELIX_ADMIN_TOKEN in your shell.'
    }

    $headers = @{
        Authorization  = "Bearer $effectiveToken"
        'Content-Type' = 'application/json'
    }

    try {
        $body = $payload | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/platform/projects" -Headers $headers -Body $body
        Write-Host "Platform project created with id $($response.id)" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 409) {
                $projects = Invoke-RestMethod -Method Get -Uri "$ApiUrl/api/platform/projects?include_archived=true" -Headers $headers
                $existing = @($projects | Where-Object { $_.slug -eq $derivedSlug } | Select-Object -First 1)

                if (-not $existing) {
                    Fail "Project slug '$derivedSlug' already exists, but existing record could not be resolved for update."
                }

                $updated = Invoke-RestMethod -Method Patch -Uri "$ApiUrl/api/platform/projects/$($existing[0].id)" -Headers $headers -Body $body
                Write-Host "Platform project updated for slug '$derivedSlug' (id $($updated.id))" -ForegroundColor Green
                return
            }
        }

        throw
    }
}

function Get-DefaultCommand {
    param([string]$RequestedAction)

    switch ($RequestedAction) {
        'install' { return 'npm install' }
        'dev' { return 'npm run dev' }
        'build' { return 'npm run build' }
        'deploy' { return 'npx vercel deploy --prod --yes --scope felabayomis-projects' }
        'link' { return 'npx vercel link --yes --scope felabayomis-projects' }
        default { return $null }
    }
}

function Get-CommandForAction {
    param(
        [string]$RequestedAction,
        [object]$ResolvedApp
    )

    if ($RequestedAction -eq 'dev' -and $ResolvedApp.Entry -and $ResolvedApp.Entry.commands.run) {
        return $ResolvedApp.Entry.commands.run
    }

    if ($RequestedAction -eq 'build' -and $ResolvedApp.Entry -and $ResolvedApp.Entry.commands.build) {
        return $ResolvedApp.Entry.commands.build
    }

    if ($RequestedAction -eq 'deploy' -and $ResolvedApp.Entry -and $ResolvedApp.Entry.commands.deploy) {
        return $ResolvedApp.Entry.commands.deploy
    }

    return (Get-DefaultCommand -RequestedAction $RequestedAction)
}

function Show-AppList {
    param(
        [object[]]$RegistryApps,
        [string]$RootPath
    )

    if ($RegistryApps.Count -gt 0) {
        $rows = $RegistryApps | Sort-Object id | ForEach-Object {
            [PSCustomObject]@{
                app     = $_.id
                path    = $_.path
                domains = ($_.domains -join ', ')
            }
        }

        $rows | Format-Table -AutoSize
        return
    }

    $appsRoot = Join-Path $RootPath 'apps'
    Get-ChildItem -Path $appsRoot -Directory | ForEach-Object {
        $name = $_.Name
        $webPackage = Join-Path $_.FullName 'web\package.json'
        $rootPackage = Join-Path $_.FullName 'package.json'

        if (Test-Path $webPackage) {
            Write-Host "$name -> web app"
        }
        elseif (Test-Path $rootPackage) {
            Write-Host "$name -> root app"
        }
        else {
            Write-Host "$name -> no package.json found"
        }
    }
}

function Show-Domains {
    param(
        [object[]]$RegistryApps,
        [string]$Name,
        [string]$RootPath
    )

    if ($RegistryApps.Count -eq 0) {
        Write-Host 'No app registry found at scripts/app-registry.json'
        return
    }

    if ($Name) {
        $resolved = Resolve-FromRegistry -RegistryApps $RegistryApps -Name $Name -RootPath $RootPath
        if (-not $resolved) {
            Fail "No registry domain mapping found for '$Name'"
        }

        $rows = @($resolved.Domains | ForEach-Object {
                [PSCustomObject]@{
                    app    = $resolved.Id
                    domain = $_
                }
            })

        if ($rows.Count -eq 0) {
            Write-Host "No domains configured for $($resolved.Id)"
            return
        }

        $rows | Format-Table -AutoSize
        return
    }

    $allRows = foreach ($entry in $RegistryApps) {
        foreach ($domain in @($entry.domains)) {
            [PSCustomObject]@{
                app    = $entry.id
                domain = $domain
            }
        }
    }

    $allRows | Sort-Object domain | Format-Table -AutoSize
}

function Run-AppAction {
    param(
        [string]$RequestedAction,
        [object]$ResolvedApp,
        [switch]$DryRunFlag
    )

    if ($RequestedAction -eq 'clean') {
        Set-Location $ResolvedApp.Path
        if (Test-Path '.next') {
            if ($DryRunFlag) {
                Write-Host "[dry-run] remove $($ResolvedApp.Path)\\.next"
                return
            }

            Remove-Item -Recurse -Force '.next'
            Write-Host '.next removed' -ForegroundColor Green
        }
        else {
            Write-Host 'No .next folder found' -ForegroundColor Yellow
        }

        return
    }

    $command = Get-CommandForAction -RequestedAction $RequestedAction -ResolvedApp $ResolvedApp
    if (-not $command) {
        Fail "No command configured for action '$RequestedAction' on app '$($ResolvedApp.Id)'"
    }

    $normalizedPath = ($ResolvedApp.Path -replace '\\', '/').ToLowerInvariant()
    if ($normalizedPath -match '/incoming/_quarantine/') {
        Fail "Refusing to run '$RequestedAction' for quarantined project path: $($ResolvedApp.Path). Promote/move it into apps/ first."
    }

    Write-Host ""
    Write-Host "App: $($ResolvedApp.Name)" -ForegroundColor Cyan
    Write-Host "Resolved Id: $($ResolvedApp.Id)" -ForegroundColor Cyan
    Write-Host "Path: $($ResolvedApp.Path)" -ForegroundColor Cyan
    Write-Host "Source: $($ResolvedApp.Source)" -ForegroundColor Cyan
    Write-Host "Action: $RequestedAction" -ForegroundColor Cyan
    Write-Host "Command: $command" -ForegroundColor Cyan
    Write-Host ""

    if ($DryRunFlag) {
        return
    }

    Set-Location $ResolvedApp.Path
    Invoke-Expression $command

    if ($LASTEXITCODE -ne 0) {
        Fail "Command failed for '$($ResolvedApp.Id)': $command"
    }
}

$root = Get-RootPath
$registryApps = Get-RegistryApps -RootPath $root

switch ($Action) {
    'register' {
        Register-PlatformProject `
            -RootPath $root `
            -RegistryApps $registryApps `
            -Name $AppName `
            -ProjectSlug $Slug `
            -ProjectAdminPath $AdminPath `
            -ProjectSidebarLabel $SidebarLabel `
            -ProjectPublicUrl $PublicUrl `
            -ProjectCategory $Category `
            -ProjectStatus $Status `
            -ProjectShowInSidebar:$ShowInSidebar `
            -ProjectShowInQuickAccess:$ShowInQuickAccess `
            -ProjectSortOrder $SortOrder `
            -ApiUrl $ApiBaseUrl `
            -Token $AdminToken `
            -DryRunFlag:$DryRun
        break
    }
    'promote' {
        Promote-IncomingProject -RootPath $root -Name $AppName -RegistryApps $registryApps -DryRunFlag:$DryRun
        break
    }
    'list' {
        Show-AppList -RegistryApps $registryApps -RootPath $root
        break
    }
    'domains' {
        Show-Domains -RegistryApps $registryApps -Name $AppName -RootPath $root
        break
    }
    default {
        $resolvedApp = Resolve-App -RootPath $root -RegistryApps $registryApps -Name $AppName
        Run-AppAction -RequestedAction $Action -ResolvedApp $resolvedApp -DryRunFlag:$DryRun
    }
}
