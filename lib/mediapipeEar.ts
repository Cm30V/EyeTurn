import type { LandmarkPoint, WebGazerInstance } from "@/types";
import { computeEar } from "@/utils/blink";

/** Read MediaPipe 468-point landmarks from WebGazer's Face Mesh tracker. */
export function getMediaPipeLandmarks(
  webgazer: WebGazerInstance | null | undefined
): LandmarkPoint[] | null {
  if (!webgazer) return null;
  const positions = webgazer.getTracker()?.getPositions?.();
  if (!positions || positions.length < 468) return null;
  return positions as LandmarkPoint[];
}

export function getEarFromWebGazer(
  webgazer: WebGazerInstance | null | undefined
): number | null {
  return computeEar(getMediaPipeLandmarks(webgazer));
}
