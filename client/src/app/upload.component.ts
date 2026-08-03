import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from './document.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="card card-modern">
    <div class="card-body">
      <h5 class="card-title">Upload Document</h5>
      <div class="drop-area text-center mb-3 d-flex align-items-center justify-content-center flex-column" (click)="fileInput.click()" (drop)="$event.preventDefault(); onFileDrop($event)">
        <div class="h4">📄</div>
        <div class="lead">Drag & drop your file(s) here</div>
        <div class="small text-muted">or click to browse — accepted: .pdf, .doc, .docx, .txt</div>
        <input type="file" multiple style="display:none" #fileInput (change)="onFile($event)" />
      </div>

      <div *ngIf="selected.length>0" class="mb-2">
        <div *ngFor="let f of selected; let i = index" class="d-flex align-items-center justify-content-between mb-1">
          <div>
            <strong class="file-link">{{f.name}}</strong>
            <div class="small text-muted">{{humanSize(f.size)}}</div>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-secondary btn-pill mr-2" (click)="removeAt(i)">Remove</button>
          </div>
        </div>
      </div>

      <div class="mt-3">
        <button class="btn btn-gradient btn-pill mr-2" (click)="upload()" [disabled]="selected.length===0 || uploading">Upload</button>
        <button class="btn btn-secondary" (click)="clear()">Clear</button>
      </div>
    </div>
  </div>
  `
})
export class UploadComponent {
  selected: File[] = [];
  uploading = false;
  constructor(private service: DocumentService){ }
  humanSize(bytes: number){ if(!bytes) return '0 B'; const thresh=1024; if(Math.abs(bytes)<thresh) return bytes+' B'; const units=['KB','MB','GB','TB']; let u=-1; do{ bytes/=thresh; ++u;} while(Math.abs(bytes)>=thresh && u<units.length-1); return bytes.toFixed(1)+' '+units[u]; }
  onFile(ev: any){ const files = ev.target.files || ev.dataTransfer && ev.dataTransfer.files; if(files && files.length){ this.selected = Array.from(files); } }
  onFileDrop(ev: any){ ev.preventDefault(); const files = ev.dataTransfer && ev.dataTransfer.files; if(files && files.length){ this.selected = Array.from(files); } }
  removeAt(i:number){ this.selected.splice(i,1); }
  clear(){ this.selected=[]; }
  upload(){ if(this.selected.length===0) return; this.uploading=true; const fd = new FormData();
    // append all files using the same field name (server uses upload.any())
    this.selected.forEach(f => fd.append('documents', f, f.name));
    this.service.uploadMultiple(fd).subscribe(()=>{ this.uploading=false; this.clear(); alert('Uploaded'); }, ()=>{ this.uploading=false; alert('Upload failed'); });
  }
}
