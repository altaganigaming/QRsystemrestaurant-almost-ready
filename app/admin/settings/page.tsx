import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  return <SettingsForm settings={settings as any} />;
}
