"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getTrackableOrder } from "@/lib/actions/ordering";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import Bill from "@/components/bill";
import { money, STATUS_LABEL } from "@/lib/utils";

const STEPS = ["new", "preparing", "ready", "completed"] as const;

export default function TrackClient({ orderId, token, settings }: { orderId: string; token: string; settings: any }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

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
  const restaurantName = settings?.restaurant_name ?? "our restaurant";
  const reviewMessages = useMemo(() => [
    `We had a wonderful experience at ${restaurantName}. The food was delicious and the service was excellent!`,
    `Thank you, ${restaurantName}, for the great food and warm service. We will visit again soon.`,
    `Highly recommend ${restaurantName}! Fresh food, quick service, and a lovely dining experience.`,
  ], [restaurantName]);

  async function copyReviewMessage() {
    await navigator.clipboard?.writeText(reviewMessages[messageIndex]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

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
      {["completed", "closed"].includes(order.status) && settings?.social?.google_review ? (
        <section id="google-review" className="card mt-5 scroll-mt-20 space-y-3 border-brand/15 bg-brand/[0.04] p-4">
          <div>
            <h2 className="font-bold">How was your experience at {restaurantName}?</h2>
            <p className="mt-1 text-xs text-black/55">Choose a message, copy it, then open the direct Google review page.</p>
          </div>
          <select className="input" value={messageIndex} onChange={(e) => setMessageIndex(Number(e.target.value))} aria-label="Choose review message">
            {reviewMessages.map((message, index) => <option key={message} value={index}>{message}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline flex-1" onClick={copyReviewMessage}>{copied ? "Copied" : "Copy message"}</button>
            <a href={settings.social.google_review} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center">Open Google Reviews</a>
          </div>
        </section>
      ) : null}
      <p className="mt-4 text-center text-xs text-black/40">This page updates automatically as the kitchen progresses your order.</p>
    </div>
  );
}
