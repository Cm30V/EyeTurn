"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebGazerInstance } from "@/types";
import { useEyeTurnStore } from "@/lib/store";
import { getWebGazerInstance, loadWebGazer } from "@/lib/webgazerLoader";
import { getMediaPipeLandmarks } from "@/lib/mediapipeEar";
import { computeEar, smoothEar } from "@/utils/blink";

function hideWebGazerUi(wg: WebGazerInstance) {
  wg.showVideoPreview(false);
  wg.showPredictionPoints(false);
  wg.showFaceOverlay(false);
  wg.showFaceFeedbackBox(false);
  wg.applyKalmanFilter(true);
}

export function useGazeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const wgRef = useRef<WebGazerInstance | null>(null);
  const smoothEarRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const activeRef = useRef(false);

  const { setIsTracking: setStoreTracking, setCurrentEar, settings } = useEyeTurnStore();

  const updateEarFromLandmarks = useCallback(
    (wg: WebGazerInstance | null) => {
      const landmarks = getMediaPipeLandmarks(wg);
      const rawEar = computeEar(landmarks);
      if (rawEar === null) {
        smoothEarRef.current = null;
        setCurrentEar(null);
        return;
      }
      const smoothed = smoothEar(smoothEarRef.current, rawEar);
      smoothEarRef.current = smoothed;
      setCurrentEar(smoothed);
    },
    [setCurrentEar]
  );

  const start = useCallback(async () => {
    if (!settings.eyeTrackingEnabled || startingRef.current || activeRef.current) {
      return;
    }

    startingRef.current = true;

    try {
      const wg = await loadWebGazer();
      wgRef.current = wg;

      wg.setRegression("ridge");
      wg.setGazeListener(() => {
        updateEarFromLandmarks(wgRef.current);
      });
      hideWebGazerUi(wg);

      if (wg.isReady?.()) {
        await wg.resume();
      } else {
        await wg.begin();
      }

      hideWebGazerUi(wg);
      activeRef.current = true;
      setIsTracking(true);
      setStoreTracking(true);
    } catch (err) {
      console.error("Failed to start WebGazer:", err);
      activeRef.current = false;
      setIsTracking(false);
      setStoreTracking(false);
    } finally {
      startingRef.current = false;
    }
  }, [setStoreTracking, settings.eyeTrackingEnabled, updateEarFromLandmarks]);

  const stop = useCallback(() => {
    const wg = wgRef.current;
    if (wg) {
      wg.pause();
      hideWebGazerUi(wg);
    }
    smoothEarRef.current = null;
    setCurrentEar(null);
    activeRef.current = false;
    setIsTracking(false);
    setStoreTracking(false);
  }, [setCurrentEar, setStoreTracking]);

  const calibrate = useCallback(() => {
    smoothEarRef.current = null;
    const store = useEyeTurnStore.getState();
    store.setIsCalibrated(false);
    store.setBlinkCalibration(null);
    store.setSessionBlinkCount(0);
    store.setSessionBlinkTimestamps([]);
    store.setCalibrationBlinkCount(0);
    store.setCalibrationPhase("open");
    store.setCalibrationProgress(0);
    store.setIsCalibrating(true);
  }, []);

  useEffect(() => {
    return () => {
      wgRef.current?.pause();
      activeRef.current = false;
    };
  }, []);

  return {
    isTracking,
    start,
    stop,
    calibrate,
    webgazer: wgRef,
  };
}

export { getWebGazerInstance };

export async function clearCalibrationData() {
  const wg = await getWebGazerInstance();
  if (wg) {
    await wg.clearData();
  }
  useEyeTurnStore.getState().setBlinkCalibration(null);
  useEyeTurnStore.getState().setIsCalibrated(false);
}
