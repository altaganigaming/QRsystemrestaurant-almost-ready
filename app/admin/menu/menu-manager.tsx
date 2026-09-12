"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { money, cn } from "@/lib/utils";
import { upsertCategory, deleteCategory, upsertProduct, deleteProduct, upsertSimple, deleteSimple, uploadImage } from "@/lib/actions/admin";

export default function MenuManager({ categories, products, currency }: { categories: Category[]; products: Product[]; currency: string }) {
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [catEdit, setCatEdit] = useState<Category | "new" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Menu</h1>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setCatEdit("new")}><Plus className="h-4 w-4" /> Category</button>
          <button className="btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Product</button>
        </div>
      </div>
      {msg ? <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p> : null}

      {categories.map((c) => (
        <section key={c.id} className="card mb-6 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{c.name} {!c.is_active ? <span className="badge bg-black/10 text-black/50">hidden</span> : null}</h2>
            <div className="flex gap-1">
              <button className="btn-ghost !p-2" onClick={() => setCatEdit(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost !p-2 text-red-500" aria-label="Delete"
                onClick={async () => { if (confirm("Delete category and all its products?")) { const r = await deleteCategory(c.id); setMsg(r.error ?? "Deleted."); location.reload(); } }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.filter((p) => p.category_id === c.id).map((p) => (
              <div key={p.id} className={cn("rounded-xl border p-3", !p.is_available && "opacity-50")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-black/55">{money(p.discount_price ?? p.price, currency)}{p.discount_price ? <span className="ml-1 text-xs line-through text-black/35">{money(p.price, currency)}</span> : null}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost !p-1.5" onClick={() => setEditing(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className="btn-ghost !p-1.5 text-red-500" aria-label="Delete"
                      onClick={async () => { if (confirm("Delete product?")) { const r = await deleteProduct(p.id); setMsg(r.error ?? "Deleted."); location.reload(); } }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={p.is_available} onChange={async (e) => { await upsertProduct({ id: p.id, is_available: e.target.checked } as any); }} />
                  Available
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}

      {catEdit ? <CategoryModal category={catEdit === "new" ? null : catEdit} onClose={() => setCatEdit(null)} onDone={() => { setCatEdit(null); location.reload(); }} /> : null}
      {editing ? <ProductModal product={editing === "new" ? null : editing} categories={categories} onClose={() => setEditing(null)} onDone={() => { setEditing(null); location.reload(); }} /> : null}
    </div>
  );
}

function CategoryModal({ category, onClose, onDone }: { category: Category | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sort, setSort] = useState(category?.sort_order ?? 0);
  const [active, setActive] = useState(category?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const r = await upsertCategory({ id: category?.id, name, description, sort_order: sort, is_active: active });
    setBusy(false);
    if (r.error) alert(r.error); else onDone();
  }

  return (
    <Modal onClose={onClose} title={category ? "Edit Category" : "New Category"}>
      <input className="input" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex items-center gap-3">
        <input className="input w-24" type="number" value={sort} onChange={(e) => setSort(Number(e.target.value))} aria-label="Sort order" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Visible</label>
      </div>
      <button className="btn-primary w-full" disabled={busy || !name.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
    </Modal>
  );
}

function ProductModal({ product, categories, onClose, onDone }: { product: Product | null; categories: Category[]; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    name: product?.name ?? "", description: product?.description ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    price: product?.price ?? 0, discount_price: product?.discount_price ?? null as number | null,
    image_url: product?.image_url ?? null as string | null,
    eat_now_enabled: product?.eat_now_enabled ?? true, pack_enabled: product?.pack_enabled ?? true,
    sort_order: product?.sort_order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function upload(file: File) {
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "products");
    const r = await uploadImage(fd);
    if (r.url) set("image_url", r.url); else alert(r.error);
  }

  async function save() {
    setBusy(true);
    const r = await upsertProduct({ id: product?.id, ...f, discount_price: f.discount_price || null } as any);
    setBusy(false);
    if (r.error) alert(r.error); else onDone();
  }

  return (
    <Modal onClose={onClose} title={product ? "Edit Product" : "New Product"} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Product name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <select className="input" value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input sm:col-span-2" placeholder="Description" value={f.description} onChange={(e) => set("description", e.target.value)} />
        <input className="input" type="number" min="0" step="0.01" placeholder="Price" value={f.price} onChange={(e) => set("price", Number(e.target.value))} />
        <input className="input" type="number" min="0" step="0.01" placeholder="Discount price (optional)" value={f.discount_price ?? ""} onChange={(e) => set("discount_price", e.target.value ? Number(e.target.value) : null)} />
        <input className="input" type="number" value={f.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} aria-label="Sort order" />
        <label className="btn-outline cursor-pointer">Upload image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        <div className="flex items-center gap-4 text-sm sm:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.eat_now_enabled} onChange={(e) => set("eat_now_enabled", e.target.checked)} /> Eat Now</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.pack_enabled} onChange={(e) => set("pack_enabled", e.target.checked)} /> Pack</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={product?.is_available ?? true} onChange={(e) => set("is_available", e.target.checked)} /> Available</label>
        </div>
        {f.image_url ? <img src={f.image_url} alt="" className="h-24 w-24 rounded-xl object-cover sm:col-span-2" /> : null}
      </div>
      {product ? <OptionEditors product={product} onChanged={() => location.reload()} /> : <p className="text-xs text-black/45">Save first, then add variants, pack sizes and add-ons.</p>}
      <button className="btn-primary w-full" disabled={busy || !f.name.trim()} onClick={save}>{busy ? "Saving…" : "Save Product"}</button>
    </Modal>
  );
}

function OptionEditors({ product, onChanged }: { product: Product; onChanged: () => void }) {
  return (
    <div className="space-y-3 border-t pt-3">
      <OptionRow title="Variants" rows={product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price_delta }))}
        onAdd={async (name, price) => { await upsertSimple("variants", { product_id: product.id, name, price_delta: price }); onChanged(); }}
        onDelete={async (id) => { await deleteSimple("variants", id); onChanged(); }} />
      <OptionRow title="Pack Sizes" rows={product.pack_sizes.map((s) => ({ id: s.id, name: s.label, price: s.price_delta }))}
        onAdd={async (name, price) => { await upsertSimple("pack_sizes", { product_id: product.id, label: name, price_delta: price }); onChanged(); }}
        onDelete={async (id) => { await deleteSimple("pack_sizes", id); onChanged(); }} />
      <OptionRow title="Add-ons" rows={product.addons.map((a) => ({ id: a.id, name: a.name, price: a.price }))}
        onAdd={async (name, price) => { await upsertSimple("addons", { product_id: product.id, name, price }); onChanged(); }}
        onDelete={async (id) => { await deleteSimple("addons", id); onChanged(); }} />
    </div>
  );
}

function OptionRow({ title, rows, onAdd, onDelete }: {
  title: string; rows: { id: string; name: string; price: number }[];
  onAdd: (name: string, price: number) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <div className="mb-1 flex flex-wrap gap-1">
        {rows.map((r) => (
          <span key={r.id} className="badge bg-black/5 text-black/70">
            {r.name}{r.price ? ` +${r.price}` : ""}
            <button className="ml-1 text-red-500" onClick={() => onDelete(r.id)} aria-label="Remove">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input" placeholder="Name (e.g. 500ml / Extra Cheese)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input w-24" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-label="Price" />
        <button className="btn-outline shrink-0" disabled={!name.trim()} onClick={async () => { await onAdd(name.trim(), price); setName(""); setPrice(0); }}>Add</button>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className={cn("card w-full space-y-3 p-5", wide ? "max-w-2xl" : "max-w-md")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
