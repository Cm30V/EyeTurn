import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function loadPdfDocument(data: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: data.slice(0) });
  const pdf = await loadingTask.promise;
  return pdf;
}

export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number,
  renderTaskRef?: { current: RenderTask | null }
) {
  if (renderTaskRef?.current) {
    renderTaskRef.current.cancel();
    renderTaskRef.current = null;
  }

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get canvas context");

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderTask = page.render({
    canvasContext: context,
    viewport,
  });

  if (renderTaskRef) {
    renderTaskRef.current = renderTask;
  }

  try {
    await renderTask.promise;
  } catch (error) {
    const err = error as { name?: string };
    if (err.name === "RenderingCancelledException") {
      return { width: viewport.width, height: viewport.height, cancelled: true };
    }
    throw error;
  } finally {
    if (renderTaskRef?.current === renderTask) {
      renderTaskRef.current = null;
    }
  }

  return { width: viewport.width, height: viewport.height, cancelled: false };
}

export { pdfjsLib };
