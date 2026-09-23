#!/usr/bin/env bash
set -euo pipefail

container_id=$(docker run -d --rm -p 127.0.0.1::80 "$IMAGE_UNDER_TEST")
trap 'docker rm -f "$container_id" >/dev/null' EXIT
port=$(docker port "$container_id" 80/tcp | cut -d: -f2)
page=$(curl --fail --silent --show-error --retry 10 --retry-all-errors --retry-delay 1 --max-time 5 "http://127.0.0.1:${port}/")
printf '%s\n' "$page" | grep -F 'React container ready [runtime-check]'
curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:${port}/app.js" -o /tmp/react-fixture-app.js
test -s /tmp/react-fixture-app.js
