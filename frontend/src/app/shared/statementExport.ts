import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StudentProfile, StatementItem, AgeAnalysis, BursaryItem } from '../types';

export function createStatementPdf(student: StudentProfile, statements: StatementItem[], age?: AgeAnalysis, bursaries: BursaryItem[] = [], logo?: Uint8Array) {
  const pdf = new jsPDF();
  const money = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '';
  const table = (title: string, head: string[], body: string[][]) => {
    pdf.setFontSize(14);
    pdf.text(title, 14, 20);
    autoTable(pdf, { startY: 27, head: [head], body, margin: { top: 15, bottom: 18 },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: [30, 45, 85] }, rowPageBreak: 'avoid' });
  };
  if (logo) pdf.addImage(logo, 'PNG', 14, 12, 22, 24);
  pdf.setFontSize(16); pdf.text('Statement of Account', 43, 20);
  pdf.setFontSize(9); pdf.text('University of Venda | Student app export', 43, 27);
  autoTable(pdf, { startY: 42, theme: 'plain', styles: { fontSize: 10 }, body: [
    ['Account holder', student.fullName], ['Student number', student.studentNumber],
    ['Statement date', student.dateOfBalance || 'Unavailable'],
    ['Balance (ZAR)', money(student.currentAccountBalance)], ['Total debits (ZAR)', money(student.totalDebit)], ['Total credits (ZAR)', money(student.totalCredit)],
  ] });
  pdf.setFontSize(9); pdf.text('Export of the account data displayed in the student app.', 14, 115);
  pdf.addPage();
  table('Fee Detail (Ledger)', ['Date', 'Reference', 'Description', 'Debit (ZAR)', 'Credit (ZAR)', 'Balance (ZAR)'],
    statements.map(item => [item.date, item.reference ?? '', item.description, money(item.debit), money(item.credit), money(item.balance)]));
  if (age) {
    pdf.addPage();
    table('Age Analysis', ['Period', 'Amount (ZAR)'], [
      ['160 days', money(age.d160)], ['90 days', money(age.d90)], ['60 days', money(age.d60)], ['30 days', money(age.d30)],
      ['Current', money(age.current)], ['Credit', money(age.credit)], ['Future', money(age.future)], ['Unallocated', money(age.unallocated)], ['Balance', money(age.balance)],
    ]);
  }
  if (bursaries.length) {
    pdf.addPage();
    table('Bursary Details', ['Year', 'Code', 'Description', 'Awarded (ZAR)', 'Allocated (ZAR)', 'Unallocated (ZAR)'],
      bursaries.map(item => [String(item.year), item.bursaryCode, item.description, money(item.awarded), money(item.allocated), money(item.unallocated)]));
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page); pdf.setFontSize(8); pdf.setTextColor(100);
    pdf.text(`${student.studentNumber} | Page ${page} of ${pages}`, 14, 287);
  }
  return pdf;
}
