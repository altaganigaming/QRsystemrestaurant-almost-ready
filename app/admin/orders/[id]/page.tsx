import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Bill, { billText } from "@/components/bill";
import OrderActions from "./order-actions";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: order } = await supabase.from("orders")
    .select("*, order_items(*, order_item_addons(*))").eq("id", params.id).maybeSingle();
  if (!order) notFound();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const s = settings as any;
  const wa = `https://wa.me/?text=${encodeURIComponent(billText(order as any, s?.restaurant_name ?? "Restaurant", s?.currency ?? "₹"))}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="no-print text-2xl font-bold">Order #{order.order_number}</h1>
        <p className="no-print mt-1 text-sm text-black/55">
          {order.type === "dine_in" ? `Dine In · Table ${order.table_label ?? "-"}` : `Delivery · ${order.address_snapshot ?? ""}`}
          {order.guest_name ? ` · ${order.guest_name}` : ""}{order.guest_phone ? ` · ${order.guest_phone}` : ""}
        </p>
        {order.note ? <p className="no-print mt-2 rounded-xl bg-amber-50 p-3 text-sm">Note: {order.note}</p> : null}
        <OrderActions order={order as any} />
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <PrintButton />
          <a href={wa} target="_blank" rel="noreferrer" className="btn-outline">Share on WhatsApp</a>
        </div>
      </div>
      <Bill order={order as any} settings={s} className="print-area" />
    </div>
  );
}
