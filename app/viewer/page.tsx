"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEyeTurnStore } from "@/lib/store";
import { loadLatestPdf } from "@/lib/pdfStorage";
import { PDFViewer } from "@/components/PDFViewer";
import { Toolbar } from "@/components/Toolbar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CalibrationOverlay } from "@/components/CalibrationOverlay";
import { WebcamPreview } from "@/components/WebcamPreview";
import { DebugOverlay } from "@/components/DebugOverlay";
import { BlinkIndicator } from "@/components/BlinkIndicator";
import { useGazeTracker } from "@/hooks/useGazeTracker";
import { useBlinkDetector } from "@/hooks/useBlinkDetector";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function ViewerPage() {
  const router = useRouter();
  const pdf = useEyeTurnStore((s) => s.pdf);
  const setPdf = useEyeTurnStore((s) => s.setPdf);
  const settings = useEyeTurnStore((s) => s.settings);
  const { start, stop, calibrate, isTracking } = useGazeTracker();

  useBlinkDetector();

  useEffect(() => {
    if (pdf) return;
    loadLatestPdf().then((stored) => {
      if (stored) {
        setPdf(stored);
      } else {
        router.replace("/");
      }
    });
  }, [pdf, setPdf, router]);

  useEffect(() => {
    if (!pdf || !settings.eyeTrackingEnabled) return;

    let mounted = true;

    const boot = async () => {
      await start();
      if (
        mounted &&
        (!useEyeTurnStore.getState().isCalibrated ||
          !useEyeTurnStore.getState().blinkCalibration)
      ) {
        calibrate();
      }
    };

    boot().catch(console.error);

    return () => {
      mounted = false;
      stop();
    };
  }, [pdf, settings.eyeTrackingEnabled, start, stop, calibrate]);

  const toggleTracking = useCallback(async () => {
    if (isTracking) {
      stop();
    } else if (settings.eyeTrackingEnabled) {
      await start();
      if (!useEyeTurnStore.getState().isCalibrated) {
        calibrate();
      }
    }
  }, [isTracking, stop, start, calibrate, settings.eyeTrackingEnabled]);

  useKeyboardShortcuts({ onToggleTracking: toggleTracking });

  if (!pdf) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Toolbar />
      <PDFViewer />
      <SettingsPanel onRecalibrate={calibrate} onToggleTracking={toggleTracking} />
      <CalibrationOverlay />
      <WebcamPreview />
      <BlinkIndicator />
      <DebugOverlay />
    </div>
  );
}
