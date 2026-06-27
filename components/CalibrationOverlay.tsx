"use client";

import { motion } from "framer-motion";
import { useEyeTurnStore } from "@/lib/store";
import { isEarClosed } from "@/utils/blink";
import {
  formatPatternSummary,
  TURN_PATTERN_BLINK_COUNT,
} from "@/utils/blinkPattern";

export function CalibrationOverlay() {
  const {
    isCalibrating,
    calibrationPhase,
    calibrationProgress,
    calibrationBlinkCount,
    currentEar,
    blinkCalibration,
    setIsCalibrating,
  } = useEyeTurnStore();

  if (!isCalibrating) return null;

  const phaseCopy =
    calibrationPhase === "open"
      ? {
          title: "Blink calibration — step 1",
          body: "Keep your eyes open. MediaPipe is sampling your open-eye EAR (Eye Aspect Ratio) from 468 face landmarks.",
          hint: "Measuring open-eye baseline…",
        }
      : {
          title: "Blink calibration — step 2",
          body: `Blink ${TURN_PATTERN_BLINK_COUNT} times quickly — the same fast rhythm you'd use to turn a page. EyeTurn learns your timing and uses it for future page turns.`,
          hint: `${calibrationBlinkCount} / ${TURN_PATTERN_BLINK_COUNT} blinks detected`,
        };

  const trackingOk = currentEar !== null;
  const eyesClosed =
    trackingOk &&
    blinkCalibration &&
    currentEar !== null &&
    isEarClosed(currentEar, blinkCalibration.threshold);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-3xl p-8 text-center"
      >
        <h2 className="text-xl font-semibold">{phaseCopy.title}</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{phaseCopy.body}</p>

        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(calibrationProgress * 100)}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
          <p className="mt-3 text-sm font-medium">{phaseCopy.hint}</p>
        </div>

        {calibrationPhase === "learnTurn" && (
          <div className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-left text-sm dark:bg-white/5">
            <p className="font-medium">Learn your turn-page rhythm</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              Landmarks: {trackingOk ? "468 points tracked" : "searching for face…"}
            </p>
            {trackingOk && blinkCalibration && (
              <>
                <p className="text-[var(--text-secondary)]">
                  State: {eyesClosed ? "EAR low (eye closed)" : "EAR high (eye open)"}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  EAR {currentEar!.toFixed(3)} · threshold{" "}
                  {blinkCalibration.threshold.toFixed(3)}
                </p>
                {calibrationBlinkCount >= TURN_PATTERN_BLINK_COUNT &&
                  blinkCalibration.turnPagePattern && (
                    <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                      Learned: {formatPatternSummary(blinkCalibration.turnPagePattern)}
                    </p>
                  )}
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCalibrating(false)}
          className="mt-8 rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
