"use client";

import { useState } from "react";
import { toggleOpen } from "@/lib/actions/admin";

export default function OpenToggle({ isOpen }: { isOpen: boolean }) {
  const [open, setOpen] = useState(isOpen);
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => { setBusy(true); setOpen(!open); await toggleOpen(!open); setBusy(false); }}
      className={`btn ${open ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700"}`}
    >
      {open ? "● Open — tap to close" : "○ Closed — tap to open"}
    </button>
  );
}
