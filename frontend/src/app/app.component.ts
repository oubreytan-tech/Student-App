import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PortalStore } from './portal.store';
import { LoginComponent } from './login.component';
import { IconComponent } from './shared/icon.component';
import { ModalComponent } from './shared/modal.component';
import { AccountComponent } from './account.component';
import { RecordsComponent } from './records.component';
import { RequestsComponent } from './requests.component';
import { CallComponent } from './call.component';
import { services } from './catalog';
import type { MainTab, TicketCategory, ModuleResult } from './types';

export interface YearSummary {
 year: number;
 mods: ModuleResult[];
 avg: number | null;
 creditsPassed: number;
 totalCredits: number;
}

export interface DegreeSummary {
 code: string;
 qualName: string;
 years: number[];
 totalCreditsPassed: number;
 overallAvg: number | null;
}
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,LoginComponent,IconComponent,ModalComponent,AccountComponent,RecordsComponent,RequestsComponent,CallComponent],templateUrl:'./app.component.html'})
export class AppComponent {
 readonly store=inject(PortalStore);private sanitizer=inject(DomSanitizer);
 tab:MainTab='home';frame=false;showPortalLogin=false;search='';category='All';modal=signal('');section='results';callCategory:TicketCategory='Network/Wi-Fi';year=0;resultYear=0;statementTab='Fee Detail';showId=false;editing=false;cellphone='';studyAddress='';notice=signal('');readonly busy=signal(false);readonly pdf=signal<SafeResourceUrl|null>(null);private blobUrl='';
 readonly student=computed(()=>this.store.data()?.student);readonly notifications=computed(()=>this.store.notices().filter(n=>!n.read).length);
 readonly nav=[{id:'home',label:'Home',icon:'home'},{id:'services',label:'Services',icon:'grid-2x2'},{id:'log',label:'Log Call',icon:'plus'},{id:'requests',label:'Requests',icon:'message-square-warning'},{id:'profile',label:'Profile',icon:'user'}];
 get currentYear(){return new Date().getFullYear();}
 get latestAttendedYear(){
  const student=this.student();
  const years=[
   student?.latestRegistrationYear,
   student?.currentRegistrationYear,
   student?.academicYear,
   ...(this.store.data()?.modules||[]).map(module=>module.year),
   ...this.history.map(record=>record.registrationYear),
  ].filter((year):year is number=>typeof year==='number'&&year>0);
  return years.length?Math.max(...years):this.currentYear;
 }
 get selectedYear(){return this.year||this.latestAttendedYear;}
 get history(){return this.store.data()?.historicalQualifications||[];}
 get qualification(){return this.history.find(q=>q.registrationYear===this.selectedYear);}
 get modules(){const data=this.store.data();return [...(data?.modules||[]),...this.history.flatMap(h=>h.modules)].filter((m,i,list)=>list.findIndex(x=>x.code===m.code&&x.year===m.year)===i);}
 get activeModules(){return this.modules.filter(m=>m.year===this.selectedYear);}
 get resultModules(){return this.modules.filter(m=>!this.resultYear||m.year===Number(this.resultYear));}
 get years(){return [...new Set(this.modules.map(m=>m.year))].sort((a,b)=>b-a);}
 get groupedResults(): YearSummary[]{
  const years=[...new Set(this.resultModules.map(m=>m.year))].sort((a,b)=>b-a);
  return years.map(year=>{
   const mods=this.resultModules.filter(m=>m.year===year);
   const withMarks=mods.filter(m=>typeof m.finalMark==='number'&&!m.withheldReason);
   const avg=withMarks.length?Math.round(withMarks.reduce((s:number,m)=>s+(m.finalMark as number),0)/withMarks.length):null;
   const creditsPassed=mods.filter(m=>m.status==='Pass'||m.status==='Distinction').reduce((s:number,m)=>s+(m.credits||0),0);
   const totalCredits=mods.reduce((s:number,m)=>s+(m.credits||0),0);
   return{year,mods,avg,creditsPassed,totalCredits};
  });
 }
 get degreeSummaries(): DegreeSummary[]{
  const qualMap=new Map<number,string>();
  for(const h of this.history)qualMap.set(h.registrationYear,h.qualificationCode);
  const s=this.student();if(s?.academicYear&&s.qualificationCode)qualMap.set(s.academicYear,s.qualificationCode);
  const grouped=new Map<string,YearSummary[]>();
  for(const g of this.groupedResults){const code=qualMap.get(g.year)||'Unknown';if(!grouped.has(code))grouped.set(code,[]);grouped.get(code)!.push(g);}
  return[...grouped.entries()].map(([code,groups])=>{
   const totalCreditsPassed=groups.reduce((s:number,g:YearSummary)=>s+g.creditsPassed,0);
   const withAvg=groups.filter(g=>g.avg!==null);
   const overallAvg=withAvg.length?Math.round(withAvg.reduce((s:number,g:YearSummary)=>s+(g.avg as number),0)/withAvg.length):null;
   const qualName=this.history.find(h=>h.qualificationCode===code)?.qualificationName||code;
   return{code,qualName,years:groups.map(g=>g.year),totalCreditsPassed,overallAvg};
  });
 }
 get filteredServices(){return services.filter(s=>(this.category==='All'||s.category===this.category)&&(s.title+' '+s.description+' '+s.category).toLowerCase().includes(this.search.toLowerCase()));}
 get admitted(){return this.activeModules.filter(m=>m.examGranted==='Yes').length;}get withheld(){return this.activeModules.filter(m=>m.withheldReason).length;}
 money(value:number|undefined){return typeof value==='number'?value.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
 navigate(id:string){if(id==='log'){this.openCall();return;}this.tab=id as MainTab;if(id==='requests')void this.store.refreshTickets();}
 openCall(category:TicketCategory='Network/Wi-Fi'){this.callCategory=category;this.open('call');}
 service(item:typeof services[number]){if(item.action==='profile'){this.tab='profile';return;}if(item.action==='call'){this.openCall((item.ticketCategory||'Other') as TicketCategory);return;}this.open(item.action);}
 open(name:string){this.notice.set('');if(name==='residence'){this.section='residenceApplications';this.modal.set('residence');}else if(name==='records'){this.section='results';this.modal.set('records');}else if(name==='results'){this.section='examResults';this.modal.set('records');}else{this.modal.set(name);}if(name==='proof')void this.loadProof();}
 close(){this.modal.set('');this.pdf.set(null);if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);this.blobUrl='';}
 async loadProof(){this.busy.set(true);try{const response=await fetch('/api/scrape/proof-pdf',{credentials:'same-origin',cache:'no-store'});if(!response.ok){const value=await response.json().catch(()=>({}));throw new Error(value.error||'Proof of registration is unavailable.');}const blob=await response.blob();if(!blob.type.startsWith('application/pdf')||await blob.slice(0,5).text()!=='%PDF-')throw new Error('The portal did not return a valid PDF.');if(this.modal()!=='proof')return;this.blobUrl=URL.createObjectURL(blob);this.pdf.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));}catch(e){this.notice.set((e as Error).message);}finally{this.busy.set(false);}}
 async exportStatement(){const data=this.store.data();if(!data||this.busy())return;this.busy.set(true);try{const {createStatementPdf}=await import('./shared/statementExport');const logo=new Uint8Array(await(await fetch('univen-logo.png')).arrayBuffer());createStatementPdf(data.student,data.statements,data.ageAnalysis,data.bursaries,logo).save('Univen_Statement_'+data.student.studentNumber+'.pdf');}catch{this.notice.set('Could not export the statement. Please try again.');}finally{this.busy.set(false);}}
 async exportResults(){
  if(!this.student())return;
  const {jsPDF}=await import('jspdf');
  const {default:autoTable}=await import('jspdf-autotable');
  const pdf=new jsPDF();
  const stu=this.student()!;
  pdf.setFontSize(15);pdf.text('University of Venda — Academic Results',14,20);
  pdf.setFontSize(9);pdf.text(stu.fullName+' · '+stu.studentNumber+' · Generated '+new Date().toLocaleDateString('en-ZA'),14,28);
  // ── Year summary table ──────────────────────────────────────────────────────
  const qualMap=new Map<number,string>();
  for(const h of this.history)qualMap.set(h.registrationYear,h.qualificationCode);
  if(stu.academicYear&&stu.qualificationCode)qualMap.set(stu.academicYear,stu.qualificationCode);
  autoTable(pdf,{
   startY:35,
   head:[['Year','Qualification','Year Avg','Credits Passed','Total Credits']],
   body:this.groupedResults.map(g=>[g.year,qualMap.get(g.year)||'—',g.avg!==null?g.avg+'%':'—',g.creditsPassed,g.totalCredits]),
   headStyles:{fillColor:[30,58,138]},styles:{fontSize:8}
  });
  // ── Degree totals (if multiple degrees) ─────────────────────────────────────
  if(this.degreeSummaries.length>1||!this.resultYear){
   const degRows=this.degreeSummaries.map(d=>[d.code,d.qualName,d.overallAvg!==null?d.overallAvg+'%':'—',d.totalCreditsPassed,d.years.join(', ')]);
   autoTable(pdf,{
    startY:(pdf as any).lastAutoTable.finalY+6,
    head:[['Code','Qualification','Overall Avg','Total Credits Passed','Years']],
    body:degRows,
    headStyles:{fillColor:[6,95,70]},styles:{fontSize:8}
   });
  }
  // ── Module detail table ──────────────────────────────────────────────────────
  autoTable(pdf,{
   startY:(pdf as any).lastAutoTable.finalY+8,
   head:[['Year','Code','Module Name','Progress','Final Mark','Status','Credits']],
   body:this.resultModules.map(m=>[m.year,m.code,m.name,m.progressMark??'—',m.withheldReason?'Withheld':m.finalMark??'—',m.status,m.credits||'—']),
   styles:{fontSize:7}
  });
  pdf.save('Univen_Results_'+stu.studentNumber+'.pdf');
 }
 editContact(){this.cellphone=this.student()?.cellphoneNumber||'';this.studyAddress=this.student()?.studyAddress||'';this.editing=true;}
 saveContact(){this.store.data.update(data=>data?{...data,student:{...data.student,cellphoneNumber:this.cellphone,studyAddress:this.studyAddress}}:null);this.editing=false;this.notice.set('Updated for this app session only. University records have not been changed.');}
 markAll(){this.store.notices.update(items=>items.map(n=>({...n,read:true})));}
 async logout(){try{await this.store.logout();this.close();this.tab='home';this.year=0;this.showPortalLogin=false;}catch(e){this.notice.set((e as Error).message);}}
}
