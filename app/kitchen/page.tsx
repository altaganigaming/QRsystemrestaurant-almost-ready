import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KitchenBoard from "./kitchen-board";
import LogoutButton from "@/components/logout-button";
import OrderNotifier from "@/components/order-notifier";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user) redirect("/kitchen/login");
  if (role === "admin") redirect("/admin");
  if (role !== "kitchen") redirect("/kitchen/login");

  const { data: settings } = await supabase.from("settings").select("currency, restaurant_name, admin_order_notifications").eq("id", 1).single();
  const restaurantName = (settings as any)?.restaurant_name ?? "Restaurant";
  return (
    <div className="min-h-screen bg-surface p-3 md:p-6">
      <OrderNotifier enabled={(settings as any)?.admin_order_notifications ?? true} placement="kitchen" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">🍳 {restaurantName} — Kitchen</h1>
        <LogoutButton redirectTo="/kitchen/login" />
      </div>
      <KitchenBoard currency={(settings as any)?.currency ?? "₹"} restaurantName={restaurantName} />
    </div>
  );
}
