import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; fullName?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const fullName = body.fullName?.trim() ?? "";
    if (!email || !email.includes("@") || password.length < 6) {
      return NextResponse.json({ error: "Enter a valid email and a password of at least 6 characters." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: "Unable to create account. Please check the details or login if you already have an account." }, { status: 400 });
    }
    return NextResponse.json({ email });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create account. Please try again." }, { status: 400 });
  }
}