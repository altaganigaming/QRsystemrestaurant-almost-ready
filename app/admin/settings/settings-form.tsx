"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { updateSettings, uploadImage } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

type S = Partial<Settings> & Record<string, any>;

export default function SettingsForm({ settings }: { settings: S }) {
  const [s, setS] = useState<S>(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: string, v: unknown) => setS((p) => ({ ...p, [k]: v }));
  const jset = (field: "headings" | "buttons" | "labels" | "messages" | "content" | "social", key: string, value: string) =>
    setS((p) => ({ ...p, [field]: { ...(p[field] ?? {}), [key]: value } }));

  async function save() {
    setBusy(true); setMsg(null);
    const { theme_colors: _tc, ...patch } = s;
    const r = await updateSettings(patch as Partial<Settings>);
    setBusy(false);
    setMsg(r.error ? `Error: ${r.error}` : "Settings saved.");
    if (!r.error) location.reload();
  }

  async function upload(field: "logo_url" | "favicon_url" | "cover_bg_url", file: File) {
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "branding");
    const r = await uploadImage(fd);
    if (r.url) set(field, r.url); else alert(r.error);
  }

  const h = s.headings ?? {}, b = s.buttons ?? {}, l = s.labels ?? {}, m = s.messages ?? {}, c = s.content ?? {}, so = s.social ?? {};

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>
      {msg ? <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p> : null}

      <Section title="Restaurant Identity">
        <Field label="Restaurant name"><input className="input" value={s.restaurant_name ?? ""} onChange={(e) => set("restaurant_name", e.target.value)} /></Field>
        <Field label="Address"><textarea className="input" rows={2} value={s.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Phone"><input className="input" value={s.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={s.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="WhatsApp number"><input className="input" value={s.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {(["logo_url", "favicon_url", "cover_bg_url"] as const).map((f) => (
            <label key={f} className="btn-outline cursor-pointer text-xs">{f === "logo_url" ? "Logo" : f === "favicon_url" ? "Favicon" : "Cover background"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(f, e.target.files[0])} />
            </label>
          ))}
          {s.logo_url ? <img src={s.logo_url} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}
          {s.cover_bg_url ? <img src={s.cover_bg_url} alt="cover" className="h-10 w-16 rounded object-cover" /> : null}
        </div>
      </Section>

      <Section title="Website Content (headings, buttons, labels, messages)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Homepage title"><input className="input" value={h.home_title ?? ""} onChange={(e) => jset("headings", "home_title", e.target.value)} /></Field>
          <Field label="Homepage subtitle"><input className="input" value={h.home_subtitle ?? ""} onChange={(e) => jset("headings", "home_subtitle", e.target.value)} /></Field>
          <Field label="Menu page title"><input className="input" value={h.menu_title ?? ""} onChange={(e) => jset("headings", "menu_title", e.target.value)} /></Field>
          <Field label="Gallery title"><input className="input" value={h.gallery_title ?? ""} onChange={(e) => jset("headings", "gallery_title", e.target.value)} /></Field>
          <Field label="About title"><input className="input" value={h.about_title ?? ""} onChange={(e) => jset("headings", "about_title", e.target.value)} /></Field>
          <Field label="Order Now button"><input className="input" value={b.order_now ?? ""} onChange={(e) => jset("buttons", "order_now", e.target.value)} /></Field>
          <Field label="View Menu button"><input className="input" value={b.view_menu ?? ""} onChange={(e) => jset("buttons", "view_menu", e.target.value)} /></Field>
          <Field label="Search placeholder"><input className="input" value={l.search_placeholder ?? ""} onChange={(e) => jset("labels", "search_placeholder", e.target.value)} /></Field>
          <Field label="Footer note"><input className="input" value={c.footer_note ?? ""} onChange={(e) => jset("content", "footer_note", e.target.value)} /></Field>
        </div>
        <Field label="About text"><textarea className="input" rows={3} value={c.about ?? ""} onChange={(e) => jset("content", "about", e.target.value)} /></Field>
        <Field label="Closed message (shown when restaurant is closed)"><input className="input" value={m.closed ?? ""} onChange={(e) => jset("messages", "closed", e.target.value)} /></Field>
      </Section>

      <Section title="Social Links">
        <div className="grid gap-3 sm:grid-cols-2">
          {["instagram", "facebook", "twitter", "youtube", "website"].map((k) => (
            <Field key={k} label={k}><input className="input" value={so[k] ?? ""} onChange={(e) => jset("social", k, e.target.value)} /></Field>
          ))}
        </div>
      </Section>

      <Section title="Theme">
        <div className="flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => { set("theme_id", t.id); set("theme_colors", null); }}
              className={cn("card w-28 p-2 text-center transition", s.theme_id === t.id && !s.theme_colors && "ring-2 ring-brand")}>
              <span className="mx-auto mb-1 flex h-8 w-full overflow-hidden rounded-lg">
                {[t.colors.primary, t.colors.secondary, t.colors.accent].map((c) => <span key={c} className="h-full flex-1" style={{ background: c }} />)}
              </span>
              <span className="text-xs font-medium">{t.name}</span>
            </button>
          ))}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold">Custom colors</summary>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(["primary", "secondary", "accent", "surface", "text"] as const).map((k) => (
              <Field key={k} label={k}>
                <input type="color" className="h-10 w-full rounded-xl border"
                  value={(s.theme_colors as any)?.[k] ?? "#000000"}
                  onChange={(e) => set("theme_colors", { ...(s.theme_colors as any), [k]: e.target.value })} />
              </Field>
            ))}
          </div>
        </details>
      </Section>

      <Section title="Billing & Ordering">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Currency symbol"><input className="input" value={s.currency ?? "₹"} onChange={(e) => set("currency", e.target.value)} /></Field>
          <Field label="Tax %"><input className="input" type="number" step="0.01" value={s.tax_percent ?? 0} onChange={(e) => set("tax_percent", Number(e.target.value))} /></Field>
          <Field label="Service charge %"><input className="input" type="number" step="0.01" value={s.service_charge_percent ?? 0} onChange={(e) => set("service_charge_percent", Number(e.target.value))} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.delivery_enabled ?? true} onChange={(e) => set("delivery_enabled", e.target.checked)} /> Enable home delivery / order online</label>
      </Section>

      <button className="btn-primary mt-4 w-full !py-3" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save All Settings"}</button>
      <p className="mt-2 text-xs text-black/45">Service suspension is developer-controlled only — see RUNBOOK.md (SQL toggle), so it cannot be bypassed from the admin panel.</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card mb-4 space-y-3 p-5"><h2 className="font-bold">{title}</h2>{children}</section>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-black/55">{label}</span>{children}</label>;
}
