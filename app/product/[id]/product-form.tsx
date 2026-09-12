"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { money, cn } from "@/lib/utils";

export default function ProductForm({ product, settings }: { product: Product; settings: any }) {
  const { add } = useCart();
  const currency = settings?.currency ?? "₹";
  const [variant, setVariant] = useState<string | null>(null);
  const [pack, setPack] = useState<string | null>(null);
  const [pickedAddons, setPickedAddons] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"eat_now" | "pack">(product.eat_now_enabled ? "eat_now" : "pack");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const effective = product.discount_price ?? product.price;
  const vDelta = product.variants.find((v) => v.name === variant)?.price_delta ?? 0;
  const pDelta = product.pack_sizes.find((s) => s.label === pack)?.price_delta ?? 0;
  const aTotal = product.addons.filter((a) => pickedAddons.has(a.name)).reduce((s, a) => s + a.price, 0);
  const unit = effective + vDelta + pDelta + aTotal;

  const toggleAddon = (name: string) => setPickedAddons((prev) => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card overflow-hidden sm:grid sm:grid-cols-2">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="h-64 w-full object-cover sm:h-full" />
          : <div className="grid h-64 place-items-center bg-black/5 text-6xl sm:h-full">🍽️</div>}
        <div className="p-5">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.description ? <p className="mt-1 text-sm text-black/55">{product.description}</p> : null}
          <div className="mt-2 flex items-baseline gap-2">
            {product.discount_price ? <span className="text-black/40 line-through">{money(product.price, currency)}</span> : null}
            <span className="text-xl font-bold text-brand">{money(unit, currency)}</span>
          </div>

          {product.variants.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-semibold">Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button key={v.id} onClick={() => setVariant(v.name)}
                    className={cn("btn !py-1.5 text-sm", variant === v.name ? "btn-primary" : "btn-outline")}>
                    {v.name}{v.price_delta ? ` (+${money(v.price_delta, currency)})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.pack_sizes.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-semibold">Pack Size</p>
              <div className="flex flex-wrap gap-2">
                {product.pack_sizes.map((s) => (
                  <button key={s.id} onClick={() => setPack(s.label)}
                    className={cn("btn !py-1.5 text-sm", pack === s.label ? "btn-primary" : "btn-outline")}>
                    {s.label}{s.price_delta ? ` (+${money(s.price_delta, currency)})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(product.eat_now_enabled || product.pack_enabled) && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-semibold">Serving</p>
              <div className="flex gap-2">
                {product.eat_now_enabled ? (
                  <button onClick={() => setMode("eat_now")} className={cn("btn !py-1.5 text-sm", mode === "eat_now" ? "btn-primary" : "btn-outline")}>Eat Now</button>
                ) : null}
                {product.pack_enabled ? (
                  <button onClick={() => setMode("pack")} className={cn("btn !py-1.5 text-sm", mode === "pack" ? "btn-primary" : "btn-outline")}>Pack</button>
                ) : null}
              </div>
            </div>
          )}

          {product.addons.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-semibold">Add-ons</p>
              <div className="flex flex-wrap gap-2">
                {product.addons.map((a) => (
                  <button key={a.id} onClick={() => toggleAddon(a.name)}
                    className={cn("btn !py-1.5 text-sm", pickedAddons.has(a.name) ? "btn-primary" : "btn-outline")}>
                    {a.name} (+{money(a.price, currency)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the kitchen (optional)"
            className="input mt-4" rows={2} />

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button className="btn-outline !p-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-lg font-bold">{qty}</span>
              <button className="btn-outline !p-2" onClick={() => setQty((q) => Math.min(100, q + 1))} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              disabled={!product.is_available}
              onClick={() => {
                add({
                  product_id: product.id, name: product.name, image_url: product.image_url,
                  unit_price: unit, base_price: product.price, qty,
                  variant_name: variant, pack_size: pack,
                  addons: product.addons.filter((a) => pickedAddons.has(a.name)).map((a) => ({ name: a.name, price: a.price })),
                  mode, note: note.trim() || null,
                });
                window.dispatchEvent(new Event("rms:open-cart"));
              }}
              className="btn-primary flex-1"
            >
              {product.is_available ? `Add · ${money(unit * qty, currency)}` : "Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
