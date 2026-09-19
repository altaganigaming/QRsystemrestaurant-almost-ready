"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCustomerUser, listCustomerUsers, sendCustomerMessage } from "@/lib/actions/admin";

export default function UsersManager() {
  const [users, setUsers] = useState<any[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [subject, setSubject] = useState("Special Offer");
  const [body, setBody] = useState("");
  const load = () => listCustomerUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  return (
    <div className="card p-4">
      {users === null ? <p className="text-sm text-black/50">Loading...</p> : null}
      {users?.length === 0 ? <p className="text-sm text-black/50">No customer accounts yet.</p> : null}
      <ul className="divide-y">
        {(users ?? []).map((user) => (
            <li key={user.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]">
            <div className="min-w-0"><p className="font-medium">{user.full_name || "Customer"}</p><p className="text-xs text-black/45">{user.email} · {user.order_count} orders · {user.total_spent} total · Joined {new Date(user.created_at).toLocaleDateString()}</p></div>
            <div className="flex shrink-0 gap-2"><button className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => { setOpen(open === user.id ? null : user.id); setBody(""); }}>Offer / Message</button><button className="btn-danger !p-2" aria-label="Delete customer account" title="Delete customer account" onClick={async () => { if (!confirm("Delete this customer account? Their order history will remain.")) return; const result = await deleteCustomerUser(user.id); if (result.error) alert(result.error); else load(); }}><Trash2 className="h-4 w-4" /></button></div>
            {open === user.id ? <form className="col-span-full mt-2 space-y-2 rounded-xl bg-black/[0.03] p-3" onSubmit={async (event) => { event.preventDefault(); const result = await sendCustomerMessage(user.id, subject, body, "offer"); if (result.error) alert(result.error); else { setOpen(null); setBody(""); } }}><input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Offer title" /><textarea className="input" required rows={2} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write an offer or message..." /><button className="btn-primary !py-1.5 text-sm">Send to Account</button></form> : null}
            {open === user.id ? <div className="col-span-full rounded-xl border border-black/10 p-3"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-black/50">Order history</p>{user.order_history?.length ? <div className="space-y-1 text-xs">{user.order_history.map((order: any) => <div key={order.id} className="flex justify-between gap-2 border-b border-black/5 py-1"><span>#{order.order_number} · {order.status}</span><span>{Number(order.grand_total).toFixed(2)} · {new Date(order.placed_at).toLocaleDateString()}</span></div>)}</div> : <p className="text-xs text-black/50">No orders yet.</p>}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}