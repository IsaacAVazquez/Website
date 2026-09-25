/**
 * How late a tick may land after the scheduled T-0 and still count as the
 * visitor watching it cross. A background tab's timers get throttled, so a
 * tick that finally lands minutes after T-0 should not fire a rocket nobody
 * saw counting down.
 */
export const LIFTOFF_GRACE_MS = 5_000;

/**
 * True only on the tick that carries the countdown across the scheduled T-0.
 *
 * `previousMs` and `currentMs` are two consecutive clock readings and `netMs`
 * is the launch's scheduled time. A tick before T-0, a tick after T-0 whose
 * predecessor was also after it, and a crossing that was only noticed long
 * after the fact all return false, so a caller that feeds it every tick gets
 * true at most once per launch.
 *
 * This is the schedule, not the launch. The snapshot cannot say whether the
 * rocket actually flew.
 */
export function crossedScheduledT0(
  previousMs: number,
  currentMs: number,
  netMs: number,
  graceMs = LIFTOFF_GRACE_MS,
): boolean {
  if (!Number.isFinite(previousMs) || !Number.isFinite(currentMs) || !Number.isFinite(netMs)) {
    return false;
  }
  return previousMs < netMs && currentMs >= netMs && currentMs - netMs <= graceMs;
}
