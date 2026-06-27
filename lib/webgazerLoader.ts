import type { WebGazerInstance } from "@/types";
import { isMobileOrTablet } from "@/utils/device";

const WEBGAZER_SCRIPT = "/webgazer/webgazer.js";
const FACE_MESH_PATH = "/webgazer/mediapipe/face_mesh";

let loadPromise: Promise<WebGazerInstance> | null = null;

export function configureWebGazer(wg: WebGazerInstance): void {
  wg.params.faceMeshSolutionPath = FACE_MESH_PATH;

  const mobile = typeof window !== "undefined" && isMobileOrTablet();
  wg.params.camConstraints = {
    video: {
      facingMode: "user",
      width: mobile ? { ideal: 640, max: 1280 } : { min: 320, ideal: 640, max: 1920 },
      height: mobile ? { ideal: 480, max: 720 } : { min: 240, ideal: 480, max: 1080 },
    },
  };
}

export function loadWebGazer(): Promise<WebGazerInstance> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("WebGazer can only load in the browser"));
  }

  if (window.webgazer) {
    configureWebGazer(window.webgazer);
    return Promise.resolve(window.webgazer);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${WEBGAZER_SCRIPT}"]`
      );
      if (existing) {
        existing.addEventListener("load", () => {
          if (window.webgazer) {
            configureWebGazer(window.webgazer);
            resolve(window.webgazer);
          } else {
            reject(new Error("WebGazer script loaded but global is missing"));
          }
        });
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load WebGazer script"))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = WEBGAZER_SCRIPT;
      script.async = true;
      script.onload = () => {
        if (!window.webgazer) {
          reject(new Error("WebGazer script loaded but global is missing"));
          return;
        }
        configureWebGazer(window.webgazer);
        resolve(window.webgazer);
      };
      script.onerror = () => reject(new Error("Failed to load WebGazer script"));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

export async function getWebGazerInstance(): Promise<WebGazerInstance | null> {
  if (typeof window === "undefined") return null;
  try {
    return await loadWebGazer();
  } catch {
    return null;
  }
}
