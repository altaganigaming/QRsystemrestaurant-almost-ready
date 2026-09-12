import { createClient } from "@/lib/supabase/server";
import MenuManager from "./menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenu() {
  const supabase = createClient();
  const [{ data: categories }, { data: products }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("*, variants(*), pack_sizes(*), addons(*)").order("sort_order"),
    supabase.from("settings").select("currency").eq("id", 1).single(),
  ]);
  return <MenuManager categories={(categories ?? []) as any} products={(products ?? []) as any} currency={(settings as any)?.currency ?? "₹"} />;
}
