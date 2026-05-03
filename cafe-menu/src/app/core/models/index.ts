export interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  created_at?: string;
}

export interface Category {
  id: string;
  establishment_id: string;
  name: string;
  order_index: number;
  active: boolean;
  created_at?: string;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  active: boolean;
  is_promotion: boolean;
  promotion_price?: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateCategory = Omit<Category, 'id' | 'created_at' | 'items'>;
export type UpdateCategory = Partial<CreateCategory>;
export type CreateMenuItem = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMenuItem = Partial<CreateMenuItem>;
