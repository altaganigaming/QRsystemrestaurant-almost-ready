import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Admin-only QR PNG generation. Content: restaurant domain + table token ONLY.
// Menu/pricing always load live from the database — reprints are never needed.
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user || role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = req.nextUrl.searchParams.get("token");
  const size = Math.min(Number(req.nextUrl.searchParams.get("size") ?? 512), 1024);
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { data: table } = await supabase.from("restaurant_tables").select("code").eq("qr_token", token).maybeSingle();
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin).replace(/\/$/, "");
  const url = `${baseUrl}/t/${token}`;
  const png = await QRCode.toBuffer(url, { type: "png", width: size, margin: 2 });
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" } });
}
