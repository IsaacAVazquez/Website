# Saved comparisons and personal project views

Isaac approved these five improvements on October 23, 2026. I will extend the existing routes, styles, validated browser stores, and calculation engines without adding dependencies.

| Order | Capability | Acceptance |
| --- | --- | --- |
| 1 | Rent versus buy | Save named inputs, load and remove them, compare results, and vary rate, appreciation, and holding period independently. |
| 2 | Food Map | Save restaurants, record visits and notes, filter personal records, add dated stops to existing trips, and attach dated source checks without restamping unchecked entries. |
| 3 | Travel Deal Lab | Save and compare flight options including route, dates, stops, baggage, cash, points, and fees. |
| 4 | Fantasy Formula 1 | Accept entered game prices, retain dated model lineups, record actual game points, and compare actual and estimated totals. |
| 5 | NBA and NFL | Save favorite teams, bring their fixtures forward, export dated schedules, and compare standings with a previous observed snapshot. |

The capabilities are independent except the restaurant integration, which reuses Travel Planner. New records are bounded and validated on restore, edits use the latest save, and storage failures remain visible. Existing records stay compatible. Saved comparisons retain their inputs.

The existing component and token conventions are the design reference. New controls remain compact, labelled, keyboard accessible, and at least 44 pixels high. Tables scroll inside their own region on phones.

Use focused Jest tests for validation, calculations, calendar exports, persistence, and interactions. Run `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, `npm run build`, and browser flows at phone and desktop widths in both themes. Review the diff and document output limits and verification.
