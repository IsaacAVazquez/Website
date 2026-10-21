# Email delivery

The public newsletter form creates a contact in Resend through `/api/newsletter/subscribe`. The email digest route that used to live beside it was deleted on 2026-10-19 because nothing called it; it is in git history if a digest ever comes back.

## Production settings

Set these in Netlify's production environment. Netlify's Free plan requires the default All scopes; limiting variables to Builds and Functions requires a paid plan. Changes take effect on a new deployment. Keep credential values out of source files, public environment variables, and browser code.

| Setting | Purpose |
| --- | --- |
| `RESEND_CONTACTS_API_KEY` | Key with contact management access. Resend requires Full access for this operation. |
| `RESEND_API_KEY` | Fallback the newsletter route reads when the contacts key is absent, for existing deployments. A sending-only key cannot create contacts. |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Optional segment for newsletter contacts. |

[Resend's API key documentation](https://resend.com/docs/dashboard/api-keys/introduction) describes the permissions, and [Netlify's scope documentation](https://docs.netlify.com/build/environment-variables/overview/) explains the plan restriction.
