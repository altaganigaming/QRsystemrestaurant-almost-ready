"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { addGallery, deleteGallery, uploadImage } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [alt, setAlt] = useState("");
  useEffect(() => {
    createClient().from("gallery").select("*").order("sort_order").then(({ data }) => setItems(data ?? []));
  }, []);

  async function upload(file: File) {
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "gallery");
    const r = await uploadImage(fd);
    if (r.url) { await addGallery(r.url, alt || undefined); setAlt(""); location.reload(); }
    else alert(r.error);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Gallery & Photos</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input className="input !w-56" placeholder="Alt text (optional)" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <label className="btn-primary cursor-pointer">Upload photo
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((g) => (
          <div key={g.id} className="group relative">
            <div className="grid aspect-square w-full place-items-center rounded-2xl bg-black/[0.03] p-2"><img src={g.image_url} alt={g.alt ?? ""} className="max-h-full max-w-full object-contain" /></div>
            <button className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-600 opacity-0 transition group-hover:opacity-100"
              aria-label="Delete"
              onClick={async () => { if (confirm("Delete photo?")) { await deleteGallery(g.id); location.reload(); } }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
