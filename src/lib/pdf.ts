import jsPDF from "jspdf";
import type { BrandSettings } from "./brand";
import { computeTotals, type Invoice, type Proposal } from "./doc-types";

const M = 40;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function moneyStr(n: number, sym: string) {
  return `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function drawHeader(doc: jsPDF, brand: BrandSettings, title: string, number: string) {
  const w = doc.internal.pageSize.getWidth();
  const [pr, pg, pb] = hexToRgb(brand.primary);
  const [ar, ag, ab] = hexToRgb(brand.accent);

  // Top gradient band (simulated with two rectangles)
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, w, 90, "F");
  doc.setFillColor(ar, ag, ab);
  doc.setGState(new (doc as any).GState({ opacity: 0.35 }));
  doc.rect(w * 0.55, 0, w * 0.45, 90, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // Left side ribbon
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 90, 6, doc.internal.pageSize.getHeight() - 90, "F");

  // Monogram/logo tile
  if (brand.logoDataUrl) {
    try { doc.addImage(brand.logoDataUrl, "PNG", M, 22, 46, 46); } catch {}
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 22, 46, 46, 10, 10, "F");
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(brand.companyName.charAt(0).toUpperCase(), M + 14, 54);
  }

  // Company info
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(brand.companyName, M + 58, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(brand.tagline, M + 58, 54);
  doc.setFontSize(8);
  doc.text(`${brand.email}  ·  ${brand.phone}  ·  ${brand.website}`, M + 58, 66);

  // Title block right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(title.toUpperCase(), w - M, 44, { align: "right" });
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`# ${number}`, w - M, 62, { align: "right" });

  return 120;
}

function drawFooter(doc: jsPDF, brand: BrandSettings) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const [pr, pg, pb] = hexToRgb(brand.primary);
  const [ar, ag, ab] = hexToRgb(brand.accent);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.4);
  doc.line(M, h - 42, w - M, h - 42);
  doc.setFillColor(ar, ag, ab);
  doc.rect(M, h - 42, 60, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(`${brand.companyName}  ·  ${brand.website}  ·  GSTIN ${brand.gstin}`, M, h - 26);
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.text("Made with Vinshare", w - M, h - 26, { align: "right" });
}

function drawParties(doc: jsPDF, brand: BrandSettings, inv: Invoice | Proposal, y: number) {
  const w = doc.internal.pageSize.getWidth();
  const [pr, pg, pb] = hexToRgb(brand.primary);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(M, y, w - M * 2, 88, 10, 10, "F");
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.4);
  doc.line(w / 2, y + 12, w / 2, y + 76);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text("FROM", M + 16, y + 20);
  doc.text("BILLED TO", w / 2 + 16, y + 20);

  doc.setTextColor(30, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(brand.companyName, M + 16, y + 36);
  doc.text(inv.clientName || "—", w / 2 + 16, y + 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  const fromLines = [brand.address, `GSTIN: ${brand.gstin}`, brand.email];
  const toLines = [inv.clientAddress || "", inv.clientEmail || ""];
  fromLines.forEach((l, i) => doc.text(l, M + 16, y + 50 + i * 12));
  toLines.forEach((l, i) => doc.text(l, w / 2 + 16, y + 50 + i * 12));

  // Meta row
  const metaY = y + 88 + 14;
  const isInv = "dueDate" in inv;
  doc.setFillColor(pr, pg, pb);
  doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.roundedRect(M, metaY - 12, w - M * 2, 26, 6, 6, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("ISSUE DATE", M + 12, metaY - 2);
  doc.text(isInv ? "DUE DATE" : "VALID UNTIL", M + 180, metaY - 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 40);
  doc.text(inv.issueDate || "—", M + 12, metaY + 10);
  doc.text((isInv ? (inv as Invoice).dueDate : (inv as Proposal).validUntil) || "—", M + 180, metaY + 10);

  return metaY + 30;
}

function drawItemsTable(doc: jsPDF, brand: BrandSettings, items: Invoice["items"], startY: number) {
  const w = doc.internal.pageSize.getWidth();
  const [pr, pg, pb] = hexToRgb(brand.primary);
  const cols = [
    { label: "Description", x: M, w: w - M * 2 - 260 },
    { label: "Qty",  x: w - M - 260, w: 50, align: "right" as const },
    { label: "Rate", x: w - M - 200, w: 70, align: "right" as const },
    { label: "Tax",  x: w - M - 120, w: 45, align: "right" as const },
    { label: "Amount", x: w - M - 75,  w: 75, align: "right" as const },
  ];
  let y = startY;
  // rounded header pill
  doc.setFillColor(pr, pg, pb);
  doc.roundedRect(M, y, w - M * 2, 28, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DESCRIPTION", cols[0].x + 12, y + 18);
  ["Qty", "Rate", "Tax", "Amount"].forEach((lbl, i) => {
    const c = cols[i + 1];
    doc.text(lbl.toUpperCase(), c.x + c.w, y + 18, { align: "right" });
  });
  y += 30;

  doc.setTextColor(30, 30, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  items.forEach((it, i) => {
    const gross = it.qty * it.rate;
    const net = gross - gross * (it.discountPct / 100);
    const amt = net + net * (it.taxPct / 100);
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 253);
      doc.rect(M, y, w - M * 2, 24, "F");
    }
    const desc = doc.splitTextToSize(it.description || "—", cols[0].w - 16);
    doc.text(desc[0] || "—", cols[0].x + 12, y + 16);
    doc.text(String(it.qty), cols[1].x + cols[1].w, y + 16, { align: "right" });
    doc.text(moneyStr(it.rate, brand.currency), cols[2].x + cols[2].w, y + 16, { align: "right" });
    doc.text(`${it.taxPct}%`, cols[3].x + cols[3].w, y + 16, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(moneyStr(amt, brand.currency), cols[4].x + cols[4].w, y + 16, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 24;
    if (y > doc.internal.pageSize.getHeight() - 140) {
      drawFooter(doc, brand); doc.addPage(); y = M;
    }
  });
  return y;
}

function drawTotals(doc: jsPDF, brand: BrandSettings, items: Invoice["items"], startY: number) {
  const w = doc.internal.pageSize.getWidth();
  const [pr, pg, pb] = hexToRgb(brand.primary);
  const [ar, ag, ab] = hexToRgb(brand.accent);
  const totals = computeTotals(items);
  let y = startY + 14;
  const boxX = w - M - 240;
  const boxW = 240;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const rows: [string, number][] = [
    ["Subtotal", totals.subtotal],
    ["Discount", -totals.discount],
    ["Tax", totals.tax],
  ];
  rows.forEach(([label, val]) => {
    doc.text(label, boxX, y);
    doc.text(moneyStr(val, brand.currency), boxX + boxW, y, { align: "right" });
    y += 16;
  });
  y += 6;
  // Gradient total card (two rects)
  doc.setFillColor(pr, pg, pb);
  doc.roundedRect(boxX - 10, y - 4, boxW + 10, 40, 10, 10, "F");
  doc.setFillColor(ar, ag, ab);
  doc.setGState(new (doc as any).GState({ opacity: 0.4 }));
  doc.roundedRect(boxX - 10 + (boxW + 10) * 0.45, y - 4, (boxW + 10) * 0.55, 40, 10, 10, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", boxX, y + 20);
  doc.setFontSize(18);
  doc.text(moneyStr(totals.total, brand.currency), boxX + boxW, y + 22, { align: "right" });
  return y + 50;
}

export function downloadInvoicePDF(inv: Invoice, brand: BrandSettings) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = drawHeader(doc, brand, "Invoice", inv.number);
  y = drawParties(doc, brand, inv, y);
  y = drawItemsTable(doc, brand, inv.items, y);
  y = drawTotals(doc, brand, inv.items, y);

  const w = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(120);
  doc.text("BANK DETAILS", M, y + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(70);
  brand.bankDetails.split("\n").forEach((l, i) => doc.text(l, M, y + 20 + i * 12));

  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(120);
  doc.text("TERMS", w / 2, y + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(70);
  (inv.terms || brand.defaultTerms).split("\n").forEach((l, i) => doc.text(l, w / 2, y + 20 + i * 12));

  drawFooter(doc, brand);
  doc.save(`${inv.number || "invoice"}.pdf`);
}

export function downloadProposalPDF(pr: Proposal, brand: BrandSettings) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const [pR, pG, pB] = hexToRgb(brand.primary);
  let y = drawHeader(doc, brand, "Proposal", pr.number);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 30);
  doc.text(pr.title || "Proposal", M, y + 6);
  y += 30;

  y = drawParties(doc, brand, pr, y);

  pr.sections.forEach((s) => {
    if (y > doc.internal.pageSize.getHeight() - 160) { drawFooter(doc, brand); doc.addPage(); y = M; }
    doc.setFillColor(pR, pG, pB);
    doc.roundedRect(M, y, 4, 20, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20, 20, 30);
    doc.text(s.heading || "Section", M + 14, y + 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(85);
    const lines = doc.splitTextToSize(s.body || "", doc.internal.pageSize.getWidth() - M * 2 - 14);
    doc.text(lines, M + 14, y + 32);
    y += 32 + lines.length * 13 + 16;
  });

  if (pr.items.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 200) { drawFooter(doc, brand); doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20, 20, 30);
    doc.text("Investment", M, y);
    y = drawItemsTable(doc, brand, pr.items, y + 12);
    y = drawTotals(doc, brand, pr.items, y);
  }

  if (pr.terms) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(120);
    doc.text("TERMS", M, y + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(70);
    (pr.terms || brand.defaultTerms).split("\n").forEach((l, i) => doc.text(l, M, y + 26 + i * 12));
  }

  drawFooter(doc, brand);
  doc.save(`${pr.number || "proposal"}.pdf`);
}
