import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public");
const outPath = path.join(outDir, "demo-sheet.pdf");

async function main() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  for (let pageNum = 1; pageNum <= 5; pageNum++) {
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    page.drawText("EyeTurn Demo Sheet Music", {
      x: 72,
      y: height - 72,
      size: 22,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Page ${pageNum} of 5`, {
      x: 72,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const staffTop = height - 200;
    for (let staff = 0; staff < 4; staff++) {
      const yBase = staffTop - staff * 120;
      for (let line = 0; line < 5; line++) {
        page.drawLine({
          start: { x: 72, y: yBase - line * 12 },
          end: { x: width - 72, y: yBase - line * 12 },
          thickness: 0.8,
          color: rgb(0, 0, 0),
        });
      }
      page.drawText("q = 120    mf    Allegro", {
        x: 90,
        y: yBase - 36,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });
    }

    page.drawText("Look at the trigger box to turn the page", {
      x: 72,
      y: 60,
      size: 11,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const bytes = await pdfDoc.save();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, bytes);
  console.log(`Created ${outPath}`);
}

main();
