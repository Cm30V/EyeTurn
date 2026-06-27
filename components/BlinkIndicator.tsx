"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEyeTurnStore } from "@/lib/store";
import { formatBlinkRange, resolvePageAction } from "@/utils/blinkRanges";

export function BlinkIndicator() {
  const {
    sessionBlinkCount,
    sessionBlinkTimestamps,
    blinkCalibration,
    settings,
    isTracking,
    isCalibrating,
    isInCooldown,
  } = useEyeTurnStore();

  if (!isTracking || isCalibrating) return null;

  const pendingAction =
    blinkCalibration &&
    resolvePageAction(sessionBlinkTimestamps, blinkCalibration, settings);

  const nextHint = formatBlinkRange(
    settings.nextPageBlinksMin,
    settings.nextPageBlinksMax
  );

  return (
    <AnimatePresence>
      {sessionBlinkCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-4 right-4 z-40 rounded-2xl glass-panel px-4 py-3 shadow-glass"
        >
          <p className="text-xs text-[var(--text-secondary)]">Blink count</p>
          <p className="text-2xl font-semibold tabular-nums">{sessionBlinkCount}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            {isInCooldown
              ? "Cooldown…"
              : pendingAction === "next"
                ? "→ next page"
                : pendingAction === "prev"
                  ? "← previous page"
                  : `${nextHint} next · ${formatBlinkRange(settings.prevPageBlinksMin, settings.prevPageBlinksMax)} prev`}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
