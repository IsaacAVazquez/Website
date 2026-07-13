#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <surface> <expected-revision> <revision-endpoint> [build-hook]" >&2
  exit 2
fi

surface="$1"
expected_revision="$2"
revision_endpoint="$3"
build_hook="${4:-}"
poll_attempts="${DATA_REVISION_POLL_ATTEMPTS:-45}"
poll_interval="${DATA_REVISION_POLL_INTERVAL_SECONDS:-20}"
response_file="${RUNNER_TEMP:-/tmp}/data-revisions-${surface}.json"

read_served_revision() {
  if ! curl -fsS "${revision_endpoint}?cacheBust=$(date +%s%N)" -o "$response_file"; then
    return 0
  fi

  node -e '
    const fs = require("fs");
    const payload = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const entry = payload.entries?.find((item) => item.surface === process.argv[2]);
    process.stdout.write(entry?.revision ?? "");
  ' "$response_file" "$surface" 2>/dev/null || true
}

served_revision="$(read_served_revision)"
if [[ "$served_revision" == "$expected_revision" ]]; then
  echo "Production already serves $surface revision $expected_revision."
  exit 0
fi

# A missing hook or a transient hook failure must not fail the refresh job:
# the snapshot is already committed, and the next scheduled rebuild picks it up.
if [[ -z "$build_hook" ]]; then
  echo "::warning::Production serves ${served_revision:-no revision} for $surface, expected $expected_revision, but the build hook is not configured; skipping deploy trigger."
  exit 0
fi

if ! curl -fsS -X POST -d '{}' "$build_hook"; then
  echo "::warning::Build hook request failed for $surface; skipping revision verification. The next scheduled rebuild will pick up the snapshot."
  exit 0
fi
echo "Build hook triggered; waiting for $surface revision $expected_revision."

for attempt in $(seq 1 "$poll_attempts"); do
  sleep "$poll_interval"
  served_revision="$(read_served_revision)"
  if [[ "$served_revision" == "$expected_revision" ]]; then
    echo "Production serves the expected $surface revision."
    exit 0
  fi
  echo "Attempt $attempt/$poll_attempts: production serves ${served_revision:-no revision}."
done

echo "::error::Production did not serve $surface revision $expected_revision before the verification deadline."
exit 1
