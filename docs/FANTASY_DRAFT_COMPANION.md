# Fantasy draft companion

Status as of September 1, 2026.

I built the fantasy draft companion as a private Chrome and Edge side panel. It keeps the ranking board visible beside an ESPN, Sleeper, or Underdog draft room, automatically records completed provider picks, and carries the website's main draft decisions into a second web page. Redraft includes the exact starting lineup, league specific replacement and scarcity, roster targets, and Draft Outlook. Best ball keeps its contest specific board, roster analysis, exact or reference recommendation mode, and Draft Outlook. ESPN and Sleeper redraft rooms can use the opt-in away controller while the computer stays online. Underdog away mode prepares contest specific rankings and position limits for Underdog's supported Autopilot flow.

The panel lives in `extension/`, which holds the Vite config, `service-worker.ts`, `sidepanel.html`, and the React entry under `extension/src/`. The ranking, room, recommendation, replacement, roster, and Draft Outlook logic it shares with the website lives under `src/lib/`. `scripts/buildFantasyCompanionExtension.mjs` builds the extension.

## Build and load it

Run the build from the repository root.

```bash
npm install
npm run build:fantasy-companion
```

The build creates `extension/dist` and packages minified, complete copies of the PPR, Half PPR, Standard, and best ball snapshots with it. The packaged copies let the panel open when the published site and saved snapshot cache are unavailable.

In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select `extension/dist`. In Edge, use the same process at `edge://extensions`. Pin the extension if you want its button to stay in the toolbar, then open the companion from that button while the draft room is open.

Chrome or Edge will show that the extension can read draft-room data on `fantasy.espn.com`, `sleeper.com`, and `app.underdogsports.com`. Sleeper sync also reads its public API at `api.sleeper.app`, and ESPN sync reads the league's draft detail from ESPN's own read API at `lm-api-reads.fantasy.espn.com` using the browser's existing ESPN sign-in, which is the same request the draft room page makes for itself. ESPN and Sleeper use the same provider permission for the separately armed away controller. Underdog page access is read only, and its Autopilot remains the provider's own control.

Run the build again after changing the extension or its packaged rankings. Return to the browser's extensions page and reload the unpacked extension to use the new build.

## Set up and record a room

For ESPN or Sleeper redraft, choose PPR, Half PPR, or Standard scoring, then set the league size, rounds, order, draft slot, and starting lineup. The lineup has one QB, 1 through 3 RB, 1 through 4 WR, 1 or 2 TE, 0 through 3 FLEX, and 0 or 1 K and DST. The presets cover two receivers with a flex, three receivers with a flex, and three receivers with two flex spots but no K or DST. Every slot remains editable, and the panel will not start a room whose starting slots exceed its rounds.

For best ball, choose the contest card that matches the Underdog lobby. The contest fixes the scoring, teams, rounds, order, lineup, recommendation mode, and roster strategy. The user still chooses the draft slot.

Keep the matching provider draft room open in the active tab when the companion starts. The Auto sync status changes to Auto synced after the provider log and companion agree. New completed picks are matched by name, position, and team, then appended in provider order. Sleeper reads the documented read-only [draft picks endpoint](https://docs.sleeper.com/#get-all-picks-in-a-draft). ESPN polls the league draft detail and player list through ESPN's read API every few seconds while a `/football/draft` tab with a `leagueId` is open, so the tab has to be signed in to ESPN. Underdog reads the completed cells visible in the open draft room. Because ESPN and Sleeper return the whole log, the panel fills in every earlier pick when you open it late or refresh either tab, while Underdog can only fill what is still on screen. ESPN keeper slots that are filled ahead of the draft are held back until every earlier pick is in, so a keeper league does not pause on the gap.

The sync path requires a complete sequence from pick one and exactly one matching player for every new pick. Underdog abbreviates player names, so the matcher uses position, team, and a conservative ADP tiebreaker when one candidate is clearly near the observed draft slot. It never removes a companion pick automatically. If the provider is behind, contains a gap, still has an ambiguous player, or disagrees with a manually recorded pick, sync pauses and shows the reason. Correct the manual pick with Undo or reload the provider room after its board finishes updating. Manual recording remains available when a provider changes its draft page.

The panel saves the room after every valid change, so closing and reopening it restores the draft on that browser profile. Undo removes the latest pick, and reset requires confirmation. A saved redraft room keeps its exact lineup along with its other settings.

## Prepare an away draft

Choose the provider on the setup screen, enter the real room settings, and select Prepare away draft. ESPN and Sleeper build a queue long enough to cover every pick in the room, with the scoring specific consensus rank as its order. Keep the provider draft room as the active tab when you select Dry test or Arm live. The command is sent only to that tab.

I would run one mock draft on each provider before the real draft. Dry test waits until the page explicitly says it is your turn, checks the visible player rows against the ranked queue, and searches up to 60 names when no visible row is a confident match. It reports the player it would draft without submitting a pick. Live mode follows the same path after a 2.5 second safety delay. It submits one player, then waits until the page stops saying it is your turn before it can act again. If the page text, player match, or draft control is ambiguous, the controller stops for that turn. A match needs the player name, team, and position in one row with exactly one enabled draft button, so a pick log entry or a second row for the same name stops the turn instead of clicking. Live mode also applies the position maximums from the ESPN strategy settings and holds DST and K for their final rounds, reading the round from the page header. It only counts the picks it submitted itself, so caps are loose on a room where you drafted by hand before arming.

Set up the provider's own autopick before arming live mode. ESPN uses saved rankings when a manager times out in a live draft, and its web Draft Strategy page also supports position minimums, maximums, and round rules. The away page calculates those settings and keeps DST and K in the final rounds when the league uses them. Sleeper uses the room's queue when the timer expires, and the commissioner can force CPU auto pick instead of waiting for the full timer. The official instructions are [ESPN's draft strategy guide](https://support.espn.com/hc/en-us/articles/360046492471-Updating-Your-Draft-Rankings-and-Strategy), [Sleeper's queue guide](https://support.sleeper.com/en/articles/3989685-watch-list-vs-draft-queue), and [Sleeper's CPU auto pick guide](https://support.sleeper.com/en/articles/4038850-where-does-the-cpu-auto-pick-from).

For Underdog, select the contest and Prepare away draft. The extension sorts the best ball snapshot for that contest, limits the list to the number of picks in the room, and copies one player name per line for Underdog's Rankings import field. It also shows the model's starting roster targets as position maximums. On Underdog, open Rankings, select the matching NFL slate, open CSV upload/download, paste the copied names, and save. Open Limits and save the maximums, then clear any room queue you do not want and turn on Autopilot in each draft room. Underdog says Autopilot takes the highest remaining player from the queue first, then personal rankings, then default ADP, while respecting custom position limits. The official instructions are [Underdog's rankings and Autopilot guide](https://help.underdogsports.com/en/articles/9180011-draft-rankings-and-autopilot), [auto pick priority](https://help.underdogsports.com/en/articles/10982124-auto-pick-priority-order), and [position limits](https://help.underdogsports.com/en/articles/10952267-draft-position-limits).

Leave the draft tab open, keep the computer plugged in, disable sleep for the draft window, and confirm the internet connection is stable. Reloading or closing the draft tab disarms the controller, which is intentional. The extension never stores a provider password, cookie, or session token.

The redraft board supports only the one QB settings documented in [the draft model contract](./FANTASY_DRAFT_MODEL.md). The best ball board keeps exact and reference contest modes separate. If the provider room uses an unsupported format, the companion remains useful as a dated ranking reference but does not present the unsupported room as an exact model.

## What matches the website

The redraft panel reads ECR before the expert mean rank, which matches the website's consensus order. Each player row shows ECR, the true position rank and tier from that position's board, bye week, and current ADP when it is valid. In 10-team, 12-team, and 14-team rooms, the row also shows FantasyPros' projected VORP for the selected scoring. VORP is projected season points above FantasyPros' same-position waiver replacement, and its roster baseline comes from that published report. The panel has no matching source report for 8-team or 16-team rooms, so those rows show the separate Index instead.

The Index is the same 0 to 100 ordinal replacement reading used by the website's `redraft-decision-v1` report. The Board tab uses that report for custom lineup replacement lines, the cost of waiting until the following user pick, roster need, and the Most at risk position. The starting lineup, league size, and rounds set the Index and roster lines but do not change the published VORP baseline. Current ADP only estimates which players may remain for the next turn. The wait reading disappears between the user's turns because the intervening selections are not known yet.

The roster view uses the same lineup derived redraft targets or adaptive best ball targets as the website. It shows the drafted count, preferred finish, open spots, viable best ball range, and the strategy reasons that change the best ball target.

Draft Outlook uses the shared room relative model on both surfaces. Redraft grades market price, roster shape, starting lineup coverage, and bye lineup coverage. Best ball grades the contest's market, roster, correlation, and bye components. The panel shows the composite, input confidence, component detail, and room rank after the minimum four picks. This is an ordinal draft process score. It does not estimate fantasy points, season wins, win probability, or payout value.

Best ball exact player scores appear only for contests with a matching current market source and only while the user's pick is live. Between turns the panel returns to the sourced ranking order. Reference contests keep the appropriate standard or Superflex board and roster help without showing an exact player score, and they remove ADP from a different room or slate. The calculations, weights, supported formats, and limits are defined in [the draft model contract](./FANTASY_DRAFT_MODEL.md).

## Snapshot fallback and source gates

The panel tries the published snapshot first, then the last validated saved copy, then the copy bundled with the extension. It labels the active copy as Published, Saved copy, or Bundled copy and shows separate Rank and Market dates. The saved snapshot cache is version 2, so older cache records without the typed redraft or best ball source contract are ignored.

Redraft snapshots retain separate dates for the scoring specific ranking source, VORP, and ADP, along with the position slices and tiers. VORP has separate 10-team, 12-team, and 14-team ranks and values for each scoring format. A stale ranking can stay visible as a dated board, but replacement, scarcity, recommendations, and Draft Outlook pause until the ranking source is usable. Missing or stale current season ADP is removed from the model input. Stale VORP is also removed from the model input, so the wait reading falls back to consensus spots instead of publishing an old projected-points estimate. The consensus board and rank based help remain, while cost of waiting becomes unmeasurable and any model component with a documented consensus fallback uses that fallback.

Best ball snapshots retain separate dates and provenance for the standard ranking, Superflex ranking, Underdog ADP, and Week 17 schedule. The selected contest decides which of those sources it needs. A missing or incomplete Week 17 map does not invalidate the player board. The dated board and roster help that does not use the schedule remain available, while schedule dependent exact guidance and Draft Outlook pause. A reference contest does not gain exact player scores merely because another contest's ADP is present.

This gating is deliberate. Missing evidence is reported as unavailable or paused, never as a zero cost, a neutral market, or false precision.

## Privacy and page control

Draft state and settings stay in the browser's local extension storage. The companion has no account, cloud sync, analytics, or remote draft upload. Pick sync receives player names and draft order from the open room, and it does not read or store a provider password, cookie, or session token. Clearing the extension's site data or removing the extension also removes its saved rooms.

ESPN and Sleeper do not provide a supported public endpoint for submitting live fantasy draft picks. The controller works against their visible draft pages, which makes it more likely to break when either company changes its interface. Both companies also restrict automated access in their terms, including [Disney's terms for ESPN](https://disneytermsofuse.com/english/) and [Sleeper's terms](https://support.sleeper.com/en/articles/5486620-general-terms-of-use). This is a private, user-armed tool, but those restrictions still create account risk. The native provider autopick is the fallback for both reliability and account safety.
