import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell restaurantName=""> {children}</AdminShell>;
}
