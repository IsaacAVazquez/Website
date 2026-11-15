# Email delivery

The public newsletter form creates a contact in Resend through `/api/newsletter/subscribe`. The email digest route, `/api/mba-jobs/email`, was deleted in PR #629, merged on 2026-10-21, because nothing called it, and it is in git history if a digest ever comes back.

## Production settings

Set these in Netlify's production environment. Netlify's Free plan requires the default All scopes; limiting variables to Builds and Functions requires a paid plan. Changes take effect on a new deployment, and running `publish-data.yml` from the Actions tab makes one, because `scripts/ci/netlify-ignore.sh` cancels Netlify's own builds of `main`. Keep credential values out of source files, public environment variables, and browser code.

| Setting | Purpose |
| --- | --- |
| `RESEND_CONTACTS_API_KEY` | Key with contact management access. Resend requires Full access for this operation. |
| `RESEND_API_KEY` | Fallback the newsletter route reads when the contacts key is absent, for existing deployments. A sending-only key cannot create contacts. |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Optional segment for newsletter contacts. |

When neither key is set, or Resend answers 401 or 403 for the key, the route logs an error and answers HTTP 503 with a message that signup is down, so a missing or rejected key shows up in the function logs. A 409 from Resend, which the route treats as a repeated signup, counts as success, and any other Resend error, or a request that never reaches Resend, answers HTTP 502 and asks the visitor to try again. The route also allows five attempts per client IP an hour and answers HTTP 429 after that.

[Resend's API key documentation](https://resend.com/docs/dashboard/api-keys/introduction) describes the permissions, and [Netlify's scope documentation](https://docs.netlify.com/build/environment-variables/overview/) explains the plan restriction.
