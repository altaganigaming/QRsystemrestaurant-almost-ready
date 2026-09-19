import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "./account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: { next?: string } }) {
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
  let messages: any[] = [];
  if (user) {
    const { data } = await supabase.from("customer_messages").select("id, subject, body, kind, created_at, read_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(20);
    messages = data ?? [];
  }
  let next = "/account";
  try {
    const requestedNext = searchParams.next ?? "";
    const decodedNext = decodeURIComponent(requestedNext);
    if (decodedNext.startsWith("/") && !decodedNext.startsWith("//") && !decodedNext.includes("\\")) next = requestedNext;
  } catch {
    next = "/account";
  }
  return <AccountClient user={user} orders={orders} messages={messages} settings={settings as any} redirectTo={next} />;
}
