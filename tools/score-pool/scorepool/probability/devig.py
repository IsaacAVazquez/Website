"""Odds conversion and vig removal.

Two jobs:
  1. Turn whatever odds format arrives (decimal, American, fractional) into
     decimal odds, then into raw implied probabilities.
  2. Strip the bookmaker's margin (the "vig" / "overround") so the probabilities
     across a market's outcomes sum to 1 and can be treated as fair.

Three de-vig methods are provided. Proportional is the transparent default;
Shin's method corrects for favourite-longshot bias and is a reasonable upgrade
for three-way markets; additive is included for completeness. None of them is
"true" -- they are different assumptions about where the margin sits, so the
tool reports which one it used rather than pretending there is one right answer.
"""

from __future__ import annotations

from typing import List, Sequence

# ---------------------------------------------------------------------------
# Format conversion
# ---------------------------------------------------------------------------


def to_decimal(price, fmt: str = "decimal") -> float:
    """Convert a single price to decimal odds.

    decimal:    already decimal (e.g. 2.50)
    american:   +150 -> 2.50, -200 -> 1.50
    fractional: "3/2" -> 2.50
    """
    fmt = fmt.lower()
    if fmt == "decimal":
        d = float(price)
    elif fmt == "american":
        p = float(price)
        if p == 0:
            raise ValueError("American odds cannot be 0")
        d = 1.0 + (p / 100.0 if p > 0 else 100.0 / abs(p))
    elif fmt == "fractional":
        num, den = str(price).split("/")
        d = 1.0 + float(num) / float(den)
    else:
        raise ValueError(f"unknown odds format {fmt!r}")
    if d <= 1.0:
        raise ValueError(f"decimal odds must be > 1.0, got {d} (from {price!r} as {fmt})")
    return d


def implied_prob(decimal_odds: float) -> float:
    """Raw implied probability of a single decimal price (still carries vig)."""
    return 1.0 / decimal_odds


def overround(decimals: Sequence[float]) -> float:
    """Sum of implied probabilities minus 1: the bookmaker's margin on a market."""
    return sum(1.0 / d for d in decimals) - 1.0


# ---------------------------------------------------------------------------
# De-vig methods
# ---------------------------------------------------------------------------


def devig_proportional(decimals: Sequence[float]) -> List[float]:
    """Scale raw implied probabilities so they sum to 1 (a.k.a. multiplicative /
    normalisation). Assumes the margin is spread proportionally across outcomes."""
    q = [1.0 / d for d in decimals]
    s = sum(q)
    return [x / s for x in q]


def devig_additive(decimals: Sequence[float]) -> List[float]:
    """Subtract an equal share of the overround from each outcome. Assumes the
    margin is spread as a flat amount, which tilts probability toward longshots
    relative to proportional. Clamped to stay non-negative and renormalised."""
    q = [1.0 / d for d in decimals]
    n = len(q)
    excess = sum(q) - 1.0
    p = [max(qi - excess / n, 0.0) for qi in q]
    s = sum(p)
    return [x / s for x in p] if s > 0 else devig_proportional(decimals)


def devig_shin(decimals: Sequence[float], max_iter: int = 100, tol: float = 1e-12) -> List[float]:
    """Shin's (1992) method. Models the margin as protection against a proportion
    ``z`` of insider money and backs out fair probabilities, which corrects some
    favourite-longshot bias. Solved for ``z`` by bisection so it works for any
    number of outcomes. Falls back to proportional if the market has no margin."""
    q = [1.0 / d for d in decimals]
    booksum = sum(q)
    if booksum <= 1.0 + 1e-9:
        return devig_proportional(decimals)

    def probs_for(z: float) -> List[float]:
        # p_i = (sqrt(z^2 + 4(1-z) q_i^2 / booksum) - z) / (2(1-z))
        out = []
        for qi in q:
            root = (z * z + 4.0 * (1.0 - z) * qi * qi / booksum) ** 0.5
            out.append((root - z) / (2.0 * (1.0 - z)))
        return out

    lo, hi = 0.0, 0.99  # z in [0, 1)
    for _ in range(max_iter):
        mid = 0.5 * (lo + hi)
        s = sum(probs_for(mid))
        # sum(probs) decreases as z increases; find z with sum == 1
        if s > 1.0:
            lo = mid
        else:
            hi = mid
        if abs(s - 1.0) < tol:
            break
    p = probs_for(0.5 * (lo + hi))
    s = sum(p)
    return [x / s for x in p]  # tiny renormalisation for safety


_METHODS = {
    "proportional": devig_proportional,
    "additive": devig_additive,
    "shin": devig_shin,
}


def devig(decimals: Sequence[float], method: str = "proportional") -> List[float]:
    """De-vig a market's decimal prices with the named method."""
    try:
        fn = _METHODS[method]
    except KeyError:
        raise ValueError(
            f"unknown devig method {method!r}; choose from {sorted(_METHODS)}"
        )
    return fn(decimals)


def devig_two_way(over: float, under: float, method: str = "proportional") -> float:
    """Return the fair probability of the first outcome of a two-way market
    (over/under, BTTS yes/no) after removing vig."""
    p_over, _ = devig([over, under], method)
    return p_over
