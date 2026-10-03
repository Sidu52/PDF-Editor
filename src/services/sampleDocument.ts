import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates a professional 2-page sample invoice PDF in-memory for quick testing and demonstration.
 */
export async function createSampleInvoicePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // --- Page 1: Modern Invoice ---
  const page1 = pdfDoc.addPage([612, 792]); // US Letter size
  const { height } = page1.getSize();

  // Top header bar
  page1.drawRectangle({
    x: 40,
    y: height - 100,
    width: 532,
    height: 60,
    color: rgb(0.12, 0.25, 0.55),
  });

  page1.drawText('INVOICE / STATEMENT', {
    x: 60,
    y: height - 65,
    size: 20,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('ACME CLOUD SOLUTIONS INC.', {
    x: 370,
    y: height - 65,
    size: 11,
    font: helvetica,
    color: rgb(0.9, 0.95, 1.0),
  });

  // Invoice Details
  page1.drawText('Invoice Number:', {
    x: 60,
    y: height - 135,
    size: 11,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('INV-2026-8849', {
    x: 160,
    y: height - 135,
    size: 11,
    font: helvetica,
    color: rgb(0.1, 0.3, 0.8),
  });

  page1.drawText('Invoice Date:', {
    x: 60,
    y: height - 155,
    size: 11,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('September 18, 2026', {
    x: 160,
    y: height - 155,
    size: 11,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  page1.drawText('Due Date:', {
    x: 60,
    y: height - 175,
    size: 11,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('October 18, 2026', {
    x: 160,
    y: height - 175,
    size: 11,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Billed To
  page1.drawText('Billed To:', {
    x: 350,
    y: height - 135,
    size: 11,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('Global Enterprises LLC', {
    x: 350,
    y: height - 155,
    size: 11,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });
  page1.drawText('742 Evergreen Terrace', {
    x: 350,
    y: height - 172,
    size: 10,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  page1.drawText('Springfield, OR 97477', {
    x: 350,
    y: height - 187,
    size: 10,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Table header
  page1.drawRectangle({
    x: 40,
    y: height - 230,
    width: 532,
    height: 24,
    color: rgb(0.93, 0.95, 0.98),
  });

  page1.drawText('Item Description', {
    x: 55,
    y: height - 222,
    size: 10,
    font: helveticaBold,
    color: rgb(0.2, 0.25, 0.35),
  });
  page1.drawText('Qty', {
    x: 330,
    y: height - 222,
    size: 10,
    font: helveticaBold,
    color: rgb(0.2, 0.25, 0.35),
  });
  page1.drawText('Rate', {
    x: 410,
    y: height - 222,
    size: 10,
    font: helveticaBold,
    color: rgb(0.2, 0.25, 0.35),
  });
  page1.drawText('Amount', {
    x: 500,
    y: height - 222,
    size: 10,
    font: helveticaBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Table rows
  const items = [
    { desc: 'Cloud Infrastructure Hosting (Monthly)', qty: '1', rate: '$1,200.00', amt: '$1,200.00' },
    { desc: 'Database Clustering & Replication Service', qty: '2', rate: '$450.00', amt: '$900.00' },
    { desc: 'AI Vector Search API Tier Enterprise', qty: '1', rate: '$850.00', amt: '$850.00' },
    { desc: '24/7 Dedicated Technical Support SLA', qty: '1', rate: '$500.00', amt: '$500.00' },
  ];

  let currentY = height - 260;
  for (const item of items) {
    page1.drawText(item.desc, { x: 55, y: currentY, size: 10, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
    page1.drawText(item.qty, { x: 335, y: currentY, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    page1.drawText(item.rate, { x: 410, y: currentY, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    page1.drawText(item.amt, { x: 500, y: currentY, size: 10, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
    currentY -= 30;
  }

  // Summary box
  page1.drawRectangle({
    x: 370,
    y: currentY - 60,
    width: 202,
    height: 70,
    color: rgb(0.96, 0.97, 0.99),
  });

  page1.drawText('Subtotal:', { x: 385, y: currentY - 20, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText('$3,450.00', { x: 490, y: currentY - 20, size: 10, font: helvetica, color: rgb(0.2, 0.2, 0.2) });

  page1.drawText('Tax (8.5%):', { x: 385, y: currentY - 38, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText('$293.25', { x: 490, y: currentY - 38, size: 10, font: helvetica, color: rgb(0.2, 0.2, 0.2) });

  page1.drawText('Total Balance:', { x: 385, y: currentY - 56, size: 11, font: helveticaBold, color: rgb(0.1, 0.3, 0.8) });
  page1.drawText('$3,743.25', { x: 485, y: currentY - 56, size: 11, font: helveticaBold, color: rgb(0.1, 0.3, 0.8) });

  // Footer note
  page1.drawText('Thank you for your business. Please remit payment within 30 days.', {
    x: 60,
    y: 80,
    size: 9,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5),
  });
  page1.drawText('Page 1 of 2', {
    x: 510,
    y: 80,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- Page 2: Terms & Notes ---
  const page2 = pdfDoc.addPage([612, 792]);
  const h2 = page2.getSize().height;

  page2.drawText('TERMS AND CONDITIONS', {
    x: 60,
    y: h2 - 70,
    size: 16,
    font: helveticaBold,
    color: rgb(0.15, 0.25, 0.45),
  });

  const terms = [
    '1. Payment is due in full within 30 days of the invoice issuance date.',
    '2. Overdue accounts will incur a finance charge of 1.5% per month or the highest rate permitted by law.',
    '3. All service agreements are governed by the Cloud Services Master Agreement.',
    '4. Inquiries regarding this statement should be directed to billing@acmecloud.com.',
  ];

  let termY = h2 - 110;
  for (const term of terms) {
    page2.drawText(term, {
      x: 60,
      y: termY,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    termY -= 28;
  }

  page2.drawText('Authorized Signature: _______________________', {
    x: 60,
    y: h2 - 270,
    size: 11,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
  });

  page2.drawText('Page 2 of 2', {
    x: 510,
    y: 80,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}
