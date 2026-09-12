import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user || role !== "admin") {
      const url = request.nextUrl.clone(); url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  if (path.startsWith("/kitchen") && path !== "/kitchen/login") {
    if (!user || (role !== "kitchen" && role !== "admin")) {
      const url = request.nextUrl.clone(); url.pathname = "/kitchen/login";
      return NextResponse.redirect(url);
    }
  }

  // Service suspension: block customer-facing surface, keep admin/kitchen/api intact.
  if (!path.startsWith("/admin") && !path.startsWith("/kitchen") && !path.startsWith("/api") && path !== "/suspended") {
    const { data: settings } = await supabase.from("settings").select("service_status").eq("id", 1).single();
    if (settings?.service_status === "suspended") {
      const url = request.nextUrl.clone(); url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
