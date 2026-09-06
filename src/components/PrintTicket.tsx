import { formatMoney, sumItems } from "@/lib/money";

type OrderItem = {
  name: string;
  unitCents: number;
  quantity: number;
  status: string;
};

type Order = {
  id: string;
  discountCents: number;
  items: OrderItem[];
};

export function PrintTicket({
  storeName,
  tableLabel,
  order,
  totalCents,
}: {
  storeName: string;
  tableLabel: string;
  order: Order;
  totalCents: number;
}) {
  const subtotal = sumItems(order.items);
  return (
    <div className="print-ticket hidden print:block">
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>{storeName}</h1>
      <p>桌台：{tableLabel}</p>
      <p>单号：{order.id.slice(-8)}</p>
      <hr />
      {order.items
        .filter((i) => i.status !== "void")
        .map((i, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
            <span>
              {i.quantity}× {i.name}
            </span>
            <span>{formatMoney(i.unitCents * i.quantity)}</span>
          </div>
        ))}
      <hr />
      <p>小计：{formatMoney(subtotal)}</p>
      {order.discountCents ? <p>折扣：-{formatMoney(order.discountCents)}</p> : null}
      <p style={{ fontWeight: 700 }}>合计：{formatMoney(totalCents)}</p>
      <p style={{ marginTop: 12, fontSize: 12 }}>谢谢惠顾</p>
    </div>
  );
}
