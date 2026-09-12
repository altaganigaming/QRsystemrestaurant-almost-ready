import type { Order } from "@/lib/types";
import { money, STATUS_LABEL } from "@/lib/utils";

export function billText(o: Order, restaurantName: string, currency: string) {
  const lines = [
    `*${restaurantName}*`,
    `Order #${o.order_number} · ${STATUS_LABEL[o.status]}`,
    o.table_label ? `Table: ${o.table_label}` : "Home Delivery",
    "",
    ...o.order_items.flatMap((it) => [
      `${it.qty} x ${it.product_name}${it.variant_name ? ` (${it.variant_name})` : ""}${it.pack_size ? ` [${it.pack_size}]` : ""}${it.mode ? ` ${it.mode === "pack" ? "Pack" : "Eat Now"}` : ""} — ${money(it.total, currency)}`,
      ...it.order_item_addons.map((a) => `   + ${a.addon_name} ${money(a.price, currency)}`),
    ]),
    "",
    `Subtotal: ${money(o.subtotal, currency)}`,
    o.discount ? `Discount: -${money(o.discount, currency)}` : null,
    o.tax ? `Tax: ${money(o.tax, currency)}` : null,
    o.service_charge ? `Service Charge: ${money(o.service_charge, currency)}` : null,
    `*Total: ${money(o.grand_total, currency)}*`,
    `Payment: ${o.payment_status.toUpperCase()}${o.payment_method ? ` (${o.payment_method})` : ""}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export default function Bill({ order, settings, className = "" }: { order: Order; settings: any; className?: string }) {
  const currency = settings?.currency ?? "₹";
  return (
    <div className={`card p-5 font-mono text-sm ${className}`}>
      <div className="text-center">
        <p className="text-lg font-bold">{settings?.restaurant_name}</p>
        {settings?.address ? <p className="text-xs text-black/50">{settings.address}</p> : null}
        {settings?.phone ? <p className="text-xs text-black/50">Ph: {settings.phone}</p> : null}
      </div>
      <hr className="my-3 border-dashed" />
      <div className="flex justify-between text-xs">
        <span>Order #{order.order_number}</span>
        <span>{new Date(order.placed_at).toLocaleString()}</span>
      </div>
      <p className="text-xs">{order.type === "dine_in" ? `Table: ${order.table_label ?? "-"}` : "Home Delivery"} · {STATUS_LABEL[order.status]}</p>
      <hr className="my-3 border-dashed" />
      <table className="w-full">
        <tbody>
          {order.order_items.map((it) => (
            <tr key={it.id} className="align-top">
              <td className="py-1 pr-2">
                <span className="font-semibold">{it.qty} × {it.product_name}</span>
                <span className="block text-xs text-black/50">
                  {[it.variant_name, it.pack_size, it.mode === "pack" ? "Pack" : it.mode === "eat_now" ? "Eat Now" : null].filter(Boolean).join(" · ")}
                </span>
                {it.order_item_addons.map((a) => (
                  <span key={a.id} className="block text-xs text-black/50">+ {a.addon_name}</span>
                ))}
                {it.note ? <span className="block text-xs italic">“{it.note}”</span> : null}
              </td>
              <td className="py-1 text-right whitespace-nowrap">{money(it.total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-3 border-dashed" />
      <div className="space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal, currency)}</span></div>
        {order.discount ? <div className="flex justify-between"><span>Discount</span><span>-{money(order.discount, currency)}</span></div> : null}
        {order.tax ? <div className="flex justify-between"><span>Tax</span><span>{money(order.tax, currency)}</span></div> : null}
        {order.service_charge ? <div className="flex justify-between"><span>Service Charge</span><span>{money(order.service_charge, currency)}</span></div> : null}
        <div className="flex justify-between text-base font-bold"><span>Grand Total</span><span>{money(order.grand_total, currency)}</span></div>
        <div className="flex justify-between text-xs"><span>Payment</span><span>{order.payment_status.toUpperCase()}{order.payment_method ? ` · ${order.payment_method}` : ""}</span></div>
      </div>
      <hr className="my-3 border-dashed" />
      <p className="text-center text-xs text-black/50">Thank you for dining with us!</p>
    </div>
  );
}
