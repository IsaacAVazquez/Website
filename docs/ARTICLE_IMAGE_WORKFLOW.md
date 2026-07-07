# Article cover images

Every post under `content/blog` gets a cover image that shows up in the hero on
`/writing/<slug>` and on the listing cards. Historically most posts fell back to
`/writing/<slug>/opengraph-image`, an auto-generated typographic card, and only
the World Cup contender posts carried a real photo. This system replaces that
placeholder with a real, license-safe photo wherever a post has a genuine
subject to picture, and keeps the editorial card on purpose where it does not.

The plan for all of this lives in one file, `scripts/data/articleCoverImages.ts`.
It lists every published slug exactly once so nothing is silently skipped, and it
assigns each one a strategy. A `wikimedia` entry carries a search phrase and alt
text, and the builder fetches a freely licensed photo for it. An `editorial-card`
entry records why a post keeps the generated card, which is the right call for the
abstract AI, PM-workflow, QA, and fintech-product pieces where the only available
stock photo would be generic filler that reads worse than the clean card. A
`manual` entry is a post whose photo is curated by hand in frontmatter, which is
how the World Cup team photos are managed, and the builder leaves those alone.

## How the builder works

`npm run update:article-images` reads the plan and, for each `wikimedia` entry
that does not already have a saved cover, searches Wikimedia Commons with the
entry's query, picks the top result that is landscape, large enough for the
1200x630 hero, and published under a license that clearly permits reuse (Creative
Commons or public domain, never anything it cannot positively identify as free).
It saves a scaled copy under `public/images/writing/covers/<slug>.<ext>` and
writes four frontmatter fields onto the post: `coverImage`, `coverImageAlt`,
`coverImageCredit`, and `coverImageCreditUrl`. The credit and license come
straight from the Commons API at fetch time, so attribution always matches the
file that actually landed rather than anything guessed in advance.

The run is fail-soft. If a search finds nothing usable or a download fails, that
one post is logged and skipped and keeps whatever cover it already had, so a
single unreachable image never blocks the others. Posts that already have a saved
cover are skipped unless you pass `--force`, which makes the whole thing safe to
re-run.

One important constraint: the agent sandbox blocks outbound requests to image
hosts, so the fetch cannot run there and will report every `wikimedia` entry as
failed. The builder is meant to run where the network is open, which is the
`Refresh Article Cover Images` GitHub Action or a local machine. The Action runs
weekly to backfill covers for new articles and can be dispatched by hand to
backfill everything, target a slug, or force a re-fetch.

| Command | What it does |
| --- | --- |
| `npm run update:article-images` | Fetch every `wikimedia` cover that is still missing |
| `npm run update:article-images -- --only=<slug>` | Fetch just one post's cover |
| `npm run update:article-images -- --force` | Re-fetch even posts that already have a cover |
| `npm run update:article-images -- --dry-run` | Print the plan with no network calls and no writes |

## When you write a new article

Sourcing the cover is part of publishing a post, not an afterthought. When you
add a new file to `content/blog`, add a matching entry to
`scripts/data/articleCoverImages.ts` in the same change. If the post has a real
subject that a photo would serve, from a sport, to a rocket, to a city, to a
piece of hardware, give it a `wikimedia` entry with a broad, neutral query and
alt text that stays true for any reasonable top result. If the post is abstract
commentary with no natural subject, give it an `editorial-card` entry with a
short reason, which is a legitimate outcome and keeps the listing from filling up
with stock filler.

Then run `npm run update:article-images -- --only=<slug>` to pull the image and
write the frontmatter, and open the post at `/writing/<slug>` to confirm the
photo reads well and the credit line is right. If you are working in the agent
sandbox where the fetch is blocked, add the plan entry anyway and let the GitHub
Action pull the image on its next run, or run the builder on a machine with
network access. The builder warns whenever the plan and the blog directory have
drifted, so a post left out of the plan will not go unnoticed.

## Overriding a specific image

The automated search is a good default, not a mandate. If you want an exact
image, do what the World Cup posts do: drop the file into
`public/images/writing/covers/` (or another folder under `public/images/writing`)
and set `coverImage`, `coverImageAlt`, `coverImageCredit`, and
`coverImageCreditUrl` by hand, then mark the post `manual` in the plan so the
builder does not overwrite it. Keep the attribution honest and the license free,
since these render publicly with a visible credit line.
