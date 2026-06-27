"use client";

import { useEffect, useRef } from "react";
import { useEyeTurnStore } from "@/lib/store";
import { getWebGazerInstance } from "@/lib/webgazerLoader";
import { getEarFromWebGazer } from "@/lib/mediapipeEar";
import { resolvePageAction } from "@/utils/blinkRanges";
import {
  buildTurnPagePattern,
  TURN_PATTERN_BLINK_COUNT,
} from "@/utils/blinkPattern";
import {
  computeEarThreshold,
  provisionalEarThreshold,
  median,
  DEFAULT_OPEN_EAR,
  createBlinkFrameState,
  processEarBlinkFrame,
} from "@/utils/blink";

const OPEN_CALIBRATION_MS = 2200;

export function useBlinkDetector() {
  const isCalibrating = useEyeTurnStore((s) => s.isCalibrating);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimestampsRef = useRef<number[]>([]);
  const calibrationTimestampsRef = useRef<number[]>([]);
  const blinkStateRef = useRef({
    ...createBlinkFrameState(),
    openSamples: [] as number[],
    closedSamples: [] as number[],
    openStartedAt: 0,
  });

  useEffect(() => {
    if (!isCalibrating) return;
    blinkStateRef.current = {
      ...createBlinkFrameState(),
      openSamples: [],
      closedSamples: [],
      openStartedAt: 0,
    };
    sessionTimestampsRef.current = [];
    calibrationTimestampsRef.current = [];
    useEyeTurnStore.getState().setSessionBlinkTimestamps([]);
    useEyeTurnStore.getState().setCalibrationBlinkCount(0);
  }, [isCalibrating]);

  useEffect(() => {
    let raf = 0;
    let active = true;

    const scheduleConfirm = (delayMs: number) => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        const current = useEyeTurnStore.getState();
        const timestamps = [...sessionTimestampsRef.current];
        const action =
          current.blinkCalibration &&
          resolvePageAction(timestamps, current.blinkCalibration, current.settings);

        if (action === "next") current.nextPage();
        else if (action === "prev") current.prevPage();

        sessionTimestampsRef.current = [];
        current.setSessionBlinkCount(0);
        current.setSessionBlinkTimestamps([]);

        if (action) {
          current.setIsInCooldown(true);
          setTimeout(() => {
            useEyeTurnStore.getState().setIsInCooldown(false);
          }, current.settings.cooldownMs);
        }
      }, delayMs);
    };

    const registerBlink = (minEar: number, isCalibration: boolean) => {
      const now = performance.now();
      const store = useEyeTurnStore.getState();

      if (isCalibration) {
        calibrationTimestampsRef.current.push(now);
        blinkStateRef.current.closedSamples.push(minEar);
        const count = calibrationTimestampsRef.current.length;
        store.setCalibrationBlinkCount(count);
        store.setCalibrationProgress(count / TURN_PATTERN_BLINK_COUNT);
        return count;
      }

      sessionTimestampsRef.current.push(now);
      const timestamps = [...sessionTimestampsRef.current];
      store.setSessionBlinkTimestamps(timestamps);
      store.setSessionBlinkCount(timestamps.length);
      scheduleConfirm(store.settings.blinkConfirmMs);
      return timestamps.length;
    };

    const tick = async () => {
      if (!active) return;

      const store = useEyeTurnStore.getState();
      const {
        isTracking,
        isCalibrating,
        isInCooldown,
        isCalibrated,
        blinkCalibration,
        settings,
        calibrationPhase,
        currentEar,
      } = store;

      if (!isTracking || !settings.eyeTrackingEnabled) {
        raf = requestAnimationFrame(tick);
        return;
      }

      let ear = currentEar;
      if (ear === null) {
        const wg = await getWebGazerInstance();
        ear = getEarFromWebGazer(wg);
        if (ear !== null) store.setCurrentEar(ear);
      }

      const state = blinkStateRef.current;
      const now = performance.now();

      if (isCalibrating && calibrationPhase === "open") {
        if (state.openStartedAt === 0) state.openStartedAt = now;
        if (ear !== null) state.openSamples.push(ear);

        store.setCalibrationProgress(
          Math.min((now - state.openStartedAt) / OPEN_CALIBRATION_MS, 1)
        );

        if (now - state.openStartedAt >= OPEN_CALIBRATION_MS) {
          const openEar = Math.max(
            median(state.openSamples) || DEFAULT_OPEN_EAR,
            DEFAULT_OPEN_EAR * 0.5
          );
          state.openSamples = [];
          state.closedSamples = [];
          calibrationTimestampsRef.current = [];
          state.lastBlinkAt = 0;
          store.setBlinkCalibration({
            openEar,
            closedEar: openEar * 0.5,
            threshold: provisionalEarThreshold(openEar),
            turnPagePattern: null,
          });
          store.setCalibrationPhase("learnTurn");
          store.setCalibrationProgress(0);
          store.setCalibrationBlinkCount(0);
        }

        raf = requestAnimationFrame(tick);
        return;
      }

      if (isCalibrating && calibrationPhase === "learnTurn") {
        const cal = store.blinkCalibration;
        if (!cal) {
          raf = requestAnimationFrame(tick);
          return;
        }

        processEarBlinkFrame(ear, cal.threshold, state, now, (minEar) => {
          const count = registerBlink(minEar, true);

          if (count >= TURN_PATTERN_BLINK_COUNT) {
            const timestamps = calibrationTimestampsRef.current;
            const closedEar = median(state.closedSamples);
            const pattern = buildTurnPagePattern(timestamps);

            store.setBlinkCalibration({
              openEar: cal.openEar,
              closedEar,
              threshold: computeEarThreshold(cal.openEar, closedEar),
              turnPagePattern: pattern,
            });
            store.setIsCalibrated(true);
            store.setIsCalibrating(false);
            store.setCalibrationPhase(null);
            store.setCalibrationProgress(1);
            calibrationTimestampsRef.current = [];
            state.closedSamples = [];
          }
        });

        raf = requestAnimationFrame(tick);
        return;
      }

      if (!isCalibrated || !blinkCalibration || isInCooldown || ear === null) {
        raf = requestAnimationFrame(tick);
        return;
      }

      processEarBlinkFrame(ear, blinkCalibration.threshold, state, now, (minEar) => {
        registerBlink(minEar, false);
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);
}
