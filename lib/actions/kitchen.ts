"use server";

import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

async function requireStaff() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user || (role !== "kitchen" && role !== "admin")) throw new Error("Forbidden");
  return supabase;
}

export async function advanceOrder(
  orderId: string,
  status: OrderStatus,
  estimatedPrepMinutes?: number,
  paymentStatus?: PaymentStatus,
  paymentMethod?: string | null,
) {
  try {
    const supabase = await requireStaff();
    const patch: Record<string, unknown> = { status };
    if (typeof estimatedPrepMinutes === "number") patch.estimated_prep_minutes = estimatedPrepMinutes;
    if (paymentStatus) patch.payment_status = paymentStatus;
    if (paymentMethod !== undefined) patch.payment_method = paymentMethod ?? null;
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update order." };
  }
}
