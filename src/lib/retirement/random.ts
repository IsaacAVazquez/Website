// ============================================================
// Seeded RNG + normal sampling for Monte Carlo.
//
// A deterministic generator is required so a given plan + seed always yields
// the same success rate (spec §8 test case) and the headline number doesn't
// jitter on every keystroke.
// ============================================================

/**
 * mulberry32 — a small, fast, well-distributed 32-bit seeded PRNG.
 * Returns a function producing uniforms in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard-normal sampler (Box-Muller) backed by a uniform generator.
 * Avoids the log(0) singularity by flooring the uniform.
 */
export function makeNormalSampler(uniform: () => number): () => number {
  return function nextNormal() {
    let u1 = uniform();
    const u2 = uniform();
    if (u1 < 1e-12) u1 = 1e-12;
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}
