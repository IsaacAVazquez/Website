import { ImageResponse } from "next/og";

type EditorialOgAccent = "cobalt" | "teal" | "amber";

/*
 * Share cards print like the riso plates on the site: a flat spot-ink ground,
 * a field of halftone dots, and a cream sheet whose second ink sits a few
 * pixels off register. The accent names are the cluster themes from
 * blog-config, mapped onto the site's inks.
 */
const INK = "#17110d";
const PAPER = "#f1ebdf";

const accentThemes: Record<
  EditorialOgAccent,
  { ground: string; second: string }
> = {
  cobalt: { ground: "#1a3ea6", second: "#edb722" },
  teal: { ground: "#df4c1e", second: "#1a3ea6" },
  amber: { ground: "#edb722", second: "#df4c1e" },
};

/** Cut at a word boundary so a long excerpt cannot push the sheet past the card. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max)).replace(/[,.;:]$/, "")}…`;
}

interface EditorialOgImageOptions {
  eyebrow: string;
  title: string;
  description: string;
  accent?: EditorialOgAccent;
  footer?: string;
}

export function createEditorialOgImage({
  eyebrow,
  title,
  description,
  accent = "cobalt",
  footer = "isaacvazquez.com",
}: EditorialOgImageOptions) {
  const theme = accentThemes[accent];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: theme.ground,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        padding: "56px 64px 64px 56px",
      }}
    >
      {/* Halftone dots over the right half of the ground. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "520px",
          height: "630px",
          display: "flex",
          backgroundImage:
            "radial-gradient(circle, rgba(23, 17, 13, 0.38) 32%, transparent 36%)",
          backgroundSize: "14px 14px",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: PAPER,
          color: INK,
          boxShadow: `12px 12px 0 ${theme.second}`,
          padding: "44px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "18px",
              height: "18px",
              background: theme.ground,
            }}
          />
          {eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 70 ? "50px" : "62px",
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              fontWeight: 800,
              textShadow: `3px 2px 0 ${theme.second}`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              lineHeight: 1.34,
              color: "#4a3728",
            }}
          >
            {clip(description, 170)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            borderTop: `2px solid ${INK}`,
            paddingTop: "18px",
          }}
        >
          <div style={{ display: "flex" }}>Isaac Vazquez</div>
          <div style={{ display: "flex" }}>{footer}</div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
