import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ItemsStore } from '../../../core/store';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Category, MenuItem } from '../../../core/models';
import { formatPrice, parsePriceMask, formatPriceMask } from '../../../core/utils/price.utils';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  readonly itemsStore = inject(ItemsStore);

  categories = signal<Category[]>([]);
  selectedCatId = signal('');
  filterCatId = signal('');
  editingId = signal<string | null>(null);
  showModal = signal(false);
  uploadingImage = signal(false);
  imagePreview = signal<string | null>(null);

  priceDisplay = signal('0,00');
  promoPriceDisplay = signal('0,00');

  loading = computed(() => this.itemsStore.loading());

  filteredItems = computed(() => {
    const filter = this.filterCatId();
    const items = this.itemsStore.items();
    if (!filter) return items;
    return items.filter(item => item.category_id === filter);
  });

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    image_url: [''],
    active: [true],
    is_promotion: [false],
    promotion_price: [null as number | null]
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.loadCategories();
      if (this.categories().length) {
        this.selectedCatId.set(this.categories()[0].id);
      }
      await this.itemsStore.loadAllItems();
    } catch (error) {
      console.error('Failed to initialize items:', error);
    }
  }

  async loadCategories(): Promise<void> {
    const ests = await this.supabase.getAllEstablishments();
    const allCats: Category[] = [];
    for (const est of ests) {
      const cats = await this.supabase.getCategoriesByEstablishment(est.id);
      allCats.push(...cats);
    }
    this.categories.set(allCats.sort((a, b) => a.order_index - b.order_index));

    if (this.selectedCatId() && !allCats.find(c => c.id === this.selectedCatId())) {
      this.selectedCatId.set(allCats.length > 0 ? allCats[0].id : '');
    }
  }

  openModal(item?: MenuItem): void {
    if (item) {
      this.editingId.set(item.id);
      this.selectedCatId.set(item.category_id);
      this.form.patchValue({
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        image_url: item.image_url ?? '',
        active: item.active,
        is_promotion: item.is_promotion,
        promotion_price: item.promotion_price ?? null
      });
      this.priceDisplay.set(formatPriceMask(item.price));
      this.promoPriceDisplay.set(item.promotion_price ? formatPriceMask(item.promotion_price) : '0,00');
      this.imagePreview.set(item.image_url ?? null);
    } else {
      this.editingId.set(null);
      this.form.reset({ active: true, is_promotion: false, price: 0 });
      this.priceDisplay.set('0,00');
      this.promoPriceDisplay.set('0,00');
      this.imagePreview.set(null);
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.imagePreview.set(null);
    this.form.reset({ active: true, is_promotion: false, price: 0 });
    this.priceDisplay.set('0,00');
    this.promoPriceDisplay.set('0,00');
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;

    try {
      const v = this.form.value;
      const payload = {
        name: v.name!,
        description: v.description ?? '',
        price: v.price!,
        image_url: v.image_url ?? '',
        active: v.active!,
        is_promotion: v.is_promotion!,
        promotion_price: v.is_promotion ? (v.promotion_price ?? undefined) : undefined,
        category_id: this.selectedCatId()
      };

      if (this.editingId()) {
        await this.itemsStore.updateItem(this.editingId()!, payload);
      } else {
        await this.itemsStore.createItem(payload);
      }

      this.closeModal();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  }

  async toggleActive(item: MenuItem): Promise<void> {
    try {
      await this.itemsStore.toggleActive(item.id, !item.active);
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  }

  async delete(id: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Excluir Item',
      message: 'Tem certeza? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await this.itemsStore.deleteItem(id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }

  async onImageFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    try {
      const url = await this.supabase.uploadImage(file);
      this.form.patchValue({ image_url: url });
      this.imagePreview.set(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      this.uploadingImage.set(false);
      input.value = '';
    }
  }

  onImageUrlInput(event: Event): void {
    const url = (event.target as HTMLInputElement).value.trim();
    this.imagePreview.set(url || null);
  }

  getCategoryName(catId: string): string {
    return this.categories().find(c => c.id === catId)?.name ?? '—';
  }

  formatPrice(value: number): string {
    return formatPrice(value);
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parsePriceMask(input.value);
    this.form.patchValue({ price: value });
    this.priceDisplay.set(formatPriceMask(value));
  }

  onPromoPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parsePriceMask(input.value);
    this.form.patchValue({ promotion_price: value });
    this.promoPriceDisplay.set(formatPriceMask(value));
  }
}
