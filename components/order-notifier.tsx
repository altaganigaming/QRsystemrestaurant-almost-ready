"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OrderNotifier({ enabled, placement }: { enabled: boolean; placement: "admin" | "kitchen" }) {
  const audioContext = useRef<AudioContext | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [armed, setArmed] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    const sb = createClient();
    const channel = sb.channel(`${placement}-new-order-notifications`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        if (!enabled) return;
        playBell(audioContext.current);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New order received", { body: `Order #${(payload.new as { order_number?: number }).order_number ?? "new"} is waiting.` });
        }
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => { setConnected(false); channel.unsubscribe(); };
  }, [enabled, placement]);

  async function armNotifications() {
    if (!enabled) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioContext.current = audioContext.current ?? new AudioContextClass();
      await audioContext.current.resume();
      playBell(audioContext.current);
    }
    setArmed(true);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setPermission(await Notification.requestPermission());
    }
  }

  return (
    <>
      <button
        className={`fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full border bg-white text-brand shadow-sm hover:bg-brand hover:text-white ${enabled && armed && connected ? "ring-2 ring-emerald-400" : ""}`}
        title={enabled ? `New-order notifications ${connected ? "connected" : "connecting"}. Click to arm sound.` : "Notifications disabled in Settings"}
        onClick={armNotifications}
      >
        {enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 text-black/40" />}
        {enabled && (!armed || !connected) ? <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${connected ? "bg-amber-500" : "bg-red-500"}`} /> : null}
      </button>
      {enabled && permission === "denied" ? <p className="fixed right-4 top-16 z-50 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-800 shadow-sm">Allow browser notifications for alerts</p> : null}
    </>
  );
}

function playBell(context: AudioContext | null) {
  if (!context) return;
  const now = context.currentTime;
  [880, 1175].forEach((frequency, index) => {
    const start = now + index * 0.18;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.42, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}