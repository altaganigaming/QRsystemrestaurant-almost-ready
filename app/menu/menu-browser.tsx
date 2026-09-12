"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { cn } from "@/lib/utils";

export default function MenuBrowser({ categories, products, currency, searchPlaceholder }: {
  categories: Category[]; products: Product[]; currency: string; searchPlaceholder: string; categoryParam?: string;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category_id !== cat) return false;
      if (!query) return true;
      return p.name.toLowerCase().includes(query) || (p.description ?? "").toLowerCase().includes(query);
    });
  }, [products, q, cat]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      const list = map.get(p.category_id) ?? [];
      list.push(p); map.set(p.category_id, list);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="sticky top-[60px] z-30 -mx-4 bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder}
            className="input !pl-9" aria-label="Search menu" />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCat("all")} className={cn("btn shrink-0 !py-1.5 text-sm", cat === "all" ? "btn-primary" : "btn-outline")}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={cn("btn shrink-0 !py-1.5 text-sm", cat === c.id ? "btn-primary" : "btn-outline")}>{c.name}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p className="mt-8 text-center text-black/50">No dishes found.</p>}

      {cat === "all"
        ? categories.map((c) => byCategory.get(c.id)?.length ? (
            <section key={c.id} className="mt-8">
              <h2 className="mb-3 text-xl font-bold">{c.name}</h2>
              {c.description ? <p className="mb-3 text-sm text-black/50">{c.description}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byCategory.get(c.id)!.map((p) => <ProductCard key={p.id} product={p} currency={currency} />)}
              </div>
            </section>
          ) : null)
        : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} currency={currency} />)}
          </div>
        )}
    </div>
  );
}
