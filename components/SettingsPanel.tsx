"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEyeTurnStore } from "@/lib/store";
import { clearCalibrationData } from "@/hooks/useGazeTracker";
import { removePdf } from "@/lib/pdfStorage";
import { generateId } from "@/utils/gaze";
import { formatBlinkRange } from "@/utils/blinkRanges";
import { formatPatternSummary } from "@/utils/blinkPattern";

interface SettingsPanelProps {
  onRecalibrate: () => void;
  onToggleTracking: () => void;
}

export function SettingsPanel({ onRecalibrate, onToggleTracking }: SettingsPanelProps) {
  const router = useRouter();
  const {
    settingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    isTracking,
    pdf,
    setPdf,
    blinkCalibration,
  } = useEyeTurnStore();

  const handleRecalibrate = async () => {
    await clearCalibrationData();
    onRecalibrate();
  };

  const handleRemovePdf = async () => {
    if (pdf) {
      await removePdf(pdf.id);
      setPdf(null);
      setSettingsOpen(false);
      router.push("/");
    }
  };

  const handleReplacePdf = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const buffer = await file.arrayBuffer();
      const { loadPdfDocument } = await import("@/lib/pdf");
      const doc = await loadPdfDocument(buffer);
      const { savePdf } = await import("@/lib/pdfStorage");
      if (pdf) await removePdf(pdf.id);
      const next = {
        id: generateId(),
        name: file.name,
        data: buffer,
        pageCount: doc.numPages,
      };
      await savePdf(next);
      setPdf(next);
      setSettingsOpen(false);
    };
    input.click();
  };

  const gap = settings.prevPageBlinksMin - settings.nextPageBlinksMax - 1;
  const turnPattern = blinkCalibration?.turnPagePattern;

  return (
    <>
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col glass-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-5">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Close settings"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Next page ·{" "}
                    {formatBlinkRange(
                      settings.nextPageBlinksMin,
                      settings.nextPageBlinksMax
                    )}{" "}
                    blinks
                  </p>
                  <SettingSlider
                    label="Next — minimum"
                    value={settings.nextPageBlinksMin}
                    min={1}
                    max={10}
                    step={1}
                    unit=""
                    onChange={(v) => updateSettings({ nextPageBlinksMin: v })}
                  />
                  <SettingSlider
                    label="Next — maximum"
                    value={settings.nextPageBlinksMax}
                    min={1}
                    max={10}
                    step={1}
                    unit=""
                    onChange={(v) => updateSettings({ nextPageBlinksMax: v })}
                  />
                  {turnPattern && (
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-xs dark:bg-white/5">
                      <p className="font-medium">Learned rhythm (from calibration)</p>
                      <p className="mt-1 text-[var(--text-secondary)]">
                        {formatPatternSummary(turnPattern)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Previous page ·{" "}
                    {formatBlinkRange(
                      settings.prevPageBlinksMin,
                      settings.prevPageBlinksMax
                    )}{" "}
                    blinks
                  </p>
                  <SettingSlider
                    label="Previous — minimum"
                    value={settings.prevPageBlinksMin}
                    min={1}
                    max={12}
                    step={1}
                    unit=""
                    onChange={(v) =>
                      updateSettings({ prevPageBlinksMin: v })
                    }
                  />
                  <SettingSlider
                    label="Previous — maximum"
                    value={settings.prevPageBlinksMax}
                    min={1}
                    max={12}
                    step={1}
                    unit=""
                    onChange={(v) =>
                      updateSettings({ prevPageBlinksMax: v })
                    }
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)]">
                  Ranges cannot overlap. Gap between ranges:{" "}
                  {gap >= 0 ? `${gap + 1} blink${gap === 0 ? "" : "s"}` : "invalid — adjusting…"}
                </p>

                <SettingSlider
                  label="Pause after last blink"
                  value={settings.blinkConfirmMs}
                  min={200}
                  max={1500}
                  step={50}
                  unit="ms"
                  onChange={(v) => updateSettings({ blinkConfirmMs: v })}
                />
                <SettingSlider
                  label="Cooldown after turn"
                  value={settings.cooldownMs}
                  min={300}
                  max={2500}
                  step={100}
                  unit="ms"
                  onChange={(v) => updateSettings({ cooldownMs: v })}
                />

                <p className="text-xs text-[var(--text-secondary)]">
                  Blink rapidly in succession — each drop/rise EAR cycle counts. Pause briefly
                  after your last blink to confirm the page turn.
                </p>

                <div className="space-y-3">
                  <ToggleRow
                    label="Blink tracking"
                    checked={settings.eyeTrackingEnabled}
                    onChange={(v) => updateSettings({ eyeTrackingEnabled: v })}
                  />
                  <ToggleRow
                    label="Webcam preview"
                    checked={settings.showWebcamPreview}
                    onChange={(v) => updateSettings({ showWebcamPreview: v })}
                  />
                  <ToggleRow
                    label="Dark mode"
                    checked={settings.darkMode}
                    onChange={(v) => updateSettings({ darkMode: v })}
                  />
                  <ToggleRow
                    label="Debug overlay"
                    checked={settings.debugMode}
                    onChange={(v) => updateSettings({ debugMode: v })}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRecalibrate}
                    className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Recalibrate blinks
                  </button>
                  <button
                    type="button"
                    onClick={onToggleTracking}
                    className="rounded-xl border border-[var(--glass-border)] px-4 py-3 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {isTracking ? "Stop tracking" : "Start tracking"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReplacePdf}
                    className="rounded-xl border border-[var(--glass-border)] px-4 py-3 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Replace PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="rounded-xl border border-red-500/30 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
                  >
                    Remove PDF
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-[var(--text-secondary)]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[var(--accent)]" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
