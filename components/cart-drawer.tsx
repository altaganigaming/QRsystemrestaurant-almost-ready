"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, X } from "lucide-react";
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

  if (!open) return null;
  const currency = settings?.currency ?? "₹";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpen(false)}>
      <aside className="flex h-full w-full max-w-md flex-col bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button className="btn-ghost !p-2" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto">
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
    </div>
  );
}
