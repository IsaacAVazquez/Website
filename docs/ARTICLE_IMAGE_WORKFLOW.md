# Article cover images

Every post under `content/blog` gets a cover image. Historically most posts fell
back to `/writing/<slug>/opengraph-image`, an auto-generated typographic card,
and only the World Cup contender posts carried a real photo. This system
replaces that placeholder with a license-safe photo, or a riso plate made for
the site, where a post has a genuine subject and a usable picture of it, and
keeps the editorial card on purpose where it does not.

As of 2026-11-02 a real cover, meaning a photo or one of the riso plates
described at the end, shows in two places. One is the hero on `/writing/<slug>`,
which prints the credit as its caption when the cover has one, and the other is
the featured pair at the top of `/writing`. The archive rows print no image.
The hero has rendered only a real cover since 2026-09-14, so a post on the
editorial card opens with no image, and in the featured pair it gets a flat
field instead. The generated card is still the link-preview image for every
post, photo or not, since the article page always sets
`/writing/<slug>/opengraph-image` as its Open Graph image. The structured data
follows the cover instead, since the post's `Article` schema and the item lists
on `/writing` and `/writing/topics/<topic>` carry each post's `coverImage`,
which is the real cover where there is one and the generated card where there is
not.

The plan for all of this lives in one file, `scripts/data/articleCoverImages.ts`.
It lists every published slug exactly once so nothing is silently skipped, and it
assigns each one a strategy. A `wikimedia` entry carries a Commons query that
names a file by its title, plus alt text, and the builder fetches a freely
licensed photo for it. An `editorial-card` entry records why a post keeps the
generated card, which is the right call for the abstract AI, PM-workflow, QA, and
fintech-product pieces and the product and process pieces about software, where
the only available stock photo would be generic filler that reads worse than the
clean card, and for the macro and markets commentary, which has no single
neutral subject to picture. The same strategy holds posts that have a subject
but no usable photo, from the ones whose fetched photo showed a different
subject and was dropped in the 2026-09-14 review (`COVER_WRONG_SUBJECT`), to
the ones with no Commons photograph pinned in
the 2026-09-27 review (`NO_PINNED_PHOTO`). It also holds the career write-ups
and the monthly company series, whose only real subject is a company's own
brand, and the season recaps whose frontmatter already points at the card. A
`manual` entry is a post whose cover is curated by hand in frontmatter, which is
how the World Cup team photos and the riso plates described at the end are
managed, and the builder leaves those alone.

## How the builder works

`npm run update:article-images` reads the plan and, for each `wikimedia` entry
that does not already have a saved cover, searches the File namespace of
Wikimedia Commons with the entry's query plus `filetype:bitmap`, which keeps
scanned books out of the results. From the first 20 results it keeps the JPEG,
PNG, and WebP files at least 800 pixels wide that are published under a license
that clearly permits reuse (Creative Commons or public domain, never anything it
cannot positively identify as free). It takes the first landscape one, which
suits the 1200 by 630 hero, or the first of them when none is landscape.
It saves a scaled copy under `public/images/writing/covers/<slug>.<ext>` and
writes four frontmatter fields onto the post: `coverImage`, `coverImageAlt`,
`coverImageCredit`, and `coverImageCreditUrl`. The credit and license come
straight from the Commons API at fetch time, so attribution always matches the
file that actually landed rather than anything guessed in advance. The alt text
is always the one written in the plan.

The run is fail-soft. If a search finds nothing usable or a download fails, that
one post is logged and skipped and keeps whatever cover it already had, so a
single unreachable image never blocks the others. Posts that already have a saved
cover are skipped unless you pass `--force`, which makes the whole thing safe to
re-run. The run still exits 1 when any planned cover failed, and its last line
gives the failed count. The GitHub Action described below commits whatever
covers landed and asks Netlify for a deploy through the `NETLIFY_BUILD_HOOK`
secret when that commit changed something and the secret is set. When a planned
cover failed, it then fails the run, which keeps a cover that never arrives
visible. Unlike every other `update-*.yml` workflow, `update-article-images.yml`
opens no GitHub issue when it fails.

The agent sandbox blocks outbound requests to image hosts, so the fetch cannot
run there and will report each `wikimedia` entry it tries to fetch as failed.
The builder is meant to run where the network is open, which is the
`Refresh Article Cover Images` GitHub Action or a local machine. The Action is
scheduled for every Monday at 06:40 UTC to backfill covers for new articles,
though GitHub started each scheduled run from 2026-07-13 to 2026-11-02 later
that day, between 07:37 and 16:30 UTC. It can also be dispatched by hand to
backfill everything, target one or more slugs, or force a re-fetch. Either way
it checks out `main` and pushes to `main`, so a dispatch from another branch
still works on `main`. Production has been built by the `Publish Refreshed Data`
workflow (`publish-data.yml`) on GitHub Actions since 2026-08-20, and
`scripts/ci/netlify-ignore.sh` cancels Netlify builds of `main`. The cover commit
carries `[skip ci]`, so it does not start that workflow on push, and new covers
go live with its next scheduled run, four of which are scheduled each day, or
sooner when another push reaches `main` or someone dispatches it by hand.

| Command | What it does |
| --- | --- |
| `npm run update:article-images` | Fetch every `wikimedia` cover that is still missing |
| `npm run update:article-images -- --only=<slug>` | Fetch just one post's cover, or several with comma-separated slugs |
| `npm run update:article-images -- --force` | Re-fetch even posts that already have a cover |
| `npm run update:article-images -- --dry-run` | Print the plan with no network calls and no writes |

## When you write a new article

Sourcing the cover is part of publishing a post, not an afterthought. When you
add a new file to `content/blog`, add a matching entry to
`scripts/data/articleCoverImages.ts` in the same change. If the post has a real
subject that a photo would serve, from a sport, to a rocket, to a city, to a
piece of hardware, find the photo on Wikimedia Commons and give the post a
`wikimedia` entry whose query pins that file with `intitle:"<file title>"`.
Write the alt text from what the photo shows, and keep it true for every file
the title matches, since one title can match more than one file. Every
`wikimedia` entry in the plan has pinned its file this way since the 2026-09-27
cover review, because a loose phrase matched scanned books. If the post is
abstract commentary with no natural subject, or no Commons photo fits it, give
it an `editorial-card` entry with a short reason, which is a legitimate outcome
and keeps stock filler off the post's hero and the featured pair on `/writing`.

Then run `npm run update:article-images -- --only=<slug>` to pull the image and
write the frontmatter, and open the post at `/writing/<slug>` to confirm the
photo reads well and the credit line is right. If you are working in the agent
sandbox where the fetch is blocked, add the plan entry anyway and let the GitHub
Action pull the image on its first run after the post reaches `main`, or run the
builder on a machine with network access. The builder prints a warning on every
run when a post has no plan entry or a plan entry has no post, but the warning
does not fail the run, so a post left out of the plan shows up only in the log.

A post on the card needs no `coverImage` in its frontmatter, since
`getBlogCoverImageUrl` in `src/lib/blog-config.ts` points a post without one at
`/writing/<slug>/opengraph-image`, and naming that path in frontmatter renders
the same way. Two checks in `src/lib/__tests__/blog-seo-content.test.ts` are the
exceptions. Every post whose file name contains `world-cup` has to set
`coverImage` itself. The contender posts have to point at the team photo the
test maps each one to, and every other World Cup post at either
`/images/writing/covers/<slug>.jpg` with a Wikimedia Commons credit and credit
URL or its own `/writing/<slug>/opengraph-image`. That means a World Cup post on
the card cannot leave the field out, and a riso plate, which carries no credit,
cannot go on one. The lead-generation posts listed in the test's
`LEAD_GEN_BLOG_SLUGS` have to keep `coverImage` set to their own
`/writing/<slug>/opengraph-image`, so moving one of them onto a photo or a plate
means editing that list in the same change.

## Overriding a specific image

The automated search is a good default, not a mandate. If you want an exact
image, do what the World Cup posts do: drop the file into
`public/images/writing/covers/` (or another folder under `public/images/writing`)
and set `coverImage`, `coverImageAlt`, `coverImageCredit`, and
`coverImageCreditUrl` by hand, then mark the post `manual` in the plan so the
builder does not overwrite it. Keep the attribution honest and the license free,
since these render publicly with a visible credit line.

## Riso plates

On 2026-09-24 twenty-eight posts moved onto riso plates made for the site, the
same two-ink halftone prints that run on Home and above each category on
`/dashboards`. Twenty-six of them had fetched photos before and two had the
editorial card. All twenty-eight live at the usual
`public/images/writing/covers/<slug>.jpg` path, carry alt text written from what
each plate shows, and have no `coverImageCredit`, since there is no third-party
photographer to credit, so the hero prints no caption under them. Each one is
marked `manual` with the `RISO_PLATE` note in the plan, which keeps the builder
from overwriting it. The prompts that made them are kept outside the repo.

As of 2026-11-02 the plan marks 29 posts with `RISO_PLATE`. The 29th,
`building-before-you-buy`, was published with its plate on 2026-10-09 in #580.
It reuses the Before You Buy project plate at
`public/images/home/retro-before-you-buy.jpg`, outside the usual `covers/`
folder, and that plate's prompt is recorded in `docs/PROJECT_PLATES.md`.
