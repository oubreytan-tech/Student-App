import type { TicketCategory } from '../types';
export const ticketCategoriesConfig: Record<TicketCategory, string[]> = {
  MyAccess: ['Portal Login / PIN', 'Module Registration Error', 'Biographical Info Discrepancy', 'Service Unavailable'],
  Registration: ['Proof of Registration Missing', 'Course Code Conflict', 'Prerequisite Waiver', 'Cost & Fee Mismatch'],
  Residence: ['Room Maintenance', 'Key Replacement', 'Water / Electricity Outage', 'Transfer Request', 'Noise Complaint'],
  Finance: ['Fee Statement Discrepancy', 'NSFAS Allocation Query', 'Debit Order / Direct Deposit', 'Bursary Refund'],
  'Examination Results': ['Missing Final Mark', 'Remarking Appeal', 'Special Examination Query', 'Graduation Audit'],
  'Microsoft Account': ['Password Reset', 'Entra ID Multi-Factor Auth', 'MS Teams License', 'OneDrive Storage'],
  'Password/Login': ['Forgotten Password', 'Account Locked', 'OTP Not Received'],
  'Network/Wi-Fi': ['Eduroam Connection', 'Residence Wi-Fi AP Offline', 'Campus Hotspot Issue', 'Slow Bandwidth'],
  'Moodle/eLearning': ['Course Not Visible', 'Assignment Upload Failure', 'Quiz Disconnection', 'Lecturer Notes Missing'],
  'Student Email': ['Mailbox Full', 'Email Delivery Delay', 'Spam Quarantine', 'Forwarding Config'],
  'Computer Laboratory': ['PC Hardware Fault', 'Software License (SPSS/MATLAB)', 'Lab Printer Offline', 'Station Access'],
  'Application Problem': ['App Bug / Freeze', 'Notification Error', 'Document Download Error', 'UI Display Glitch'],
  Other: ['General Inquiry', 'Campus Security Contact', 'Lost Student Card', 'Feedback'],
};
