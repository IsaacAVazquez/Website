# Project following workflows

I added these six workflows on October 25, 2026. Each one extends its existing route and design, and personal records stay in the visitor's browser.

| Project         | Accepted behavior                                                                                                                              | Evidence boundary                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Developer tools | Save named shortlists of up to four tools and compare working environment, model access, pricing, and team support against chosen requirements | Published facts have their own check dates. An unknown capability stays unknown. Prices are descriptions, with no invented usage total or recommendation score. |
| Startup tracker | Follow companies, save research notes, and keep dated funding rounds with source links                                                         | The public catalog stays curated. Additional rounds are entered by the visitor and identified as personal research.                                             |
| SpaceX          | Follow launches, compare their schedule and status with a saved observation, and download calendar events for precise future launch times      | The comparison covers observations saved in this browser. Uncertain, stale, or past launch times do not become calendar events.                                 |
| Golf            | Follow players and compare their published round scores in a pinned personal board                                                             | Missing rounds stay unknown, and an absent player remains followed.                                                                                             |
| Polling         | Follow races and compare dated candidate readings with a saved observation                                                                     | Candidate identity and election year must match before computing a change. Source dates and poll counts stay visible.                                           |
| Earthquakes     | Save named coordinates, radius, and magnitude filters and inspect nearby events                                                                | The results cover the events supplied by the current snapshot, with its date and fallback status. They are not a complete local event archive.                  |

## Saved records

| Records                                | Browser key                     | Bound                                                   |
| -------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| Named tool shortlists and requirements | `dev-tool-comparisons-v1`       | 20 lists with up to four tools each                     |
| Followed companies                     | `startup-followed-companies-v1` | 20 companies                                            |
| Company notes and sourced rounds       | `startup-company-research-v1`   | 20 companies, 4,000 note characters, and 30 rounds each |
| Followed launches                      | `spacex-followed-launches-v1`   | 20 launches                                             |
| Launch observations                    | `spacex-launch-readings-v1`     | Two source readings per launch, 80 total                |
| Followed golfers                       | `golf-followed-players-v1`      | 20 players                                              |
| Followed races                         | `polling-followed-races-v1`     | 20 races                                                |
| Race observations                      | `polling-race-readings-v1`      | Two source readings per race, 80 total                  |
| Saved coordinates and filters          | `earthquake-saved-places-v1`    | 20 places                                               |

Restored records pass through bounded validators. Edits read the latest saved records through `useBrowserRecord`, and that adapter now keeps its update function stable and skips unchanged writes. This lets the observation effects record a new source snapshot once without creating a write loop. A newer source reading cannot be replaced by an older one. Failed durable saves remain in memory and show a notice.

Company note saves preserve rounds added in another tab. A form opened before another tab deletes that research cannot recreate it. Removing a followed item keeps its research or observations, and an item missing from the source stays followed with an unavailable label.

## Comparison facts and limits

I read the providers' official pricing and documentation on October 25, 2026. The changed tool entries include Cursor's new plans, OpenAI's current plan and model wording, Cline's seat and inference distinction, Kilo's separate inference and compute charges, and GitHub's published credit allowances. The directory keeps the September 28 date on its star counts and releases. Its pricing date is separate, and its independent verification flag stays false.

The sources are the provider links beside each entry, including [Cursor pricing](https://cursor.com/pricing), [OpenAI pricing](https://learn.chatgpt.com/docs/pricing), [GitHub's plans](https://docs.github.com/en/copilot/get-started/plans), [Cline pricing](https://cline.bot/pricing), [Augment pricing](https://www.augmentcode.com/pricing), [Kilo pricing](https://kilo.ai/pricing), [Devin pricing](https://devin.ai/pricing), [JetBrains plans](https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html), and [Zed pricing](https://zed.dev/pricing). An explicit recorded capability can satisfy a requirement, and an unconfirmed one stays unknown. Published pricing is descriptive and is not a computed team bill.

Startup timelines combine the catalog's latest round with the visitor's own dated source links. No additional public funding facts are invented. The catalog keeps its own as-of date and unverified disclosure. An undisclosed amount stays separate from zero.

The launch tracker combines the cards and details loaded with the page. It labels that source snapshot and asks the visitor to reload for newer tracker data. Calendar export uses stable launch identifiers, UTC times, escaped text, and UTF-8 line folding. It omits uncertain, stale, past, and no-earlier-than times. The file is a download and does not subscribe to schedule changes.

Golf compares published round strokes and shows unreported rounds explicitly. A round in progress may be partial, so the board keeps the through and status fields beside the scores. Polling compares the same named pair within the same election year, including a reversal in who leads, and reports percentage-point changes in the current leader's margin. New poll identifiers can include source corrections.

Saved earthquake places use geographic coordinates and great-circle distance. The nearby list covers only the recent and significant events supplied to the dashboard. It keeps the feed timestamp and fallback label, and zero matches does not imply that no earthquakes occurred locally.

## Verification on October 25, 2026

The Node 22 full unit run passed 530 suites and 4,987 tests. The final comparison markup and styling were then checked with seven focused suites and 31 tests. Lint, standalone TypeScript, and the production build passed. A deliberate inversion of the launch calendar's uncertainty rule failed both launch regression tests, and the original implementation was restored.

Chromium passed 14 workflow and layout tests covering all six routes in light and dark mode. The populated layout checks covered 320, 768, 1024, and 1440 pixels, with one page heading, one main landmark, and no page-wide horizontal overflow. Saving and reloading passed for shortlists, research notes and source links, followed launches, players and races, and saved places. The comparison also supports keyboard checkbox selection, saving, and horizontal scrolling. Browser checks reported no application errors. The contrast sweep found no failures after the disabled controls were adjusted. Firefox and WebKit were not part of this pass.

The design detector reported seven advisories about the shared form's type sizes and corner radius against the outer site's design reference. Those controls follow the project routes' own compact form styling, which the project design rules allow. No required detector findings remained.
