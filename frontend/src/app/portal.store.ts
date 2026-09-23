import { Injectable, signal, computed } from '@angular/core';
import type { PortalScrapedPayload, SupportTicket, AppNotification } from './types';
export interface Account { id:string; name:string; email:string; studentNumber?:string; providers:{provider:string; email:string}[] }
export interface ReadResult { status:string; academicYear:string|null; retrievedAt:string; warnings:string[]; error?:{code:string; message:string}|null; data:{tables:ReadTable[];fields:{label:string;value:string|null}[];messages:string[]}|null }
export interface ReadTable { heading:string|null; caption:string|null; headers:string[]; rows:{rowIndex:number;cells:(string|null)[]}[] }
export class ApiError extends Error { constructor(public status:number, message:string){super(message);} }
@Injectable({providedIn:'root'})
export class PortalStore {
 readonly data = signal<PortalScrapedPayload|null>(null);
 readonly account = signal<Account|null>(null);
 readonly configured = signal<Record<string,boolean>>({google:false,microsoft:false});
 readonly tickets = signal<SupportTicket[]>([]);
 readonly notices = signal<AppNotification[]>([]);
 readonly notice = signal('');
 readonly busy = signal(false);
 readonly connecting = signal(false);
 readonly read = signal<Record<string,string>>({});
 readonly unread = computed(()=>this.tickets().filter(t=>t.status!=='Closed' && (Date.parse(this.read()[t.id]||'')||0)<Date.parse(t.updatedAt)).length);
 private refreshing = false;
 constructor(){
   void this.session();
   window.setInterval(()=>{if(this.data() && document.visibilityState==='visible') void this.keepAlive();},120000);
 }
 async api<T>(path:string, body?:unknown):Promise<T>{
   let response:Response;
   try {response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(90000)});}
   catch{throw new ApiError(0,'Unable to reach the student service. Please try again.');}
   const result=await response.json().catch(()=>({error:'The service returned an unreadable response.'}));
   if(!response.ok){
     if(response.status===401 && path.startsWith('scrape/')) this.data.set(null);
     throw new ApiError(response.status,typeof result.error==='string'?result.error:result.error?.message||'The request could not be completed.');
   }
   return result;
 }
 async login(unum:string,pin:string){
   const result=await this.api<{success:boolean;data:PortalScrapedPayload;isLive:boolean;statusMessage:string}>('scrape/portal-sync',{unum,pin,numtype:'S'});
   if(!result.success||!result.data) throw new Error('The portal could not verify your sign-in.');
   this.data.set({...result.data,isLive:result.isLive,statusMessage:result.statusMessage});
   if(this.account()) await this.linkPortal();
 }
 async keepAlive(){try{await this.api('scrape/keep-alive',{});}catch{/* A transient error must not clear the session. */}}
 async session(){try{const value=await this.api<{account:Account|null;configured:Record<string,boolean>}>('account/session'); this.account.set(value.account);this.configured.set(value.configured);if(value.account){this.loadRead(value.account.id);await this.refreshTickets();}}catch{this.notice.set('Support account service is currently unavailable.');}}
 private loadRead(id:string){try{this.read.set(JSON.parse(localStorage.getItem('univen_clone_read_'+id)||'{}'));}catch{this.read.set({});}}
 markRead(ticket:SupportTicket){this.read.update(old=>({...old,[ticket.id]:ticket.updatedAt}));try{localStorage.setItem('univen_clone_read_'+this.account()?.id,JSON.stringify(this.read()));}catch{}}
 async refreshTickets(){if(!this.account()||this.refreshing)return;this.refreshing=true;this.busy.set(true);try{const result=await this.api<{tickets:SupportTicket[];warnings:string[]}>('account/tickets/refresh',{});this.tickets.set(result.tickets);this.notice.set(result.warnings.join(' '));}catch(e){this.notice.set((e as Error).message);}finally{this.busy.set(false);this.refreshing=false;}}
 async linkPortal(){try{await this.api('scrape/link-account',{});const value=await this.api<{account:Account|null}>('account/session');this.account.set(value.account);}catch(e){this.notice.set((e as Error).message);}}
 async signIn(provider:string){
   if(this.connecting())return;
   const popup=window.open('about:blank','univen-account','width=520,height=680');
   if(!popup){this.notice.set('Allow pop-ups to connect your email account.');return;}
   this.connecting.set(true);this.notice.set('');
   try{
     const result=await this.api<{url:string}>('account/start',{provider,link:!!this.account()});popup.location.href=result.url;
     await new Promise<void>((resolve,reject)=>{
       const start=Date.now();let checking=false;
       const receive=(event:MessageEvent)=>{if(event.origin!==location.origin||event.source!==popup)return;if(event.data?.type==='univen-account-connected'){cleanup();resolve();}else if(event.data?.type==='univen-account-error'){cleanup();reject(new Error('Sign-in could not be completed. Please try again.'));}};
       const cleanup=()=>{clearInterval(timer);window.removeEventListener('message',receive);};
       const timer=window.setInterval(async()=>{if(checking)return;checking=true;try{const state=await this.api<{account:Account|null}>('account/session');if(state.account?.providers.some(p=>p.provider===provider)){cleanup();resolve();}else if(popup.closed||Date.now()-start>600000){cleanup();reject(new Error('Sign-in was not completed.'));}}catch{if(popup.closed){cleanup();reject(new Error('Sign-in could not be verified.'));}}finally{checking=false;}},2000);
       window.addEventListener('message',receive);
     });
     await this.session();if(this.data())await this.linkPortal();
   }catch(e){this.notice.set((e as Error).message);}finally{popup.close();this.connecting.set(false);}
 }
 async send(ticket:SupportTicket,attachments:unknown[],provider:string){const result=await this.api<{ticket:SupportTicket}>('account/tickets/send',{ticket,attachments,provider});this.tickets.update(old=>[result.ticket,...old.filter(t=>t.id!==result.ticket.id)]);this.notices.update(old=>[{id:crypto.randomUUID(),title:'Ticket Logged: '+result.ticket.id,message:result.ticket.title,type:'ticket',timestamp:new Date().toISOString(),read:false,relatedId:result.ticket.id},...old]);return result.ticket;}
 async reply(ticketId:string,text:string,operationId:string){const result=await this.api<{ticket:SupportTicket}>('account/tickets/reply',{ticketId,text,operationId});this.tickets.update(old=>old.map(t=>t.id===ticketId?result.ticket:t));}
 async logout(){await this.api('scrape/logout',{});await this.api('account/logout',{});this.data.set(null);this.account.set(null);this.tickets.set([]);this.notices.set([]);this.read.set({});}
}
