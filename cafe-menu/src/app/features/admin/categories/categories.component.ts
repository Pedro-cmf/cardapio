import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CategoriesStore } from '../../../core/store';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Category, Establishment } from '../../../core/models';

/**
 * Categories Management Component
 *
 * Manages menu categories with drag-and-drop ordering
 *
 * Features:
 * - Uses CategoriesStore for state management (no page reloads)
 * - Cached data (doesn't reload unnecessarily)
 * - Drag and drop reordering
 * - Modal-based CRUD
 * - Custom confirmation dialogs
 */
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);

  // Use store instead of local signals
  readonly categoriesStore = inject(CategoriesStore);

  establishments = signal<Establishment[]>([]);
  selectedEstId = signal('');
  editingId = signal<string | null>(null);
  showModal = signal(false);

  // Computed from store
  categories = computed(() => this.categoriesStore.sortedCategories());
  loading = computed(() => this.categoriesStore.loading());

  form = this.fb.group({
    name: ['', Validators.required],
    order_index: [0],
    active: [true]
  });

  async ngOnInit(): Promise<void> {
    try {
      const ests = await this.supabase.getAllEstablishments();
      this.establishments.set(ests);

      if (ests.length) {
        this.selectedEstId.set(ests[0].id);
        await this.loadCategories();
      }
    } catch (error) {
      console.error('Failed to load establishments:', error);
    }
  }

  /**
   * Load categories using store (with caching)
   */
  async loadCategories(): Promise<void> {
    try {
      await this.categoriesStore.loadCategories(this.selectedEstId());
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  openModal(cat?: Category) {
    if (cat) {
      this.editingId.set(cat.id);
      this.form.patchValue({ name: cat.name, order_index: cat.order_index, active: cat.active });
    } else {
      this.editingId.set(null);
      // Nova categoria sempre vai para o final
      const nextOrder = this.categories().length;
      this.form.reset({ name: '', active: true, order_index: nextOrder });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.form.reset({ name: '', active: true, order_index: 0 });
  }

  /**
   * Save category (create or update) using store
   */
  async save(): Promise<void> {
    if (this.form.invalid) return;

    try {
      const payload = {
        name: this.form.value.name!,
        order_index: this.form.value.order_index ?? 0,
        active: this.form.value.active ?? true,
        establishment_id: this.selectedEstId()
      };

      if (this.editingId()) {
        // Update existing category
        await this.categoriesStore.updateCategory(this.editingId()!, payload);
      } else {
        // Create new category
        await this.categoriesStore.createCategory(payload);
      }

      this.closeModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      // Error is already handled by store, just log it
    }
  }

  /**
   * Toggle category active status using store
   */
  async toggleActive(cat: Category): Promise<void> {
    try {
      await this.categoriesStore.updateCategory(cat.id, { active: !cat.active });
    } catch (error) {
      console.error('Failed to toggle category:', error);
    }
  }

  /**
   * Delete category with confirmation dialog using store
   */
  async delete(id: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Excluir Categoria',
      message: 'Tem certeza? Isso excluirá os itens dessa categoria.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await this.categoriesStore.deleteCategory(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  }

  /**
   * Handle drag and drop reordering using store
   */
  async onDrop(event: CdkDragDrop<Category[]>): Promise<void> {
    const cats = [...this.categories()];
    moveItemInArray(cats, event.previousIndex, event.currentIndex);

    try {
      // Update order using store (handles all API calls)
      await this.categoriesStore.updateCategoryOrder(cats);
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  }
}
