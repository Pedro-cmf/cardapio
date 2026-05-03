import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  viewMode = signal<'desktop' | 'mobile'>('desktop');
  menuUrl!: SafeResourceUrl;

  async ngOnInit() {
    const ests = await this.supabase.getAllEstablishments();
    if (ests.length > 0) {
      const slug = ests[0].slug;
      const url = `${window.location.origin}/menu/${slug}`;
      this.menuUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  setViewMode(mode: 'desktop' | 'mobile') {
    this.viewMode.set(mode);
  }

  refreshPreview() {
    if (this.previewFrame) {
      const iframe = this.previewFrame.nativeElement;
      iframe.src = iframe.src;
    }
  }
}
