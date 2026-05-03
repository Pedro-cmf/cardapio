import {
  Component, OnInit, signal, inject, AfterViewInit, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Establishment, Category } from '../../../core/models';

@Component({
  selector: 'app-menu-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-home.component.html',
  styleUrls: ['./menu-home.component.scss']
})
export class MenuHomeComponent implements OnInit, AfterViewInit {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);

  @ViewChild('navScroll') navScrollEl?: ElementRef<HTMLElement>;

  establishment = signal<Establishment | null>(null);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');
  activeCategoryId = signal('');

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    try {
      const est = await this.supabase.getEstablishmentBySlug(slug);
      if (!est) {
        this.error.set('Estabelecimento não encontrado.');
        return;
      }
      this.establishment.set(est);
      this.applyTheme(est);
      const cats = await this.supabase.getFullMenu(est.id);
      this.categories.set(cats);
      if (cats.length) this.activeCategoryId.set(cats[0].id);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erro ao carregar cardápio');
    } finally {
      this.loading.set(false);
    }
  }

  ngAfterViewInit() {
    // Scroll spy simples
    window.addEventListener('scroll', () => this.updateActive(), { passive: true });
    setTimeout(() => this.updateActive(), 100);
  }

  private updateActive() {
    const navWrap = document.querySelector('.nav-wrap');
    if (!navWrap) return;

    const offset = navWrap.clientHeight + 20;
    let currentIdx = 0;

    this.categories().forEach((cat, i) => {
      const el = document.getElementById('sec-' + cat.id);
      if (el && el.getBoundingClientRect().top <= offset) {
        currentIdx = i;
      }
    });

    const currentCat = this.categories()[currentIdx];
    if (currentCat) {
      this.activeCategoryId.set(currentCat.id);

      // Auto-scroll da nav
      const navBtn = document.querySelectorAll('.nav-btn')[currentIdx] as HTMLElement;
      if (navBtn && this.navScrollEl) {
        const nav = this.navScrollEl.nativeElement;
        nav.scrollTo({
          left: navBtn.offsetLeft - nav.clientWidth / 2 + navBtn.clientWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }

  scrollToCategory(id: string) {
    const el = document.getElementById('sec-' + id);
    if (!el) return;
    const navWrap = document.querySelector('.nav-wrap');
    const navH = navWrap ? navWrap.clientHeight : 0;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - navH - 14,
      behavior: 'smooth'
    });
  }

  formatPrice(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  private applyTheme(est: Establishment) {
    const r = document.documentElement;
    r.style.setProperty('--color-primary', est.primary_color);
    r.style.setProperty('--color-secondary', est.secondary_color);
    r.style.setProperty('--color-accent', est.accent_color);
  }
}
