import type { BlinkCalibration, SettingsState } from "@/types";
import { matchesTurnPagePattern } from "@/utils/blinkPattern";

export type BlinkPageAction = "next" | "prev" | null;

export interface BlinkRangeSettings {
  nextPageBlinksMin: number;
  nextPageBlinksMax: number;
  prevPageBlinksMin: number;
  prevPageBlinksMax: number;
}

const MAX_BLINKS = 12;

export function rangesOverlap(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number
): boolean {
  return aMin <= bMax && bMin <= aMax;
}

/** Enforce min ≤ max per range and next range strictly before previous (no overlap). */
export function normalizeBlinkRanges(settings: SettingsState): SettingsState {
  let nextMin = clamp(Math.round(settings.nextPageBlinksMin), 1, MAX_BLINKS);
  let nextMax = clamp(Math.round(settings.nextPageBlinksMax), 1, MAX_BLINKS);
  let prevMin = clamp(Math.round(settings.prevPageBlinksMin), 1, MAX_BLINKS);
  let prevMax = clamp(Math.round(settings.prevPageBlinksMax), 1, MAX_BLINKS);

  if (nextMin > nextMax) [nextMin, nextMax] = [nextMax, nextMin];
  if (prevMin > prevMax) [prevMin, prevMax] = [prevMax, prevMin];

  if (nextMax >= prevMin) {
    prevMin = nextMax + 1;
    if (prevMin > prevMax) prevMax = prevMin;
  }

  if (prevMin <= nextMax) {
    nextMax = Math.max(1, prevMin - 1);
    if (nextMin > nextMax) nextMin = nextMax;
  }

  return {
    ...settings,
    nextPageBlinksMin: nextMin,
    nextPageBlinksMax: nextMax,
    prevPageBlinksMin: prevMin,
    prevPageBlinksMax: prevMax,
  };
}

export function migrateBlinkSettings(
  raw: Partial<SettingsState> & Record<string, unknown>
): SettingsState {
  const hasRanges =
    typeof raw.nextPageBlinksMin === "number" &&
    typeof raw.nextPageBlinksMax === "number";

  if (hasRanges) {
    return normalizeBlinkRanges({ ...defaultBlinkRangeFields(), ...raw } as SettingsState);
  }

  const legacyNext =
    typeof raw.blinksForNextPage === "number" ? raw.blinksForNextPage : 3;
  const legacyPrev =
    typeof raw.blinksForPreviousPage === "number" ? raw.blinksForPreviousPage : 5;

  return normalizeBlinkRanges({
    ...defaultBlinkRangeFields(),
    ...raw,
    nextPageBlinksMin: Math.max(1, legacyNext - 1),
    nextPageBlinksMax: legacyNext,
    prevPageBlinksMin: legacyPrev,
    prevPageBlinksMax: legacyPrev,
  } as SettingsState);
}

export function defaultBlinkRangeFields(): BlinkRangeSettings {
  return {
    nextPageBlinksMin: 2,
    nextPageBlinksMax: 3,
    prevPageBlinksMin: 5,
    prevPageBlinksMax: 6,
  };
}

export function resolvePageAction(
  blinkTimestamps: number[],
  calibration: BlinkCalibration,
  settings: SettingsState
): BlinkPageAction {
  const count = blinkTimestamps.length;

  if (count >= settings.nextPageBlinksMin && count <= settings.nextPageBlinksMax) {
    return "next";
  }

  if (
    calibration.turnPagePattern &&
    matchesTurnPagePattern(blinkTimestamps, calibration.turnPagePattern)
  ) {
    return "next";
  }

  if (count >= settings.prevPageBlinksMin && count <= settings.prevPageBlinksMax) {
    return "prev";
  }

  return null;
}

export function formatBlinkRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
