import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Establishment } from '../../../core/models';

@Component({
  selector: 'app-qrcode',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.scss']
})
export class QrcodeComponent implements OnInit {
  private supabase = inject(SupabaseService);
  establishments = signal<Establishment[]>([]);
  menuUrl = signal('');

  async ngOnInit() {
    const ests = await this.supabase.getAllEstablishments();
    this.establishments.set(ests);
    if (ests.length) this.setUrl(ests[0].slug);
  }

  setUrl(slug: string) {
    this.menuUrl.set(`${window.location.origin}/menu/${slug}`);
  }

  onSelect(event: Event) {
    this.setUrl((event.target as HTMLSelectElement).value);
  }

  downloadQR() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const a = document.createElement('a');
    a.download = 'qrcode-cardapio.png';
    a.href = canvas.toDataURL();
    a.click();
  }
}
