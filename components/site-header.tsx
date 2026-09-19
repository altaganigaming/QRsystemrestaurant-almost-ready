"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export default function SiteHeader({ settings }: { settings: any }) {
  const { tableCode } = useCart();
  const b = settings?.buttons ?? {};
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            : <UtensilsCrossed className="h-6 w-6 text-brand" />}
          <span className="truncate max-w-[40vw]">{settings?.restaurant_name ?? "Restaurant"}</span>
          {tableCode ? <span className="badge bg-brand/10 text-brand">Table {tableCode}</span> : null}
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link className="btn-ghost hidden sm:inline-flex" href="/">{b.home ?? "Home"}</Link>
          <Link className="btn-ghost" href="/menu">{b.view_menu ?? "Menu"}</Link>
          <Link className="btn-ghost" href="/track">{b.track_order ?? "Track"}</Link>
          <Link className="btn-ghost hidden sm:inline-flex" href="/account">Account</Link>
        </nav>
      </div>
    </header>
  );
}
