import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocMeta { id: string; filename: string; size: number; createdAt: string; mimetype?: string }

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private http: HttpClient) {}

  list(): Observable<DocMeta[]> { return this.http.get<DocMeta[]>('/api/documents'); }
  upload(file: File) { const fd = new FormData(); fd.append('document', file); return this.http.post('/api/upload', fd); }
  uploadMultiple(formData: FormData) { return this.http.post('/api/upload', formData); }
  metadata(id: string) { return this.http.get<any>(`/api/documents/${id}/metadata`); }
  previewUrl(id: string) { return `/api/documents/${id}/preview`; }
  downloadUrl(id: string) { return `/api/documents/${id}`; }
}
