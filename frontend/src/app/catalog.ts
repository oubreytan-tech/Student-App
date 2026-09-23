export const services = [
 {title:'Portal Records',description:'Assessment, admission, progress, certificates and contacts.',category:'Academics',icon:'book-open',action:'records'},
 {title:'Proof of Registration (PDF)',description:'Official certificate of registration and enrolled modules.',category:'Registration',icon:'file-text',action:'proof'},
 {title:'Registration Process Status',description:'View your academic registration record.',category:'Registration',icon:'circle-check',action:'proof'},
 {title:'Proof and Cost Breakdown',description:'Tuition fees, lab levies, and student council registration fees.',category:'Registration',icon:'credit-card',action:'statement'},
 {title:'Examination Results',description:'Semester module marks, grades, credits, and pass determinations.',category:'Academics',icon:'graduation-cap',action:'results'},
 {title:'Academic Record & Transcript',description:'Historical transcript summary and degree credits.',category:'Academics',icon:'book-open',action:'results'},
 {title:'Assessment & Exam Admission Status',description:'Continuous assessment marks and exam admission.',category:'Academics',icon:'calendar',action:'results'},
 {title:'Academic Remarking / Appeal',description:'Submit an appeal or remark request for examination papers.',category:'Academics',icon:'message-square-warning',action:'call',ticketCategory:'Examination Results'},
 {title:'Summarised Statement of Account',description:'Fee ledger with tuition, residence charges, and receipts.',category:'Finance',icon:'credit-card',action:'statement'},
 {title:'NSFAS Bursary Remittance',description:'Bursary funding and allowance information from your record.',category:'Finance',icon:'shield-check',action:'statement'},
 {title:'Residence Admission Status',description:'View your residence application and allocation status.',category:'Residence',icon:'home',action:'residence'},
 {title:'Room Maintenance Request',description:'Report electrical, plumbing, furniture, or Wi-Fi faults.',category:'Residence',icon:'message-square-warning',action:'call',ticketCategory:'Residence'},
 {title:'Personal Contact Details & Address',description:'View cellphone number, postal and study addresses.',category:'Administration',icon:'user',action:'profile'},
 {title:'Request Special Examination',description:'Request assistance with a medical or special examination.',category:'Administration',icon:'file-text',action:'call',ticketCategory:'Examination Results'}
];
export const sections=[['examResults','Examination Results'],['results','Assessment Status'],['admission','Academic Admission'],['progress','Progress Report'],['documents','Certificates'],['contacts','Contacts'],['residenceApplications','Residence Applications'],['residenceProof','Residence Proof']];
