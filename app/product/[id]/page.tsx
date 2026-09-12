import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "./product-form";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: p }, { data: settings }] = await Promise.all([
    supabase.from("products").select("*, variants(*), pack_sizes(*), addons(*)").eq("id", params.id).maybeSingle(),
    supabase.from("settings").select("*").eq("id", 1).single(),
  ]);
  if (!p) notFound();
  return <ProductForm product={p as any} settings={settings as any} />;
}
