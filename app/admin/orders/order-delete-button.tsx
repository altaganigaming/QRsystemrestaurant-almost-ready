"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteOrder } from "@/lib/actions/admin";

export default function OrderDeleteButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <button className="btn-danger !p-2" aria-label="Delete order" title="Delete order" onClick={async () => {
      if (!confirm("Permanently delete this order and its items?")) return;
      const result = await deleteOrder(orderId);
      if (result.error) alert(result.error); else router.refresh();
    }}>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}