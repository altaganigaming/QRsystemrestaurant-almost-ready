"use client";

import { useState } from "react";
import { Plus, Trash2, QrCode } from "lucide-react";
import type { RestaurantTable } from "@/lib/types";
import { upsertTable, deleteTable } from "@/lib/actions/admin";
import { Modal } from "../menu/menu-manager";

export default function TablesManager({ tables }: { tables: RestaurantTable[] }) {
  const [qr, setQr] = useState<RestaurantTable | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tables & QR Codes</h1>
        <AddTable onDone={() => location.reload()} />
      </div>
      {msg ? <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p> : null}
      <p className="mb-4 text-sm text-black/50">Each QR encodes only your restaurant URL + table token. Prices always load from the database, so QR codes never need reprinting after menu changes.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <div key={t.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="text-lg font-bold">{t.name}</p>
              <p className="text-xs text-black/50">Code: {t.code} {t.is_active ? "" : "· inactive"}</p>
            </div>
            <div className="flex gap-1">
              <button className="btn-primary !p-2" onClick={() => setQr(t)} aria-label="Show QR"><QrCode className="h-4 w-4" /></button>
              <button className="btn-danger !p-2" aria-label="Delete"
                onClick={async () => { if (confirm("Delete table? Old QR codes will stop working.")) { const r = await deleteTable(t.id); setMsg(r.error ?? "Deleted."); location.reload(); } }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {qr ? <QrModal table={qr} onClose={() => setQr(null)} /> : null}
    </div>
  );
}

function AddTable({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className="input !w-28 uppercase" placeholder="Code (T5)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      <input className="input !w-36" placeholder="Name (Table 5)" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn-primary" disabled={busy || !code.trim() || !name.trim()}
        onClick={async () => {
          setBusy(true);
          const r = await upsertTable({ code: code.trim(), name: name.trim() });
          setBusy(false);
          if (r.error) alert(r.error); else onDone();
        }}>
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}

function QrModal({ table, onClose }: { table: RestaurantTable; onClose: () => void }) {
  const url = `/api/qr?token=${table.qr_token}&size=512`;
  return (
    <Modal title={`QR — ${table.name}`} onClose={onClose}>
      <div className="text-center">
        <img src={url} alt={`QR for ${table.name}`} className="mx-auto rounded-xl border" width={256} height={256} />
        <p className="mt-2 text-xs break-all text-black/50">{`${typeof window !== "undefined" ? window.location.origin : ""}/t/${table.qr_token}`}</p>
        <div className="mt-3 flex justify-center gap-2">
          <a className="btn-primary" href={url} download={`qr-${table.code}.png`}>Download PNG</a>
          <button className="btn-outline" onClick={() => {
            const w = window.open("", "_blank", "width=420,height=560");
            if (w) { w.document.write(`<html><head><title>${table.name} QR</title></head><body style="text-align:center;font-family:sans-serif"><h2>${table.name}</h2><img src="${window.location.origin}${url}" style="width:400px" onload="window.print()"/></body></html>`); w.document.close(); }
          }}>Print</button>
        </div>
      </div>
    </Modal>
  );
}
