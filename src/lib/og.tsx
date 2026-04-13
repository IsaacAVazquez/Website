import { ImageResponse } from "next/og";

type EditorialOgAccent = "cobalt" | "teal" | "amber";

const accentThemes: Record<
  EditorialOgAccent,
  {
    background: string;
    card: string;
    border: string;
    badge: string;
    text: string;
    muted: string;
    highlight: string;
  }
> = {
  cobalt: {
    background: "linear-gradient(135deg, #f6f7fb 0%, #edf2ff 55%, #dbe8ff 100%)",
    card: "rgba(255, 255, 255, 0.78)",
    border: "rgba(53, 94, 197, 0.16)",
    badge: "#355ec5",
    text: "#111827",
    muted: "#4b5563",
    highlight: "#1d4ed8",
  },
  teal: {
    background: "linear-gradient(135deg, #f4fbfa 0%, #e3f6f2 52%, #c8eee5 100%)",
    card: "rgba(255, 255, 255, 0.8)",
    border: "rgba(18, 104, 93, 0.16)",
    badge: "#12685d",
    text: "#10211d",
    muted: "#42564f",
    highlight: "#0f766e",
  },
  amber: {
    background: "linear-gradient(135deg, #fffaf0 0%, #fff2d9 48%, #ffe1ad 100%)",
    card: "rgba(255, 252, 247, 0.85)",
    border: "rgba(161, 98, 7, 0.16)",
    badge: "#a16207",
    text: "#1f1607",
    muted: "#5b513f",
    highlight: "#92400e",
  },
};

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
  footer = "isaacavazquez.com",
}: EditorialOgImageOptions) {
  const theme = accentThemes[accent];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: theme.background,
          color: theme.text,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          padding: "54px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            borderRadius: "36px",
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 20px 80px rgba(15, 23, 42, 0.08)",
            padding: "42px 44px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "999px",
                background: theme.badge,
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "10px 18px",
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
                fontWeight: 800,
                display: "flex",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "29px",
                lineHeight: 1.34,
                color: theme.muted,
                display: "flex",
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: theme.highlight,
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex" }}>Isaac Vazquez</div>
            <div style={{ display: "flex" }}>{footer}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
