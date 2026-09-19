import type { Viewport } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme, themeStyleVars } from "@/lib/themes";
import { CartProvider } from "@/components/cart-provider";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import CartDrawer from "@/components/cart-drawer";

export const dynamic = "force-dynamic";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const s = settings as any;
  const theme = resolveTheme(s?.theme_id ?? "classic", s?.theme_colors);

  return (
    <html lang="en" style={themeStyleVars(theme) as React.CSSProperties}>
      <head>
        {s?.favicon_url ? <link rel="icon" href={s.favicon_url} /> : null}
      </head>
      <body>
        <CartProvider>
          <SiteHeader settings={s} />
          <main className="min-h-[70vh] pb-20">{children}</main>
          <SiteFooter settings={s} />
          <CartDrawer settings={s} />
        </CartProvider>
      </body>
    </html>
  );
}
