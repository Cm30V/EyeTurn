"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEyeTurnStore } from "@/lib/store";
import { loadLatestPdf } from "@/lib/pdfStorage";
import { PDFViewer } from "@/components/PDFViewer";
import { Toolbar } from "@/components/Toolbar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CalibrationOverlay } from "@/components/CalibrationOverlay";
import { CameraPrompt } from "@/components/CameraPrompt";
import { WebcamPreview } from "@/components/WebcamPreview";
import { DebugOverlay } from "@/components/DebugOverlay";
import { BlinkIndicator } from "@/components/BlinkIndicator";
import { useGazeTracker } from "@/hooks/useGazeTracker";
import { useBlinkDetector } from "@/hooks/useBlinkDetector";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { requiresCameraUserGesture } from "@/utils/device";

export default function ViewerPage() {
  const router = useRouter();
  const pdf = useEyeTurnStore((s) => s.pdf);
  const setPdf = useEyeTurnStore((s) => s.setPdf);
  const settings = useEyeTurnStore((s) => s.settings);
  const isCalibrated = useEyeTurnStore((s) => s.isCalibrated);
  const isCalibrating = useEyeTurnStore((s) => s.isCalibrating);
  const {
    start,
    stop,
    calibrate,
    isTracking,
    isStarting,
    cameraError,
  } = useGazeTracker();

  const [needsCameraTap, setNeedsCameraTap] = useState(false);

  useBlinkDetector();

  useEffect(() => {
    setNeedsCameraTap(requiresCameraUserGesture());
  }, []);

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
    if (!pdf || !settings.eyeTrackingEnabled || needsCameraTap) return;

    let mounted = true;

    const boot = async () => {
      const started = await start();
      if (
        mounted &&
        started &&
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
  }, [pdf, settings.eyeTrackingEnabled, needsCameraTap, start, stop, calibrate]);

  const enableCamera = useCallback(async () => {
    const started = await start();
    if (started && !isCalibrated && !isCalibrating) {
      calibrate();
    }
  }, [start, calibrate, isCalibrated, isCalibrating]);

  const toggleTracking = useCallback(async () => {
    if (isTracking) {
      stop();
    } else if (settings.eyeTrackingEnabled) {
      const started = await start();
      if (started && !useEyeTurnStore.getState().isCalibrated) {
        calibrate();
      }
    }
  }, [isTracking, stop, start, calibrate, settings.eyeTrackingEnabled]);

  useKeyboardShortcuts({ onToggleTracking: toggleTracking });

  const showCameraPrompt =
    needsCameraTap &&
    settings.eyeTrackingEnabled &&
    !isTracking &&
    !isCalibrating &&
    !!pdf;

  if (!pdf) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col pt-[env(safe-area-inset-top)]">
      <Toolbar />
      <PDFViewer />
      <SettingsPanel onRecalibrate={calibrate} onToggleTracking={toggleTracking} />
      {showCameraPrompt && (
        <CameraPrompt
          onEnable={enableCamera}
          isStarting={isStarting}
          error={cameraError}
        />
      )}
      <CalibrationOverlay />
      <WebcamPreview />
      <BlinkIndicator />
      <DebugOverlay />
    </div>
  );
}
