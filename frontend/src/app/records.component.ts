import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalStore, ReadResult, ReadTable } from './portal.store';
import { sections } from './catalog';
import { IconComponent } from './shared/icon.component';
import type { ModuleResult } from './types';
import type { YearSummary, DegreeSummary } from './app.component';

@Component({
 selector: 'app-records',
 standalone: true,
 imports: [CommonModule, FormsModule, IconComponent],
 template: `<div class="space-y-4">
 <div class="portal-tabs flex overflow-x-auto gap-2 pb-2">
  @for(item of sections;track item[0]){
   <button type="button" role="tab" [attr.aria-selected]="section===item[0]" class="tab-btn" [class.tab-btn-active]="section===item[0]" (click)="select(item[0])">
    @if(section===item[0]){<span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 shrink-0"></span>}
    {{item[1]}}
   </button>
  }
 </div>

 @if(section === 'examResults'){
  <div class="space-y-4">
   <div class="flex justify-between items-center gap-2">
    <select aria-label="Results year" class="field !w-auto" [(ngModel)]="resultYear">
     <option [ngValue]="0">All years</option>
     @for(y of years; track y){<option [ngValue]="y">{{y}}</option>}
    </select>
    <div class="flex items-center gap-2">
     <a href="/api/scrape/exam-admission-pdf?download=1" download class="secondary inline-flex items-center gap-1.5">
      <app-icon name="file-text" [size]="15"/> Exam Admission Slip
     </a>
     <button type="button" class="secondary inline-flex items-center gap-1.5" (click)="exportPdf()">
      <app-icon name="download" [size]="15"/> Download PDF
     </button>
    </div>
   </div>

   @if(!resultYear && degreeSummaries.length){
    @for(deg of degreeSummaries; track deg.code){
    <div class="rounded-2xl bg-blue-950 text-white p-3 space-y-1.5 shadow-sm">
      <p class="text-[10px] font-bold uppercase tracking-wider text-blue-300">{{deg.code}} &mdash; All-Year Degree Totals</p>
      <p class="text-xs font-semibold text-blue-100 leading-snug">{{deg.qualName}}</p>
      <div class="grid grid-cols-3 gap-1.5 mt-1">
       <div class="bg-white/10 rounded-xl p-2 text-center">
        <p class="text-[9px] text-blue-300 uppercase font-bold tracking-wider">Overall Avg</p>
        <strong class="text-xl">{{deg.overallAvg !== null ? deg.overallAvg + '%' : '—'}}</strong>
       </div>
      <div class="bg-emerald-900/60 rounded-xl p-2 text-center">
        <p class="text-[9px] text-emerald-300 uppercase font-bold tracking-wider">Credits Passed</p>
        <strong class="text-xl text-emerald-300">{{deg.totalCreditsPassed}}</strong>
       </div>
      <div class="bg-white/10 rounded-xl p-2 text-center">
        <p class="text-[9px] text-blue-300 uppercase font-bold tracking-wider">Years</p>
        <strong class="text-xl">{{deg.years.length}}</strong>
       </div>
      </div>
     </div>
    }
   }

   @for(group of groupedResults; track group.year){
    <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
     <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-sm font-extrabold text-blue-950">{{group.year}} Session <span class="text-slate-400 font-normal text-xs">&middot; {{group.mods.length}} module{{group.mods.length===1?'':'s'}}</span></h3>
      <div class="flex gap-2 flex-wrap justify-end">
       <span class="inline-flex flex-col items-center rounded-xl bg-blue-900 text-white px-3 py-1.5 text-center min-w-[68px]">
        <span class="text-[9px] font-bold uppercase tracking-wider text-blue-200">Year Avg</span>
        <strong class="text-base leading-tight mt-0.5">{{group.avg !== null ? group.avg + '%' : '—'}}</strong>
       </span>
       <span class="inline-flex flex-col items-center rounded-xl bg-emerald-700 text-white px-3 py-1.5 text-center min-w-[90px]">
        <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Credits Passed</span>
        <strong class="text-base leading-tight mt-0.5">{{group.creditsPassed}} / {{group.totalCredits}}</strong>
       </span>
      </div>
     </div>
     <div class="divide-y divide-slate-100">
      @for(module of group.mods; track $index){
       <div class="p-4 space-y-2">
        <div class="flex justify-between gap-2">
         <strong class="text-xs text-blue-900">{{module.code}}</strong>
         <span class="tag" [class.!bg-emerald-100]="module.status==='Pass'||module.status==='Distinction'" [class.!text-emerald-800]="module.status==='Pass'||module.status==='Distinction'" [class.!bg-red-100]="module.status==='Fail'" [class.!text-red-800]="module.status==='Fail'" [class.!bg-amber-100]="module.status==='Deferred'" [class.!text-amber-800]="module.status==='Deferred'">{{module.status}}</span>
        </div>
        <h4 class="font-bold text-xs text-slate-900">{{module.name}}</h4>
        <div class="grid grid-cols-3 gap-2 text-[11px]">
         <div class="rounded-lg bg-slate-50 p-2">Progress mark<strong class="block text-sm">{{module.progressMark ?? '—'}}</strong></div>
         <div class="rounded-lg bg-slate-50 p-2">Final mark<strong class="block text-sm" [class.text-emerald-700]="(module.finalMark??0)>=50&&!module.withheldReason" [class.text-red-700]="(module.finalMark??50)<50&&module.finalMark!==undefined&&!module.withheldReason">{{module.withheldReason ? 'Withheld' : module.finalMark ?? '—'}}</strong></div>
         <div class="rounded-lg bg-slate-50 p-2">Exam admitted<strong class="block text-sm">{{module.examGranted || '—'}}</strong></div>
        </div>
        @if(module.withheldReason){<p class="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg">{{module.withheldReason}}</p>}
        @if(module.credits){<p class="text-[10px] text-slate-400">{{module.credits}} credit{{module.credits===1?'':'s'}}</p>}
       </div>
      }
     </div>
    </div>
   }
   @if(!groupedResults.length){<p class="empty">No module results were returned for this degree.</p>}
  </div>
 } @else {
  @if(section === 'results' && groupedResults.length){
   <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
    <div class="text-xs">
     <strong class="text-blue-950">Academic Summary:</strong>
     <span class="text-slate-600 ml-1.5">Year Avg: <b class="text-blue-900">{{groupedResults[0]?.avg !== null ? groupedResults[0]?.avg + '%' : '—'}}</b> &middot; Credits Passed: <b class="text-emerald-700">{{groupedResults[0]?.creditsPassed}} / {{groupedResults[0]?.totalCredits}}</b></span>
    </div>
    <div class="flex gap-2">
     <button type="button" class="text-xs font-bold text-blue-900 hover:underline" (click)="select('examResults')">View All Years Totals &rsaquo;</button>
     <button type="button" class="secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1" (click)="exportPdf()"><app-icon name="download" [size]="13"/> PDF</button>
    </div>
   </div>
  }
  <div class="flex justify-between items-center">
   <span class="text-[11px] text-slate-500 font-medium">{{result()?.academicYear?'Academic year '+result()?.academicYear:'Verified portal records'}}</span>
   <button type="button" class="secondary !py-1.5 !px-3 inline-flex items-center gap-1.5" [disabled]="loading()" (click)="load(true)">
    <app-icon name="refresh-cw" [size]="13" [class.animate-spin]="loading()"/> Refresh
   </button>
  </div>
  @if(loading() && !result()){
   <div class="py-12 flex flex-col items-center justify-center gap-3 text-center" role="status">
    <div class="relative w-14 h-14 flex items-center justify-center">
     <div class="absolute inset-0 rounded-2xl bg-amber-400/20 animate-ping"></div>
     <img src="favicon.png" alt="UNIVEN" class="w-12 h-12 object-contain relative z-10 loading-favicon">
    </div>
    <div class="space-y-0.5">
     <p class="text-xs font-bold text-blue-950">Retrieving portal records…</p>
     <p class="text-[10px] text-slate-500">Contacting University of Venda student records</p>
    </div>
   </div>
  }
  @else if(error()){<p class="text-xs text-red-800 bg-red-50 p-4 rounded-xl" role="alert">{{error()}}</p>}
  @else if(result();as response){
   @for(warning of response.warnings;track $index){<p class="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl">{{warning}}</p>}
   @if(response.error){<p class="text-xs text-red-700" role="alert">{{response.error.message}}</p>}
   @if(response.status==='empty'){<p class="empty">No records returned by the portal.</p>}
   @if(response.data;as data){
    @if(section==='residenceProof' && response.status==='ok'){
     <a class="primary inline-flex items-center gap-2" href="/api/scrape/residence-proof-pdf" download><app-icon name="download"/>Download Residence Proof</a>
    }
    @for(field of data.fields;track $index){<div class="portal-field"><strong>{{field.label}}</strong><span>{{field.value || '—'}}</span></div>}
    @for(message of data.messages;track $index){<p class="text-xs text-slate-600">{{message}}</p>}
    @if(section==='results' && data.tables.length){
     <div class="assessment-picker">
      <label for="assessment-module" class="assessment-picker-label">Assessment Status</label>
      <select id="assessment-module" class="field" [ngModel]="selectedModule?.code" (ngModelChange)="selectModule($event)">
       @for(module of assessmentModules;track module.code){<option [ngValue]="module.code">{{module.code}} · {{module.name}}</option>}
      </select>
     </div>
     @if(selectedModule;as module){
      <article class="assessment-module-card">
       <div class="assessment-module-heading">
      <div><span class="assessment-code">{{module.code}}</span><span class="assessment-meta">{{module.year}} · {{module.block}}</span></div>
      <h3>{{module.name}}</h3>
       </div>
       <div class="assessment-breakdown">
      <p class="assessment-breakdown-title">Assessment Breakdown</p>
      @for(detail of assessmentDetails;track $index){
       @for(row of detail.rows;track $index){
        <div class="assessment-row-card">
         <div class="assessment-row-top"><strong>{{cell(row,0) || 'Class'}} {{cell(row,1)}}</strong><strong class="assessment-mark">{{cell(row,4) || '—'}}</strong></div>
         <div class="assessment-chips"><span class="assessment-chip assessment-chip-blue">{{cell(row,3) || 'Marked'}}</span><span class="assessment-chip assessment-chip-green">{{cell(row,5) || 'Result'}}</span><span class="assessment-chip">{{cell(row,6) || 'Assessment Mark'}}</span></div>
         <div class="assessment-values"><span><small>AN</small>{{cell(row,2) || '—'}}</span><span><small>CB</small>{{cell(row,7) || '—'}}</span><span><small>CP</small>{{cell(row,8) || '—'}}</span><span><small>SM</small>{{cell(row,9) || '—'}}</span><span><small>W</small>{{cell(row,10) || '—'}}</span></div>
        </div>
       }
      }
      @if(!assessmentDetails.length){<p class="empty">No assessment details were returned for this module.</p>}
       </div>
      </article>
     }
    } @else { @for(table of data.tables;track $index){
    <article class="portal-record-card">
     <div class="portal-record-heading">
       <h3 class="font-bold text-xs text-blue-950">{{table.heading}}</h3>
       @if(table.caption){<p class="text-[11px] text-slate-500 mt-1">{{table.caption}}</p>}
      </div>
      @if(section==='progress'){
       <div class="compact-portal-list">
        @for(detail of compactRows(table);track $index){<div class="compact-portal-row">{{detail}}</div>}
       </div>
      } @else {
      <div class="scroll-table">
    <table class="portal-table">
        <thead><tr>@for(index of indexes(table);track index){<th>{{header(table,index)}}</th>}</tr></thead>
     <tbody>@for(row of table.rows;track $index){<tr>@for(index of indexes(table);track index){<td [attr.data-label]="header(table,index)">{{row.cells[index] || '—'}}</td>}</tr>}</tbody>
       </table>
      </div>
      }
      @if(!table.rows.length){<p class="empty">No records.</p>}
     </article>
    }}
   }
  }
 }
</div>`
})
export class RecordsComponent implements OnChanges {
 @Input() section='results';
 private _initialYear=0;
 @Input() set initialYear(value:number){this._initialYear=value;if(value>0)this.resultYear=value;}
 get initialYear(){return this._initialYear;}
 readonly store=inject(PortalStore);
 readonly sections=sections;
 readonly loading=signal(false);
 readonly error=signal('');
 readonly result=signal<ReadResult|null>(null);
 resultYear=0;
 selectedModuleCode='';
 private cache=new Map<string,ReadResult>();
 private version=0;

 get history(){return this.store.data()?.historicalQualifications||[];}
 get student(){return this.store.data()?.student;}
 get modules(): ModuleResult[]{
  const data=this.store.data();
  return [...(data?.modules||[]),...this.history.flatMap(h=>h.modules)].filter((m,i,list)=>list.findIndex(x=>x.code===m.code&&x.year===m.year)===i);
 }
 get resultModules(): ModuleResult[]{
  return this.modules.filter(m=>!this.resultYear||m.year===Number(this.resultYear));
 }
 get years(): number[]{
  return [...new Set(this.modules.map(m=>m.year))].sort((a,b)=>b-a);
 }
 get assessmentModules(){
  const table=this.result()?.data?.tables?.[0];
  if(!table)return [];
  return table.rows.map(row=>({code:this.cell(row,0),name:this.cell(row,1),year:this.cell(row,2),block:this.cell(row,3)}));
 }
 get selectedModule(){return this.assessmentModules.find(module=>module.code===this.selectedModuleCode)||this.assessmentModules[0];}
 get assessmentDetails(){
  const code=this.selectedModule?.code;
  return code?((this.result()?.data?.tables||[]).slice(1).filter(table=>table.heading===code)):[];
 }
 cell(row:{cells:(string|null)[]},index:number){return row.cells[index]||'';}
 get groupedResults(): YearSummary[]{
  const years=[...new Set(this.resultModules.map(m=>m.year))].sort((a,b)=>b-a);
  return years.map(year=>{
   const mods=this.resultModules.filter(m=>m.year===year);
   const withMarks=mods.filter(m=>typeof m.finalMark==='number'&&!m.withheldReason);
   const avg=withMarks.length?Math.round(withMarks.reduce((s:number,m:ModuleResult)=>s+(m.finalMark as number),0)/withMarks.length):null;
   const creditsPassed=mods.filter(m=>m.status==='Pass'||m.status==='Distinction').reduce((s:number,m:ModuleResult)=>s+(m.credits||0),0);
   const totalCredits=mods.reduce((s:number,m:ModuleResult)=>s+(m.credits||0),0);
   return{year,mods,avg,creditsPassed,totalCredits};
  });
 }
 get degreeSummaries(): DegreeSummary[]{
  const qualMap=new Map<number,string>();
  for(const h of this.history)qualMap.set(h.registrationYear,h.qualificationCode);
  const s=this.student;if(s?.academicYear&&s.qualificationCode)qualMap.set(s.academicYear,s.qualificationCode);
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

 async exportPdf(){
  const stu=this.student;
  if(!stu)return;
  const {jsPDF}=await import('jspdf');
  const {default:autoTable}=await import('jspdf-autotable');
  const pdf=new jsPDF();
  pdf.setFontSize(15);pdf.text('University of Venda — Academic Results',14,20);
  pdf.setFontSize(9);pdf.text(stu.fullName+' · '+stu.studentNumber+' · Generated '+new Date().toLocaleDateString('en-ZA'),14,28);
  const qualMap=new Map<number,string>();
  for(const h of this.history)qualMap.set(h.registrationYear,h.qualificationCode);
  if(stu.academicYear&&stu.qualificationCode)qualMap.set(stu.academicYear,stu.qualificationCode);
  autoTable(pdf,{
   startY:35,
   head:[['Year','Qualification','Year Avg','Credits Passed','Total Credits']],
   body:this.groupedResults.map(g=>[g.year,qualMap.get(g.year)||'—',g.avg!==null?g.avg+'%':'—',g.creditsPassed,g.totalCredits]),
   headStyles:{fillColor:[30,58,138]},styles:{fontSize:8}
  });
  if(this.degreeSummaries.length>1||!this.resultYear){
   const degRows=this.degreeSummaries.map(d=>[d.code,d.qualName,d.overallAvg!==null?d.overallAvg+'%':'—',d.totalCreditsPassed,d.years.join(', ')]);
   autoTable(pdf,{
    startY:(pdf as any).lastAutoTable.finalY+6,
    head:[['Code','Qualification','Overall Avg','Total Credits Passed','Years']],
    body:degRows,
    headStyles:{fillColor:[6,95,70]},styles:{fontSize:8}
   });
  }
  autoTable(pdf,{
   startY:(pdf as any).lastAutoTable.finalY+8,
   head:[['Year','Code','Module Name','Progress','Final Mark','Status','Credits']],
   body:this.resultModules.map(m=>[m.year,m.code,m.name,m.progressMark??'—',m.withheldReason?'Withheld':m.finalMark??'—',m.status,m.credits||'—']),
   styles:{fontSize:7}
  });
  pdf.save('Univen_Results_'+stu.studentNumber+'.pdf');
 }

 ngOnChanges(){
  if(this.section==='examResults'){
   this.error.set('');
   this.loading.set(false);
   return;
  }
  if(this.cache.has(this.section)){
   this.result.set(this.cache.get(this.section)!);
   this.error.set('');
  }else{
   void this.load();
  }
 }

 select(value:string){
  if(this.section===value && (this.result() || this.loading() || value==='examResults'))return;
  this.section=value;
  if(value==='examResults'){
   this.error.set('');
   this.loading.set(false);
   return;
  }
  if(this.cache.has(value)){
   this.error.set('');
   this.loading.set(false);
   this.result.set(this.cache.get(value)!);
  this.selectedModuleCode='';
   return;
  }
  void this.load();
 }

 async load(forceRefresh=false){
  if(forceRefresh){
   this.cache.delete(this.section);
  }else if(this.cache.has(this.section)){
   this.result.set(this.cache.get(this.section)!);
   return;
  }
  const version=++this.version;
  this.loading.set(true);
  this.error.set('');
  if(!this.cache.has(this.section))this.result.set(null);
  try{
   const result=await this.store.api<ReadResult>('scrape/read/'+this.section);
   if(version===this.version){
    this.cache.set(this.section,result);
    this.result.set(result);
    this.selectedModuleCode='';
   }
  }catch(e){
   if(version===this.version)this.error.set((e as Error).message);
  }finally{
   if(version===this.version)this.loading.set(false);
  }
 }

 indexes(table:ReadTable){
  const importantBySection:Record<string,string[]>= {
   admission:['Year','Qualification','Faculty','Status','Academic Choice'],
   documents:['Certificate','Processed','Expiry Date','Remarks'],
   residenceApplications:['Academic Year','Residence Period','Building','Admission Status'],
   contacts:['Communication Type','Detail']
  };
  const important=importantBySection[this.section];
  return table.headers.map((_,i)=>i).filter(i=>{
   const name=table.headers[i].trim();
   if(['Contract Code','Quote Number','Quote Total','Load/View'].includes(name))return false;
   return important?important.includes(name):(name!==''||this.section==='documents');
  });
 }

 compactRows(table:ReadTable){
  const seen=new Set<string>();
  return table.rows.map(row=>row.cells.map(value=>value?.trim()||'').filter(value=>value&&value.toLowerCase()!=='detail').join(' ')).filter(value=>value&&!seen.has(value)&&seen.add(value));
 }
 selectModule(code:string){this.selectedModuleCode=code;}
 header(table:ReadTable,index:number){const name=table.headers[index];return name==='Qualification'&&table.headers.indexOf(name)===index?'Code':name||'Detail';}
}
