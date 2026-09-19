"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types";

export interface PlaceOrderInput {
  type: "dine_in" | "delivery";
  tableCode?: string;
  guestName?: string;
  guestPhone?: string;
  address?: string;
  note?: string;
  items: CartItem[];
}

export async function placeOrder(input: PlaceOrderInput) {
  try {
    const supabase = createAdminClient();
    const { data: settings, error: settingsError } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (settingsError) return { error: `Restaurant settings unavailable: ${settingsError.message}` };
    if (!settings) return { error: "Restaurant not configured." };
    if (settings.service_status !== "active") return { error: "Ordering is temporarily unavailable." };
    if (!settings.is_open) return { error: "Restaurant is currently closed." };
    if (input.type === "delivery" && !settings.delivery_enabled) return { error: "Home delivery is not available." };
    if (!input.items?.length) return { error: "Your cart is empty." };
    if (input.items.length > 100) return { error: "Too many items in one order." };
    for (const item of input.items) {
      if (!item.product_id || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) {
        return { error: "Invalid cart item." };
      }
    }

  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();

  let tableId: string | null = null;
  let tableLabel: string | null = null;
  if (input.type === "dine_in") {
    const { data: table, error: tableError } = await supabase.from("restaurant_tables")
      .select("id, name").eq("code", (input.tableCode ?? "").toUpperCase()).eq("is_active", true).maybeSingle();
    if (tableError) return { error: `Table lookup failed: ${tableError.message}` };
    if (!table) return { error: "Invalid or inactive table code." };
    tableId = table.id; tableLabel = table.name;
  } else {
    if (!user) return { error: "Please login to order delivery." };
    if (!input.address?.trim()) return { error: "Delivery address is required." };
  }

  // Re-verify every price against the database. Client-sent prices are ignored.
  const ids = Array.from(new Set(input.items.map((i) => i.product_id)));
  const { data: products, error: productsError } = await supabase.from("products")
    .select("id, name, price, discount_price, is_available, eat_now_enabled, pack_enabled, variants(id,name,price_delta), pack_sizes(id,label,price_delta), addons(id,name,price)")
    .in("id", ids);
  if (productsError) return { error: `Menu lookup failed: ${productsError.message}` };
  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));
  const anyProduct = byId as unknown as Map<string, any>;

  const rows: any[] = [];
  for (const item of input.items) {
    const p = anyProduct.get(item.product_id);
    if (!p || !p.is_available) return { error: `“${item.name}” is unavailable.` };
    if (item.mode === "eat_now" && !p.eat_now_enabled) return { error: `“${p.name}” is not available for Eat Now.` };
    if (item.mode === "pack" && !p.pack_enabled) return { error: `“${p.name}” is not available for Pack.` };

    let unit = Number(p.discount_price ?? p.price);
    const base = Number(p.price);
    if (item.variant_name) {
      const v = (p.variants as any[]).find((x) => x.name === item.variant_name);
      if (!v) return { error: `Invalid variant for “${p.name}”.` };
      unit += Number(v.price_delta);
    }
    if (item.pack_size) {
      const s = (p.pack_sizes as any[]).find((x) => x.label === item.pack_size);
      if (!s) return { error: `Invalid pack size for “${p.name}”.` };
      unit += Number(s.price_delta);
    }
    const addons: { addon_name: string; price: number }[] = [];
    for (const a of item.addons ?? []) {
      const match = (p.addons as any[]).find((x) => x.name === a.name);
      if (!match) return { error: `Invalid add-on for “${p.name}”.` };
      // Prevent the same add-on from being charged more than once per item.
      if (!addons.some((x) => x.addon_name === match.name)) {
        addons.push({ addon_name: match.name, price: Number(match.price) });
      }
    }
    const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
    const total = (unit + addonsTotal) * item.qty;
    const lineDiscount = Math.max(0, base - Number(p.discount_price ?? p.price)) * item.qty;
    rows.push({
      product_id: p.id, product_name: p.name, variant_name: item.variant_name, pack_size: item.pack_size,
      mode: item.mode, unit_price: unit + addonsTotal, base_price: base, qty: item.qty, total, note: item.note ?? null,
      lineDiscount, order_item_addons: addons,
    });
  }

  const subtotal = rows.reduce((s, r) => s + Number(r.unit_price) * r.qty, 0);
  // Discount applies only to the product's base price; variant, pack and add-on
  // surcharges remain payable in full.
  const discount = rows.reduce((s, r) => s + Number(r.lineDiscount), 0);
  const net = subtotal - discount;
  const tax = (net * Number(settings.tax_percent)) / 100;
  const serviceCharge = (net * Number(settings.service_charge_percent)) / 100;
  const grand = net + tax + serviceCharge;

  const { data: order, error } = await supabase.from("orders").insert({
    table_id: tableId, table_label: tableLabel, customer_id: user?.id ?? null,
    guest_name: input.guestName?.trim() || null, guest_phone: input.guestPhone?.trim() || null,
    type: input.type, address_snapshot: input.type === "delivery" ? input.address!.trim() : null,
    note: input.note?.trim() || null, subtotal, discount, tax, service_charge: serviceCharge, grand_total: grand,
  }).select("id, order_number, access_token").single();

  if (error || !order) return { error: `Could not place the order: ${error?.message ?? "database did not return the order"}` };

  const itemRows = rows.map(({ order_item_addons, lineDiscount, ...r }) => r);
  const { data: insertedItems, error: itemsError } = await supabase.from("order_items")
    .insert(itemRows.map((r) => ({ ...r, order_id: order.id }))).select("id");
  if (itemsError || !insertedItems || insertedItems.length !== rows.length) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: `Order items failed to save: ${itemsError?.message ?? "database did not return the items"}` };
  }

  const addonRows = rows.flatMap((r, i) =>
    r.order_item_addons.map((a: any) => ({ ...a, order_item_id: insertedItems[i].id })));
  if (addonRows.length) {
    const { error: addonsError } = await supabase.from("order_item_addons").insert(addonRows);
    if (addonsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return { error: `Order add-ons failed to save: ${addonsError.message}` };
    }
  }

    return { orderId: order.id, accessToken: order.access_token, orderNumber: order.order_number };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not place the order. Please try again." };
  }
}

export async function getTrackableOrder(orderId: string, accessToken: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("orders")
    .select("*, order_items(*, order_item_addons(*))")
    .eq("id", orderId).eq("access_token", accessToken).maybeSingle();
  if (error || !data) return { error: "Order not found." };
  return { order: data };
}
