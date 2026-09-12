import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KitchenBoard from "./kitchen-board";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user) redirect("/kitchen/login");
  if (role === "admin") redirect("/admin");
  if (role !== "kitchen") redirect("/kitchen/login");

  const { data: settings } = await supabase.from("settings").select("currency, restaurant_name").eq("id", 1).single();
  return (
    <div className="min-h-screen bg-surface p-3 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">🍳 {(settings as any)?.restaurant_name} — Kitchen</h1>
        <LogoutButton redirectTo="/kitchen/login" />
      </div>
      <KitchenBoard currency={(settings as any)?.currency ?? "₹"} />
    </div>
  );
}
