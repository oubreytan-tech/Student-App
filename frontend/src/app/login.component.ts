import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PortalStore } from './portal.store';
import { IconComponent } from './shared/icon.component';
@Component({selector:'app-login',standalone:true,imports:[FormsModule,IconComponent],templateUrl:'./login.component.html'})
export class LoginComponent {
 readonly store=inject(PortalStore); unum='';pin='';showPin=false;readonly busy=signal(false);readonly error=signal('');
 cleanStudent(value:string){this.unum=value.replace(/\D/g,'').slice(0,9);this.error.set('');}
 cleanPin(value:string){this.pin=value.replace(/\D/g,'').slice(0,5);this.error.set(this.pin.startsWith('0')?'PIN cannot start with 0 as required by the University portal.':'');}
 async login(){if(this.busy())return;if(!/^\d{7,9}$/.test(this.unum)){this.error.set('Student Number must be 7 to 9 digits.');return;}if(!/^[1-9]\d{4}$/.test(this.pin)){this.error.set('PIN must be exactly 5 numeric digits and cannot start with 0.');return;}this.busy.set(true);this.error.set('');try{await this.store.login(this.unum,this.pin);}catch(e){this.error.set((e as Error).message);}finally{this.pin='';this.busy.set(false);}}
}
