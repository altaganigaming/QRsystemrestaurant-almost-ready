import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, STATUS_LABEL } from "@/lib/utils";
import OrderDeleteButton from "./order-delete-button";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "new", "preparing", "ready", "completed", "closed", "cancelled", "unpaid"];

export default async function OrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();
  const f = searchParams.status ?? "all";
  let query = supabase.from("orders").select("id, order_number, status, payment_status, type, table_label, grand_total, placed_at").order("placed_at", { ascending: false }).limit(200);
  if (f === "unpaid") query = query.eq("payment_status", "unpaid").not("status", "in", '("cancelled")');
  else if (f !== "all") query = query.eq("status", f);
  const { data: orders } = await query;
  const { data: settings } = await supabase.from("settings").select("currency").eq("id", 1).single();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`}
            className={`btn !py-1.5 text-xs capitalize ${f === s ? "btn-primary" : "btn-outline"}`}>{s === "all" ? "All" : s.replace("_", " ")}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-black/50">
            <th className="p-3">#</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Total</th><th className="p-3">Placed</th><th className="p-3" />
          </tr></thead>
          <tbody>
            {(orders ?? []).map((o: any) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-black/[0.02]">
                <td className="p-3 font-semibold">{o.order_number}</td>
                <td className="p-3">{o.type === "dine_in" ? `Dine In · ${o.table_label ?? "-"}` : "Delivery"}</td>
                <td className="p-3">{STATUS_LABEL[o.status]}</td>
                <td className="p-3">{o.payment_status === "paid" ? "✅ Paid" : "Unpaid"}</td>
                <td className="p-3 font-medium">{money(o.grand_total, (settings as any)?.currency)}</td>
                <td className="p-3 text-black/50">{new Date(o.placed_at).toLocaleString()}</td>
                <td className="p-3"><div className="flex items-center gap-3"><Link href={`/admin/orders/${o.id}`} className="text-brand underline">Open</Link><OrderDeleteButton orderId={o.id} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
