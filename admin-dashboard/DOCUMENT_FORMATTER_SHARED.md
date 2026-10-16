# Shared-service Formatter integration: local release candidate

Nothing in this document authorizes publishing, deployment or production changes.
The dedicated `backend/documentFormatterServer.js` and its tests are preserved.

## Verified configuration and publication risk

Owner-confirmed Render configuration:

- Service: `felix-platform-backend`, ID `srv-d787uppr0fns738hc260`
- Repository: `felabayomi/FelixPlatform`, branch `main`
- Root: `admin-dashboard`; build: `npm install`; start: `node server.js`
- Auto-deploy: On Commit; no included/ignored build filters
- Baseline deploy: `dep-d97fje74lpts73f5qgu0`
- Baseline source: `21947965323c1a8f6e54f832c124ec9ee4441115`
- No dashboard artifact rollback available

The GitHub connector successfully retrieved that full source commit on
2026-10-15. Canonical reference:
https://github.com/felabayomi/FelixPlatform/commit/21947965323c1a8f6e54f832c124ec9ee4441115

Changes include files inside `admin-dashboard`. Treat a push/merge to `main` as a
production deployment trigger. Do not rely on a skip message as the sole control.
No root, build, start, build-filter or existing CORS setting changes are required.
Do not synchronize `backend/render.yaml`, which specifies different settings.

## Runtime behavior

The reserved `/document-formatter` namespace is mounted before legacy CORS and
parsers, preventing both preflight interception and policy leakage. Only the exact
origin `https://formatter.felixplatforms.com` is browser-authorized there. Existing
origins, credential behavior and route handlers remain unchanged elsewhere.

`DOCUMENT_FORMATTER_ENABLED` must equal the literal string `true`; otherwise every
request in that namespace returns 404, and Formatter modules are not imported.
When enabled, missing, padded, short, or legacy-equal signing keys return 503 on
actual Formatter requests. CORS preflights can succeed without authentication.
Load failures are contained to the namespace. Dependency/build failures can still
affect the whole service and cannot be prevented by a request feature flag.

Provision `DOCUMENT_FORMATTER_JWT_SECRET` privately with at least 32 random bytes.
Do not change `SECRET_KEY` or reuse its value. Length validation cannot prove entropy.
Formatter tokens use HS256, issuer `felixplatform:document-formatter`, and audience
`document-formatter`; verification requires all three. No legacy/fallback/demo
tokens are accepted. Shared default login/verifier exports retain their old key,
claims, lifetime and verification behavior. No environment variable is rewritten
while processing requests. Existing insecure legacy fallback behavior is not fixed
by this isolated integration and requires a separately coordinated migration.

Endpoints are `/document-formatter/auth/login`, `/auth/me` under that same base,
and the existing `/api/health`, `/api/admin/overview`, `/api/request-access`, and
`/api/format/{txt,docx,pdf,extract}` under that base. Root `/api/health` is unchanged.
Registration, resets, billing and unrelated routers are not mounted here.

The pilot is admin/superadmin only. Non-admin accounts can authenticate but receive
no Formatter entitlement, including users with other active subscriptions. Paid
user access remains blocked pending authoritative subscription/product mapping.
No product ID was guessed. Users/subscriptions are read only. Formatter requests
skip table creation, including multipart flows; normal formatter metadata inserts
and access-request email delivery occur only when those endpoints are invoked.

Future frontend configuration: set `VITE_API_URL` to
`https://felix-platform-backend.onrender.com/document-formatter`, rebuild only the
Formatter frontend, remove/update its old default, and require a new Formatter
login. This has not been done.

## Release gates and order (future authorization required)

1. Review the complete diff and restricted pilot scope.
2. Validate clean installation and both test suites on Linux with the production
   Node version; verify sibling backend files exist in the actual Render layout.
3. Test synthetic accounts/data/email and browser flows in an equivalent isolated
   preproduction environment. Health does not prove database/email readiness.
4. Confirm recovery API access and release coordination without triggering a deploy.
5. Obtain explicit publication/deployment approval. Account for On Commit before
   any push or merge. Release the code with Formatter disabled and verify existing
   applications before separately authorizing secret provisioning and activation.
6. Keep existing production settings and legacy secrets unchanged. Enable only the
   Formatter flag and private key in a separately approved activation procedure.
7. Monitor shared CPU/memory, database latency and email errors; enforce operational
   concurrency/upload limits before broad use. Confirm entitlement before paid use.

## Source-based recovery (not artifact rollback)

If only Formatter functionality fails, a separately authorized flag-off redeploy
can remove its traffic. It cannot repair installation/startup regressions.

For a shared-service regression:

1. Freeze pushes/merges to `main` and coordinate queued deploys. API recovery does
   not disable auto-deploy; a later push could replace the recovery deployment.
2. Rebuild/deploy the recorded baseline source using current unchanged service
   settings. This needs no rollback button, Git reset, force-push, or new commit.
3. Wait for that exact SHA to become live; check `/`, `/api/health`, Campaign Signal
   aliases, Election Predictor and Expedition America against baseline behavior.
4. Preserve database records and legacy key configuration. The baseline ignores
   Formatter-only variables. Do not run migrations or remove formatter tables.
5. Restore the previous frontend or maintenance state if it was switched; Formatter
   will not work on the old source. Investigate before lifting the release freeze.

The following command is executable ONLY AFTER EXPLICIT RECOVERY AUTHORIZATION.
Run from a trusted local Node 24 shell, not as part of tests. Supply an authorized
`RENDER_API_KEY` through a private environment mechanism; never paste its value into
source, chat or a command argument. It requests a real production rebuild/deploy.
It has NOT been executed or production-tested.

```sh
node -e '(async()=>{const key=process.env.RENDER_API_KEY;if(!key)throw new Error("missing credential");const response=await fetch("https://api.render.com/v1/services/srv-d787uppr0fns738hc260/deploys",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({commitId:"21947965323c1a8f6e54f832c124ec9ee4441115"})});if(!response.ok){console.error("Recovery rejected: HTTP "+response.status);process.exitCode=1;return;}console.log("Recovery requested; verify exact SHA and final status in Render.");})().catch(()=>{console.error("Recovery failed; details suppressed.");process.exitCode=1;})'
```

API reference: https://api-docs.render.com/reference/create-deploy
Deployment behavior: https://render.com/docs/deploys

Rebuilding old source is slower and less certain than using a retained artifact:
registry availability, runtime changes and environment compatibility remain risks.
Baseline source availability is verified; successful recovery execution is not.
