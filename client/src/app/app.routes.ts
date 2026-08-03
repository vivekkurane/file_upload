import { Routes } from '@angular/router';
import { ListComponent } from './list.component';
import { UploadComponent } from './upload.component';
import { PreviewComponent } from './preview.component';

export const routes: Routes = [
  { path: '', component: ListComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'preview/:id', component: PreviewComponent },
  { path: '**', redirectTo: '' }
];
