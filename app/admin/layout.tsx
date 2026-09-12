import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user) redirect("/admin/login");
  if (role === "kitchen") redirect("/kitchen");
  if (role !== "admin") redirect("/admin/login");
  return <AdminShell restaurantName=""> {children}</AdminShell>;
}
