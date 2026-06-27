declare module "webgazer" {
  interface WebGazerPrediction {
    x: number;
    y: number;
  }

  interface WebGazerModule {
    setRegression: (type: string) => WebGazerModule;
    setGazeListener: (
      callback: (data: WebGazerPrediction | null, elapsedTime?: number) => void
    ) => WebGazerModule;
    begin: () => Promise<WebGazerModule>;
    pause: () => WebGazerModule;
    end: () => WebGazerModule;
    showVideoPreview: (show: boolean) => WebGazerModule;
    showPredictionPoints: (show: boolean) => WebGazerModule;
    showFaceOverlay: (show: boolean) => WebGazerModule;
    showFaceFeedbackBox: (show: boolean) => WebGazerModule;
    applyKalmanFilter: (apply: boolean) => WebGazerModule;
    clearData: () => Promise<void>;
    setTracker: (tracker: string) => WebGazerModule;
    getVideoElementCanvas: () => HTMLCanvasElement | null;
    recordScreenPosition: (x: number, y: number, eventType?: string) => WebGazerModule;
    params: {
      showVideo: boolean;
      showFaceOverlay: boolean;
      showFaceFeedbackBox: boolean;
      showPredictionPoints: boolean;
    };
  }

  const webgazer: WebGazerModule;
  export default webgazer;
}
