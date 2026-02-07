import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Patient, Order, Service, Nurse, Payment } from '@medplus/db';
import { COLORS, FONTS, LAYOUT } from './templates/styles';
import { getContractContent } from './templates/contract';
import { getConsentContent } from './templates/consent';
import { getServiceActContent } from './templates/service-act';
import { getReceiptContent } from './templates/receipt';

interface DocumentSection {
  heading: string;
  body: string;
}

/**
 * Render a structured document to a PDF and return bytes.
 */
async function renderPdf(
  title: string,
  sections: DocumentSection[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  let y = height - LAYOUT.marginTop;
  const maxWidth = width - LAYOUT.marginLeft - LAYOUT.marginRight;

  // Title
  const titleWidth = fontBold.widthOfTextAtSize(title, FONTS.titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: FONTS.titleSize,
    font: fontBold,
    color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b),
  });
  y -= FONTS.titleSize + LAYOUT.lineSpacing * 2;

  // Sections
  for (const section of sections) {
    // Check if we need a new page
    if (y < LAYOUT.marginBottom + 60) {
      page = doc.addPage([595, 842]);
      y = height - LAYOUT.marginTop;
    }

    // Heading
    if (section.heading) {
      page.drawText(section.heading, {
        x: LAYOUT.marginLeft,
        y,
        size: FONTS.headingSize,
        font: fontBold,
        color: rgb(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b),
      });
      y -= FONTS.headingSize + 6;
    }

    // Body text (handle multi-line)
    const lines = section.body.split('\n');
    for (const line of lines) {
      // Wrap long lines
      const wrappedLines = wrapText(line, font, FONTS.bodySize, maxWidth);
      for (const wrappedLine of wrappedLines) {
        if (y < LAYOUT.marginBottom) {
          page = doc.addPage([595, 842]);
          y = height - LAYOUT.marginTop;
        }
        page.drawText(wrappedLine, {
          x: LAYOUT.marginLeft,
          y,
          size: FONTS.bodySize,
          font,
          color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b),
        });
        y -= LAYOUT.lineSpacing;
      }
    }

    y -= LAYOUT.lineSpacing; // Extra spacing between sections
  }

  // Footer on every page
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const footerText = `MedPlus | Страница ${i + 1} из ${pages.length}`;
    const footerWidth = font.widthOfTextAtSize(footerText, FONTS.smallSize);
    p.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 30,
      size: FONTS.smallSize,
      font,
      color: rgb(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b),
    });
  }

  return doc.save();
}

/**
 * Wrap text to fit within a maximum width.
 */
function wrapText(
  text: string,
  font: { widthOfTextAtSize(text: string, size: number): number },
  fontSize: number,
  maxWidth: number
): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ============================================================
// Public API — one function per document type
// ============================================================

export async function generateContract(
  patient: Patient,
  order: Order,
  service: Service
): Promise<Uint8Array> {
  const { title, sections } = getContractContent(patient, order, service);
  return renderPdf(title, sections);
}

export async function generateConsent(
  patient: Patient,
  service: Service
): Promise<Uint8Array> {
  const { title, sections } = getConsentContent(patient, service);
  return renderPdf(title, sections);
}

export async function generateServiceAct(
  patient: Patient,
  order: Order,
  service: Service,
  nurse: Nurse
): Promise<Uint8Array> {
  const { title, sections } = getServiceActContent(patient, order, service, nurse);
  return renderPdf(title, sections);
}

export async function generateReceipt(
  order: Order,
  payment: Payment,
  patientName: string,
  serviceName: string
): Promise<Uint8Array> {
  const { title, sections } = getReceiptContent(order, payment, patientName, serviceName);
  return renderPdf(title, sections);
}
