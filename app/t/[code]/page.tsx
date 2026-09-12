import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// QR landing: identifies restaurant (domain) + table (qr_token). No prices here —
// menu and pricing always load from the database, so QR codes never need regenerating.
export default async function TableLanding({ params }: { params: { code: string } }) {
  // QR landing is intentionally server-side and uses the service-role client
  // because anonymous users must be able to validate a table QR token without
  // exposing the restaurant_tables table through public RLS.
  const supabase = createAdminClient();
  const { data: table } = await supabase
    .from("restaurant_tables").select("code")
    .eq("qr_token", params.code).eq("is_active", true).maybeSingle();
  if (!table) notFound();
  redirect(`/menu?table=${encodeURIComponent(table.code)}`);
}
