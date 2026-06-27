import type { TurnPageBlinkPattern } from "@/types";

/** Relative tolerance when matching inter-blink timing to the learned pattern. */
export const PATTERN_INTERVAL_TOLERANCE = 0.65;

/** Relative tolerance for total burst duration. */
export const PATTERN_DURATION_TOLERANCE = 0.55;

export const TURN_PATTERN_BLINK_COUNT = 3;

export function computeInterBlinkMs(timestamps: number[]): number[] {
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  return intervals;
}

export function buildTurnPagePattern(timestamps: number[]): TurnPageBlinkPattern {
  const interBlinkMs = computeInterBlinkMs(timestamps);
  const totalDurationMs =
    timestamps.length >= 2 ? timestamps[timestamps.length - 1] - timestamps[0] : 0;
  const avgInterBlinkMs =
    interBlinkMs.length > 0
      ? interBlinkMs.reduce((a, b) => a + b, 0) / interBlinkMs.length
      : 0;
  const maxGapMs =
    interBlinkMs.length > 0 ? Math.max(...interBlinkMs) * 1.75 : 500;

  return {
    blinkCount: timestamps.length,
    interBlinkMs,
    avgInterBlinkMs,
    totalDurationMs,
    maxGapMs,
  };
}

function intervalMatches(actual: number, expected: number): boolean {
  const margin = Math.max(expected * PATTERN_INTERVAL_TOLERANCE, 90);
  return actual >= expected - margin && actual <= expected + margin;
}

/** True when blink count and timing match the calibrated turn-page gesture. */
export function matchesTurnPagePattern(
  timestamps: number[],
  pattern: TurnPageBlinkPattern
): boolean {
  if (timestamps.length !== pattern.blinkCount) return false;
  if (pattern.blinkCount < 2) return false;

  const intervals = computeInterBlinkMs(timestamps);
  if (intervals.length !== pattern.interBlinkMs.length) return false;

  const intervalsOk = intervals.every((interval, i) =>
    intervalMatches(interval, pattern.interBlinkMs[i])
  );
  if (!intervalsOk) return false;

  const duration = timestamps[timestamps.length - 1] - timestamps[0];
  const durationMargin = Math.max(
    pattern.totalDurationMs * PATTERN_DURATION_TOLERANCE,
    200
  );

  return (
    duration >= pattern.totalDurationMs - durationMargin &&
    duration <= pattern.totalDurationMs + durationMargin
  );
}

export function formatPatternSummary(pattern: TurnPageBlinkPattern): string {
  const avg = Math.round(pattern.avgInterBlinkMs);
  const total = Math.round(pattern.totalDurationMs);
  return `${pattern.blinkCount} blinks · ~${avg}ms apart · ${total}ms total`;
}

export function formatIntervals(intervals: number[]): string {
  if (intervals.length === 0) return "—";
  return intervals.map((ms) => `${Math.round(ms)}ms`).join(", ");
}
