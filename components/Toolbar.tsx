"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useEyeTurnStore } from "@/lib/store";

export function Toolbar() {
  const {
    currentPage,
    totalPages,
    zoom,
    setZoom,
    nextPage,
    prevPage,
    isFullscreen,
    setFullscreen,
    setSettingsOpen,
    isTracking,
  } = useEyeTurnStore();

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, [setFullscreen]);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--glass-border)] glass-panel px-4 py-3">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="rounded-lg px-2 py-1 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          EyeTurn
        </Link>
        <span className="hidden text-sm text-[var(--text-secondary)] sm:inline">
          {currentPage} / {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <ToolbarButton onClick={prevPage} disabled={currentPage <= 1} label="Previous page">
          ←
        </ToolbarButton>
        <span className="min-w-[4rem] text-center text-sm sm:hidden">
          {currentPage}/{totalPages}
        </span>
        <ToolbarButton onClick={nextPage} disabled={currentPage >= totalPages} label="Next page">
          →
        </ToolbarButton>

        <div className="mx-1 hidden h-6 w-px bg-[var(--glass-border)] sm:block" />

        <ToolbarButton onClick={() => setZoom(zoom - 0.25)} disabled={zoom <= 0.5} label="Zoom out">
          −
        </ToolbarButton>
        <span className="hidden min-w-[3rem] text-center text-xs text-[var(--text-secondary)] sm:inline">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton onClick={() => setZoom(zoom + 0.25)} disabled={zoom >= 3} label="Zoom in">
          +
        </ToolbarButton>

        <div className="mx-1 hidden h-6 w-px bg-[var(--glass-border)] sm:block" />

        <ToolbarButton onClick={toggleFullscreen} label="Toggle fullscreen">
          {isFullscreen ? "⤢" : "⛶"}
        </ToolbarButton>

        <ToolbarButton onClick={() => setSettingsOpen(true)} label="Settings">
          ⚙
        </ToolbarButton>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isTracking
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-gray-500/15 text-[var(--text-secondary)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          />
          {isTracking ? "Tracking" : "Off"}
        </span>
      </div>
    </header>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 min-w-9 items-center justify-center rounded-xl text-sm font-medium transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
