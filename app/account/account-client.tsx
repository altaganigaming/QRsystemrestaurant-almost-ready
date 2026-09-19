"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Bill from "@/components/bill";
import { money, STATUS_LABEL } from "@/lib/utils";

export default function AccountClient({ user, orders, messages, settings, redirectTo }: { user: any; orders: any[]; messages: any[]; settings: any; redirectTo: string }) {
  const sb = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const currency = settings?.currency ?? "₹";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else location.reload();
    } else {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, fullName: name }),
      });
      const result = await response.json() as { error?: string; email?: string };
      if (!response.ok || result.error || !result.email) { setMsg(result.error ?? "Unable to create account."); return; }
      const { error } = await sb.auth.signInWithPassword({ email: result.email, password });
      if (error) setMsg(error.message); else location.href = redirectTo;
    }
  }

  async function saveAddress(address: string, phone: string) {
    const { data: { user: u } } = await sb.auth.getUser();
    if (u) { await sb.from("profiles").update({ address, phone }).eq("id", u.id); setMsg("Profile updated."); }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="card p-6">
          <h1 className="mb-4 text-xl font-bold">{mode === "login" ? "Login" : "Create Account"}</h1>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" ? <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} /> : null}
            <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {msg ? <p className="text-sm text-amber-700">{msg}</p> : null}
            <button className="btn-primary w-full">{mode === "login" ? "Login" : "Sign Up"}</button>
          </form>
          <button className="mt-3 w-full text-center text-sm text-brand" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-bold">{user.user_metadata?.full_name || user.email}</p>
          <p className="text-sm text-black/50">{user.email}</p>
        </div>
        <button className="btn-outline" onClick={async () => { await sb.auth.signOut(); location.href = "/"; }}>Logout</button>
      </div>

      <ProfileForm onSave={saveAddress} msg={msg} />

      {messages.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Offers & Messages</h2>
          <div className="space-y-3">{messages.map((message: any) => (
            <article key={message.id} className="card border-brand/20 bg-brand/[0.04] p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-bold">{message.subject || (message.kind === "offer" ? "Special Offer" : "Message from Restaurant")}</p><span className="text-xs text-black/45">{new Date(message.created_at).toLocaleDateString()}</span></div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">{message.body}</p>
            </article>
          ))}</div>
        </section>
      ) : null}

      <h2 className="mb-3 mt-8 text-lg font-bold">My Orders</h2>
      {orders.length === 0 && <p className="text-black/50">No orders yet.</p>}
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o.id} className="card overflow-hidden">
            <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div>
                <p className="font-bold">#{o.order_number} <span className={`badge ml-2 ${o.status === "completed" || o.status === "closed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{STATUS_LABEL[o.status]}</span></p>
                <p className="text-xs text-black/50">{new Date(o.placed_at).toLocaleString()} · {o.type === "dine_in" ? `Table ${o.table_label ?? ""}` : "Delivery"}</p>
              </div>
              <p className="font-bold">{money(o.grand_total, currency)}</p>
            </button>
            {expanded === o.id ? (
              <div className="border-t p-4">
                <Bill order={o} settings={settings} />
                <a className="btn-outline mt-3 w-full" href={`/track?o=${o.id}&k=${o.access_token ?? ""}`}>Track Order</a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileForm({ onSave, msg }: { onSave: (a: string, p: string) => void; msg: string | null }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <form className="card mt-4 space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); onSave(address, phone); }}>
      <h2 className="font-bold">Delivery Details</h2>
      <input className="input" placeholder="Default delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button className="btn-outline">Save</button>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
    </form>
  );
}
