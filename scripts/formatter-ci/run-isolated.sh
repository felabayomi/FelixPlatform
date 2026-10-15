#!/usr/bin/env bash
set -euo pipefail
[[ "$(uname -s)" == Linux && "$EUID" -eq 0 ]]
snapshot="$(realpath "$1")"
node_bin="$(realpath "$2")"
runner_uid="$3"
runner_gid="$4"
home="$(realpath "$5")"
[[ "$runner_uid" =~ ^[0-9]+$ && "$runner_uid" -ne 0 && "$runner_gid" =~ ^[0-9]+$ ]]
# Fail closed: no fallback to unrestricted testing if namespaces are unavailable.
exec unshare --net -- bash -euo pipefail -c '
  ip link set lo up
  test "$(ls /sys/class/net)" = lo
  test -z "$(ip route show default)"
  exec setpriv --reuid="$3" --regid="$4" --clear-groups --bounding-set=-all --no-new-privs \
    env -i HOME="$5" PATH="$(dirname "$2"):/usr/bin:/bin" \
    CI=true NODE_OPTIONS=--max-old-space-size=256 \
    NODE_PATH="$1/admin-dashboard/node_modules" FORMATTER_REQUIRE_NET_ISOLATION=1 \
    "$2" "$1/scripts/formatter-ci/run-validation.cjs"
' formatter-network "$snapshot" "$node_bin" "$runner_uid" "$runner_gid" "$home"
