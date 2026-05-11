/*
 * Beatport Top 100 extractor
 *
 * Usage:
 *   1. Open https://www.beatport.com/top-100 in your browser.
 *   2. Open DevTools (Cmd/Ctrl+Opt+I) and switch to the Console tab.
 *   3. If prompted, type `allow pasting` and press Enter.
 *   4. Paste the entire contents of this file and press Enter.
 *
 * Output:
 *   - Logs the CSV to the console
 *   - Copies the CSV to your clipboard
 *   - Downloads beatport-top100-<date>.csv
 *
 * Columns: rank,title,mix,artists,remixers,label,bpm,key,genre,released
 *
 * The script first tries to read the page's embedded Next.js data (most
 * reliable). If Beatport changes their data shape, it falls back to scraping
 * visible DOM rows.
 */

(async () => {
  const FIELDS = [
    "rank",
    "title",
    "mix",
    "artists",
    "remixers",
    "label",
    "bpm",
    "key",
    "genre",
    "released",
  ];

  const csvEscape = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const toCSV = (rows) =>
    [FIELDS.join(","), ...rows.map((r) => FIELDS.map((f) => csvEscape(r[f])).join(","))].join("\n");

  const namesOf = (arr) =>
    Array.isArray(arr) ? arr.map((a) => a?.name).filter(Boolean).join(", ") : "";

  const looksLikeTrack = (n) =>
    n &&
    typeof n === "object" &&
    typeof n.name === "string" &&
    Array.isArray(n.artists) &&
    (n.bpm != null || "mix_name" in n || "mixName" in n || "release" in n || "label" in n);

  function fromNextData() {
    const el = document.getElementById("__NEXT_DATA__");
    if (!el) return null;
    let data;
    try {
      data = JSON.parse(el.textContent || "");
    } catch {
      return null;
    }

    const found = [];
    const stack = [data];
    const visited = new WeakSet();
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if (visited.has(node)) continue;
      visited.add(node);
      if (Array.isArray(node)) {
        for (const v of node) stack.push(v);
        continue;
      }
      if (looksLikeTrack(node)) found.push(node);
      for (const k in node) stack.push(node[k]);
    }

    if (!found.length) return null;

    const seen = new Set();
    const unique = [];
    for (const t of found) {
      const key =
        t.id ??
        t.track_id ??
        `${t.name}|${t.mix_name ?? t.mixName ?? ""}|${namesOf(t.artists)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(t);
    }

    return unique.slice(0, 100).map((t, i) => ({
      rank: i + 1,
      title: t.name ?? "",
      mix: t.mix_name ?? t.mixName ?? "",
      artists: namesOf(t.artists),
      remixers: namesOf(t.remixers),
      label: t.label?.name ?? t.release?.label?.name ?? "",
      bpm: t.bpm ?? "",
      key:
        (typeof t.key === "object" ? t.key?.name : t.key) ??
        t.key_name ??
        "",
      genre:
        t.genre?.name ??
        (Array.isArray(t.genres) ? t.genres.map((g) => g?.name).filter(Boolean).join(", ") : ""),
      released: t.new_release_date ?? t.publish_date ?? t.release?.new_release_date ?? "",
    }));
  }

  function fromDom() {
    const rowNodes = Array.from(
      document.querySelectorAll('[data-testid="tracks-table-row"], [class*="TrackRow"], [class*="trackRow"]')
    );
    if (!rowNodes.length) return null;

    const text = (n, sel) => {
      if (!n) return "";
      const el = sel ? n.querySelector(sel) : n;
      return (el?.textContent || "").trim();
    };

    return rowNodes.slice(0, 100).map((row, i) => {
      const links = Array.from(row.querySelectorAll("a"));
      const artistLinks = links.filter((a) => /\/artist\//.test(a.getAttribute("href") || ""));
      const labelLink = links.find((a) => /\/label\//.test(a.getAttribute("href") || ""));
      const titleLink = links.find((a) => /\/track\//.test(a.getAttribute("href") || ""));
      const titleRaw = text(titleLink) || text(row, '[class*="title" i]');
      const mixMatch = titleRaw.match(/\(([^)]+)\)\s*$/);
      return {
        rank: i + 1,
        title: titleRaw.replace(/\s*\([^)]+\)\s*$/, "").trim(),
        mix: mixMatch ? mixMatch[1] : "",
        artists: artistLinks.map((a) => text(a)).join(", "),
        remixers: "",
        label: text(labelLink),
        bpm: text(row, '[class*="bpm" i]'),
        key: text(row, '[class*="key" i]'),
        genre: text(row, '[class*="genre" i]'),
        released: text(row, '[class*="date" i]'),
      };
    });
  }

  const rows = fromNextData() || fromDom();
  if (!rows || !rows.length) {
    console.error(
      "[beatport-extractor] Could not find tracks. The page structure may have changed, or the list hasn't loaded yet. Scroll the list into view and try again."
    );
    return;
  }

  const csv = toCSV(rows);
  console.log(`[beatport-extractor] Extracted ${rows.length} tracks`);
  console.log(csv);

  try {
    await navigator.clipboard.writeText(csv);
    console.log("[beatport-extractor] CSV copied to clipboard");
  } catch (e) {
    console.warn("[beatport-extractor] Clipboard write failed:", e?.message || e);
  }

  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beatport-top100-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    console.log("[beatport-extractor] CSV downloaded");
  } catch (e) {
    console.warn("[beatport-extractor] Download failed:", e?.message || e);
  }

  console.log("[beatport-extractor] Preview:", rows.slice(0, 5));
})();
