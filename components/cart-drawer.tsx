"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/utils";

export default function CartDrawer({ settings }: { settings: any }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("rms:open-cart", handler);
    return () => window.removeEventListener("rms:open-cart", handler);
  }, []);

  const currency = settings?.currency ?? "₹";
  return (
    <>
      {!open && cart.count > 0 ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-white shadow-xl ring-4 ring-white/80"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          Cart <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-xs text-brand">{cart.count}</span>
        </button>
      ) : null}
      {open ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:p-4" onClick={() => setOpen(false)}>
      <aside className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button className="btn-ghost !p-2" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
          {cart.items.length === 0 && <p className="text-black/50">Cart is empty.</p>}
          {cart.items.map((i) => (
            <div key={i.key} className="card flex gap-3 p-3">
              {i.image_url ? <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-black/[0.03] p-1"><img src={i.image_url} alt="" className="max-h-full max-w-full object-contain" /></div> : null}
              <div className="flex-1 text-sm">
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-black/50">
                  {[i.variant_name, i.pack_size, i.mode === "pack" ? "Pack" : "Eat Now"].filter(Boolean).join(" · ")}
                </p>
                <p className="font-medium">{money(i.unit_price, currency)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => cart.remove(i.key)} className="text-red-500" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                <div className="flex items-center gap-2">
                  <button className="btn-outline !p-1.5 !rounded-lg" onClick={() => cart.setQty(i.key, i.qty - 1)}><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center font-semibold">{i.qty}</span>
                  <button className="btn-outline !p-1.5 !rounded-lg" onClick={() => cart.setQty(i.key, i.qty + 1)}><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t pt-3">
          <div className="mb-3 flex justify-between font-bold"><span>Subtotal</span><span>{money(cart.subtotal, currency)}</span></div>
          <Link href="/checkout" className="btn-primary w-full" onClick={() => setOpen(false)}>Review & Place Order</Link>
        </div>
      </aside>
    </div> : null}
    </>
  );
}
