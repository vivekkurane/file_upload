import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { DocumentService } from './document.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="card card-modern">
    <div class="card-body">
      <button class="btn btn-outline-secondary btn-pill mb-3" (click)="goBack()">← Back</button>

      <div *ngIf="loading" class="text-center text-muted py-4">Loading preview...</div>
      <div *ngIf="error" class="alert alert-danger">{{error}}</div>

      <div *ngIf="!loading && !error">
        <div class="mb-3"><strong>{{doc?.filename}}</strong>
          <div class="text-muted">{{humanSize(doc?.size)}} · {{doc?.mimetype || 'Unknown type'}}</div>
        </div>

        <div class="mb-3">
          <a class="btn btn-gradient btn-pill mr-2" [href]="service.downloadUrl(doc.id)">Download</a>
          <a class="btn btn-outline-secondary btn-pill" [href]="service.previewUrl(doc.id)">Open Raw Preview</a>
        </div>

        <div *ngIf="viewerUrl">
          <div *ngIf="isPdf" style="height:80vh;">
            <iframe width="100%" height="100%" frameborder="0" [src]="trustedUrl"></iframe>
          </div>
          <div *ngIf="isImage" class="text-center">
            <img [src]="viewerUrl" [alt]="doc?.filename" class="img-fluid" style="max-height:80vh;" />
          </div>
          <div *ngIf="isText">
            <pre class="border p-3" style="max-height:70vh; overflow:auto; background:#f8f9fa;">{{textContent}}</pre>
          </div>
        </div>

        <div class="alert alert-warning" *ngIf="!viewerUrl">Preview is not available for this file type. Use the download button to open it locally.</div>
      </div>

    </div>
  </div>
  `
})
export class PreviewComponent implements OnInit {
  doc: any = null;
  loading = true;
  error: string | null = null;
  viewerUrl: string | null = null;
  trustedUrl: any = null;
  isPdf = false; isImage = false; isText = false; textContent = '';

  constructor(private route: ActivatedRoute, public service: DocumentService, private sanitizer: DomSanitizer) {}

  ngOnInit(){
    const id = this.route.snapshot.paramMap.get('id');
    if(!id){ this.loading=false; this.error='No document id provided.'; return; }
    this.service.metadata(id).subscribe(res=>{
      this.doc = res; this.loading=false;
      this.isPdf = this.doc.mimetype === 'application/pdf';
      this.isImage = this.doc.mimetype && this.doc.mimetype.indexOf('image/') === 0;
      this.isText = this.doc.mimetype === 'text/plain';
      if(this.isPdf || this.isImage || this.isText){ this.viewerUrl = this.service.previewUrl(id); this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerUrl); }
      if(this.isText && this.viewerUrl){ fetch(this.viewerUrl).then(r=>r.text()).then(t=>this.textContent=t).catch(()=>this.textContent='[Failed to load]'); }
    }, err=>{ this.loading=false; this.error='Document not found or failed to load.'; });
  }
  goBack(){ history.back(); }
  humanSize(bytes: any){ if(!bytes) return '0 B'; const b = Number(bytes); const thresh=1024; if(Math.abs(b)<thresh) return b+' B'; const units=['KB','MB','GB','TB']; let u=-1; let val=b; do{ val/=thresh; ++u;} while(Math.abs(val)>=thresh && u<units.length-1); return val.toFixed(1)+' '+units[u]; }
}
