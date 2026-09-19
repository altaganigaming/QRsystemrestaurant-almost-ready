"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { LayoutDashboard, ReceiptText, UtensilsCrossed, Grid2x2, Images, Settings, ChefHat, LogOut, Users } from "lucide-react";
import AdminOrderNotifier from "./admin-order-notifier";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tables", label: "Tables & QR", icon: Grid2x2 },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/kitchen", label: "Kitchen Accounts", icon: ChefHat },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children, notificationsEnabled }: { children: React.ReactNode; notificationsEnabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const channel = createClient()
      .channel("admin-order-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => router.refresh())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [router]);

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminOrderNotifier enabled={notificationsEnabled} />
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
        <button className="m-2 btn-ghost justify-start text-sm" title="Logout" onClick={async () => { await createClient().auth.signOut(); router.replace("/admin/login"); router.refresh(); }}>
          <LogOut className="h-4 w-4 shrink-0" /><span className="hidden md:inline">Logout</span>
        </button>
      </aside>
      <div className="ml-16 flex-1 p-4 md:ml-56 md:p-8">{children}</div>
    </div>
  );
}
