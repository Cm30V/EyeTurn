"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEyeTurnStore } from "@/lib/store";
import { savePdf } from "@/lib/pdfStorage";
import { generateId } from "@/utils/gaze";
import { loadPdfDocument } from "@/lib/pdf";
import { DEMO_PDF_PATH } from "@/utils/gaze";
import { isIOS, isMobileOrTablet } from "@/utils/device";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPdf = useEyeTurnStore((s) => s.setPdf);
  const [mobileHint, setMobileHint] = useState<string | null>(null);

  useEffect(() => {
    if (!isMobileOrTablet()) return;
    setMobileHint(
      isIOS()
        ? "On iPhone/iPad: open over HTTPS, then tap Enable camera in the viewer."
        : "On mobile: tap Enable camera in the viewer after loading a PDF."
    );
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const buffer = await file.arrayBuffer();
      const doc = await loadPdfDocument(buffer);
      const pdfState = {
        id: generateId(),
        name: file.name,
        data: buffer,
        pageCount: doc.numPages,
      };
      await savePdf(pdfState);
      setPdf(pdfState);
      router.push("/viewer");
    },
    [router, setPdf]
  );

  const onUploadClick = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDemoClick = async () => {
    const res = await fetch(DEMO_PDF_PATH);
    const buffer = await res.arrayBuffer();
    const doc = await loadPdfDocument(buffer);
    const pdfState = {
      id: generateId(),
      name: "Demo Sheet Music.pdf",
      data: buffer,
      pageCount: doc.numPages,
    };
    await savePdf(pdfState);
    setPdf(pdfState);
    router.push("/viewer");
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg text-center"
      >
        <div className="glass-panel rounded-[2rem] p-8 sm:p-14">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">EyeTurn</h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Hands-free sheet music using blink detection.
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Works on Mac, Windows, iPhone, and iPad — same app, front-camera blink tracking.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onUploadClick}
              className="min-h-[3rem] rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-medium text-white shadow-lg transition hover:opacity-90 active:opacity-80"
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={onDemoClick}
              className="min-h-[3rem] rounded-2xl border border-[var(--glass-border)] px-8 py-4 text-base font-medium transition hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10"
            >
              Demo Mode
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        <p className="mt-8 text-sm text-[var(--text-secondary)]">
          Uses your front camera to detect blinks. All PDFs stay in your browser.
        </p>
        {mobileHint && (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">{mobileHint}</p>
        )}
      </motion.div>
    </main>
  );
}
