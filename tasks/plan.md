# Project workflow improvements

Isaac approved the five proposed improvements on October 23, 2026. Each project keeps its existing visual design and browser saves. No new account or dependency is needed.

| Project | Acceptance | Verification |
| --- | --- | --- |
| Budget Planner | Copy an earlier plan into an empty month, carry selected positive category balances, and record monthly bills once per month. Existing expenses stay intact. | Budget model and interaction tests |
| Wine Cellar | Save owned bottles and a wishlist, track quantities, and open a bottle into the tasting journal without losing older entries. | Inventory and interaction tests |
| News Pulse | Retain bounded public headline observations, show outlet pickup and observed headline changes, and distinguish changes since the last visit. Failed feeds never create observations. | History, server, and interaction tests |
| Museum Log | Research current exhibitions with dated primary sources, filter by trip dates, and add a museum to a saved trip. | Calendar overlap and trip integration tests |
| GitHub Trending Pulse | Save a browser shortlist and compare growth, activity, and licensing using the existing snapshot. | Persistence and comparison interaction tests |

The implementation order is budget, wine, news, museums, and repositories. The museum integration reads the existing Travel Planner storage contract. News history uses the existing durable public cache; personal last-visit state stays in the browser.

After the individual checks, run lint, typecheck, the full Jest suite, a Node 22 production build, and browser checks at phone and desktop widths. Review the final diff and update the workflow documentation.
