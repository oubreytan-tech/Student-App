import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { IconComponent } from './icon.component';
@Component({selector:'app-modal', standalone:true, imports:[A11yModule,IconComponent], template:`<div class="modal-overlay fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" (click)="close.emit()"><section role="dialog" aria-modal="true" [attr.aria-label]="title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" class="modal-card bg-slate-50 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] overflow-auto shadow-2xl" [class.modal-card-fill]="fill" (click)="$event.stopPropagation()"><div class="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3"><div><h2 class="font-extrabold text-blue-950 text-base">{{title}}</h2>@if(subtitle){<p class="text-[11px] text-slate-500 mt-1">{{subtitle}}</p>}</div><button cdkFocusInitial type="button" class="p-2 rounded-lg hover:bg-slate-100" aria-label="Close dialog" (click)="close.emit()"><app-icon name="x"/></button></div><div class="p-4 sm:p-5"><ng-content/></div></section></div>`})
export class ModalComponent {
 @Input() title=''; @Input() subtitle='';
 /** Holds the dialog at its full height so loading content does not resize the card when data arrives. */
 @Input() fill=false;
 @Output() close = new EventEmitter<void>();
 @HostListener('document:keydown.escape') escape(){ this.close.emit(); }
}
