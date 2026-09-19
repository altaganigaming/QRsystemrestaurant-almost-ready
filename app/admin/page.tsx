import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/utils";
import OpenToggle from "./open-toggle";
import Link from "next/link";
import OrderDeleteButton from "./orders/order-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [{ data: todayOrders }, { data: activeOrders }, { data: recent }, { data: paymentBreakdown }] = await Promise.all([
    supabase.from("orders").select("grand_total, payment_status, status").gte("placed_at", today.toISOString()).not("status", "in", '("cancelled")'),
    supabase.from("orders").select("id").in("status", ["new", "preparing", "ready"]),
    supabase.from("orders").select("id, order_number, status, payment_status, grand_total, placed_at").order("placed_at", { ascending: false }).limit(10),
    supabase.from("orders").select("payment_status").not("status", "in", '("cancelled")'),
  ]);
  const revenue = (todayOrders ?? []).reduce((s: number, o: any) => s + Number(o.grand_total), 0);
  const paidCount = (paymentBreakdown ?? []).filter((o: any) => o.payment_status === "paid").length;
  const unpaidCount = (paymentBreakdown ?? []).filter((o: any) => o.payment_status === "unpaid").length;
  const completedCount = (todayOrders ?? []).filter((o: any) => o.status === "completed").length;
  const s = settings as any;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{s?.restaurant_name}</h1>
        <OpenToggle isOpen={s?.is_open ?? true} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Today's Sales" value={money(revenue, s?.currency)} />
        <Stat label="Today's Orders" value={String((todayOrders ?? []).length)} />
        <Stat label="Paid Orders" value={String(paidCount)} />
        <Stat label="Unpaid Orders" value={String(unpaidCount)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stat label="Active Orders" value={String((activeOrders ?? []).length)} />
        <Stat label="Completed Today" value={String(completedCount)} />
        <Stat label="Kitchen Queue" value={String((todayOrders ?? []).filter((o: any) => ["new", "preparing", "ready"].includes(o.status)).length)} />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Recent Orders</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-black/50">
            <th className="p-3">#</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Total</th><th className="p-3">Time</th><th className="p-3" />
          </tr></thead>
          <tbody>
            {(recent ?? []).map((o: any) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{o.order_number}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3">{o.payment_status === "paid" ? "✅ Paid" : "Unpaid"}</td>
                <td className="p-3">{money(o.grand_total, s?.currency)}</td>
                <td className="p-3 text-black/50">{new Date(o.placed_at).toLocaleString()}</td>
                <td className="p-3"><div className="flex items-center gap-3"><Link href={`/admin/orders/${o.id}`} className="text-brand underline">View</Link><OrderDeleteButton orderId={o.id} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-black/50">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-brand">{value}</p>
    </div>
  );
}
