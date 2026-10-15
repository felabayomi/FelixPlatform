#!/usr/bin/env bash
set -euo pipefail
stage=arguments
trap 'status=$?; printf "FAIL isolation stage=%s exit=%s\n" "$stage" "$status" >&2' ERR
[[ "$#" -eq 5 ]]
stage=linux-root
[[ "$(uname -s)" == Linux && "$EUID" -eq 0 ]]
stage=required-tools
for tool in realpath unshare ip ls cut tr setpriv env bash; do command -v "$tool" >/dev/null 2>&1; done
stage=snapshot-path
snapshot="$(realpath "$1" 2>/dev/null)"
[[ -d "$snapshot" ]]
stage=node-path
node_bin="$(realpath "$2" 2>/dev/null)"
[[ -f "$node_bin" && -x "$node_bin" ]]
runner_uid="$3"
runner_gid="$4"
stage=home-path
home="$(realpath "$5" 2>/dev/null)"
[[ -d "$home" ]]
stage=runner-identity
[[ "$runner_uid" =~ ^[0-9]+$ && "$runner_uid" -ne 0 && "$runner_gid" =~ ^[0-9]+$ && "$runner_gid" -ne 0 ]]
# Fail closed: no fallback to unrestricted testing if namespaces are unavailable.
stage=namespace-or-child
unshare --net -- bash -euo pipefail -s -- "$snapshot" "$node_bin" "$runner_uid" "$runner_gid" "$home" <<'ISOLATED'
  stage=namespace-entered
  trap 'status=$?; printf "FAIL isolation stage=%s exit=%s\n" "$stage" "$status" >&2' ERR
  printf 'PASS isolation namespace entered\n'
  stage=loopback-up
  ip link set lo up >/dev/null 2>&1
  stage=namespace-interface-query
  links="$(ip -o link show | cut -d : -f 2 | tr -d " ")"
  stage=namespace-loopback-only
  test "$links" = lo
  printf 'PASS isolation namespace interfaces: loopback only\n'
  stage=sysfs-interface-query
  sysfs_links="$(ls /sys/class/net)"
  stage=sysfs-loopback-only
  test "$sysfs_links" = lo
  stage=default-route-query
  routes="$(ip route show default)"
  stage=no-default-route
  test -z "$routes"
  printf 'PASS isolation interface and route guards\n'
  stage=privilege-drop-or-validation
  setpriv --reuid="$3" --regid="$4" --clear-groups --bounding-set=-all --no-new-privs \
    env -i HOME="$5" PATH="$(dirname "$2"):/usr/bin:/bin" \
    CI=true NODE_OPTIONS=--max-old-space-size=256 \
    NODE_PATH="$1/admin-dashboard/node_modules" FORMATTER_REQUIRE_NET_ISOLATION=1 \
    "$2" "$1/scripts/formatter-ci/run-validation.cjs"
ISOLATED
