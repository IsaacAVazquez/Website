"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GitCompareArrows, X } from "lucide-react";
import { useState } from "react";

import { useCompareTray } from "@/hooks/useCompareTray";
import { getPositionTone } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import { CompareModal } from "./CompareModal";

interface CompareTrayProps {
  resolvePlayer: (id: string) => Player | undefined;
  publishedRank?: (player: Player) => string;
}

/**
 * A docked bottom bar that surfaces the compare selection from anywhere on the
 * page and opens the side-by-side modal. Renders nothing until at least one
 * player is pinned, so it never steals space during normal browsing.
 */
export function CompareTray({ resolvePlayer, publishedRank }: CompareTrayProps) {
  const reduceMotion = useReducedMotion();
  const compare = useCompareTray();
  const [open, setOpen] = useState(false);

  const players = compare.compareIds
    .map((id) => resolvePlayer(id))
    .filter((player): player is Player => Boolean(player));

  const canCompare = players.length >= 2;

  return (
    <>
      <AnimatePresence>
        {players.length > 0 && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div
              className="flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-[var(--radius-3xl)] border px-3 py-2.5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix))",
                boxShadow: "var(--shadow-lg)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="home-kicker mb-0 hidden sm:block">Compare</span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {players.map((player) => (
                  <span
                    key={player.id}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                    style={{ borderColor: "var(--home-rule)", ...getPositionTone(player.position) }}
                  >
                    <span className="max-w-[8rem] truncate">{player.name}</span>
                    <button
                      type="button"
                      onClick={() => compare.remove(player.id)}
                      aria-label={`Remove ${player.name} from compare`}
                      className="-my-3 -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in srgb, var(--home-ink) 12%, transparent)" }}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => compare.clear()}
                className="inline-flex min-h-touch items-center rounded-full px-3 text-xs font-semibold"
                style={{ color: "var(--home-ink-muted)" }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={!canCompare}
                className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
                style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                title={canCompare ? undefined : "Pin at least two players"}
              >
                <GitCompareArrows size={16} aria-hidden="true" />
                Compare {players.length}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && canCompare && (
        <CompareModal
          players={players}
          publishedRank={publishedRank}
          onClose={() => setOpen(false)}
          onRemove={(id) => {
            compare.remove(id);
            if (players.length <= 2) setOpen(false);
          }}
        />
      )}
    </>
  );
}
