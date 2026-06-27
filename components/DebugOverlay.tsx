"use client";

import { useEyeTurnStore } from "@/lib/store";

export function DebugOverlay() {
  const {
    isTracking,
    isInCooldown,
    settings,
    blinkCalibration,
    currentEar,
    sessionBlinkCount,
  } = useEyeTurnStore();

  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || settings.debugMode);

  if (!isDev || !settings.debugMode) return null;

  return (
    <div className="fixed right-4 top-20 z-[100] min-w-[220px] rounded-2xl glass-panel p-4 font-mono text-xs">
      <p className="mb-2 font-sans text-sm font-semibold">Debug (MediaPipe EAR)</p>
      <div className="space-y-1 text-[var(--text-secondary)]">
        <p>
          WebGazer:{" "}
          <span className={isTracking ? "text-green-500" : "text-red-500"}>
            {isTracking ? "active" : "inactive"}
          </span>
        </p>
        <p>EAR: {currentEar !== null ? currentEar.toFixed(3) : "—"}</p>
        <p>
          Threshold:{" "}
          {blinkCalibration ? blinkCalibration.threshold.toFixed(3) : "—"}
        </p>
        <p>Blink count: {sessionBlinkCount}</p>
        <p>Cooldown: {isInCooldown ? "yes" : "no"}</p>
        {blinkCalibration && (
          <>
            <p>Open EAR: {blinkCalibration.openEar.toFixed(3)}</p>
            <p>Closed EAR: {blinkCalibration.closedEar.toFixed(3)}</p>
            {blinkCalibration.turnPagePattern && (
              <p>Turn pattern: {blinkCalibration.turnPagePattern.blinkCount} blinks</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
