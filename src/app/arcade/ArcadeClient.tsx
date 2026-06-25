"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./arcade.module.css";

/*
 * REACTOR — a self-contained reflex arcade game.
 *
 * This component intentionally avoids the site's editorial primitives and
 * shared hooks. It is a standalone toy with its own state machine:
 *   boot -> playing -> over -> (retry) playing
 *
 * Timing runs off requestAnimationFrame against a deadline so the countdown
 * bar stays smooth and the difficulty can ramp every round. All visual motion
 * is handled in CSS and gated behind prefers-reduced-motion.
 */

const GRID = 9;
const START_WINDOW = 1250; // ms a target stays "hittable" on round 0
const MIN_WINDOW = 460; // floor so late game stays fair
const WINDOW_DECAY = 26; // ms shaved per round survived
const START_LIVES = 3;
const HISCORE_KEY = "arcade-reactor-hiscore-v1";

const BOOT_LINES = [
  "> PHOSPHOR ARCADE SYS v2.6",
  "> loading reactor core ........ OK",
  "> calibrating reflex matrix ... OK",
  "> neon tubes ................... LIT",
  "> ready player one.",
];

type Status = "boot" | "playing" | "over";
type Feedback = { cell: number; type: "hit" | "miss" } | null;
const COLORS = ["cyan", "magenta", "acid"] as const;

function readHiScore(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(HISCORE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function ArcadeClient() {
  const [status, setStatus] = useState<Status>("boot");
  const [bootText, setBootText] = useState("");
  const [bootDone, setBootDone] = useState(false);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lives, setLives] = useState(START_LIVES);
  const [hiScore, setHiScore] = useState(0);

  const [liveCell, setLiveCell] = useState<number | null>(null);
  const [decoyCell, setDecoyCell] = useState<number | null>(null);
  const [liveColor, setLiveColor] = useState<(typeof COLORS)[number]>("cyan");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [timerPct, setTimerPct] = useState(100);

  // Refs mirror state the rAF / timeout closures need without going stale.
  const statusRef = useRef<Status>("boot");
  const roundRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(1);
  const livesRef = useRef(START_LIVES);
  const liveCellRef = useRef<number | null>(null);
  const decoyCellRef = useRef<number | null>(null);
  const deadlineRef = useRef(0);
  const windowRef = useRef(START_WINDOW);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds the latest spawnRound so endRound can schedule the next round
  // without creating a declaration cycle between the round-control callbacks.
  const spawnRoundRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    rafRef.current = null;
    timeoutRef.current = null;
  }, []);

  // ---- Boot typewriter ----
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const full = BOOT_LINES.join("\n");

    if (reduce) {
      const id = setTimeout(() => {
        setBootText(full);
        setBootDone(true);
      }, 0);
      return () => clearTimeout(id);
    }

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setBootText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(id);
        setBootDone(true);
      }
    }, 18);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const endRound = useCallback(
    (next: "again" | "over") => {
      clearTimers();
      liveCellRef.current = null;
      decoyCellRef.current = null;
      setLiveCell(null);
      setDecoyCell(null);

      if (next === "over") {
        // Commit the high score here (event-driven), not in an effect.
        const finalScore = scoreRef.current;
        const stored = readHiScore();
        if (finalScore > stored) {
          try {
            window.localStorage.setItem(HISCORE_KEY, String(finalScore));
          } catch {
            /* storage may be unavailable — score just won't persist */
          }
        }
        setHiScore(Math.max(stored, finalScore));
        statusRef.current = "over";
        setStatus("over");
        return;
      }
      timeoutRef.current = setTimeout(() => {
        roundRef.current += 1;
        spawnRoundRef.current();
      }, 260);
    },
    [clearTimers]
  );

  const handleHit = useCallback(
    (cell: number) => {
      clearTimers();
      const gained = 10 * comboRef.current;
      comboRef.current += 1;
      scoreRef.current += gained;
      setCombo(comboRef.current);
      setScore((s) => s + gained);
      setFeedback({ cell, type: "hit" });
      endRound("again");
    },
    [clearTimers, endRound]
  );

  const handleMiss = useCallback(
    (reason: "timeout" | "decoy") => {
      clearTimers();
      comboRef.current = 1;
      setCombo(1);
      const cell =
        reason === "decoy" ? decoyCellRef.current : liveCellRef.current;
      if (cell !== null) setFeedback({ cell, type: "miss" });

      livesRef.current -= 1;
      setLives(livesRef.current);
      endRound(livesRef.current <= 0 ? "over" : "again");
    },
    [clearTimers, endRound]
  );

  const spawnRound = useCallback(() => {
    if (statusRef.current !== "playing") return;
    setFeedback(null);

    const target = Math.floor(Math.random() * GRID);
    // A decoy appears more often as rounds climb (cap ~55%).
    const decoyChance = Math.min(0.55, 0.12 + roundRef.current * 0.03);
    let decoy: number | null = null;
    if (Math.random() < decoyChance) {
      do {
        decoy = Math.floor(Math.random() * GRID);
      } while (decoy === target);
    }

    const window_ = Math.max(
      MIN_WINDOW,
      START_WINDOW - roundRef.current * WINDOW_DECAY
    );
    windowRef.current = window_;
    deadlineRef.current = performance.now() + window_;

    liveCellRef.current = target;
    decoyCellRef.current = decoy;
    setLiveCell(target);
    setDecoyCell(decoy);
    setLiveColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setTimerPct(100);

    const tick = () => {
      if (statusRef.current !== "playing") return;
      const remaining = deadlineRef.current - performance.now();
      const pct = Math.max(0, (remaining / windowRef.current) * 100);
      setTimerPct(pct);
      if (remaining <= 0) {
        handleMiss("timeout");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [handleMiss]);

  // Keep the ref pointed at the freshest spawnRound for endRound's scheduler.
  useEffect(() => {
    spawnRoundRef.current = spawnRound;
  }, [spawnRound]);

  const handleCellClick = useCallback(
    (i: number) => {
      if (statusRef.current !== "playing") return;
      if (i === liveCellRef.current) {
        handleHit(i);
      } else if (i === decoyCellRef.current) {
        handleMiss("decoy");
      } else {
        // Misfire on an empty cell only breaks the combo — no life lost.
        comboRef.current = 1;
        setCombo(1);
      }
    },
    [handleHit, handleMiss]
  );

  const startGame = useCallback(() => {
    clearTimers();
    roundRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 1;
    livesRef.current = START_LIVES;
    setScore(0);
    setCombo(1);
    setLives(START_LIVES);
    setFeedback(null);
    statusRef.current = "playing";
    setStatus("playing");
    timeoutRef.current = setTimeout(spawnRound, 400);
  }, [clearTimers, spawnRound]);

  // Keyboard support: number keys 1-9 map left-to-right, top-to-bottom.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (statusRef.current !== "playing") return;
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        e.preventDefault();
        handleCellClick(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCellClick]);

  const isOverlay = status !== "playing";

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <div className={styles.topbar}>
          <p className={styles.kicker}>ISAAC VAZQUEZ // SIDE-QUEST #07</p>
          <p className={styles.coin}>● ● ● INSERT COIN</p>
        </div>

        <div className={styles.titleWrap}>
          <h1 className={styles.title}>REACTOR</h1>
          <p className={styles.tagline}>
            A neon reflex cabinet bolted onto a buttoned-up portfolio. The rest
            of this site is paper, ink, and serif restraint — this is{" "}
            <b>none of that</b>. Light the live cell before it fades. Dodge the
            dashed decoys. Keep the combo alive.
          </p>
        </div>

        <section className={styles.cabinet} aria-label="Reactor game cabinet">
          <div className={styles.hud}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>SCORE</span>
              <span className={`${styles.statValue} ${styles.score}`}>
                {String(score).padStart(5, "0")}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>COMBO</span>
              <span className={`${styles.statValue} ${styles.combo}`}>
                x{combo}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>LIVES</span>
              <span className={`${styles.statValue} ${styles.lives}`}>
                {Array.from({ length: START_LIVES }, (_, i) => (
                  <span key={i} className={i >= lives ? styles.spent : ""}>
                    ♥
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className={styles.board} role="grid" aria-label="Reactor grid">
            {Array.from({ length: GRID }, (_, i) => {
              const live = i === liveCell;
              const decoy = i === decoyCell;
              const fb = feedback?.cell === i ? feedback.type : null;
              const cls = [
                styles.cell,
                live ? `${styles.live} ${styles[liveColor]}` : "",
                decoy ? styles.decoy : "",
                fb === "hit" ? styles.hit : "",
                fb === "miss" ? styles.miss : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  disabled={status !== "playing"}
                  onPointerDown={() => handleCellClick(i)}
                  aria-label={`Cell ${i + 1}${
                    live ? ", target live" : decoy ? ", decoy" : ""
                  }`}
                >
                  <span className={styles.index} aria-hidden="true">
                    {i + 1}
                  </span>
                  {live ? "◎" : decoy ? "✕" : ""}
                </button>
              );
            })}

            {isOverlay && (
              <div className={styles.overlay}>
                {status === "boot" ? (
                  <>
                    <pre className={styles.boot}>
                      {bootText}
                      {!bootDone && <span className={styles.cursor} />}
                    </pre>
                    {bootDone && (
                      <>
                        <p className={styles.overlayTitle}>PRESS START</p>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={startGame}
                        >
                          ▶ START GAME
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className={`${styles.overlayTitle} ${styles.over}`}>
                      GAME OVER
                    </p>
                    <p className={styles.overlayText}>
                      You scored{" "}
                      <strong style={{ color: "var(--ph-acid)" }}>
                        {score}
                      </strong>
                      .{" "}
                      {score >= hiScore && score > 0
                        ? "New high score — the cabinet remembers."
                        : `High score to beat: ${hiScore}.`}
                    </p>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={startGame}
                    >
                      ↻ RETRY
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.timerTrack} aria-hidden="true">
            <div
              className={styles.timerFill}
              style={{ width: `${status === "playing" ? timerPct : 0}%` }}
            />
          </div>
        </section>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>◎ LIVE CELL</span>
            <p className={styles.legendDesc}>
              The glowing tile. Hit it before the bar empties to bank points.
            </p>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>✕ DECOY</span>
            <p className={styles.legendDesc}>
              Dashed magenta trap. Tap one and you lose a life.
            </p>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>x COMBO</span>
            <p className={styles.legendDesc}>
              Each clean hit multiplies the next. A miss resets it to one.
            </p>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>⌨ KEYS 1–9</span>
            <p className={styles.legendDesc}>
              Play by mouse, touch, or the number keys laid out like the grid.
            </p>
          </div>
        </div>

        <p className={styles.backNote}>
          Built as a one-off style experiment. Head back to the{" "}
          <Link href="/">portfolio</Link> for the regularly scheduled paper and
          ink, or browse the <Link href="/portfolio">project archive</Link>.
        </p>
      </div>
    </div>
  );
}
