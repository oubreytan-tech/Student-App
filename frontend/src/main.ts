import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent).catch(() => { document.body.textContent = 'The portal could not start. Please refresh.'; });
