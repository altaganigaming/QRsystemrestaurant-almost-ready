import KitchenUsers from "./kitchen-users";

export const dynamic = "force-dynamic";

export default function KitchenAccountsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Kitchen Accounts</h1>
      <p className="mb-4 text-sm text-black/50">Kitchen staff can only access the Kitchen Dashboard — never admin settings, menu, or billing. Deleting an account removes its access immediately; you can create a replacement at any time.</p>
      <KitchenUsers />
    </div>
  );
}
