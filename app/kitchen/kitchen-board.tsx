"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { advanceOrder, markKitchenPaid } from "@/lib/actions/kitchen";
import { billText } from "@/components/bill";
import type { Order } from "@/lib/types";
import { money, STATUS_LABEL } from "@/lib/utils";

const COLUMNS = ["new", "preparing", "ready"] as const;
const PREP_TIMES = [5, 10, 15, 20];

export default function KitchenBoard({ currency, restaurantName }: { currency: string; restaurantName: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const sound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const sb = createClient();
    const load = async () => {
      const { data } = await sb.from("orders")
        .select("*, order_items(*, order_item_addons(*))")
        .in("status", ["new", "preparing", "ready"])
        .order("placed_at", { ascending: true });
      setOrders((data ?? []) as Order[]);
    };
    load();
    const channel = sb.channel("kitchen-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          sound.current?.play().catch(() => {});
          load();
        } else if (payload.eventType === "UPDATE") {
          const updated = payload.new as Order;
          setOrders((prev) => {
            const existing = prev.find((o) => o.id === updated.id);
            const merged = existing ? { ...existing, ...updated } : updated;
            const rest = prev.filter((o) => o.id !== updated.id);
            return ["new", "preparing", "ready"].includes(merged.status) ? [...rest, merged as Order] : rest;
          });
        } else load();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  async function advance(o: Order, status: Order["status"], prep?: number) {
    const r = await advanceOrder(o.id, status, prep);
    if ("error" in r && r.error) alert(r.error);
    else setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status, estimated_prep_minutes: prep ?? x.estimated_prep_minutes } : x)));
  }

  return (
    <div>
      <audio ref={sound} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=" preload="auto" />
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col} className="rounded-2xl bg-black/[0.03] p-3">
            <h2 className="mb-3 flex items-center justify-between px-1 font-bold capitalize">
              {STATUS_LABEL[col]}
              <span className="badge bg-white">{orders.filter((o) => o.status === col).length}</span>
            </h2>
            <div className="space-y-3">
              {orders.filter((o) => o.status === col).map((o) => (
                <OrderCard key={o.id} order={o} currency={currency} restaurantName={restaurantName} onAdvance={advance} onPayment={(id) => setOrders((prev) => prev.map((x) => x.id === id ? { ...x, payment_status: "paid", payment_method: "cash" } : x))} />
              ))}
              {orders.filter((o) => o.status === col).length === 0 && (
                <p className="rounded-xl border border-dashed p-4 text-center text-sm text-black/35">No orders</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, currency, restaurantName, onAdvance, onPayment }: { order: Order; currency: string; restaurantName: string; onAdvance: (o: Order, s: Order["status"], prep?: number) => void; onPayment: (id: string) => void }) {
  const elapsed = Math.floor((Date.now() - new Date(order.placed_at).getTime()) / 60000);
  return (
    <article className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-lg font-extrabold">#{order.order_number}</p>
        <span className={`badge ${order.type === "dine_in" ? "bg-brand/10 text-brand" : "bg-sky-50 text-sky-700"}`}>
          {order.type === "dine_in" ? `Table ${order.table_label ?? ""}` : "🛵 Delivery"}
        </span>
      </div>
      <p className="mb-2 text-xs text-black/45">
        {elapsed} min ago
        {order.estimated_prep_minutes && order.status !== "ready" ? ` · ETA ${order.estimated_prep_minutes} min` : ""}
      </p>
      <ul className="mb-2 space-y-1 text-sm">
        {order.order_items.map((it) => (
          <li key={it.id}>
            <span className="font-semibold">{it.qty} × {it.product_name}</span>
            <span className="block text-xs text-black/50 pl-4">
              {[it.variant_name, it.pack_size, it.mode === "pack" ? "Pack" : it.mode === "eat_now" ? "Eat Now" : null].filter(Boolean).join(" · ")}
              {it.order_item_addons.length ? ` · +${it.order_item_addons.map((a) => a.addon_name).join(", +")}` : ""}
            </span>
            {it.note ? <span className="block text-xs italic text-amber-700 pl-4">“{it.note}”</span> : null}
          </li>
        ))}
      </ul>
      {order.note ? <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Order note: {order.note}</p> : null}
      {order.type === "delivery" && order.address_snapshot ? (
        <p className="mb-2 rounded-lg bg-sky-50 p-2 text-xs text-sky-800">📍 {order.address_snapshot}{order.guest_phone ? ` · ${order.guest_phone}` : ""}</p>
      ) : null}
      <div className="flex items-center justify-between border-t pt-2 text-sm font-bold">
        <span>{money(order.grand_total, currency)}</span>
        <span className="text-xs font-medium text-black/45">{order.payment_status === "paid" ? "PAID" : "UNPAID"}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {order.payment_status === "unpaid" ? (
          <button className="btn-outline !py-1.5 text-sm" onClick={async () => {
            const result = await markKitchenPaid(order.id, "cash");
            if (result.error) alert(result.error);
            else onPayment(order.id);
          }}>Mark Paid (Cash)</button>
        ) : <span className="badge bg-emerald-50 text-emerald-700">Payment received</span>}
        <a
          className="btn-outline !py-1.5 text-sm"
          target="_blank"
          rel="noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(billText(order, restaurantName, currency))}`}
        >Send Bill on WhatsApp</a>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {order.status === "new" && (
          <>
            <select id={`prep-${order.id}`} className="input !w-auto !py-1.5 text-sm" defaultValue="10" aria-label="Estimated prep time">
              {PREP_TIMES.map((t) => <option key={t} value={t}>{t} min</option>)}
            </select>
            <button className="btn-primary !py-1.5 text-sm"
              onClick={() => onAdvance(order, "preparing", Number((document.getElementById(`prep-${order.id}`) as HTMLSelectElement)?.value ?? 10))}>
              Start Preparing
            </button>
          </>
        )}
        {order.status === "preparing" && (
          <button className="btn-primary !py-1.5 text-sm" onClick={() => onAdvance(order, "ready")}>Mark Ready</button>
        )}
        {order.status === "ready" && (
          <button className="btn-primary !py-1.5 text-sm" onClick={() => onAdvance(order, "completed")}>Complete</button>
        )}
      </div>
    </article>
  );
}
