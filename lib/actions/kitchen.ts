"use server";

import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

async function requireStaff() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user || (role !== "kitchen" && role !== "admin")) throw new Error("Forbidden");
  return supabase;
}

export async function advanceOrder(orderId: string, status: OrderStatus, estimatedPrepMinutes?: number) {
  const supabase = await requireStaff();
  const patch: Record<string, unknown> = { status };
  if (estimatedPrepMinutes) patch.estimated_prep_minutes = estimatedPrepMinutes;
  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) return { error: error.message };
  return { ok: true };
}
