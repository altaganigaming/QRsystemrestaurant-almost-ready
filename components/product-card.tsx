"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";

export default function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const { add } = useCart();
  const effective = product.discount_price ?? product.price;
  const out = !product.is_available;
  return (
    <div className={`card overflow-hidden ${out ? "opacity-60" : ""}`}>
      <Link href={`/product/${product.id}`} className="block">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="h-40 w-full object-cover" />
          : <div className="grid h-40 place-items-center bg-black/5 text-4xl">🍽️</div>}
      </Link>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${product.id}`} className="font-semibold leading-snug hover:text-brand">{product.name}</Link>
          <div className="text-right shrink-0">
            {product.discount_price ? <p className="text-xs text-black/40 line-through">{money(product.price, currency)}</p> : null}
            <p className="font-bold text-brand">{money(effective, currency)}</p>
          </div>
        </div>
        {product.description ? <p className="mt-1 line-clamp-2 text-xs text-black/50">{product.description}</p> : null}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1 text-[10px]">
            {product.eat_now_enabled ? <span className="badge bg-emerald-50 text-emerald-700">Eat Now</span> : null}
            {product.pack_enabled ? <span className="badge bg-sky-50 text-sky-700">Pack</span> : null}
          </div>
          <button
            disabled={out}
            onClick={() => add({ product_id: product.id, name: product.name, image_url: product.image_url, unit_price: effective, base_price: product.price, variant_name: null, pack_size: null, addons: [], mode: product.eat_now_enabled ? "eat_now" : "pack", note: null })}
            className="btn-primary !rounded-xl !p-2"
            aria-label={`Add ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {out ? <p className="mt-1 text-xs font-medium text-red-500">Currently unavailable</p> : null}
      </div>
    </div>
  );
}
