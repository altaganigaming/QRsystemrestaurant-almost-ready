"use client";

import { useCallback, useEffect, useState } from "react";
import { getTrackableOrder } from "@/lib/actions/ordering";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import Bill from "@/components/bill";
import { money, STATUS_LABEL } from "@/lib/utils";

const STEPS = ["new", "preparing", "ready", "completed"] as const;

export default function TrackClient({ orderId, token, settings }: { orderId: string; token: string; settings: any }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getTrackableOrder(orderId, token);
    if ("error" in res && res.error) setError(res.error);
    else setOrder(res.order as Order);
  }, [orderId, token]);

  useEffect(() => { load(); }, [load]);

  // Realtime for logged-in customers; 4s polling fallback for guests.
  useEffect(() => {
    const sb = createClient();
    let channel: ReturnType<typeof sb.channel> | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        channel = sb.channel(`track-${orderId}`)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, load)
          .subscribe();
      } else {
        timer = setInterval(load, 4000);
      }
    });
    return () => { channel?.unsubscribe(); if (timer) clearInterval(timer); };
  }, [orderId, load]);

  if (error) return <div className="mx-auto max-w-md px-4 py-16 text-center text-red-600">{error}</div>;
  if (!order) return <div className="py-20 text-center text-black/50">Loading your order…</div>;

  const currency = settings?.currency ?? "₹";
  const stepIdx = order.status === "cancelled" ? -1 : STEPS.indexOf(order.status as any);
  const cancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="card p-5 text-center">
        <p className="text-sm text-black/50">Order Number</p>
        <p className="text-4xl font-extrabold text-brand">#{order.order_number}</p>
        <p className="mt-1 text-sm text-black/55">
          {order.type === "dine_in" ? `Table ${order.table_label ?? ""}` : "Home Delivery"} · {money(order.grand_total, currency)} · {order.payment_status === "paid" ? "PAID" : "Pay at counter / UPI"}
        </p>
        {order.estimated_prep_minutes && ["new", "preparing"].includes(order.status) ? (
          <p className="mt-2 text-sm font-semibold text-emerald-700">Estimated ready in ~{order.estimated_prep_minutes} min</p>
        ) : null}
      </div>

      {cancelled ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-center font-semibold text-red-700">This order was cancelled.</p>
      ) : (
        <ol className="mt-6 space-y-0">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${i <= stepIdx ? "bg-brand text-white" : "bg-black/10 text-black/40"}`}>{i + 1}</span>
              <div className="flex-1">
                <p className={`font-semibold ${i <= stepIdx ? "" : "text-black/40"}`}>{STATUS_LABEL[s]}</p>
                {i < STEPS.length - 1 && <div className={`my-1 h-6 w-0.5 ${i < stepIdx ? "bg-brand" : "bg-black/10"}`} />}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8">
        <Bill order={order} settings={settings} />
      </div>
      <p className="mt-4 text-center text-xs text-black/40">This page updates automatically as the kitchen progresses your order.</p>
    </div>
  );
}
