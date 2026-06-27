import { create } from "zustand";
import { migrateBlinkSettings, normalizeBlinkRanges } from "@/utils/blinkRanges";
import { persist } from "zustand/middleware";
import type { PdfDocumentState, SettingsState, BlinkCalibration } from "@/types";

interface EyeTurnState {
  pdf: PdfDocumentState | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  isFullscreen: boolean;

  isTracking: boolean;
  isCalibrated: boolean;
  isCalibrating: boolean;
  isInCooldown: boolean;

  blinkCalibration: BlinkCalibration | null;
  currentEar: number | null;
  sessionBlinkCount: number;
  sessionBlinkTimestamps: number[];
  calibrationPhase: "open" | "learnTurn" | null;
  calibrationProgress: number;
  calibrationBlinkCount: number;

  settings: SettingsState;
  settingsOpen: boolean;

  setPdf: (pdf: PdfDocumentState | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (count: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  setFullscreen: (value: boolean) => void;

  setIsTracking: (value: boolean) => void;
  setIsCalibrated: (value: boolean) => void;
  setIsCalibrating: (value: boolean) => void;
  setIsInCooldown: (value: boolean) => void;
  setBlinkCalibration: (calibration: BlinkCalibration | null) => void;
  setCurrentEar: (ear: number | null) => void;
  setSessionBlinkCount: (count: number) => void;
  setSessionBlinkTimestamps: (timestamps: number[]) => void;
  setCalibrationPhase: (phase: "open" | "learnTurn" | null) => void;
  setCalibrationProgress: (progress: number) => void;
  setCalibrationBlinkCount: (count: number) => void;

  updateSettings: (settings: Partial<SettingsState>) => void;
  setSettingsOpen: (open: boolean) => void;
}

const defaultSettings: SettingsState = normalizeBlinkRanges({
  nextPageBlinksMin: 2,
  nextPageBlinksMax: 3,
  prevPageBlinksMin: 5,
  prevPageBlinksMax: 6,
  blinkConfirmMs: 350,
  cooldownMs: 600,
  showWebcamPreview: true,
  eyeTrackingEnabled: true,
  debugMode: false,
  darkMode: false,
});

export const useEyeTurnStore = create<EyeTurnState>()(
  persist(
    (set, get) => ({
      pdf: null,
      currentPage: 1,
      totalPages: 0,
      zoom: 1,
      isFullscreen: false,

      isTracking: false,
      isCalibrated: false,
      isCalibrating: false,
      isInCooldown: false,

      blinkCalibration: null,
      currentEar: null,
      sessionBlinkCount: 0,
      sessionBlinkTimestamps: [],
      calibrationPhase: null,
      calibrationProgress: 0,
      calibrationBlinkCount: 0,

      settings: defaultSettings,
      settingsOpen: false,

      setPdf: (pdf) => set({ pdf, currentPage: 1 }),
      setCurrentPage: (page) => {
        const { totalPages } = get();
        if (totalPages === 0) return;
        set({ currentPage: Math.max(1, Math.min(page, totalPages)) });
      },
      setTotalPages: (count) => set({ totalPages: count }),
      nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages) {
          set({ currentPage: currentPage + 1, sessionBlinkCount: 0, sessionBlinkTimestamps: [] });
        }
      },
      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1, sessionBlinkCount: 0, sessionBlinkTimestamps: [] });
        }
      },
      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(zoom, 3)) }),
      setFullscreen: (value) => set({ isFullscreen: value }),

      setIsTracking: (value) => set({ isTracking: value }),
      setIsCalibrated: (value) => set({ isCalibrated: value }),
      setIsCalibrating: (value) => set({ isCalibrating: value }),
      setIsInCooldown: (value) => set({ isInCooldown: value }),
      setBlinkCalibration: (calibration) => set({ blinkCalibration: calibration }),
      setCurrentEar: (ear) => set({ currentEar: ear }),
      setSessionBlinkCount: (count) => set({ sessionBlinkCount: count }),
      setSessionBlinkTimestamps: (timestamps) => set({ sessionBlinkTimestamps: timestamps }),
      setCalibrationPhase: (phase) => set({ calibrationPhase: phase }),
      setCalibrationProgress: (progress) => set({ calibrationProgress: progress }),
      setCalibrationBlinkCount: (count) => set({ calibrationBlinkCount: count }),

      updateSettings: (settings) =>
        set((state) => ({
          settings: normalizeBlinkRanges({ ...state.settings, ...settings }),
        })),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
    }),
    {
      name: "eyeturn-v4",
      merge: (persisted, current) => {
        const p = persisted as Partial<typeof current> & Record<string, unknown>;
        const rawCalibration = p.blinkCalibration as BlinkCalibration | null | undefined;
        const blinkCalibration = rawCalibration
          ? { ...rawCalibration, turnPagePattern: rawCalibration.turnPagePattern ?? null }
          : null;

        return {
          ...current,
          ...p,
          blinkCalibration,
          settings: migrateBlinkSettings({
            ...defaultSettings,
            ...(p.settings as Partial<SettingsState> | undefined),
            ...(p as Record<string, unknown>),
          }),
        };
      },
      partialize: (state) => ({
        blinkCalibration: state.blinkCalibration,
        settings: state.settings,
        isCalibrated: state.isCalibrated,
      }),
    }
  )
);
