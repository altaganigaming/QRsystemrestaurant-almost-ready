import UsersManager from "./users-manager";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Customer Accounts</h1>
      <p className="mb-4 text-sm text-black/50">View registered customers and remove test accounts when needed.</p>
      <UsersManager />
    </div>
  );
}