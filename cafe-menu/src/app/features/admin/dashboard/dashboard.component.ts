import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Establishment } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);

  establishments = signal<Establishment[]>([]);
  selected = signal<Establishment | null>(null);
  currentPage = 'Visão Geral';

  async ngOnInit() {
    try {
      const data = await this.supabase.getAllEstablishments();
      this.establishments.set(data);
      if (data.length === 1) this.selected.set(data[0]);
    } catch (error) {
      console.error('Failed to load establishments:', error);
    }
  }

  logout() { this.auth.signOut(); }
}
