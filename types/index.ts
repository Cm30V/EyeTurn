export interface TurnPageBlinkPattern {
  blinkCount: number;
  interBlinkMs: number[];
  avgInterBlinkMs: number;
  totalDurationMs: number;
  maxGapMs: number;
}

export interface BlinkCalibration {
  openEar: number;
  closedEar: number;
  threshold: number;
  turnPagePattern: TurnPageBlinkPattern | null;
}

export interface SettingsState {
  nextPageBlinksMin: number;
  nextPageBlinksMax: number;
  prevPageBlinksMin: number;
  prevPageBlinksMax: number;
  blinkConfirmMs: number;
  cooldownMs: number;
  showWebcamPreview: boolean;
  eyeTrackingEnabled: boolean;
  debugMode: boolean;
  darkMode: boolean;
}

export type LandmarkPoint = [number, number, number?];

export interface WebGazerEye {
  width: number;
  height: number;
}

export interface WebGazerEyeFeatures {
  left: WebGazerEye;
  right: WebGazerEye;
}

export interface WebGazerPrediction {
  x: number;
  y: number;
  eyeFeatures?: WebGazerEyeFeatures | null;
}

export interface PdfDocumentState {
  id: string;
  name: string;
  data: ArrayBuffer;
  pageCount: number;
}

declare global {
  interface Window {
    webgazer?: WebGazerInstance;
  }
}

export interface WebGazerTracker {
  getPositions: () => number[][] | null;
  name: string;
}

export interface WebGazerInstance {
  setRegression: (type: string) => WebGazerInstance;
  setGazeListener: (
    callback: (data: WebGazerPrediction | null, elapsedTime?: number) => void
  ) => WebGazerInstance;
  begin: () => Promise<WebGazerInstance>;
  pause: () => WebGazerInstance;
  end: () => WebGazerInstance;
  showVideoPreview: (show: boolean) => WebGazerInstance;
  showPredictionPoints: (show: boolean) => WebGazerInstance;
  showFaceOverlay: (show: boolean) => WebGazerInstance;
  showFaceFeedbackBox: (show: boolean) => WebGazerInstance;
  applyKalmanFilter: (apply: boolean) => WebGazerInstance;
  clearData: () => Promise<void>;
  setTracker: (tracker: string) => WebGazerInstance;
  getTracker: () => WebGazerTracker;
  getVideoElementCanvas: () => HTMLCanvasElement | null;
  recordScreenPosition: (x: number, y: number, eventType?: string) => WebGazerInstance;
  isReady: () => boolean;
  resume: () => Promise<WebGazerInstance>;
  params: {
    faceMeshSolutionPath: string;
    showVideo: boolean;
    showFaceOverlay: boolean;
    showFaceFeedbackBox: boolean;
    showPredictionPoints: boolean;
  };
}
