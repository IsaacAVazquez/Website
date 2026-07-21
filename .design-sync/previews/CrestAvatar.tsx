import * as React from "react";
import { CrestAvatar } from "isaac-vazquez-portfolio";

const crestDataUri =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><path d='M32 5l23 8v15c0 15-10 24-23 31C19 52 9 43 9 28V13z' fill='%23d8d5cc'/></svg>";

const sizeCaption: React.CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  color: "var(--home-ink-muted)",
  textAlign: "center",
};

export const InitialsFallback = () => (
  <div className="flex items-center gap-4" style={{ alignItems: "flex-end" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CrestAvatar crest={null} name="Arsenal" size="sm" />
      <p style={sizeCaption}>sm</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CrestAvatar crest={null} name="Man City" size="md" />
      <p style={sizeCaption}>md</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CrestAvatar crest={null} name="Real Madrid" size="lg" />
      <p style={sizeCaption}>lg</p>
    </div>
  </div>
);

export const WithCrestImage = () => (
  <div className="flex items-center gap-4">
    <CrestAvatar crest={crestDataUri} name="Newcastle United" size="md" />
    <CrestAvatar crest={crestDataUri} name="Newcastle United" size="lg" />
  </div>
);

export const InStandingsRow = () => (
  <div className="max-w-md">
    {[
      { pos: 1, name: "Real Madrid", points: "89 pts" },
      { pos: 2, name: "Barcelona", points: "85 pts" },
      { pos: 3, name: "Atlético Madrid", points: "74 pts" },
    ].map((row) => (
      <div
        key={row.pos}
        className="flex items-center justify-between gap-3 text-sm"
        style={{ padding: "8px 0", borderBottom: "1px solid var(--home-rule)" }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              width: 16,
              color: "var(--home-ink-muted)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.pos}
          </span>
          <CrestAvatar crest={null} name={row.name} size="sm" />
          <span style={{ fontWeight: 600, color: "var(--home-ink)" }}>{row.name}</span>
        </div>
        <span style={{ color: "var(--home-ink-muted)", fontVariantNumeric: "tabular-nums" }}>
          {row.points}
        </span>
      </div>
    ))}
  </div>
);
