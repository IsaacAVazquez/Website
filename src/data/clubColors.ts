/**
 * Per-club accent color lookup for the Premier League and La Liga dashboards.
 *
 * football-data.org's team payload only ever exposes `clubColors` as a free-text
 * description (e.g. "Red / White"), never a hex value, so there is no upstream
 * source for a literal brand color. This module ships a small hand-authored
 * lookup instead, keyed by the competition's team abbreviation (TLA), so
 * components can resolve a club's primary color as data rather than hardcoding
 * hex values inline (see CLAUDE.md's styling guardrails).
 *
 * Colors are representative primary brand colors sourced from general public
 * club-identity knowledge, not an official/licensed palette — treat them as
 * "sensible accent," not pixel-exact brand compliance. Unknown codes resolve to
 * `null` so callers fall back to a neutral token (e.g. `var(--home-signal)`)
 * instead of a hardcoded default hex.
 */

/** Premier League club accent colors, keyed by TLA (case-insensitive). */
export const PREMIER_LEAGUE_CLUB_ACCENT_COLORS: Record<string, string> = {
  ARS: "#EF0107", // Arsenal
  AVL: "#670E36", // Aston Villa
  BOU: "#DA020E", // AFC Bournemouth
  BRE: "#E30613", // Brentford
  BHA: "#0057B8", // Brighton & Hove Albion
  CHE: "#034694", // Chelsea
  COV: "#78D0F2", // Coventry City
  CRY: "#1B458F", // Crystal Palace
  EVE: "#003399", // Everton
  FUL: "#000000", // Fulham
  HUL: "#F18A00", // Hull City
  IPS: "#3A64A3", // Ipswich Town
  LEE: "#1D428A", // Leeds United
  LEI: "#003090", // Leicester City
  LIV: "#C8102E", // Liverpool
  MCI: "#6CABDD", // Manchester City
  MUN: "#DA291C", // Manchester United
  NEW: "#241F20", // Newcastle United
  NOT: "#DD0000", // Nottingham Forest
  SOU: "#D71920", // Southampton
  SUN: "#EB172B", // Sunderland
  TOT: "#132257", // Tottenham Hotspur
  WHU: "#7A263A", // West Ham United
  WOL: "#FDB913", // Wolverhampton Wanderers
  BUR: "#6C1D45", // Burnley
};

/**
 * La Liga club accent colors, keyed by TLA (case-insensitive).
 *
 * Atlético Madrid appears under both "ATM" and "ATL" because football-data.org
 * and other feeds have used both abbreviations for the same club historically.
 */
export const LA_LIGA_CLUB_ACCENT_COLORS: Record<string, string> = {
  ALA: "#0066B3", // Alavés
  ATH: "#EE2523", // Athletic Club
  ATM: "#CB3524", // Atlético Madrid
  ATL: "#CB3524", // Atlético Madrid (alternate TLA)
  FCB: "#A50044", // FC Barcelona
  CEL: "#8AC3EE", // RC Celta de Vigo
  DEP: "#0E5FA8", // RC Deportivo La Coruña
  ELC: "#00A650", // Elche CF
  ESP: "#0057A8", // RCD Espanyol
  GET: "#005CA9", // Getafe CF
  GIR: "#CD2534", // Girona FC
  LEV: "#00285E", // Levante UD
  MAL: "#0A5EB3", // Málaga CF
  OSA: "#D2001C", // CA Osasuna
  RAY: "#E30613", // Rayo Vallecano
  BET: "#00954C", // Real Betis
  RMA: "#00529F", // Real Madrid
  RSO: "#0067B1", // Real Sociedad
  SAN: "#00953B", // Real Racing Club de Santander
  SEV: "#D2001C", // Sevilla FC
  VAL: "#EE3524", // Valencia CF
  VIL: "#FDE100", // Villarreal CF
};

function lookupAccentColor(
  table: Record<string, string>,
  tla: string | null | undefined
): string | null {
  if (!tla) return null;
  const key = tla.trim().toUpperCase();
  if (!key) return null;
  return table[key] ?? null;
}

/** Resolves a Premier League club's accent hex by TLA, or `null` if unknown. */
export function getPremierLeagueClubAccentColor(tla: string | null | undefined): string | null {
  return lookupAccentColor(PREMIER_LEAGUE_CLUB_ACCENT_COLORS, tla);
}

/** Resolves a La Liga club's accent hex by TLA, or `null` if unknown. */
export function getLaLigaClubAccentColor(tla: string | null | undefined): string | null {
  return lookupAccentColor(LA_LIGA_CLUB_ACCENT_COLORS, tla);
}
