"use client";

import { motion } from "framer-motion";
import { isIOS, isSecureCameraContext } from "@/utils/device";

interface CameraPromptProps {
  onEnable: () => void;
  isStarting: boolean;
  error: string | null;
}

export function CameraPrompt({ onEnable, isStarting, error }: CameraPromptProps) {
  const secure = isSecureCameraContext();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-3xl p-6 text-center sm:p-8"
      >
        <h2 className="text-lg font-semibold sm:text-xl">Enable front camera</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {isIOS()
            ? "Safari requires a tap to access the camera. EyeTurn uses your front camera and MediaPipe face tracking — the same blink detection as on desktop."
            : "Tap below to allow camera access for blink detection."}
        </p>

        {!secure && (
          <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Camera access requires HTTPS. Open this site over a secure connection (not plain
            http:// on a phone).
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onEnable}
          disabled={isStarting || !secure}
          className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-6 py-4 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isStarting ? "Starting camera…" : "Enable camera & calibrate"}
        </button>
      </motion.div>
    </div>
  );
}
