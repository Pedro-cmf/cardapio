import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { Category, CreateCategory, UpdateCategory } from '../models';
import { SupabaseService } from '../services/supabase.service';

/**
 * State interface for Categories Store
 */
interface CategoriesState {
  categories: Category[];
  selectedEstablishmentId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Initial state for Categories Store
 */
const initialState: CategoriesState = {
  categories: [],
  selectedEstablishmentId: null,
  loading: false,
  error: null,
  lastUpdated: null
};

/**
 * Categories Store - Centralized state management for categories
 *
 * Features:
 * - Caching with timestamp
 * - Error handling
 * - Loading states
 * - Computed selectors
 *
 * Usage:
 * ```typescript
 * constructor(private categoriesStore: CategoriesStore) {}
 *
 * ngOnInit() {
 *   this.categoriesStore.loadCategories(establishmentId);
 * }
 * ```
 */
export const CategoriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    // Active categories only
    activeCategories: computed(() =>
      store.categories().filter(cat => cat.active)
    ),
    // Sorted by order_index
    sortedCategories: computed(() =>
      [...store.categories()].sort((a, b) => a.order_index - b.order_index)
    ),
    // Check if data is stale (older than 5 minutes)
    isStale: computed(() => {
      const lastUpdated = store.lastUpdated();
      if (!lastUpdated) return true;
      return Date.now() - lastUpdated > 5 * 60 * 1000; // 5 minutes
    }),
    // Has categories
    hasCategories: computed(() => store.categories().length > 0)
  })),
  withMethods((store, supabase = inject(SupabaseService)) => ({
    /**
     * Load categories for an establishment
     * Uses cache if data is fresh
     */
    async loadCategories(establishmentId: string, forceRefresh = false): Promise<void> {
      // Use cache if available and fresh
      if (
        !forceRefresh &&
        store.selectedEstablishmentId() === establishmentId &&
        !store.isStale() &&
        store.hasCategories()
      ) {
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const categories = await supabase.getCategoriesByEstablishment(establishmentId);
        patchState(store, {
          categories,
          selectedEstablishmentId: establishmentId,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Create a new category
     */
    async createCategory(payload: CreateCategory): Promise<Category> {
      patchState(store, { loading: true, error: null });

      try {
        const newCategory = await supabase.createCategory(payload);

        // Add to store
        patchState(store, {
          categories: [...store.categories(), newCategory],
          loading: false,
          lastUpdated: Date.now()
        });

        return newCategory;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Update an existing category
     */
    async updateCategory(id: string, payload: UpdateCategory): Promise<Category> {
      patchState(store, { loading: true, error: null });

      try {
        const updatedCategory = await supabase.updateCategory(id, payload);

        // Update in store
        patchState(store, {
          categories: store.categories().map(cat =>
            cat.id === id ? updatedCategory : cat
          ),
          loading: false,
          lastUpdated: Date.now()
        });

        return updatedCategory;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Delete a category
     */
    async deleteCategory(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        await supabase.deleteCategory(id);

        // Remove from store
        patchState(store, {
          categories: store.categories().filter(cat => cat.id !== id),
          loading: false,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Update category order after drag and drop
     */
    async updateCategoryOrder(categories: Category[]): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        // Update order_index for all categories
        const updates = categories.map((cat, index) =>
          supabase.updateCategory(cat.id, { order_index: index })
        );

        await Promise.all(updates);

        // Update store with new order
        patchState(store, {
          categories: categories.map((cat, index) => ({
            ...cat,
            order_index: index
          })),
          loading: false,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update category order';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Clear the store
     */
    clearStore(): void {
      patchState(store, initialState);
    }
  }))
);
