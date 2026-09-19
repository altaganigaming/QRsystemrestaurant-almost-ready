"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createCustomerAccount(email: string, password: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || password.length < 6) return { error: "Enter a valid email and a password of at least 6 characters." };
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  });
  if (error || !data.user) return { error: error?.message ?? "Unable to create account." };
  return { email: normalizedEmail };
}