"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatMoney } from "@/lib/money";

type Item = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  active: boolean;
  categoryId?: string;
};
type Category = { id: string; name: string; active: boolean; items: Item[] };

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState("");
  const [itemForm, setItemForm] = useState({
    categoryId: "",
    name: "",
    price: "",
    description: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setCategories(data.categories || []);
    if (data.categories?.[0] && !itemForm.categoryId) {
      setItemForm((f) => ({ ...f, categoryId: data.categories[0].id }));
    }
  }, [itemForm.categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addCategory() {
    if (!catName.trim()) return;
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", name: catName.trim() }),
    });
    setCatName("");
    await load();
  }

  async function addItem() {
    if (!itemForm.categoryId || !itemForm.name) return;
    const priceCents = Math.round(parseFloat(itemForm.price || "0") * 100);
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "item",
        categoryId: itemForm.categoryId,
        name: itemForm.name,
        description: itemForm.description || null,
        priceCents,
      }),
    });
    setItemForm((f) => ({ ...f, name: "", price: "", description: "" }));
    await load();
  }

  async function toggleItem(item: Item) {
    await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", id: item.id, active: !item.active }),
    });
    await load();
  }

  async function removeItem(id: string) {
    await fetch(`/api/menu?type=item&id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AppShell title="菜单管理">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-black/10 bg-white/75 p-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl">分类</h2>
          <div className="mt-3 flex gap-2">
            <input
              className="min-h-11 flex-1 rounded-lg border border-black/15 px-3"
              placeholder="新分类名称"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button
              type="button"
              className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-white"
              onClick={addCategory}
            >
              添加
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="rounded-lg bg-black/5 px-3 py-2">
                {c.name} · {c.items.length} 道菜
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-black/10 bg-white/75 p-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl">新菜品</h2>
          <div className="mt-3 grid gap-2">
            <select
              className="min-h-11 rounded-lg border border-black/15 px-3"
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className="min-h-11 rounded-lg border border-black/15 px-3"
              placeholder="菜名"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            />
            <input
              className="min-h-11 rounded-lg border border-black/15 px-3"
              placeholder="价格（美元）"
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
            />
            <input
              className="min-h-11 rounded-lg border border-black/15 px-3"
              placeholder="描述（可选）"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            />
            <button
              type="button"
              className="min-h-11 rounded-lg bg-[var(--brand-primary)] text-white"
              onClick={addItem}
            >
              添加菜品
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 space-y-4">
        {categories.map((c) => (
          <section key={c.id} className="rounded-xl border border-black/10 bg-white/70 p-4">
            <h3 className="text-lg font-semibold">{c.name}</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {c.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-black/5 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {item.name}{" "}
                      <span className="text-[var(--brand-muted)]">
                        {formatMoney(item.priceCents)}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--brand-muted)]">
                      {item.active ? "上架" : "下架"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="min-h-11 rounded-lg bg-black/5 px-3 text-sm"
                      onClick={() => toggleItem(item)}
                    >
                      {item.active ? "下架" : "上架"}
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded-lg bg-red-800/90 px-3 text-sm text-white"
                      onClick={() => removeItem(item.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
