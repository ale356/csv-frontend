import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { UploadComponent } from './app/upload/upload.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
