"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCustomerUser, listCustomerUsers } from "@/lib/actions/admin";

export default function UsersManager() {
  const [users, setUsers] = useState<any[] | null>(null);
  const load = () => listCustomerUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  return (
    <div className="card p-4">
      {users === null ? <p className="text-sm text-black/50">Loading...</p> : null}
      {users?.length === 0 ? <p className="text-sm text-black/50">No customer accounts yet.</p> : null}
      <ul className="divide-y">
        {(users ?? []).map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div><p className="font-medium">{user.full_name || "Customer"}</p><p className="text-xs text-black/45">{user.email} · Created {new Date(user.created_at).toLocaleDateString()}</p></div>
            <button className="btn-danger !p-2" aria-label="Delete customer account" title="Delete customer account" onClick={async () => { if (!confirm("Delete this customer account? Their order history will remain.")) return; const result = await deleteCustomerUser(user.id); if (result.error) alert(result.error); else load(); }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}