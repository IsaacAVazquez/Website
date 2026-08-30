# Fantasy draft companion

Status as of August 25, 2026.

I built the fantasy draft companion as a private Chrome and Edge side panel. It keeps the ranking board visible beside an ESPN or Underdog draft room, records picks manually, and carries the website's main draft decisions into a second web page. Redraft now includes the exact starting lineup, league specific replacement and scarcity, roster targets, and Draft Outlook. Best ball keeps its contest specific board, roster analysis, exact or reference recommendation mode, and Draft Outlook. The panel does not read, click, or submit anything on the provider page.

The panel lives in `extension/`, which holds the Vite config, `service-worker.ts`, `sidepanel.html`, and the React entry under `extension/src/`. The ranking, room, recommendation, replacement, roster, and Draft Outlook logic it shares with the website lives under `src/lib/`. `scripts/buildFantasyCompanionExtension.mjs` builds the extension.

## Build and load it

Run the build from the repository root.

```bash
npm install
npm run build:fantasy-companion
```

The build creates `extension/dist` and packages minified, complete copies of the PPR, Half PPR, Standard, and best ball snapshots with it. The packaged copies let the panel open when the published site and saved snapshot cache are unavailable.

In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select `extension/dist`. In Edge, use the same process at `edge://extensions`. Pin the extension if you want its button to stay in the toolbar, then open the companion from that button while the draft room is open.

Run the build again after changing the extension or its packaged rankings. Return to the browser's extensions page and reload the unpacked extension to use the new build.

## Set up and record a room

For redraft, choose PPR, Half PPR, or Standard scoring, then set the league size, rounds, order, draft slot, and starting lineup. The lineup has one QB, 1 through 3 RB, 1 through 4 WR, 1 or 2 TE, 0 through 3 FLEX, and 0 or 1 K and DST. The presets cover two receivers with a flex, three receivers with a flex, and three receivers with two flex spots but no K or DST. Every slot remains editable, and the panel will not start a room whose starting slots exceed its rounds.

For best ball, choose the contest card that matches the Underdog lobby. The contest fixes the scoring, teams, rounds, order, lineup, recommendation mode, and roster strategy. The user still chooses the draft slot.

Record every selection in draft order by finding the player and adding the pick to the team on the clock. The panel saves the room after every valid change, so closing and reopening it restores the draft on that browser profile. Undo removes the latest pick, and reset requires confirmation. A saved redraft room keeps its exact lineup along with its other settings.

The redraft board supports only the one QB settings documented in [the draft model contract](./FANTASY_DRAFT_MODEL.md). The best ball board keeps exact and reference contest modes separate. If the provider room uses an unsupported format, the companion remains useful as a dated ranking reference but does not present the unsupported room as an exact model.

## What matches the website

The redraft panel reads ECR before the expert mean rank, which matches the website's consensus order. Each player row shows ECR, the true position rank and tier from that position's board, bye week, and current ADP when it is valid. In 10-team, 12-team, and 14-team rooms, the row also shows FantasyPros' projected VORP for the selected scoring. VORP is projected season points above FantasyPros' same-position waiver replacement, and its roster baseline comes from that published report. The panel has no matching source report for 8-team or 16-team rooms, so those rows show the separate Index instead.

The Index is the same 0 to 100 ordinal replacement reading used by the website's `redraft-decision-v1` report. The Board tab uses that report for custom lineup replacement lines, the cost of waiting until the following user pick, roster need, and the Most at risk position. The starting lineup, league size, and rounds set the Index and roster lines but do not change the published VORP baseline. Current ADP only estimates which players may remain for the next turn. The wait reading disappears between the user's turns because the intervening selections are not known yet.

The roster view uses the same lineup derived redraft targets or adaptive best ball targets as the website. It shows the drafted count, preferred finish, open spots, viable best ball range, and the strategy reasons that change the best ball target.

Draft Outlook uses the shared room relative model on both surfaces. Redraft grades market price, roster shape, starting lineup coverage, and bye lineup coverage. Best ball grades the contest's market, roster, correlation, and bye components. The panel shows the composite, input confidence, component detail, and room rank after the minimum four picks. This is an ordinal draft process score. It does not estimate fantasy points, season wins, win probability, or payout value.

Best ball exact player scores appear only for contests with a matching current market source and only while the user's pick is live. Between turns the panel returns to the sourced ranking order. Reference contests keep the appropriate standard or Superflex board and roster help without showing an exact player score, and they remove ADP from a different room or slate. The calculations, weights, supported formats, and limits are defined in [the draft model contract](./FANTASY_DRAFT_MODEL.md).

## Snapshot fallback and source gates

The panel tries the published snapshot first, then the last validated saved copy, then the copy bundled with the extension. It labels the active copy as Published, Saved copy, or Bundled copy and shows separate Rank and Market dates. The saved snapshot cache is version 2, so older cache records without the typed redraft or best ball source contract are ignored.

Redraft snapshots retain separate dates for the scoring specific ranking source, VORP, and ADP, along with the position slices and tiers. VORP has separate 10-team, 12-team, and 14-team ranks and values for each scoring format. A stale ranking can stay visible as a dated board, but replacement, scarcity, recommendations, and Draft Outlook pause until the ranking source is usable. Missing or stale current season ADP is removed from the model input. The consensus board and rank based help remain, while cost of waiting becomes unmeasurable and any model component with a documented consensus fallback uses that fallback.

Best ball snapshots retain separate dates and provenance for the standard ranking, Superflex ranking, Underdog ADP, and Week 17 schedule. The selected contest decides which of those sources it needs. A missing or incomplete Week 17 map does not invalidate the player board. The dated board and roster help that does not use the schedule remain available, while schedule dependent exact guidance and Draft Outlook pause. A reference contest does not gain exact player scores merely because another contest's ADP is present.

This gating is deliberate. Missing evidence is reported as unavailable or paused, never as a zero cost, a neutral market, or false precision.

## Privacy and pick sync

Draft state and settings stay in the browser's local extension storage. The companion has no account, cloud sync, analytics, or remote draft upload. Clearing the extension's site data or removing the extension also removes its saved rooms.

Provider pick auto sync is intentionally disabled. ESPN and Underdog do not provide a supported public live draft interface for this companion, and their terms restrict automated monitoring and unauthorized scripts. The extension therefore has no content script that reads either draft room and no permission to control those pages. Side loading the extension does not change those restrictions.

I would add pick auto sync only through a documented provider integration or written permission. That version would remain read only, stop whenever a player match is uncertain, and leave every actual draft selection to the user.
