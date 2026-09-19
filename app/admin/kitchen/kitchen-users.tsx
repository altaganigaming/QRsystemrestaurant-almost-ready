"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { createKitchenUser, deleteKitchenUser, listKitchenUsers } from "@/lib/actions/admin";

export default function KitchenUsers() {
  const [users, setUsers] = useState<any[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => listKitchenUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <form className="card space-y-3 p-4" onSubmit={async (e) => {
        e.preventDefault(); setMsg(null);
        const r = await createKitchenUser(email, password, name);
        setMsg(r.error ? `Error: ${r.error}` : `Kitchen account created for ${email}.`);
        if (!r.error) { setEmail(""); setPassword(""); setName(""); load(); }
      }}>
        <h2 className="font-semibold">Create Kitchen Account</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="input" required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" required type="password" minLength={8} placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary">Create Account</button>
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      </form>

      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Existing Kitchen Accounts</h2>
        {users === null ? <p className="text-sm text-black/50">Loading…</p> : null}
        {users?.length === 0 ? <p className="text-sm text-black/50">No kitchen accounts yet.</p> : null}
        <ul className="divide-y">
          {(users ?? []).map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
              <div><p className="font-medium">{u.full_name || "Kitchen User"}</p><p className="text-xs text-black/45">{u.email} · Created {new Date(u.created_at).toLocaleDateString()}</p></div>
              <button className="btn-danger !p-2" aria-label="Delete account"
                onClick={async () => { if (confirm("Delete this kitchen account?")) { const r = await deleteKitchenUser(u.id); if (r.error) alert(r.error); load(); } }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
