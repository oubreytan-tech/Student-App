import { test, expect, Page } from '@playwright/test';
// The Portal Records dialog must keep its final size while records are still being retrieved.
const student={studentNumber:'20000001',fullName:'TEST STUDENT',preferredName:'Student',gender:'Other',dateOfBirth:'',idNumber:'',maritalStatus:'',homeLanguage:'',citizenship:'',institutionalEmail:'student@example.invalid',cellphoneNumber:'0000000000',postalAddress:'',studyAddress:'Test address',currentAccountBalance:1234.56,qualification:'Test Qualification',qualificationCode:'TEST',academicYear:2026,faculty:'Test Faculty',department:'Test Department',admissionStatus:'Currently Registered',registrationStatus:'Currently Registered',isCurrentlyRegistered:true,nsfasFunded:false,profileImageUrl:''};
const modules=[{code:'BIS5141',name:'IS RESEARCH METHOD',semester:'Semester 1' as const,year:2026,status:'Enrolled' as const,credits:72,examGranted:'Yes'},{code:'BIS5241',name:'ADVANCED DATABASES',semester:'Semester 1' as const,year:2026,status:'Enrolled' as const,credits:72,examGranted:'Yes'}];
const sync={student,modules,statements:[{id:'test-statement',date:'21-Sep-2026',description:'Test tuition',debit:1234.56,balance:1234.56,type:'Tuition'}],ageAnalysis:{d160:0,d90:0,d60:0,d30:0,current:1234.56,credit:0,future:0,unallocated:0,balance:1234.56},bursaries:[],historicalQualifications:[],isLive:true,statusMessage:'Verified test session'};
const records={status:'ok',academicYear:'2026',retrievedAt:'2026-09-21T00:00:00.000Z',warnings:[],error:null,data:{fields:[],messages:[],tables:[{heading:'Assessment Status',caption:null,headers:['Subject Code','Subject Name','Year','Block'],rows:[{rowIndex:1,cells:['BIS5141','IS RESEARCH METHOD','2026','1']},{rowIndex:2,cells:['BIS5241','ADVANCED DATABASES','2026','1']}]},{heading:'BIS5141',caption:null,headers:['Class','','AN','Marked','Mark','Result','Type','CB','CP','SM','W'],rows:[{rowIndex:1,cells:['Class','A','1','Marked','68','Pass (P)','Assignment Mark (AS)','0','Y','—','30']},{rowIndex:2,cells:['Class','A','1','Marked','100','Pass (P)','Attendance Mark (AT)','0','Y','—','10']}]}]}};
async function mock(page:Page,readDelayMs:number){
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let body:unknown={success:true};
  if(path==='/api/account/session')body={account:null,configured:{google:false,microsoft:false}};
  if(path==='/api/scrape/portal-sync')body={success:true,isLive:true,data:sync,statusMessage:'Verified test session'};
  if(path.startsWith('/api/scrape/read/')){await new Promise(resolve=>setTimeout(resolve,readDelayMs));body=records;}
  if(path==='/api/scrape/proof-pdf'){await new Promise(resolve=>setTimeout(resolve,readDelayMs));await route.fulfill({status:200,contentType:'application/pdf',body:'%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'});return;}
  await route.fulfill({json:body});
 });
}
async function login(page:Page){
 await page.goto('/');
 await page.locator('#student-number').fill('20000001');
 await page.locator('#portal-pin').fill('12345');
 await page.getByRole('button',{name:'Sign In to Student Portal',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Hello, Student'})).toBeVisible();
}
async function openPortalRecords(page:Page){
 await login(page);
 await page.getByRole('button',{name:'Services',exact:true}).click();
 await page.getByRole('button',{name:/Portal Records Assessment/}).click();
}
test('portal records dialog holds its size while records load',async({page},info)=>{
 await mock(page,2500);
 await openPortalRecords(page);
 const dialog=page.getByRole('dialog');
 await expect(dialog).toContainText('Retrieving portal records');
 await page.waitForTimeout(400);
 const loading=await dialog.boundingBox();
 await page.screenshot({path:info.outputPath('portal-records-loading.png')});
 await expect(dialog.getByRole('heading',{name:'IS RESEARCH METHOD'})).toBeVisible();
 const loaded=await dialog.boundingBox();
 await page.screenshot({path:info.outputPath('portal-records-loaded.png')});
 const viewport=page.viewportSize()!;
 expect(Math.round(loaded!.height)).toBe(Math.round(loading!.height));
 expect(loading!.height).toBeGreaterThan(viewport.height*0.9);
});
test('proof of registration dialog holds its size while the PDF loads',async({page},info)=>{
 await mock(page,2500);
 await login(page);
 await page.getByRole('button',{name:/Am I registered/}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toContainText('Retrieving official proof of registration');
 await page.waitForTimeout(400);
 const loading=await dialog.boundingBox();
 await page.screenshot({path:info.outputPath('proof-loading.png')});
 await expect(dialog.getByRole('link',{name:/Download Official PDF/})).toBeVisible();
 const loaded=await dialog.boundingBox();
 await page.screenshot({path:info.outputPath('proof-loaded.png')});
 expect(Math.round(loaded!.height)).toBe(Math.round(loading!.height));
 expect(loading!.height).toBeGreaterThan(page.viewportSize()!.height*0.9);
});
test('statement dialog keeps one size across its tabs',async({page},info)=>{
 await mock(page,0);
 await login(page);
 await page.getByRole('button',{name:/What do I owe/}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toContainText('Test tuition');
 const heights:number[]=[];
 for(const tab of ['Fee Detail','Age Analysis','Bursary Details']){
  await dialog.getByRole('button',{name:tab,exact:true}).click();
  await page.waitForTimeout(150);
  heights.push(Math.round((await dialog.boundingBox())!.height));
  await page.screenshot({path:info.outputPath('statement-'+tab.replace(' ','-').toLowerCase()+'.png')});
 }
 expect(heights[1]).toBe(heights[0]);
 expect(heights[2]).toBe(heights[0]);
 expect(heights[0]).toBeGreaterThan(page.viewportSize()!.height*0.9);
});
