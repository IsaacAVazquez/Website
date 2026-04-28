# Security Policy

Thanks for taking the time to look at the security of this site. This repository powers [isaacavazquez.com](https://isaacavazquez.com) — a personal portfolio, writing surface, and a few standalone analytics tools. It is not a multi-tenant product, but the live site is publicly indexed and I take responsible disclosure seriously.

For day-to-day operational notes (secrets, admin gate, deployment hygiene), see [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Supported Versions

Only the `main` branch and the currently deployed Netlify production site are supported. Older branches, archived plans, and historical docs may describe behavior that no longer reflects the live system; please verify against `main` before reporting.

| Branch / surface | Supported |
|---|---|
| `main` (deployed to isaacavazquez.com) | Yes |
| Other branches, forks, archived docs | No |

---

## Reporting A Vulnerability

**Please do not open a public GitHub issue for security problems.** Public reports give attackers a head start while a fix is in progress.

Preferred reporting channels, in order:

1. **GitHub private vulnerability reporting** — open a private advisory at the repository's `Security` tab (`Report a vulnerability`). This is the fastest path and keeps history attached to the repo.
2. **Email** — `Isaac_Vazquez@yahoo.com` with subject prefix `[security]`. Encryption is not required, but please do not include exploit payloads in plaintext if you can avoid it.

Please include:

- a clear description of the issue and the impact you believe it has
- step-by-step reproduction (URL, request, expected vs. actual behavior)
- the affected commit SHA or deploy URL if you can identify it
- any logs, screenshots, or proof-of-concept code that helps verify the finding
- whether you would like to be credited and, if so, how to attribute you

### What to expect

- I will acknowledge receipt within **3 business days**.
- I will share an initial assessment (accepted / needs more info / not in scope) within **7 business days**.
- For accepted reports, I will work toward a fix and target disclosure within **30 days** for typical issues, or sooner for high-severity findings. If a fix needs longer, I will tell you why and stay in touch.
- Once a fix ships, I will (with your consent) credit you in the release notes or the repo's security advisory.

I cannot offer monetary bounties.

---

## Scope

In scope:

- the live deployment at `isaacavazquez.com` and `*.isaacavazquez.com`
- code in this repository's `main` branch
- API routes under `/api/*` and the Netlify functions in `netlify/functions/`
- the `/admin` authentication surface

Out of scope:

- third-party services this site reads from (Finnhub, football-data.org, Resend, FantasyPros public cheatsheets, SpaceX public APIs) — please report those upstream
- denial-of-service or volumetric attacks
- social engineering, phishing of the site owner, or physical attacks
- findings that depend on already-compromised end-user devices, browser extensions, or stolen credentials
- automated scanner output without a working proof-of-concept
- missing security headers or cookie flags with no demonstrated impact
- vulnerabilities in archived, historical, or clearly deprecated docs and code paths (e.g., references to `/api/scheduled-update`, `/api/data-manager`, `/api/fantasy-pros-*`, `/api/scrape` — those routes do not exist in the live app)

---

## Safe Harbor

I will not pursue legal action against researchers who:

- make a good-faith effort to follow this policy
- avoid privacy violations, data destruction, or service degradation
- do not access, modify, or exfiltrate data beyond what is needed to demonstrate the issue
- give me reasonable time to remediate before any public disclosure

If you are unsure whether a planned test is acceptable, ask first via the channels above.

---

## Hardening Notes For Contributors

If you are sending a pull request, please:

- never commit secrets, `.env*` files, or live API keys (use `.env.example` as the template)
- avoid introducing new authenticated surfaces without discussing the threat model first
- prefer well-maintained dependencies with active releases
- run `npm run lint`, `npm test`, and `npm run build` before opening a PR that touches auth, API routes, or `netlify.toml`
- review [`docs/SECURITY.md`](docs/SECURITY.md) for the operational guardrails

Thanks for helping keep the site safe.
