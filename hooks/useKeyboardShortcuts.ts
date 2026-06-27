"use client";

import { useEffect } from "react";
import { useEyeTurnStore } from "@/lib/store";

interface UseKeyboardShortcutsOptions {
  onToggleTracking?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { nextPage, prevPage, isFullscreen, setFullscreen } = useEyeTurnStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          nextPage();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevPage();
          break;
        case " ":
          e.preventDefault();
          options.onToggleTracking?.();
          break;
        case "Escape":
          if (isFullscreen) {
            e.preventDefault();
            setFullscreen(false);
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage, isFullscreen, setFullscreen, options]);
}
