import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { MenuItem, CreateMenuItem, UpdateMenuItem } from '../models';
import { SupabaseService } from '../services/supabase.service';

/**
 * State interface for Items Store
 */
interface ItemsState {
  items: MenuItem[];
  selectedCategoryId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Initial state for Items Store
 */
const initialState: ItemsState = {
  items: [],
  selectedCategoryId: null,
  loading: false,
  error: null,
  lastUpdated: null
};

/**
 * Items Store - Centralized state management for menu items
 *
 * Features:
 * - Caching with timestamp
 * - Error handling
 * - Loading states
 * - Computed selectors
 * - Filtering by category
 *
 * Usage:
 * ```typescript
 * constructor(private itemsStore: ItemsStore) {}
 *
 * ngOnInit() {
 *   this.itemsStore.loadItems(categoryId);
 * }
 * ```
 */
export const ItemsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    // Active items only
    activeItems: computed(() =>
      store.items().filter(item => item.active)
    ),
    // Items on promotion
    promotionItems: computed(() =>
      store.items().filter(item => item.is_promotion && item.active)
    ),
    // Items by category (if filter applied)
    itemsByCategory: computed(() => (categoryId: string) =>
      store.items().filter(item => item.category_id === categoryId)
    ),
    // Check if data is stale (older than 5 minutes)
    isStale: computed(() => {
      const lastUpdated = store.lastUpdated();
      if (!lastUpdated) return true;
      return Date.now() - lastUpdated > 5 * 60 * 1000; // 5 minutes
    }),
    // Has items
    hasItems: computed(() => store.items().length > 0)
  })),
  withMethods((store, supabase = inject(SupabaseService)) => ({
    /**
     * Load items for a category
     * Uses cache if data is fresh
     */
    async loadItems(categoryId: string, forceRefresh = false): Promise<void> {
      // Use cache if available and fresh
      if (
        !forceRefresh &&
        store.selectedCategoryId() === categoryId &&
        !store.isStale() &&
        store.hasItems()
      ) {
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const items = await supabase.getItemsByCategory(categoryId);
        patchState(store, {
          items,
          selectedCategoryId: categoryId,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load items';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Load all items (for overview/stats)
     */
    async loadAllItems(forceRefresh = false): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        // Get all establishments and their items
        const establishments = await supabase.getAllEstablishments();
        const allItems: MenuItem[] = [];

        for (const est of establishments) {
          const categories = await supabase.getCategoriesByEstablishment(est.id);
          for (const cat of categories) {
            const items = await supabase.getItemsByCategory(cat.id);
            allItems.push(...items);
          }
        }

        patchState(store, {
          items: allItems,
          selectedCategoryId: null,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load all items';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Create a new item
     */
    async createItem(payload: CreateMenuItem): Promise<MenuItem> {
      patchState(store, { loading: true, error: null });

      try {
        const newItem = await supabase.createItem(payload);

        // Add to store
        patchState(store, {
          items: [...store.items(), newItem],
          loading: false,
          lastUpdated: Date.now()
        });

        return newItem;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Update an existing item
     */
    async updateItem(id: string, payload: UpdateMenuItem): Promise<MenuItem> {
      patchState(store, { loading: true, error: null });

      try {
        const updatedItem = await supabase.updateItem(id, payload);

        // Update in store
        patchState(store, {
          items: store.items().map(item =>
            item.id === id ? updatedItem : item
          ),
          loading: false,
          lastUpdated: Date.now()
        });

        return updatedItem;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Toggle item active status
     */
    async toggleActive(id: string, active: boolean): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        await supabase.toggleItemActive(id, active);

        // Update in store
        patchState(store, {
          items: store.items().map(item =>
            item.id === id ? { ...item, active } : item
          ),
          loading: false,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to toggle item';
        patchState(store, {
          loading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    /**
     * Delete an item
     */
    async deleteItem(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        await supabase.deleteItem(id);

        // Remove from store
        patchState(store, {
          items: store.items().filter(item => item.id !== id),
          loading: false,
          lastUpdated: Date.now()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
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
