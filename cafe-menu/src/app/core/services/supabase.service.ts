import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  Establishment, Category, MenuItem,
  CreateCategory, UpdateCategory,
  CreateMenuItem, UpdateMenuItem
} from '../models';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  // ── Establishments ────────────────────────────
  async getEstablishmentBySlug(slug: string): Promise<Establishment | null> {
    const { data, error } = await this.supabase
      .from('establishments')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  }

  async getAllEstablishments(): Promise<Establishment[]> {
    const { data, error } = await this.supabase
      .from('establishments')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async createEstablishment(payload: Omit<Establishment, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase
      .from('establishments')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ── Categories ────────────────────────────────
  async getCategoriesByEstablishment(establishmentId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('order_index');
    if (error) throw error;
    return data ?? [];
  }

  async createCategory(payload: CreateCategory): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, payload: UpdateCategory): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ── Menu Items ────────────────────────────────
  async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async getFullMenu(establishmentId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*, items:menu_items!inner(*)')
      .eq('establishment_id', establishmentId)
      .eq('active', true)
      .eq('items.active', true)
      .order('order_index');
    if (error) throw error;
    return data ?? [];
  }

  async createItem(payload: CreateMenuItem): Promise<MenuItem> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateItem(id: string, payload: UpdateMenuItem): Promise<MenuItem> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleItemActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .update({ active })
      .eq('id', id);
    if (error) throw error;
  }

  async togglePromotion(id: string, is_promotion: boolean, promotion_price?: number): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .update({ is_promotion, promotion_price: is_promotion ? promotion_price : null })
      .eq('id', id);
    if (error) throw error;
  }

  // ── Storage ───────────────────────────────────
  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from('menu-images')
      .upload(fileName, file, { upsert: false });

    if (error) throw error;

    const { data: urlData } = this.supabase.storage
      .from('menu-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }
}
