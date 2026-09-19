"use client";

import type { Order } from "@/lib/types";
import { billText } from "@/components/bill";

export default function BillPdfButton({ order, restaurantName, currency }: { order: Order; restaurantName: string; currency: string }) {
  function download() {
    const popup = window.open("", "_blank", "width=720,height=900");
    if (!popup) return;
    popup.opener = null;
    const text = billText(order, restaurantName, currency).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
    popup.document.write(`<html><head><title>Bill #${order.order_number}</title><style>body{font-family:monospace;max-width:680px;margin:32px auto;white-space:pre-wrap;font-size:14px}@media print{body{margin:0}}</style></head><body>${text}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return <button className="btn-outline !py-1.5 text-sm" onClick={download}>Download Bill PDF</button>;
}