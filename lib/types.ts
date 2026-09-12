export type Role = "admin" | "kitchen" | "customer";
export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled" | "closed";
export type PaymentStatus = "unpaid" | "paid";
export type OrderType = "dine_in" | "delivery";

export interface Settings {
  id: number;
  restaurant_name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  cover_bg_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  social: Record<string, string>;
  headings: Record<string, string>;
  buttons: Record<string, string>;
  labels: Record<string, string>;
  messages: Record<string, string>;
  content: Record<string, string>;
  theme_id: string;
  theme_colors: { primary: string; secondary: string; accent: string; surface: string; text: string } | null;
  currency: string;
  tax_percent: number;
  service_charge_percent: number;
  is_open: boolean;
  service_status: "active" | "suspended";
  delivery_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category { id: string; name: string; description: string | null; image_url: string | null; sort_order: number; is_active: boolean; }
export interface Product {
  id: string; category_id: string; name: string; description: string | null;
  image_url: string | null; price: number; discount_price: number | null;
  is_available: boolean; eat_now_enabled: boolean; pack_enabled: boolean; sort_order: number;
  variants: Variant[]; addons: Addon[]; pack_sizes: PackSize[];
}
export interface Variant { id: string; product_id: string; name: string; price_delta: number; }
export interface Addon { id: string; product_id: string; name: string; price: number; }
export interface PackSize { id: string; product_id: string; label: string; price_delta: number; }
export interface GalleryItem { id: string; image_url: string; alt: string | null; sort_order: number; }
export interface RestaurantTable { id: string; code: string; name: string; is_active: boolean; qr_token: string; }

export interface OrderItemAddon { id: string; order_item_id: string; addon_name: string; price: number; }
export interface OrderItem {
  id: string; order_id: string; product_id: string | null; product_name: string;
  variant_name: string | null; pack_size: string | null; mode: string | null;
  unit_price: number; base_price: number; qty: number; total: number; note: string | null;
  order_item_addons: OrderItemAddon[];
}
export interface Order {
  id: string; order_number: number; table_id: string | null; table_label: string | null;
  customer_id: string | null; guest_name: string | null; guest_phone: string | null;
  type: OrderType; status: OrderStatus; payment_status: PaymentStatus; payment_method: string | null;
  address_snapshot: string | null; subtotal: number; discount: number; tax: number;
  service_charge: number; grand_total: number; note: string | null;
  estimated_prep_minutes: number | null; placed_at: string; completed_at: string | null;
  order_items: OrderItem[];
}

export interface CartItem {
  key: string; product_id: string; name: string; image_url: string | null;
  unit_price: number; base_price: number; qty: number;
  variant_name: string | null; pack_size: string | null;
  addons: { name: string; price: number }[];
  mode: "eat_now" | "pack"; note: string | null;
}
