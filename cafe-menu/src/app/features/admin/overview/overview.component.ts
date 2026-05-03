import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Category, MenuItem } from '../../../core/models';

interface CategoryWithCount extends Category {
  itemCount: number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  private supabase = inject(SupabaseService);

  categories = signal<Category[]>([]);
  allItems = signal<MenuItem[]>([]);

  stats = computed(() => {
    const cats = this.categories();
    const items = this.allItems();

    return {
      categories: cats.length,
      activeCategories: cats.filter(c => c.active).length,
      items: items.length,
      activeItems: items.filter(i => i.active).length,
      promoItems: items.filter(i => i.is_promotion).length
    };
  });

  categoriesWithCount = computed(() => {
    const cats = this.categories();
    const items = this.allItems();

    return cats
      .map(cat => ({
        ...cat,
        itemCount: items.filter(i => i.category_id === cat.id).length
      }))
      .sort((a, b) => a.order_index - b.order_index);
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const ests = await this.supabase.getAllEstablishments();
      const allCats: Category[] = [];
      const allItems: MenuItem[] = [];

      for (const est of ests) {
        const cats = await this.supabase.getCategoriesByEstablishment(est.id);
        allCats.push(...cats);

        for (const cat of cats) {
          const items = await this.supabase.getItemsByCategory(cat.id);
          allItems.push(...items);
        }
      }

      this.categories.set(allCats);
      this.allItems.set(allItems);
    } catch (error) {
      console.error('Failed to load overview data:', error);
    }
  }
}
