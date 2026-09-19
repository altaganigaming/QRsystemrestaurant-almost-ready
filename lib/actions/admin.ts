"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Settings } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user || role !== "admin") throw new Error("Admin only");
  return supabase;
}

export async function updateSettings(patch: Partial<Settings>) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("settings").update(patch).eq("id", 1);
  return { error: error?.message ?? null };
}

export async function toggleOpen(isOpen: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("settings").update({ is_open: isOpen }).eq("id", 1);
  return { ok: true };
}

export async function upsertCategory(data: { id?: string; name: string; description?: string; sort_order?: number; is_active?: boolean }) {
  const supabase = await requireAdmin();
  const { error } = data.id
    ? await supabase.from("categories").update(data).eq("id", data.id)
    : await supabase.from("categories").insert(data);
  return { error: error?.message ?? null };
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function upsertProduct(data: Record<string, unknown> & { id?: string }) {
  const supabase = await requireAdmin();
  const { id, ...rest } = data;
  const { error } = id
    ? await supabase.from("products").update(rest).eq("id", id)
    : await supabase.from("products").insert(rest);
  return { error: error?.message ?? null };
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function upsertSimple(table: "variants" | "pack_sizes" | "addons", data: Record<string, unknown> & { id?: string }) {
  const supabase = await requireAdmin();
  const { id, ...rest } = data;
  const { error } = id
    ? await supabase.from(table).update(rest).eq("id", id)
    : await supabase.from(table).insert(rest);
  return { error: error?.message ?? null };
}

export async function deleteSimple(table: "variants" | "pack_sizes" | "addons", id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function upsertTable(data: { id?: string; code: string; name: string; is_active?: boolean }) {
  const supabase = await requireAdmin();
  const { id, ...rest } = data;
  const { error } = id
    ? await supabase.from("restaurant_tables").update(rest).eq("id", id)
    : await supabase.from("restaurant_tables").insert(rest);
  return { error: error?.message ?? null };
}

export async function deleteTable(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function addGallery(imageUrl: string, alt?: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("gallery").insert({ image_url: imageUrl, alt: alt ?? null });
  return { error: error?.message ?? null };
}

export async function deleteGallery(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function markPaid(orderId: string, method: string) {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("orders")
      .update({ payment_status: "paid", payment_method: method }).eq("id", orderId);
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update payment." };
  }
}

export async function setOrderStatus(orderId: string, status: string) {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update order." };
  }
}

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  const folder = String(formData.get("folder") ?? "misc");
  if (!file || file.size > 5 * 1024 * 1024) return { error: "Image required (max 5MB)." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are allowed." };
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const allowedExt = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
  if (!allowedExt.has(ext)) return { error: "Unsupported image format." };
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function createKitchenUser(email: string, password: string, fullName: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role: "kitchen" },
    user_metadata: { full_name: fullName },
  });
  return { error: error?.message ?? null };
}

export async function deleteKitchenUser(userId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  return { error: error?.message ?? null };
}

export async function listKitchenUsers() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("id, full_name, created_at").eq("role", "kitchen").order("created_at", { ascending: false });
  return data ?? [];
}
