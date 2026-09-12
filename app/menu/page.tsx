import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import MenuBrowser from "./menu-browser";
import TableCapture from "@/components/table-capture";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const supabase = createClient();
  const [{ data: settings }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products")
      .select("*, variants(*), pack_sizes(*), addons(*)")
      .order("sort_order"),
  ]);
  const s = settings as any;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense><TableCapture /></Suspense>
      <h1 className="mb-1 text-3xl font-extrabold">{s?.headings?.menu_title ?? "Our Menu"}</h1>
      {!s?.is_open ? <p className="badge mt-2 bg-red-50 text-red-600">We are currently closed</p> : null}
      <MenuBrowser
        categories={(categories ?? []) as any}
        products={(products ?? []) as any}
        currency={s?.currency ?? "₹"}
        searchPlaceholder={s?.labels?.search_placeholder ?? "Search dishes…"}
      />
    </div>
  );
}
