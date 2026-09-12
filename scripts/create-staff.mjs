/**
 * Create the FIRST admin or kitchen accounts (server-side only).
 * Usage:
 *   SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/create-staff.mjs admin admin@rest.com Passw0rd! "Owner Name"
 *   SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/create-staff.mjs kitchen chef@rest.com Passw0rd! "Chef Name"
 */
import { createClient } from "@supabase/supabase-js";

const [role, email, password, fullName] = process.argv.slice(2);
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!["admin", "kitchen"].includes(role) || !email || !password || !url || !key) {
  console.error("Usage: node scripts/create-staff.mjs <admin|kitchen> <email> <password> [full name]");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.createUser({
  email, password, email_confirm: true,
  app_metadata: { role },
  user_metadata: { full_name: fullName ?? "" },
});
if (error) { console.error(error.message); process.exit(1); }
console.log(`Created ${role}: ${email} (${data.user.id})`);
