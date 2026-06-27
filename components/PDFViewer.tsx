"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEyeTurnStore } from "@/lib/store";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf";

export function PDFViewer() {
  const { pdf, currentPage, zoom, setTotalPages } = useEyeTurnStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState(false);
  const [renderSize, setRenderSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!pdf) return;

    let cancelled = false;

    const load = async () => {
      try {
        const doc = await loadPdfDocument(pdf.data);
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      setPdfDoc(null);
    };
  }, [pdf, setTotalPages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const doc = pdfDoc;
    const canvas = canvasRef.current;
    if (!doc || !canvas || !pdf) return;

    let cancelled = false;

    const render = async () => {
      setIsRendering(true);
      try {
        const fitScale =
          containerSize.width > 0 && containerSize.height > 0
            ? Math.min(
                (containerSize.width - 32) / 612,
                (containerSize.height - 32) / 792
              )
            : 1;
        const scale = Math.max(0.5, fitScale * zoom);
        const result = await renderPageToCanvas(
          doc,
          currentPage,
          canvas,
          scale,
          renderTaskRef
        );
        if (!cancelled && !result.cancelled) {
          setRenderSize({ width: result.width, height: result.height });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to render page:", err);
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    render();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pdf, currentPage, zoom, containerSize.width, containerSize.height]);

  if (!pdf) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-[var(--text-secondary)]">
        No PDF loaded. Upload a file or try demo mode.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-auto p-4"
    >
      <div
        className="relative"
        style={{ width: renderSize.width || "auto", height: renderSize.height || "auto" }}
      >
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="relative shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            className={`max-w-full rounded-lg bg-white ${isRendering ? "opacity-80" : "opacity-100"}`}
          />
        </motion.div>
      </div>
    </div>
  );
}
