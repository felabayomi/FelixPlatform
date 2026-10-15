# Formatter security and Linux validation preparation

Local preparation only: do not publish, run Actions, deploy or modify production
without separate authorization. Shared Formatter remains disabled by default.

## Targeted dependency changes

Active service `admin-dashboard`: Multer is pinned to 2.4.0. Lockfile updates:
body-parser 2.2.2 -> 2.3.0, proxy-addr 2.0.7 -> 2.0.8, qs 6.15.0 -> 6.16.1.
Required descendants also change: type-is 2.0.1 -> 2.1.0, side-channel 1.1.0 ->
1.1.1, side-channel-list 1.0.0 -> 1.0.1, and two nested content-type 2.1.0 entries.
Multer's obsolete concat-stream dependency tree is removed. Express 5.2.1,
Mammoth 1.13.0 and unrelated existing package versions are preserved.

The active-service audit now reports only the three moderate package entries
Mammoth -> argparse -> sprintf-js, one underlying advisory. Formatter calls
Mammoth's library extraction API; argparse is imported by its CLI, which the server
does not execute. No patched sprintf-js release is available. No downgrade or
cross-major argparse override is applied. Do not run `npm audit fix --force`.
The preserved backend reference manifest/lockfile has not been security-updated;
it is not installed by the shared service or this workflow. Its separate audit
reports 13 affected-package entries (1 low, 7 moderate, 4 high, 1 critical), including
dependencies not present in the active build. Do not treat the reference entrypoint
as independently release-ready or install its lockfile for this shared release.

## Workflow restrictions

The temporary workflow triggers solely on pushes to
`fix/document-formatter-backend-integration` in `felabayomi/FelixPlatform`.
There is no main, PR, dispatch, schedule, environment, OIDC, deployment permission,
production-secret reference, deployment command, cache or uploaded artifact.
Actions are pinned to official v4 commit SHAs and checkout credentials are not
persisted. The repository is public; standard GitHub-hosted Ubuntu compute is
free under GitHub's current public-repository policy. No new runner or Render
service is provisioned. The workflow has not been started.

The reviewed source exporter excludes Git objects, environment files, records,
uploads and installed modules. The initial checkout is removed before npm scripts
run. Installation/audit require public registry network access, but receive a fresh
HOME and scrubbed environment, without production or deployment credentials.

Startup and tests subsequently run in a fresh Linux network namespace. Only
loopback is enabled; execution drops to the runner UID/GID, removes capabilities
and disallows gaining privileges. There is no fallback if namespace setup fails.
Verification checks interfaces, IPv4 routes, UID, capabilities, NoNewPrivs and a
failed connection to the documentation-only address 198.51.100.1. Timeout or
connection refusal is not accepted as proof. Checks run before and after tests.

**Actual Linux isolation is not locally verified.** Shell syntax, workflow syntax,
metadata rejection cases and simulated network-probe outcomes can be tested on
Windows; these do not establish kernel enforcement on Ubuntu. The future workflow
must pass its runtime guards. This is not a general sandbox guarantee against
arbitrary malicious kernel/native code; install-time networking is intentional.

## Portable validation

`run-validation.cjs` requires Node 22, performs real `node server.js` startup with
the flag absent and enabled, and runs all suites sequentially. The startup preload
substitutes database/email/AI dependencies, refuses a real pg driver and disables
outbound fetch. Only synthetic credentials are used. Regression suites mock their
own database/email dependencies. No production records or credentials are used.

Local mode explicitly prints that Linux isolation is unverified. CI mode refuses
to proceed unless `FORMATTER_REQUIRE_NET_ISOLATION=1`; actual isolation checks
must then succeed. Use `export-snapshot.cjs` to create a fresh source-only temporary
candidate and run `npm install` in its admin-dashboard directory before validating.

Added parser tests cover file/field limits, extreme multipart indices, aborted
disk-upload cleanup, parser recovery, and malformed/oversized JSON. Strategy tests
check metadata guards, source exclusion and fail-closed network probes.

Release blockers remain Linux execution, actual Render sibling-module availability,
authorized recovery readiness, and subscription-product mapping for paid users.
Publishing this workflow would start Actions; committing/pushing/merging remains
unauthorized. A main-branch update can trigger the existing Render service.
