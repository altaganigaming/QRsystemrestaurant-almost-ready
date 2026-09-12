import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "./account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

  let orders: any[] = [];
  if (user) {
    const { data } = await supabase.from("orders")
      .select("*, order_items(*, order_item_addons(*))")
      .order("placed_at", { ascending: false }).limit(50);
    orders = data ?? [];
  }
  return <AccountClient user={user} orders={orders} settings={settings as any} />;
}
