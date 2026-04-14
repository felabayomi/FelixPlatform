# Felix Platform Strict Deploy Routine

This routine makes releases repeatable from `main` and protects admin-save-to-frontend behavior.

## Non-negotiable rules

1. One platform, one backend, one database.
2. Release only from `main` and only when local `main` equals `origin/main`.
3. Never deploy with tracked local edits.
4. Keep admin-managed apps dynamic so save actions update public pages quickly.

## Admin-save propagation rule

Any app with content edited from `admin-dashboard` must:

1. Persist changes to the shared backend successfully.
2. Read that content dynamically on the public app (`force-dynamic` or equivalent no-cache strategy).
3. Pass post-release live checks.

Current enforced dynamic checks:

- `apps/WACI/web/app/layout.tsx`
- `apps/Wildlife-Pedia/web/app/layout.tsx`

## Release command

From repo root:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\release-main.ps1 -Deploy
```

## Unified centralized app command (all app deployments)

Use the registry-driven command from repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 list
```

Common examples:

```powershell
# list available apps from registry/folders
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 list

# run one app locally
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 dev admin-dashboard

# build one app
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 build waci-web

# deploy one app
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 deploy wildlife-pedia-web

# domain -> app mapping table
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 domains
```

Notes:

- `scripts/app-registry.json` is the deployment source of truth.
- `scripts/platform-control.ps1` can still be used if needed, but `scripts/app.ps1` is the canonical centralized command.

Incoming -> apps intake and registry examples:

```powershell
# move incoming/<AppName> into apps/<AppName>
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 promote CityTourHub

# create platform registry record (uses FELIX_ADMIN_TOKEN or -AdminToken)
powershell -ExecutionPolicy Bypass -File .\scripts\app.ps1 register CityTourHub `
   -AdminPath /city-tour-hub `
   -SidebarLabel "City Tour Hub" `
   -PublicUrl https://tours.citydiscoverer.guide `
   -Status launched `
   -ShowInSidebar `
   -ShowInQuickAccess
```

The source of truth is `scripts/app-registry.json`. Add new apps there once, then the command automatically knows how to run, build, deploy, and map domains.

## Centralized deployment routine for any app

1. Confirm app exists in `scripts/app-registry.json` (or register it).
2. Validate locally: `app.ps1 build <AppName>`.
3. Deploy with: `app.ps1 deploy <AppName>`.
4. Validate domain mapping with: `app.ps1 domains`.
5. Run live smoke checks for the deployed domain/API.

## What the routine does

1. Verifies branch is `main`.
2. Verifies no tracked local edits.
3. Verifies local `main` is synced to `origin/main`.
4. Runs build checks:
   - backend syntax
   - admin dashboard build
   - WACI web build
   - Wildlife-Pedia web build
5. Deploys in strict order:
   - `felix-platform`
   - `admin-dashboard`
   - `WACI web`
   - `Wildlife-Pedia web`
6. Runs live smoke checks:
   - backend health
   - main platform domain
   - admin domain
   - WACI domain
   - Wildlife-Pedia domain

## Useful flags

- `-Deploy` : runs production deployments after checks.
- `-SkipBuild` : skips local build stage.
- `-SkipBackendHealth` : skips Render health check.
- `-BackendHealthUrl <url>` : override backend health endpoint.

## Recommended release sequence

1. Merge to `main`.
2. Pull latest `main` locally.
3. Run the release command.
4. Confirm all checks pass.
5. Record release links in team notes.

## Latest deployment record (Expedition America)

- Date: 2026-04-13
- Commit: `c9ecf49`
- Change: Enforce one daily draft generation with Postgres advisory lock + existing draft/published check in `backend/controllers/expeditionAmericaController.js`.
- Deploy target: Render backend `felix-platform-backend` (`https://felix-platform-backend.onrender.com`).
- Deploy method: Push to `main` (`origin/main`) to trigger Render auto-deploy.
- Centralized command coverage: documented and standardized for all apps via `scripts/app.ps1` + `scripts/app-registry.json`.

### Validation run (production)

Endpoint tested:

- `POST /api/expedition-america/articles/generate-daily`

Result:

1. First call returned `all_complete` with `skipped: true` and message "Skipped generation: an article already exists for 2026-04-14."
2. Second call returned the same skip result.

Outcome:

- Duplicate generation prevented on live backend for the same target publish date.
