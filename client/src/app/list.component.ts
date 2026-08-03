import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DocumentService, DocMeta } from './document.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="card card-modern">
    <div class="card-body">
      <h5 class="card-title">Uploaded Documents</h5>
      <div *ngIf="loading" class="text-center text-muted py-3">Loading...</div>
      <div *ngIf="!loading && docs.length===0" class="text-center text-muted py-3">No documents uploaded yet.</div>
      <div *ngIf="!loading && docs.length>0" class="table-responsive d-none d-md-block">
        <table class="table table-sm table-hover mb-0">
          <thead>
            <tr><th>Filename</th><th>Size</th><th>Uploaded</th><th></th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of docs">
              <td><a [routerLink]="['/preview', d.id]" class="file-link">{{d.filename}}</a></td>
              <td>{{humanSize(d.size)}}</td>
              <td>{{d.createdAt | date:'medium'}}</td>
              <td class="text-right"><a class="btn btn-sm btn-gradient btn-pill mr-2" [href]="service.downloadUrl(d.id)">Download</a></td>
              <td class="text-right"><button class="btn btn-sm btn-danger btn-pill" (click)="deleteDoc(d)">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!loading && docs.length>0" class="d-md-none">
        <div *ngFor="let d of docs" class="doc-card-mobile">
          <div class="mb-2">
            <a [routerLink]="['/preview', d.id]" class="file-link">{{d.filename}}</a>
            <div class="small text-muted">{{humanSize(d.size)}} · {{d.createdAt | date:'medium'}}</div>
          </div>
          <div class="d-flex gap-2">
            <a class="btn btn-sm btn-gradient btn-pill flex-fill" [href]="service.downloadUrl(d.id)">Download</a>
            <button class="btn btn-sm btn-danger btn-pill flex-fill" (click)="deleteDoc(d)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class ListComponent implements OnInit {
  docs: DocMeta[] = [];
  loading = false;
  constructor(public service: DocumentService, private router: Router) {}
  ngOnInit(){ this.load(); }
  humanSize(bytes: number){ if(!bytes) return '0 B'; const thresh=1024; if(Math.abs(bytes)<thresh) return bytes+' B'; const units=['KB','MB','GB','TB']; let u=-1; do{ bytes/=thresh; ++u;} while(Math.abs(bytes)>=thresh && u<units.length-1); return bytes.toFixed(1)+' '+units[u]; }
  load(){ this.loading=true; this.service.list().subscribe(d=>{ this.docs=d; this.loading=false; }, ()=>{ this.loading=false; }); }
 deleteDoc(d: DocMeta){ if(!confirm('Delete "'+d.filename+'"?')) return; this.service.deleteDocument(d.id).subscribe(() => { this.load(); this.service.notifyStorageChanged(); }); }
}
