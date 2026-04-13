param(
    [switch]$Deploy,
    [switch]$SkipBuild,
    [switch]$SkipBackendHealth,
    [string]$BackendHealthUrl = "https://felix-platform-backend.onrender.com/health"
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-CheckedCommand {
    param(
        [string]$Command,
        [string]$FailureMessage
    )

    Write-Host "-> $Command"
    Invoke-Expression $Command

    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

function Assert-BranchAndSync {
    Write-Step "Checking git state"

    $branch = (git branch --show-current).Trim()
    if ($branch -ne 'main') {
        throw "Release routine only runs from main. Current branch: $branch"
    }

    $trackedChanges = git status --porcelain --untracked-files=no
    if ($trackedChanges) {
        throw "Tracked changes detected. Commit or stash tracked changes before running release routine."
    }

    Invoke-CheckedCommand "git fetch origin main" "Unable to fetch origin/main"

    $localHead = (git rev-parse HEAD).Trim()
    $remoteHead = (git rev-parse origin/main).Trim()

    if ($localHead -ne $remoteHead) {
        throw "Local main is not synced to origin/main. Run git pull --ff-only first."
    }

    Write-Host "Git checks passed on commit $localHead" -ForegroundColor Green
}

function Run-BuildChecks {
    if ($SkipBuild) {
        Write-Step "Skipping build checks"
        return
    }

    Write-Step "Running build checks"
    Invoke-CheckedCommand "node --check backend/server.js" "Backend syntax check failed"
    Invoke-CheckedCommand "npm --prefix admin-dashboard/frontend run build" "Admin dashboard build failed"
    Invoke-CheckedCommand "npm --prefix apps/WACI/web run build" "WACI web build failed"
    Invoke-CheckedCommand "npm --prefix apps/Wildlife-Pedia/web run build" "Wildlife-Pedia web build failed"

    $dynamicMarker = 'export const dynamic = "force-dynamic"'
    $rgAvailable = $null -ne (Get-Command rg -ErrorAction SilentlyContinue)

    if ($rgAvailable) {
        $waciDynamic = rg --line-number --fixed-strings $dynamicMarker "apps/WACI/web/app/layout.tsx"
    } else {
        $waciDynamic = Select-String -Path "apps/WACI/web/app/layout.tsx" -SimpleMatch $dynamicMarker
    }
    if (-not $waciDynamic) {
        throw "WACI layout must stay dynamic for admin-save propagation."
    }

    if ($rgAvailable) {
        $wildlifeDynamic = rg --line-number --fixed-strings $dynamicMarker "apps/Wildlife-Pedia/web/app/layout.tsx"
    } else {
        $wildlifeDynamic = Select-String -Path "apps/Wildlife-Pedia/web/app/layout.tsx" -SimpleMatch $dynamicMarker
    }
    if (-not $wildlifeDynamic) {
        throw "Wildlife-Pedia layout must stay dynamic for admin-save propagation."
    }

    Write-Host "Build checks passed" -ForegroundColor Green
}

function Deploy-VercelProject {
    param(
        [string]$Directory,
        [string]$Label
    )

    Write-Step "Deploying $Label"

    Push-Location $Directory
    try {
        Invoke-CheckedCommand "npx vercel deploy --prod --yes" "$Label deploy failed"
    } finally {
        Pop-Location
    }
}

function Run-Deployments {
    if (-not $Deploy) {
        Write-Step "Deploy flag not set; skipping deploy phase"
        return
    }

    Write-Step "Deploying projects in strict order"
    Deploy-VercelProject -Directory "c:\FelixPlatform" -Label "felix-platform"
    Deploy-VercelProject -Directory "c:\FelixPlatform\admin-dashboard\frontend" -Label "admin-dashboard"
    Deploy-VercelProject -Directory "c:\FelixPlatform\apps\WACI\web" -Label "WACI web"
    Deploy-VercelProject -Directory "c:\FelixPlatform\apps\Wildlife-Pedia\web" -Label "Wildlife-Pedia web"
}

function Verify-LiveEndpoints {
    Write-Step "Running post-release live checks"

    if (-not $SkipBackendHealth) {
        $backend = Invoke-RestMethod -Uri $BackendHealthUrl -Method Get
        if ($backend.status -ne 'ok') {
            throw "Backend health check failed at $BackendHealthUrl"
        }
        Write-Host "Backend health check passed" -ForegroundColor Green
    }

    $mainResponse = Invoke-WebRequest -UseBasicParsing "https://www.felixplatforms.com"
    if ($mainResponse.StatusCode -ne 200) {
        throw "Main platform domain check failed"
    }

    $adminResponse = Invoke-WebRequest -UseBasicParsing "https://admin.felixplatforms.com"
    if ($adminResponse.StatusCode -ne 200) {
        throw "Admin domain check failed"
    }

    $waciResponse = Invoke-WebRequest -UseBasicParsing "https://www.wildlifeafrica.org"
    if ($waciResponse.StatusCode -ne 200) {
        throw "WACI domain check failed"
    }

    $wildlifeResponse = Invoke-WebRequest -UseBasicParsing "https://www.wildlife-pedia.com/about"
    if ($wildlifeResponse.StatusCode -ne 200) {
        throw "Wildlife-Pedia domain check failed"
    }

    Write-Host "Domain checks passed" -ForegroundColor Green
}

Write-Step "Felix Platform release routine started"
Assert-BranchAndSync
Run-BuildChecks
Run-Deployments
Verify-LiveEndpoints
Write-Host "`nRelease routine completed successfully." -ForegroundColor Green
