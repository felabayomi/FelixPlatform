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
