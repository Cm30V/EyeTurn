"use client";

import { useEffect, useRef } from "react";
import { useEyeTurnStore } from "@/lib/store";
import { getWebGazerInstance } from "@/hooks/useGazeTracker";

export function WebcamPreview() {
  const showPreview = useEyeTurnStore((s) => s.settings.showWebcamPreview);
  const isTracking = useEyeTurnStore((s) => s.isTracking);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showPreview || !isTracking) return;

    let raf = 0;
    let active = true;

    const drawFrame = async () => {
      if (!active) return;
      const wg = await getWebGazerInstance();
      const src = wg?.getVideoElementCanvas?.();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (src && canvas && ctx && src.width > 0) {
        canvas.width = 144;
        canvas.height = 108;
        ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
      }

      raf = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [showPreview, isTracking]);

  if (!showPreview || !isTracking) return null;

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 overflow-hidden rounded-2xl border border-white/20 shadow-glass glass-panel">
      <canvas
        ref={canvasRef}
        className="block h-28 w-36 object-cover"
        style={{ transform: "scaleX(-1)" }}
        aria-label="Webcam preview"
      />
      <div className="absolute bottom-1 left-1 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white">
        Live
      </div>
    </div>
  );
}
