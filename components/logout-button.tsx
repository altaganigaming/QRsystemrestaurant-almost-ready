"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ redirectTo }: { redirectTo: string }) {
  return (
    <button className="btn-outline" onClick={async () => {
      await createClient().auth.signOut();
      location.href = redirectTo;
    }}>Logout</button>
  );
}
