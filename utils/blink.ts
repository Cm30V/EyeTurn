import type { LandmarkPoint } from "@/types";

/**
 * MediaPipe Face Mesh (468 landmarks) — standard EAR indices.
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * @see https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 */
export const MEDIAPIPE_LEFT_EAR = [362, 385, 387, 263, 373, 380] as const;
export const MEDIAPIPE_RIGHT_EAR = [33, 159, 158, 133, 153, 144] as const;
export const MEDIAPIPE_LANDMARK_COUNT = 468;

function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Single-eye EAR from six MediaPipe landmark indices. */
export function eyeAspectRatio(
  landmarks: LandmarkPoint[],
  indices: readonly number[]
): number | null {
  const points = indices.map((i) => landmarks[i]);
  if (points.some((p) => !p)) return null;

  const [p1, p2, p3, p4, p5, p6] = points as LandmarkPoint[];
  const vertical1 = dist(p2, p6);
  const vertical2 = dist(p3, p5);
  const horizontal = dist(p1, p4);

  if (horizontal === 0) return null;
  return (vertical1 + vertical2) / (2 * horizontal);
}

/** Average EAR across both eyes — primary blink signal. */
export function computeEar(landmarks: LandmarkPoint[] | null): number | null {
  if (!landmarks || landmarks.length < MEDIAPIPE_LANDMARK_COUNT) return null;

  const left = eyeAspectRatio(landmarks, MEDIAPIPE_LEFT_EAR);
  const right = eyeAspectRatio(landmarks, MEDIAPIPE_RIGHT_EAR);

  if (left === null && right === null) return null;
  if (left === null) return right;
  if (right === null) return left;
  return (left + right) / 2;
}

const EAR_SMOOTH_ALPHA = 0.55;

export function smoothEar(previous: number | null, current: number): number {
  if (previous === null) return current;
  return previous + EAR_SMOOTH_ALPHA * (current - previous);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Threshold between open and closed EAR after calibration blinks. */
export function computeEarThreshold(openEar: number, closedEar: number): number {
  return (openEar + closedEar) / 2;
}

/** Initial threshold before closed-eye samples exist (step 2 start). */
export function provisionalEarThreshold(openEar: number): number {
  return openEar * 0.75;
}

/** True when EAR has dropped below the blink threshold (eye closing). */
export function isEarClosed(ear: number, threshold: number): boolean {
  return ear < threshold;
}

export const MIN_BLINK_CLOSED_MS = 15;
export const MAX_BLINK_CLOSED_MS = 700;
export const MIN_BLINK_GAP_MS = 15;
export const DEFAULT_OPEN_EAR = 0.25;

export interface BlinkFrameState {
  eyesClosed: boolean;
  closedSince: number;
  lastBlinkAt: number;
  minEarWhileClosed: number;
}

/**
 * MediaPipe + EAR blink counter: count one blink when EAR drops below threshold
 * then rises back above it (drop → rise cycle).
 */
export function processEarBlinkFrame(
  ear: number | null,
  threshold: number,
  state: BlinkFrameState,
  now: number,
  onBlink: (minEar: number) => void
): void {
  if (ear === null) return;

  const closed = isEarClosed(ear, threshold);

  if (closed && !state.eyesClosed) {
    state.eyesClosed = true;
    state.closedSince = now;
    state.minEarWhileClosed = ear;
    return;
  }

  if (closed && state.eyesClosed) {
    state.minEarWhileClosed = Math.min(state.minEarWhileClosed, ear);
    return;
  }

  if (!closed && state.eyesClosed) {
    const closedDuration = now - state.closedSince;
    const gap = now - state.lastBlinkAt;

    if (
      closedDuration >= MIN_BLINK_CLOSED_MS &&
      closedDuration <= MAX_BLINK_CLOSED_MS &&
      gap >= MIN_BLINK_GAP_MS
    ) {
      onBlink(state.minEarWhileClosed);
      state.lastBlinkAt = now;
    }

    state.eyesClosed = false;
    state.minEarWhileClosed = 1;
  }
}

export function createBlinkFrameState(): BlinkFrameState {
  return {
    eyesClosed: false,
    closedSince: 0,
    lastBlinkAt: 0,
    minEarWhileClosed: 1,
  };
}
