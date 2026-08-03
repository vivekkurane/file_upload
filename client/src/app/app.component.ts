import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocumentService, StorageSummary } from './document.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.shell.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Document Manager';
  canInstall = false;
  storageSummary: StorageSummary | null = null;
  loadingStorage = false;
  private deferredPrompt: any = null;

  constructor(private service: DocumentService) {}

  ngOnInit(): void {
    this.loadStorageSummary();
    this.service.storageRefresh$.subscribe(() => this.loadStorageSummary());

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall = true;
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall = false;
      this.deferredPrompt = null;
    });
  }

  loadStorageSummary(): void {
    this.loadingStorage = true;
    this.service.storageSummary().subscribe({
      next: (summary) => {
        this.storageSummary = summary;
        this.loadingStorage = false;
      },
      error: () => {
        this.loadingStorage = false;
      }
    });
  }

  formatSize(bytes: number | null | undefined): string {
    if (bytes == null || bytes === 0) return '0 B';
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  }

  installPwa(): void {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then(() => {
      this.canInstall = false;
      this.deferredPrompt = null;
    });
  }
}
