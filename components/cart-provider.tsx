"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/lib/types";

const CART_KEY = "rms_cart_v1";
const TABLE_KEY = "rms_table_code";

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "qty"> & { qty?: number }) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  tableCode: string | null;
  setTableCode: (code: string | null) => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function makeKey(i: Omit<CartItem, "key" | "qty">) {
  return [i.product_id, i.variant_name, i.pack_size, i.mode, i.note, (i.addons ?? []).map((a) => a.name).sort().join("+")].join("|");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableCode, setTableCodeState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"));
      setTableCodeState(localStorage.getItem(TABLE_KEY));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(items)); }, [items, hydrated]);
  useEffect(() => { if (hydrated) { if (tableCode) localStorage.setItem(TABLE_KEY, tableCode); else localStorage.removeItem(TABLE_KEY); } }, [tableCode, hydrated]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (item) => setItems((prev) => {
      const key = makeKey(item);
      const found = prev.find((p) => p.key === key);
      if (found) return prev.map((p) => (p.key === key ? { ...p, qty: Math.min(p.qty + (item.qty ?? 1), 100) } : p));
      return [...prev, { ...item, key, qty: item.qty ?? 1 }];
    }),
    remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
    setQty: (key, qty) => setItems((prev) => qty <= 0 ? prev.filter((p) => p.key !== key) : prev.map((p) => (p.key === key ? { ...p, qty: Math.min(qty, 100) } : p))),
    clear: () => setItems([]),
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.unit_price * i.qty, 0),
    tableCode,
    setTableCode: setTableCodeState,
  }), [items, tableCode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart outside provider");
  return ctx;
}
