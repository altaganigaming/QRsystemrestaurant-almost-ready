"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ReceiptText, UtensilsCrossed, Grid2x2, Images, Settings, ChefHat } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tables", label: "Tables & QR", icon: Grid2x2 },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/kitchen", label: "Kitchen Accounts", icon: ChefHat },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode; restaurantName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="no-print fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r bg-white md:w-56">
        <div className="hidden p-4 text-lg font-extrabold text-brand md:block">Admin Panel</div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-black/5",
                pathname === href ? "bg-brand text-white hover:bg-brand" : "text-ink")}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <button className="m-2 btn-ghost justify-start text-sm" onClick={async () => { await createClient().auth.signOut(); router.push("/admin/login"); router.refresh(); }}>
          <span className="hidden md:inline">Logout</span><span className="md:hidden">⏻</span>
        </button>
      </aside>
      <div className="ml-16 flex-1 p-4 md:ml-56 md:p-8">{children}</div>
    </div>
  );
}
