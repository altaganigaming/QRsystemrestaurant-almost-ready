import { createClient } from "@/lib/supabase/server";
import TablesManager from "./tables-manager";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const supabase = createClient();
  const { data: tables } = await supabase.from("restaurant_tables").select("*").order("code");
  return <TablesManager tables={(tables ?? []) as any} />;
}
