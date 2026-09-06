"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrintTicket } from "@/components/PrintTicket";
import { usePosEvents } from "@/hooks/use-pos-events";
import { formatMoney, sumItems } from "@/lib/money";
import { formatDuration, isOverSoftLimit } from "@/lib/duration";

type Mod = { name: string; priceCents: number };
type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  active: boolean;
  modifiers: {
    id: string;
    name: string;
    required: boolean;
    options: { id: string; name: string; priceCents: number }[];
  }[];
};
type Category = { id: string; name: string; items: MenuItem[] };
type OrderItem = {
  id: string;
  name: string;
  unitCents: number;
  quantity: number;
  status: string;
  modifiersJson: string;
  note?: string | null;
};
type Order = {
  id: string;
  status: string;
  discountCents: number;
  createdAt?: string;
  items: OrderItem[];
  staff?: { id: string; name: string; employeeId: string } | null;
};

export default function OrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const [table, setTable] = useState<{ id: string; name: string; number: string } | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catId, setCatId] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);
  const [modItem, setModItem] = useState<MenuItem | null>(null);
  const [pickedMods, setPickedMods] = useState<Mod[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [storeName, setStoreName] = useState("POS");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [opening, setOpening] = useState(true);

  const load = useCallback(async () => {
    const [tRes, mRes, sRes] = await Promise.all([
      fetch(`/api/tables/${tableId}`),
      fetch("/api/menu"),
      fetch("/api/store"),
    ]);
    const tData = await tRes.json();
    const mData = await mRes.json();
    const sData = await sRes.json();
    if (tData.table) setTable(tData.table);
    if (tData.order) {
      setOrder(tData.order);
      setDiscount(tData.order.discountCents || 0);
    } else {
      setOrder(null);
    }
    if (mData.categories?.length) {
      setCategories(mData.categories);
      setCatId((c) => c || mData.categories[0].id);
    }
    if (sData.store?.displayName) setStoreName(sData.store.displayName);
    return tData as { table?: unknown; order?: Order | null };
  }, [tableId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOpening(true);
      const data = await load();
      if (cancelled) return;
      if (!data.order) {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId, guestCount: 2 }),
        });
        const created = await res.json();
        if (!cancelled && created.order) {
          setOrder(created.order);
          setDiscount(created.order.discountCents || 0);
        }
      }
      if (!cancelled) setOpening(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load, tableId]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  usePosEvents((type) => {
    if (type === "orders" || type === "tables") load();
  });

  const items = useMemo(
    () => categories.find((c) => c.id === catId)?.items.filter((i) => i.active) ?? [],
    [categories, catId],
  );

  const subtotal = order ? sumItems(order.items) : 0;
  const total = Math.max(0, subtotal - discount);
  const seatedMs = order?.createdAt
    ? nowMs - new Date(order.createdAt).getTime()
    : null;
  const overLimit = seatedMs != null && isOverSoftLimit(seatedMs);

  async function ensureOrder() {
    if (order) return order;
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, guestCount: 2 }),
    });
    const data = await res.json();
    setOrder(data.order);
    return data.order as Order;
  }

  async function addItem(menuItem: MenuItem, modifiers: Mod[] = []) {
    if (menuItem.modifiers.some((g) => g.required) && !modItem) {
      setModItem(menuItem);
      setPickedMods([]);
      return;
    }
    const o = await ensureOrder();
    await fetch(`/api/orders/${o.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItemId: menuItem.id,
        quantity: 1,
        modifiers,
      }),
    });
    setModItem(null);
    await load();
    setCartOpen(true);
  }

  async function sendKitchen() {
    if (!order) return;
    await fetch(`/api/orders/${order.id}/send`, { method: "POST" });
    await load();
  }

  async function applyDiscount() {
    if (!order) return;
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discountCents: discount }),
    });
    await load();
  }

  async function voidItem(itemId: string) {
    if (!order) return;
    await fetch(`/api/orders/${order.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, void: true }),
    });
    await load();
  }

  async function pay(method: "cash" | "card" | "other") {
    if (!order) return;
    await fetch(`/api/orders/${order.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, clearTo: "dirty" }),
    });
    setPayOpen(false);
    router.push("/floor");
  }

  const cart = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl">当前订单</h2>
        <button type="button" className="lg:hidden" onClick={() => setCartOpen(false)}>
          关闭
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto py-3">
        {order?.items
          .filter((i) => i.status !== "void")
          .map((i) => (
            <div key={i.id} className="rounded-lg bg-black/5 p-3">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {i.quantity}× {i.name}
                  </p>
                  <p className="text-xs text-[var(--brand-muted)]">
                    {i.status === "pending" ? "未送厨" : i.status === "sent" ? "制作中" : "已完成"}
                  </p>
                </div>
                <div className="text-right">
                  <p>{formatMoney(i.unitCents * i.quantity)}</p>
                  {i.status === "pending" ? (
                    <button
                      type="button"
                      className="text-xs text-red-700"
                      onClick={() => voidItem(i.id)}
                    >
                      退菜
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        {!order?.items?.length ? (
          <p className="text-sm text-[var(--brand-muted)]">点选左侧菜品加入订单</p>
        ) : null}
      </div>
      <div className="space-y-2 border-t border-black/10 pt-3">
        <div className="flex justify-between text-sm">
          <span>小计</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="min-h-11 flex-1 rounded-lg border border-black/15 px-2"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            placeholder="折扣(分)"
          />
          <button type="button" className="min-h-11 rounded-lg bg-black/5 px-3" onClick={applyDiscount}>
            折扣
          </button>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span>合计</span>
          <span>{formatMoney(total)}</span>
        </div>
        <button
          type="button"
          className="min-h-12 w-full rounded-lg bg-[var(--brand-primary)] font-semibold text-white"
          onClick={sendKitchen}
        >
          送厨
        </button>
        <button
          type="button"
          className="min-h-12 w-full rounded-lg font-semibold"
          style={{ background: "var(--brand-accent)" }}
          onClick={() => setPayOpen(true)}
          disabled={!order || !order.items.some((i) => i.status !== "void")}
        >
          结账
        </button>
        <button
          type="button"
          className="min-h-11 w-full rounded-lg bg-black/5"
          onClick={() => window.print()}
        >
          打印客单
        </button>
      </div>
    </div>
  );

  return (
    <AppShell title={table ? `桌 ${table.number} ${table.name}` : "点餐"}>
      {order && table ? (
        <PrintTicket
          storeName={storeName}
          tableLabel={`${table.number} ${table.name}`}
          order={order}
          totalCents={total}
        />
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg bg-black/5 px-3"
          onClick={() => router.push("/floor")}
        >
          ← 桌台图
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {table ? `${table.number} · ${table.name}` : "点餐"}
            {opening ? (
              <span className="ml-2 text-sm font-normal text-[var(--brand-muted)]">
                开台中…
              </span>
            ) : null}
          </p>
          <p className="text-sm text-[var(--brand-muted)]">
            {order?.staff?.name ? (
              <span>服务员 {order.staff.name}</span>
            ) : (
              <span>未分配服务员</span>
            )}
            {seatedMs != null ? (
              <span
                className={`ml-3 font-mono tabular-nums ${
                  overLimit ? "font-semibold text-amber-800" : ""
                }`}
              >
                已用时 {formatDuration(seatedMs)}
                {overLimit ? " · 已超过 2 小时" : ""}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-white lg:hidden"
          onClick={() => setCartOpen(true)}
        >
          购物车 · {formatMoney(total)}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[180px_1fr_320px]">
        <aside className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`min-h-11 shrink-0 rounded-lg px-3 text-left ${
                catId === c.id ? "bg-[var(--brand-primary)] text-white" : "bg-white/70"
              }`}
              onClick={() => setCatId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </aside>

        <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="min-h-[100px] rounded-xl border border-black/10 bg-white/80 p-3 text-left"
              onClick={() => addItem(item)}
            >
              <p className="font-semibold">{item.name}</p>
              {item.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--brand-muted)]">
                  {item.description}
                </p>
              ) : null}
              <p className="mt-2 text-[var(--brand-primary)]">{formatMoney(item.priceCents)}</p>
            </button>
          ))}
        </section>

        <aside className="hidden rounded-xl border border-black/10 bg-white/80 p-4 lg:block">
          {cart}
        </aside>
      </div>

      {cartOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-3 lg:hidden">
          <div className="ml-auto h-full max-w-md rounded-xl bg-[var(--brand-surface)] p-4">
            {cart}
          </div>
        </div>
      ) : null}

      {modItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <h3 className="text-xl font-semibold">{modItem.name} · 选项</h3>
            {modItem.modifiers.map((g) => (
              <div key={g.id} className="mt-4">
                <p className="text-sm font-medium">
                  {g.name}
                  {g.required ? " *" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.options.map((o) => {
                    const active = pickedMods.some((m) => m.name === o.name);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`min-h-11 rounded-lg px-3 ${
                          active ? "bg-[var(--brand-primary)] text-white" : "bg-black/5"
                        }`}
                        onClick={() => {
                          setPickedMods((prev) => {
                            const withoutGroup = prev.filter(
                              (m) => !g.options.some((opt) => opt.name === m.name),
                            );
                            return [
                              ...withoutGroup,
                              { name: o.name, priceCents: o.priceCents },
                            ];
                          });
                        }}
                      >
                        {o.name}
                        {o.priceCents ? ` +${formatMoney(o.priceCents)}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-lg bg-black/5"
                onClick={() => setModItem(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="min-h-11 flex-1 rounded-lg bg-[var(--brand-primary)] text-white"
                onClick={() => addItem(modItem, pickedMods)}
              >
                加入
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {payOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h3 className="text-xl font-semibold">结账 {formatMoney(total)}</h3>
            <div className="mt-4 grid gap-2">
              {(
                [
                  ["cash", "现金"],
                  ["card", "银行卡"],
                  ["other", "其他"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  className="min-h-12 rounded-lg bg-[var(--brand-primary)] text-white"
                  onClick={() => pay(m)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="min-h-11 rounded-lg bg-black/5"
                onClick={() => setPayOpen(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
