"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/utils";

export default function CheckoutPage() {
  return <CheckoutInner />;
}

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function CheckoutInner() {
  const cart = useCart();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [type, setType] = useState<"dine_in" | "delivery">("dine_in");
  const [tableInput, setTableInput] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user));
    sb.from("settings").select("*").eq("id", 1).single().then(({ data }) => setSettings(data));
    setTableInput(localStorage.getItem("rms_table_code") ?? "");
  }, []);

  const currency = settings?.currency ?? "₹";
  const tableCode = (cart.tableCode ?? tableInput).toUpperCase();
  const delivery = type === "delivery";

  async function submit() {
    setBusy(true); setError(null);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type, tableCode: delivery ? undefined : tableCode,
        guestName, guestPhone, address: delivery ? address : undefined, note,
        items: cart.items,
      }),
    });
    const res = await response.json() as { error?: string; orderId?: string; accessToken?: string };
    setBusy(false);
    if ("error" in res && res.error) { setError(res.error); return; }
    cart.clear(); cart.setTableCode(null);
    router.push(`/track?o=${res.orderId}&k=${res.accessToken}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Review Your Order</h1>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Order Type</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setType("dine_in")} className={`btn ${!delivery ? "btn-primary" : "btn-outline"}`}>🍽️ Dine In</button>
          <button onClick={() => setType("delivery")} disabled={!settings?.delivery_enabled}
            className={`btn ${delivery ? "btn-primary" : "btn-outline"}`}>🛵 Home Delivery</button>
        </div>

        {!delivery ? (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Table Code</label>
            <input className="input uppercase" placeholder="e.g. T5" value={tableCode} onChange={(e) => { setTableInput(e.target.value.toUpperCase()); cart.setTableCode(e.target.value.toUpperCase() || null); }} />
            <p className="mt-1 text-xs text-black/45">Shown on your table QR / stand.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!user ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                Home delivery requires an account. <a className="font-semibold underline" href="/account">Login or Sign up</a>
              </p>
            ) : (
              <>
                <input className="input" placeholder="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                <input className="input" placeholder="Phone number" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                <textarea className="input" rows={3} placeholder="Full delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Name (optional)" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          <input className="input" placeholder="Phone (optional)" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
        </div>
        <textarea className="input mt-3" rows={2} placeholder="Order note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </section>

      <section className="card mt-4 p-4">
        <h2 className="mb-3 font-semibold">Items</h2>
        {cart.items.length === 0 && <p className="text-black/50">Your cart is empty. <a href="/menu" className="text-brand underline">Browse the menu</a>.</p>}
        <ul className="divide-y">
          {cart.items.map((i) => (
            <li key={i.key} className="flex justify-between gap-3 py-2 text-sm">
              <span>{i.qty} × {i.name}
                <span className="block text-xs text-black/45">{[i.variant_name, i.pack_size, i.mode === "pack" ? "Pack" : "Eat Now"].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="font-medium">{money(i.unit_price * i.qty, currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-bold">
          <span>Subtotal</span><span>{money(cart.subtotal, currency)}</span>
        </div>
        <p className="mt-1 text-xs text-black/45">Tax &amp; service charge (if any) are calculated and shown on your bill.</p>
      </section>

      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}

      <button disabled={busy || cart.items.length === 0 || (delivery && !user)} onClick={submit} className="btn-primary mt-6 w-full !py-3 text-lg">
        {busy ? "Placing order…" : "Place Order"}
      </button>
    </div>
  );
}
