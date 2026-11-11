import jsPDF from 'jspdf';

// ---------- helpers ----------

const money = (v) => Number(v || 0).toFixed(2);

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${h ? ONES[h] + ' Hundred' : ''}${h && rest ? ' ' : ''}${rest ? twoDigits(rest) : ''}`;
};

/** Indian-format amount in words: "One Thousand Seven Hundred Forty Rupees and Fifty Paise Only" */
export function amountToWords(amount) {
  const value = Number(amount || 0);
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let words = '';
  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  const rest = rem % 1000;

  if (crore) words += `${threeDigits(crore)} Crore `;
  if (lakh) words += `${threeDigits(lakh)} Lakh `;
  if (thousand) words += `${threeDigits(thousand)} Thousand `;
  if (rest) words += `${threeDigits(rest)} `;
  words = words.trim() + ' Rupees';

  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return words + ' Only';
}

const fmtDate = (value) => {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
};

const fmtDateTime = (value) => {
  const d = new Date(value);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${fmtDate(value)}, ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

/**
 * Build a professional A4 invoice PDF for a bill.
 * Returns the jsPDF document — caller decides: save() or autoPrint + open.
 */
export function generateInvoicePDF(bill) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();   // 210
  const M = 14;
  const RIGHT = PW - M;
  const BLUE = [30, 58, 138];
  const DARK = [31, 41, 55];
  const GRAY = [107, 114, 128];
  const LIGHT = [243, 244, 246];
  const GREEN_BG = [220, 252, 231];
  const GREEN_TX = [21, 128, 61];

  // ---------------- Header band ----------------
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('CARLIGHT', M, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('P R E M I U M   C A R   W A S H   S E R V I C E S', M, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('TAX INVOICE', RIGHT, 19, { align: 'right' });

  let y = 40;

  // ---------------- Billed-to vs invoice details ----------------
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO', M, y);
  doc.text('INVOICE DETAILS', RIGHT, y, { align: 'right' });

  y += 5.5;
  doc.setDrawColor(222, 226, 230);
  doc.line(M, y - 2, M + 80, y - 2);
  doc.line(RIGHT - 70, y - 2, RIGHT, y - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(bill.customerName || '-', M, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Phone: ${bill.phoneNumber ? '+91 ' + bill.phoneNumber : '-'}`, M, y + 9.5);
  doc.text(`Vehicle: ${bill.carNo || '-'}${bill.carType ? ` (${String(bill.carType).replace(/_/g, ' ')})` : ''}`, M, y + 15);

  doc.setFontSize(9);
  const metaLines = [
    ['Invoice No:', bill.invoiceNo || '-'],
    ['Invoice Date:', fmtDateTime(bill.createdAt)],
    ['Bill ID:', String(bill.billId ?? '-')],
    ['Payment Method:', String(bill.paymentMethod || '-').replace(/_/g, ' ')],
    ['Served By:', bill.createdBy || '-']
  ];
  let my = y + 1.5;
  metaLines.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, RIGHT - 70, my);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(String(val), RIGHT, my, { align: 'right' });
    my += 5.5;
  });

  y = Math.max(y + 20, my) + 4;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Service location: ${bill.outletName || '-'}`, M, y);
  y += 6;

  // ---------------- Items table ----------------
  doc.setFillColor(...DARK);
  doc.rect(M, y, PW - 2 * M, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', M + 2, y + 5.5);
  doc.text('DESCRIPTION', M + 10, y + 5.5);
  doc.text('AMOUNT (RS.)', RIGHT - 2, y + 5.5, { align: 'right' });
  y += 8;

  const items = [];
  // For fast/manual billing, packagePrice is 0 but totalAmount holds the manual amount
  const carWashAmt = (bill.packagePrice || 0) > 0 ? (bill.packagePrice || 0) : (Number(bill.totalAmount) || 0);
  items.push({ desc: `Car Wash — ${bill.packageName || 'MANUAL / FAST BILLING'}`, amt: carWashAmt });
  (bill.extras || []).forEach(x => items.push({ desc: `Extra: ${x.name}`, amt: x.price }));
  (bill.additionalCharges || []).forEach(c => items.push({ desc: c.title, amt: c.amount }));

  let subtotal = 0;
  items.forEach((item, i) => {
    subtotal += Number(item.amt) || 0;
    if (i % 2 === 1) {
      doc.setFillColor(...LIGHT);
      doc.rect(M, y, PW - 2 * M, 7, 'F');
    }
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(String(i + 1), M + 2, y + 5);
    doc.text(String(item.desc).slice(0, 70), M + 10, y + 5);
    doc.text(money(item.amt), RIGHT - 2, y + 5, { align: 'right' });
    y += 7;
  });

  // ---------------- Price breakup ----------------
  const manualDiscount = Number(bill.discount) || 0;
  const couponDiscount = Number(bill.couponDiscount) || 0;
  const totalPaid = Number(bill.totalAmount) || Math.max(0, subtotal - manualDiscount - couponDiscount);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Subtotal', RIGHT - 60, y);
  doc.text(money(subtotal), RIGHT - 2, y, { align: 'right' });
  y += 6;

  if (manualDiscount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text('Discount', RIGHT - 60, y);
    doc.text(`- ${money(manualDiscount)}`, RIGHT - 2, y, { align: 'right' });
    y += 6;
  }

  if (couponDiscount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Coupon${bill.couponCode ? ` (${bill.couponCode})` : ''}`, RIGHT - 60, y);
    doc.text(`- ${money(couponDiscount)}`, RIGHT - 2, y, { align: 'right' });
    y += 6;
  }

  // Total paid — highlighted band
  y += 2;
  doc.setFillColor(...GREEN_BG);
  doc.setDrawColor(...GREEN_TX);
  doc.setLineWidth(0.4);
  doc.rect(RIGHT - 85, y, 85, 12, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...GREEN_TX);
  doc.text('TOTAL PAID', RIGHT - 81, y + 8);
  doc.setFontSize(13);
  doc.text(`Rs. ${money(totalPaid)}`, RIGHT - 4, y + 8, { align: 'right' });
  y += 17;

  // Amount in words
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const wordsLine = doc.splitTextToSize(`Amount in words: ${amountToWords(totalPaid)}`, PW - 2 * M);
  doc.text(wordsLine, M, y);
  y += wordsLine.length * 4 + 4;

  // ---------------- Footer ----------------
  doc.setDrawColor(222, 226, 230);
  doc.line(M, y, RIGHT, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLUE);
  doc.text('Thank you for choosing CarLight!', PW / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('This is a computer-generated invoice and does not require a signature.', PW / 2, y, { align: 'center' });

  y += 4;
  doc.text(`Generated on ${fmtDateTime(new Date())}`, PW / 2, y, { align: 'center' });

  return doc;
}