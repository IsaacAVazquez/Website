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

# Snapshot timestamps feed sitemap freshness metadata. Refresh workflows install
# dependencies before reaching this helper, so regenerate and stage the sitemap
# with the snapshot. Changelog-only workflows intentionally skip this branch.
sitemap_enabled=false
if [[ -f node_modules/gray-matter/package.json ]]; then
  sitemap_enabled=true
  node scripts/generatePublicSitemap.mjs
  git add -- "$@" public/sitemap.xml
else
  git add -- "$@"
fi

if git diff --cached --quiet; then
  echo "No staged snapshot changes detected."
  exit 0
fi

git commit -m "$commit_message"

# Retry on push rejection because several snapshot bots push to the same branch.
# The generated sitemap is a shared artifact, so concurrent refreshes can meet
# there even when their underlying snapshot files do not overlap. Regenerate it
# from the rebased snapshot inventory and auto-resolve only sitemap-only
# conflicts. Any overlapping data conflict still fails the run.
max_attempts="${SNAPSHOT_PUSH_ATTEMPTS:-8}"

for attempt in $(seq 1 "$max_attempts"); do
  if git push origin HEAD:main; then
    echo "Pushed on attempt $attempt."
    exit 0
  fi

  echo "Push attempt $attempt/$max_attempts rejected. Rebasing onto latest origin/main..."
  git fetch origin main

  if ! git rebase --autostash origin/main; then
    unmerged_files="$(git diff --name-only --diff-filter=U)"
    if [[ "$sitemap_enabled" == true && "$unmerged_files" == "public/sitemap.xml" ]]; then
      echo "Resolving the generated sitemap against the rebased snapshots."
      node scripts/generatePublicSitemap.mjs
      git add -- public/sitemap.xml
      if ! GIT_EDITOR=true git rebase --continue; then
        git rebase --abort || true
        echo "Rebase could not continue after regenerating the sitemap."
        exit 1
      fi
    else
      git rebase --abort || true
      echo "Rebase hit a genuine data conflict; failing the run."
      exit 1
    fi
  fi

  # A clean textual merge can still preserve an older generated value. Rebuild
  # and amend after every rebase so the commit reflects all snapshots now on
  # the branch, including a concurrent refresh that landed first.
  if [[ "$sitemap_enabled" == true ]]; then
    node scripts/generatePublicSitemap.mjs
    git add -- public/sitemap.xml
    if ! git diff --cached --quiet; then
      git commit --amend --no-edit
    fi
  fi

  if [[ "$attempt" -lt "$max_attempts" ]]; then
    backoff=$(( attempt * attempt * 2 ))
    if [[ "$backoff" -gt 30 ]]; then backoff=30; fi
    sleep $(( backoff + (RANDOM % 5) ))
  fi
done

echo "Push failed after $max_attempts attempts."
exit 1
