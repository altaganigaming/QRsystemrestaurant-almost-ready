import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import TrackClient from "./track-client";

export const dynamic = "force-dynamic";

export default function TrackPage({ searchParams }: { searchParams: { o?: string; k?: string } }) {
  if (!searchParams.o || !searchParams.k) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-black/50">
        Open the tracking link from your order confirmation, or find your order in your account.
      </div>
    );
  }
  return (
    <Suspense>
      <TrackWrapper orderId={searchParams.o} token={searchParams.k} />
    </Suspense>
  );
}

async function TrackWrapper({ orderId, token }: { orderId: string; token: string }) {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  return <TrackClient orderId={orderId} token={token} settings={settings as any} />;
}
