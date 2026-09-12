"use client";

import { useState } from "react";
import { markPaid, setOrderStatus } from "@/lib/actions/admin";
import type { Order } from "@/lib/types";

export default function OrderActions({ order }: { order: Order }) {
  const [method, setMethod] = useState("upi");
  const [msg, setMsg] = useState<string | null>(null);
  const active = !["completed", "closed", "cancelled"].includes(order.status);

  return (
    <div className="card no-print mt-4 space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Payment:</span>
        <span className={`badge ${order.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{order.payment_status.toUpperCase()}</span>
      </div>
      {order.payment_status === "unpaid" && (
        <div className="flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="upi">UPI</option><option value="cash">Cash</option>
            <option value="card">Card</option><option value="online">Online</option><option value="other">Other</option>
          </select>
          <button className="btn-primary" onClick={async () => { const r = await markPaid(order.id, method); setMsg(r.error ?? "Marked as paid."); }}>Mark Paid</button>
        </div>
      )}
      {active && (
        <div className="flex flex-wrap gap-2">
          {order.status === "ready" ? (
            <button className="btn-outline" onClick={async () => { const r = await setOrderStatus(order.id, "completed"); setMsg(r.error ?? "Order completed."); location.reload(); }}>Complete Order</button>
          ) : null}
          <button className="btn-danger" onClick={async () => { if (confirm("Cancel this order?")) { const r = await setOrderStatus(order.id, "cancelled"); setMsg(r.error ?? "Order cancelled."); location.reload(); } }}>Cancel</button>
        </div>
      )}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
    </div>
  );
}
