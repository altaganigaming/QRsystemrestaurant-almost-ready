"use client";

import Link from "next/link";
import { ClipboardList, Home, Menu, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export default function SiteHeader({ settings }: { settings: any }) {
  const { count } = useCart();
  const b = settings?.buttons ?? {};
  return (
    <header className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto max-w-xl px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
        <nav className="grid grid-cols-5 gap-1 text-[10px] font-semibold sm:text-[11px]">
          <Link className="btn-ghost !h-12 !min-h-0 !flex-col !gap-0.5 !rounded-xl !px-1 !py-1" href="/"><Home className="h-4 w-4" /><span>{b.home ?? "Home"}</span></Link>
          <Link className="btn-ghost !h-12 !min-h-0 !flex-col !gap-0.5 !rounded-xl !px-1 !py-1" href="/menu"><Menu className="h-4 w-4" /><span>{b.view_menu ?? "Menu"}</span></Link>
          <Link className="btn-ghost !h-12 !min-h-0 !flex-col !gap-0.5 !rounded-xl !px-1 !py-1" href="/track"><ClipboardList className="h-4 w-4" /><span>{b.track_order ?? "Track"}</span></Link>
          <Link className="btn-ghost !h-12 !min-h-0 !flex-col !gap-0.5 !rounded-xl !px-1 !py-1" href="/account"><UserRound className="h-4 w-4" /><span>Account</span></Link>
          <Link href="/checkout" className="btn-primary relative !h-12 !min-h-0 !flex-col !gap-0.5 !rounded-xl !px-1 !py-1">
            <ShoppingCart className="h-4 w-4" /><span>Cart</span>
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
