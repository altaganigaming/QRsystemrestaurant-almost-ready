"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function KitchenLogin() {
  const sb = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    const role = (data.user?.app_metadata as any)?.role;
    router.push(role === "admin" ? "/admin" : "/kitchen");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3 p-6">
        <h1 className="text-xl font-bold">Kitchen Login</h1>
        <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="btn-primary w-full">Sign In</button>
      </form>
    </div>
  );
}
