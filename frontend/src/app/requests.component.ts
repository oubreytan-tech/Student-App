import { Component, inject, signal, Output, EventEmitter, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PortalStore } from './portal.store';
import { normalizeTicket, formatSupportDate } from './shared/supportNormalizer';
import { IconComponent } from './shared/icon.component';
@Component({selector:'app-requests',standalone:true,imports:[FormsModule,IconComponent],templateUrl:'./requests.component.html',styleUrl:'./requests.css'})
export class RequestsComponent {
 readonly store=inject(PortalStore);@Output() logCall=new EventEmitter<void>();search='';status='All';selected=signal<string|null>(null);replyText='';readonly sending=signal(false);readonly error=signal('');private attempt:{text:string;id:string}|null=null;readonly formatDate=formatSupportDate;
 readonly detail=computed(()=>{const t=this.store.tickets().find(t=>t.id===this.selected());return t?normalizeTicket(t):null;});
 get filtered(){return this.store.tickets().map(normalizeTicket).filter(t=>(this.status==='All'||(this.status==='Active'?!['Closed','Resolved'].includes(t.status):['Closed','Resolved'].includes(t.status)))&&(t.title+' '+t.id+' '+(t.externalTicketId||'')+' '+t.category).toLowerCase().includes(this.search.toLowerCase()));}
 open(id:string){this.selected.set(id);const ticket=this.store.tickets().find(t=>t.id===id);if(ticket)this.store.markRead(ticket);this.replyText='';this.attempt=null;this.error.set('');}
 async reply(){const ticket=this.detail();if(!ticket||!this.replyText.trim()||this.sending())return;this.sending.set(true);this.error.set('');if(!this.attempt)this.attempt={text:this.replyText.trim(),id:crypto.randomUUID()};try{await this.store.reply(ticket.id,this.attempt.text,this.attempt.id);this.replyText='';this.attempt=null;}catch(e){this.error.set((e as Error).message);}finally{this.sending.set(false);}}
}
