#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <commit-message> <pathspec> [pathspec ...]" >&2
  exit 2
fi

commit_message="$1"
shift

git config --local user.email "github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"

git add -- "$@"

if git diff --cached --quiet; then
  echo "No staged snapshot changes detected."
  exit 0
fi

git commit -m "$commit_message"

# Retry on push rejection — main moves constantly because several snapshot
# bots (earthquake hourly, world cup, transit, etc.) push to the same branch.
# A refresh commit only touches its own snapshot files, so a rebase here never
# truly conflicts; the failure mode is simply losing the race repeatedly. Retry
# persistently with capped exponential backoff plus jitter so the bots stop
# colliding on the same retry window. Bail only on a genuine conflict.
max_attempts="${SNAPSHOT_PUSH_ATTEMPTS:-8}"

for attempt in $(seq 1 "$max_attempts"); do
  if git push origin HEAD:main; then
    echo "Pushed on attempt $attempt."
    exit 0
  fi

  echo "Push attempt $attempt/$max_attempts rejected. Rebasing onto latest origin/main..."
  git fetch origin main

  if ! git rebase --autostash origin/main; then
    git rebase --abort || true
    echo "Rebase hit a genuine conflict — failing the run."
    exit 1
  fi

  if [[ "$attempt" -lt "$max_attempts" ]]; then
    backoff=$(( attempt * attempt * 2 ))
    if [[ "$backoff" -gt 30 ]]; then backoff=30; fi
    sleep $(( backoff + (RANDOM % 5) ))
  fi
done

echo "Push failed after $max_attempts attempts."
exit 1
