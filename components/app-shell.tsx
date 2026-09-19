"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import CartDrawer from "@/components/cart-drawer";

export default function AppShell({ children, settings }: { children: React.ReactNode; settings: any }) {
  const pathname = usePathname() ?? "";
  const hideCustomerChrome = pathname.startsWith("/admin") || pathname.startsWith("/kitchen");

  return (
    <>
      {!hideCustomerChrome && <SiteHeader settings={settings} />}
      <main className="min-h-[70vh]">{children}</main>
      {!hideCustomerChrome && <SiteFooter settings={settings} />}
      {!hideCustomerChrome && <CartDrawer settings={settings} />}
    </>
  );
}
