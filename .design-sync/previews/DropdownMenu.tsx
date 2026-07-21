import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "isaac-vazquez-portfolio";

const triggerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  borderRadius: 9999,
  border: "1px solid var(--home-rule)",
  background: "var(--home-paper)",
  color: "var(--home-ink)",
  padding: "8px 18px",
  fontSize: 14,
  fontWeight: 600,
};

const Chevron = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const TriggerClosed = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" style={triggerStyle}>
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--home-ink-muted)",
          }}
        >
          Source
        </span>
        <span>All feeds</span>
        <Chevron />
      </button>
    </DropdownMenuTrigger>
  </DropdownMenu>
);

export const OpenMenu = () => (
  <div style={{ minHeight: 320 }}>
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" style={triggerStyle}>
          <span>Scoring format</span>
          <Chevron />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} style={{ minWidth: 220 }}>
        <DropdownMenuLabel>Scoring format</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="half-ppr">
          <DropdownMenuRadioItem value="ppr">PPR</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="half-ppr">Half PPR</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="standard">Standard</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Show tier breaks</DropdownMenuCheckboxItem>
        <DropdownMenuItem>
          Export board
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
