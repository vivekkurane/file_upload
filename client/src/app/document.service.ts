import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface DocMeta { id: string; filename: string; size: number; createdAt: string; mimetype?: string }
export interface StorageSummary {
 total: number;
 dataSize: number;
 count: number;
 dbStorageSize: number | null;
 quota: number | null;
 remaining: number | null;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
 private storageRefreshSource = new Subject<void>();
 readonly storageRefresh$ = this.storageRefreshSource.asObservable();

 constructor(private http: HttpClient) {}

 list(): Observable<DocMeta[]> { return this.http.get<DocMeta[]>('/api/documents'); }
 upload(file: File) { const fd = new FormData(); fd.append('document', file); return this.http.post('/api/upload', fd); }
 uploadMultiple(formData: FormData) { return this.http.post('/api/upload', formData); }
 storageSummary(): Observable<StorageSummary> { return this.http.get<StorageSummary>('/api/storage'); }
 deleteDocument(id: string) { return this.http.delete(`/api/documents/${id}`); }
 metadata(id: string) { return this.http.get<any>(`/api/documents/${id}/metadata`); }
 previewUrl(id: string) { return `/api/documents/${id}/preview`; }
 downloadUrl(id: string) { return `/api/documents/${id}`; }
 notifyStorageChanged(): void { this.storageRefreshSource.next(); }
}
