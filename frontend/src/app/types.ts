export type TicketStatus = 
  | 'Submitted'
  | 'Received'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Student'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export type TicketCategory =
  | 'MyAccess'
  | 'Registration'
  | 'Residence'
  | 'Finance'
  | 'Examination Results'
  | 'Microsoft Account'
  | 'Password/Login'
  | 'Network/Wi-Fi'
  | 'Moodle/eLearning'
  | 'Student Email'
  | 'Computer Laboratory'
  | 'Application Problem'
  | 'Other';

export interface TicketComment {
  id: string;
  sender: 'student' | 'technician' | 'system';
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  attachments?: { name: string; size: string; url?: string }[];
}

export interface SupportTicket {
  outlook?: { messageId: string; conversationId: string };
  id: string; // e.g. "INC-2026-001425"
  studentNumber: string;
  studentName: string;
  email: string;
  contactNumber: string;
  category: TicketCategory;
  subcategory: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: string;
  assignedDepartment?: string;
  createdAt: string;
  updatedAt: string;
  deviceInfo: string;
  attachments: { name: string; size: string; type: string }[];
  comments: TicketComment[];
  externalTicketId?: string;
  solution?: string;
  surveyUrl?: string;
  reopenUrl?: string;
}

export interface StudentProfile {
  studentNumber: string;
  fullName: string;
  preferredName: string;
  gender: 'Female' | 'Male' | 'Other';
  dateOfBirth: string;
  idNumber: string;
  maritalStatus: string;
  homeLanguage: string;
  citizenship: string;
  institutionalEmail: string;
  cellphoneNumber: string;
  postalAddress: string;
  studyAddress: string;
  currentAccountBalance: number; // e.g., 82561.00
  totalDebit?: number;           // e.g., 498689.00
  totalCredit?: number;          // e.g., 416128.00
  dateOfBalance?: string;        // e.g., 10-SEP-2026
  qualification: string;
  qualificationCode?: string;    // e.g., MSHBIS
  academicYear: number;
  faculty: string;
  department: string;
  academicBlock?: string;        // e.g., H2 - HONOURS STUDENTS(JANUARY)
  offeringType?: string;         // e.g., 03 - HONOURS (FIRST YEAR) FULL TIME
  periodOfStudy?: string;        // e.g., 1ST YEAR
  registrationDates?: string;    // e.g., 06-Jan-2026 to 31-Dec-2026
  hasBursary?: boolean;
  admissionStatus: string;
  isCurrentlyRegistered?: boolean;
  registrationStatus?: 'Currently Registered' | 'Previously Registered' | 'Not Registered';
  currentRegistrationYear?: number;
  latestRegistrationYear?: number;
  historicalQualifications?: HistoricalQualification[];
  nsfasFunded: boolean;
  profileImageUrl: string;
}

export interface ModuleResult {
  code: string;
  name: string;
  semester: 'Semester 1' | 'Semester 2' | 'Year';
  year: number;
  finalMark?: number;
  progressMark?: number;         // Scraped from 'Full Period' (DP mark)
  status: 'Pass' | 'Distinction' | 'Fail' | 'Enrolled' | 'Deferred';
  credits: number;
  classGroup?: string;           // e.g., 'A'
  pracGroup?: string;
  tutGroup?: string;
  attendance?: string;           // e.g., 'NORMAL EXAM'
  examGranted?: string;          // e.g., 'Yes' | 'No'
  examMonth?: string;            // e.g., '6' (June) or '10' / '11'
  withheldReason?: string;       // e.g., 'Withhold examination results - Finance'
  assessmentStatus?: string;
}

export interface AgeAnalysis {
  d160: number;
  d90: number;
  d60: number;
  d30: number;
  current: number;
  credit: number;
  future: number;
  unallocated: number;
  balance: number;
}

export interface BursaryItem {
  year: number;
  bursaryCode: string;
  description: string;
  isNsfas: boolean;
  awarded: number;
  allocated: number;
  unallocated: number;
}

export interface HistoricalQualification {
  qualificationCode: string;
  qualificationName: string;
  registrationYear: number;
  academicBlock?: string;
  faculty: string;
  department: string;
  offeringType?: string;
  periodOfStudy: string;
  registrationDates?: string;
  hasBursary: boolean;
  modules: ModuleResult[];
}

export interface StatementItem {
  id: string;
  date: string;
  description: string;
  reference?: string;
  debit?: number;
  credit?: number;
  balance: number;
  type: 'Tuition' | 'Residence' | 'Payment' | 'NSFAS Allocation' | 'Levy' | 'Book Allowance';
}

export interface ResidenceDetails {
  residenceName: string;
  campus: string;
  block: string;
  roomNumber: string;
  admissionStatus: 'Admitted' | 'Application Pending' | 'Off-Campus Approved' | 'Not Allocated';
  roomType: 'Single' | 'Double' | 'Suite';
  moveInDate: string;
  inspectionStatus: 'Passed' | 'Pending';
  wardenName: string;
  wardenContact: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'ticket' | 'academic' | 'finance' | 'residence' | 'announcement';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  relatedId?: string;
}

export type MainTab = 'home' | 'services' | 'requests' | 'profile';

export interface PortalScrapedPayload {
  student: StudentProfile;
  modules: ModuleResult[];
  statements: StatementItem[];
  ageAnalysis: AgeAnalysis;
  bursaries: BursaryItem[];
  historicalQualifications?: HistoricalQualification[];
  isLive: boolean;
  statusMessage?: string;
  porUrl?: string;
}
