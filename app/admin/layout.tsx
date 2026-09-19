import AdminShell from "./admin-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("admin_order_notifications").eq("id", 1).single();
  return <AdminShell notificationsEnabled={settings?.admin_order_notifications ?? true}>{children}</AdminShell>;
}
