import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StudentProfile, ModuleResult } from '../types';

export function createExamAdmissionPdf(student: StudentProfile, modules: ModuleResult[], logo?: Uint8Array) {
  const pdf = new jsPDF();
  const year = student.academicYear || new Date().getFullYear();

  // Header banner & Logo
  if (logo) {
    try {
      pdf.addImage(logo, 'PNG', 14, 10, 22, 22);
    } catch {}
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(20, 35, 75);
  pdf.text('UNIVERSITY OF VENDA', 40, 17);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(180, 83, 9); // Amber
  pdf.text('OFFICIAL EXAMINATION ADMISSION SLIP (PERMIT)', 40, 23);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Academic Year: ${year}  |  Self-Help iEnabler  |  Date Printed: ${new Date().toLocaleDateString('en-ZA')}`, 40, 28);

  // Student Particulars Table
  autoTable(pdf, {
    startY: 34,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 32 },
      1: { cellWidth: 62 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 32 },
      3: { cellWidth: 56 }
    },
    body: [
      ['Student Number:', student.studentNumber, 'National ID / Passport:', student.idNumber || '—'],
      ['Student Name:', student.fullName, 'Date of Birth:', student.dateOfBirth || '—'],
      ['Qualification:', `${student.qualificationCode || ''} - ${student.qualification}`, 'Academic Block:', student.academicBlock || 'Standard'],
      ['Faculty:', student.faculty || '—', 'Account Status:', (student.currentAccountBalance <= 0 ? 'Financially Cleared' : `Balance Owing: R ${student.currentAccountBalance.toFixed(2)}`)],
      ['Admission Status:', student.registrationStatus || student.admissionStatus || 'Registered', 'Offering Type:', student.offeringType || 'Full-Time']
    ]
  });

  // Table of Admitted Modules
  const finalY = (pdf as any).lastAutoTable?.finalY || 68;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(20, 35, 75);
  pdf.text('ENROLLED MODULES & EXAMINATION ADMISSION STATUS', 14, finalY + 7);

  const tableRows = (modules && modules.length ? modules : []).map(m => {
    const isAdmitted = m.examGranted === 'Yes' || (!m.examGranted && m.status !== 'Fail');
    const statusText = m.withheldReason ? 'WITHHELD' : isAdmitted ? 'ADMITTED' : (m.examGranted || 'PENDING');
    const examPeriod = m.examMonth ? `Month ${m.examMonth}` : (m.semester === 'Semester 1' ? 'June / July' : 'Nov / Dec');
    return [
      m.code,
      m.name,
      m.semester || '—',
      examPeriod,
      m.attendance || 'NORMAL EXAM',
      statusText
    ];
  });

  autoTable(pdf, {
    startY: finalY + 11,
    head: [['Course Code', 'Course Description', 'Semester', 'Exam Period', 'Exam Type', 'Admission Status']],
    body: tableRows.length ? tableRows : [['—', 'No module records found', '—', '—', '—', '—']],
    styles: { fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' },
    headStyles: { fillColor: [20, 35, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw || '');
        if (text === 'ADMITTED') {
          data.cell.styles.textColor = [16, 120, 60];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'WITHHELD') {
          data.cell.styles.textColor = [180, 50, 50];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const instructionsY = (pdf as any).lastAutoTable?.finalY || 180;

  // Candidate Examination Instructions Box
  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(14, instructionsY + 6, 182, 45, 3, 3, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 35, 75);
  pdf.text('IMPORTANT EXAMINATION RULES & INSTRUCTIONS TO CANDIDATES:', 18, instructionsY + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  const rules = [
    '1. You MUST produce this official Exam Admission Slip together with your valid UNIVEN Student Card at the examination venue.',
    '2. Candidates must be seated in the examination hall at least 30 minutes prior to the commencement of the paper.',
    '3. Cellular phones, smartwatches, programmable calculators, notes, and unauthorized electronic devices are strictly prohibited.',
    '4. Examination admission is subject to meeting all continuous assessment (DP) requirements and academic regulations.',
    '5. Inquiries regarding examination timetables or venues should be directed to the Examinations Office / Student Enquiry.'
  ];
  let currentRuleY = instructionsY + 19;
  for (const rule of rules) {
    pdf.text(rule, 18, currentRuleY);
    currentRuleY += 5;
  }

  // Footer & Verification note
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('This document was generated via University of Venda Student Self-Help Services. Authenticated via student session.', 14, pageHeight - 12);
  pdf.text(`Student: ${student.studentNumber} | Reference: EXM-${year}-${student.studentNumber.slice(-4)}`, 14, pageHeight - 8);

  return pdf;
}
