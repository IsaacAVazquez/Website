# Email delivery

I keep newsletter contact management and MBA digest sending on separate server credentials. The public newsletter form creates a contact in Resend, and the digest endpoint sends only when a caller supplies its secret and an approved recipient.

## Production settings

Set these in Netlify's production environment. Netlify's Free plan requires the default All scopes; limiting variables to Builds and Functions requires a paid plan. Isaac approved Production / All scopes on October 4, and the sender, digest secret, and exact recipient allowlist are saved and verified by readback. Changes take effect on a new deployment. Keep credential values out of source files, public environment variables, and browser code.

| Setting | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sending-only key for the MBA digest. |
| `RESEND_FROM_EMAIL` | Sender address on a domain verified in the same Resend account. Production uses `no-reply@isaacavazquez.com`. |
| `RESEND_CONTACTS_API_KEY` | Separate key with contact management access. Resend requires Full access for this operation. |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Optional segment for newsletter contacts. |
| `MBA_DIGEST_SECRET` | Random secret required in the `x-mba-digest-secret` request header. |
| `MBA_DIGEST_ALLOWED_RECIPIENTS` | Comma-separated approved addresses. The saved production configuration contains only the single approved test inbox. |

The newsletter route falls back to `RESEND_API_KEY` when the separate contact key is absent, for existing deployments. A sending-only key cannot create contacts. [Resend's API key documentation](https://resend.com/docs/dashboard/api-keys/introduction) describes the permissions.

The verified sender domain has an extra `a` after `isaac`. The website's `isaacvazquez.com` domain is a different domain and has not been verified for email in this account. [Netlify's scope documentation](https://docs.netlify.com/build/environment-variables/overview/) explains the plan restriction.

## Protected digest caller

The public tracker has no send button. Use a trusted local process or server caller with the digest secret. No recurring digest schedule is configured.

Prepare a private `digest.json` file containing a `to` address from the allowlist and a `jobs` array. Each job needs `companyName`, `title`, `location`, `department`, an HTTPS `applyUrl`, and a parseable `postedAt` date. The route accepts up to 25 valid jobs, rejects recipients outside the allowlist, and limits sending by request, caller IP, and day.

Load `MBA_DIGEST_SECRET` into the caller's environment from the secret store, then send the file with a server process such as this one. The secret stays in the request header and is never printed.

```sh
node --input-type=module <<'JS'
import { readFile } from 'node:fs/promises';
if (!process.env.MBA_DIGEST_SECRET) throw new Error('Load the digest secret first.');
const payload = JSON.parse(await readFile('digest.json', 'utf8'));
const response = await fetch('https://isaacvazquez.netlify.app/api/mba-jobs/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-mba-digest-secret': process.env.MBA_DIGEST_SECRET,
  },
  body: JSON.stringify(payload),
});
const result = await response.json();
console.log({ status: response.status, accepted: result.ok === true, id: result.id });
if (!response.ok) process.exitCode = 1;
JS
```

HTTP 200 and an email ID confirm that Resend accepted the message. Confirm delivery in Resend's email event history. HTTP 401 means the caller secret is wrong or absent, HTTP 403 means the recipient is outside the allowlist, and HTTP 503 means required delivery settings are absent or invalid.
