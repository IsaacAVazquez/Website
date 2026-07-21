InstrumentTape from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.InstrumentTape` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Shared horizontal mono readout strip — a "tape" — for live-instrument
ticker devices (recent outcomes, quote lines, results feeds). A thin
layout shell only: callers supply fully rendered items, so the same
primitive can back the investments quote tape, dashboard results tapes,
and the SpaceX launch tape without duplicating the scroll/hairline chrome.

Deliberately has NO auto-scrolling/marquee animation — the motion rules
forbid looping animation. Horizontal overflow is a plain scroll container
that clips gracefully instead of wrapping or truncating.

## Props

```ts
interface InstrumentTapeProps {
  label?: React.ReactNode;
  items: Array<{ key: string; content: React.ReactNode }>;
  ariaLabel: string;
  className?: string;
  emptyFallback?: React.ReactNode;
}
```

## Examples

### QuoteTape

```jsx
() => (
  <div style={shell}>
    <InstrumentTape
      ariaLabel="Holdings quote tape"
      label="Snapshot · May 15"
      items={[
        {
          key: "VTI",
          content: (
            <>
              <span style={{ fontWeight: 600 }}>VTI</span>
              <span>$262.41</span>
              <span style={{ color: "var(--home-positive)" }}>+0.8%</span>
            </>
          ),
        },
        {
          key: "VXUS",
          content: (
            <>
              <span style={{ fontWeight: 600 }}>VXUS</span>
              <span>$64.87</span>
              <span style={{ color: "var(--home-negative)" }}>-0.4%</span>
            </>
          ),
        },
        {
          key: "BND",
          content: (
            <>
              <span style={{ fontWeight: 600 }}>BND</span>
              <span>$73.12</span>
              <span style={{ color: "var(--home-positive)" }}>+0.1%</span>
            </>
          ),
        },
        {
          key: "QQQ",
          content: (
            <>
              <span style={{ fontWeight: 600 }}>QQQ</span>
              <span>$448.95</span>
              <span style={{ color: "var(--home-positive)" }}>+1.2%</span>
            </>
          ),
        },
      ]}
    />
  </div>
)
```

### LaunchTape

```jsx
() => (
  <div style={shell}>
    <InstrumentTape
      ariaLabel="Recent launch outcomes and upcoming launch windows"
      label={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden="true"
            style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--home-signal)" }}
          />
          Latest · Flight 412
        </span>
      }
      items={[
        {
          key: "starlink-12-8",
          content: (
            <>
              <span style={{ fontWeight: 500 }}>Starlink 12-8</span>
              <span style={subTag}>F9</span>
              {outcome(true)}
            </>
          ),
        },
        {
          key: "crs-33",
          content: (
            <>
              <span style={{ fontWeight: 500 }}>CRS-33</span>
              <span style={subTag}>F9</span>
              {outcome(true)}
            </>
          ),
        },
        {
          key: "ift-11",
          content: (
            <>
              <span style={{ fontWeight: 500 }}>Flight 11</span>
              <span style={subTag}>SS</span>
              {outcome(false)}
            </>
          ),
        },
        {
          key: "ussf-87",
          content: (
            <>
              <span style={{ color: "var(--home-ink-muted)" }}>USSF-87</span>
              <span style={subTag}>FH</span>
              <span style={{ fontSize: "0.62rem", color: "var(--home-ink-muted)" }}>
                May 22, 02:05 PM
              </span>
            </>
          ),
        },
      ]}
    />
  </div>
)
```

### EmptyFallback

```jsx
() => (
  <div style={shell}>
    <InstrumentTape
      ariaLabel="Launch tape"
      items={[]}
      emptyFallback={
        <p
          className="text-sm"
          style={{ margin: 0, padding: "14px 4px", color: "var(--home-ink-muted)" }}
        >
          No recent outcomes or upcoming windows are available from the current snapshot.
        </p>
      }
    />
  </div>
)
```
