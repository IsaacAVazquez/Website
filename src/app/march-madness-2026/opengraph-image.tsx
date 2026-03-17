import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "March Madness 2026 Bracket Analysis";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at top left, rgba(245,158,11,0.22), transparent 28%), radial-gradient(circle at top right, rgba(59,130,246,0.2), transparent 24%), linear-gradient(180deg, #05080f 0%, #09111a 55%, #060a12 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          padding: "56px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 32,
            background: "linear-gradient(180deg, rgba(9,16,24,0.94), rgba(6,10,18,0.9))",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
              color: "#fbbf24",
            }}
          >
            <span>2026 NCAA Tournament</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
            <span style={{ color: "rgba(255,255,255,0.72)" }}>Interactive Sports Analysis</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 920 }}>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.94 }}>
              <span style={{ fontSize: 82, fontWeight: 800 }}>March Madness</span>
              <span style={{ fontSize: 82, fontWeight: 800, color: "#fbbf24" }}>
                Bracket Analysis
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.3,
                color: "rgba(241,245,249,0.88)",
                maxWidth: 900,
              }}
            >
              Best upset picks, Final Four calls, and a time-zone travel model that finds edges
              seed lines miss.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              fontSize: 18,
            }}
          >
            {["KenPom", "S-Curve", "Time Zones", "Injuries"].map((pill, index) => (
              <div
                key={pill}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background:
                    index === 0
                      ? "rgba(245,158,11,0.14)"
                      : index === 1
                        ? "rgba(56,189,248,0.14)"
                        : index === 2
                          ? "rgba(16,185,129,0.14)"
                          : "rgba(255,255,255,0.06)",
                  color: "#e2e8f0",
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
