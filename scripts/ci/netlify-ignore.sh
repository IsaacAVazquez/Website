#!/usr/bin/env sh
# Netlify build ignore command. The exit codes are inverted from the usual
# convention: exit 0 cancels the Netlify build, and a non-zero exit lets it run.
#
# main is skipped because production no longer builds on Netlify. publish-data.yml
# builds in GitHub Actions, where a public repository gets free minutes, and
# uploads the result with `netlify deploy --no-build`, which does not draw on the
# account's 300 monthly build minutes. Letting Netlify also build main would
# duplicate every deploy and race the upload from Actions.
#
# dependabot branches are skipped because nobody opens their previews. Eighteen of
# the twenty-four builds in the thirty days before 2026-08-19 were dependency-bump
# previews, and they are what exhausted the quota on 2026-08-06.
#
# Human pull requests still get a deploy preview.

case "$BRANCH" in
  main|dependabot/*) exit 0 ;;
  *) exit 1 ;;
esac
