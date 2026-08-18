# Fantasy draft companion

Status as of August 12, 2026.

I built the fantasy draft companion as a private Chrome and Edge side panel. It keeps the ranking board visible beside an ESPN or Underdog draft room, records picks manually, and carries the existing redraft and best ball guidance into a second web page. It does not read, click, or submit anything on the provider page.

The panel itself lives in `extension/`, which holds the Vite config, `service-worker.ts`, `sidepanel.html`, and the React entry under `extension/src/`. The ranking, room, and recommendation logic it shares with the website lives in `src/lib/fantasyCompanion/`, and `scripts/buildFantasyCompanionExtension.mjs` is the build.

## Build and load it

Run the build from the repository root.

```bash
npm install
npm run build:fantasy-companion
```

The build creates `extension/dist` and packages compact copies of the PPR, Half PPR, Standard, and best ball snapshots with it. The packaged copies let the panel open when the published site or the network is unavailable.

In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select `extension/dist`. In Edge, use the same process at `edge://extensions`. Pin the extension if you want its button to stay in the toolbar, then open the companion from that button while the draft room is open.

Run the build again after changing the extension or its packaged rankings. Return to the browser's extensions page and reload the unpacked extension to use the new build.

## Use it during a draft

Choose the scoring or contest format that matches the room, set the league details, and record every selection in draft order. Search for the selected player and add the pick to the matching team. The panel saves the room after every change, so closing and reopening the panel restores the draft on that browser profile. Undo and correction controls are the recovery path for a missed or incorrect pick.

The redraft board supports the one-quarterback PPR, Half PPR, and Standard settings documented in [the draft model contract](./FANTASY_DRAFT_MODEL.md). The best ball board keeps exact and reference contest modes separate. If the provider room uses an unsupported format, the companion remains useful as a ranking reference but should not present its guidance as an exact model for that room.

## Ranking updates and privacy

When the panel opens, it tries to load the published snapshot from `isaacvazquez.com`. If that request fails or the returned data is invalid, it uses the packaged copy from the last extension build. The source date remains visible so an older board cannot look fresh, and the extension does not store or require a FantasyPros API key.

Draft state and settings stay in the browser's local extension storage. The companion has no account, cloud sync, analytics, or remote draft upload. Clearing the extension's site data or removing the extension also removes its saved rooms.

## Why pick sync is disabled

Provider pick auto-sync is intentionally disabled. ESPN and Underdog do not provide a supported public live-draft interface for this companion, and their terms restrict automated monitoring and unauthorized scripts. The extension therefore has no content script that reads either draft room and no permission to control those pages. Side loading the extension does not change those restrictions.

I would add pick auto-sync only through a documented provider integration or written permission. That version would remain read only, stop whenever a player match is uncertain, and leave every actual draft selection to the user.
