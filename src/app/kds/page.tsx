"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { usePosEvents } from "@/hooks/use-pos-events";
type KdsItem = {
  id: string;
  name: string;
  quantity: number;
  modifiersJson: string;
  note?: string | null;
  sentAt?: string | null;
  order: {
    id: string;
    table?: { number: string; name: string } | null;
  };
};

export default function KdsPage() {
  const [items, setItems] = useState<KdsItem[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/kds");
    const data = await res.json();
    if (res.ok) setItems(data.items || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  usePosEvents((type) => {
    if (type === "kds" || type === "orders") load();
  });

  async function markReady(id: string) {
    await fetch(`/api/kds/${id}/ready`, { method: "POST" });
    await load();
  }

  return (
    <AppShell title="后厨显示屏">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[var(--brand-muted)]">待制作 {items.length} 项</p>
        <button type="button" className="min-h-11 rounded-lg bg-black/5 px-3" onClick={load}>
          刷新
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          let mods: { name: string }[] = [];
          try {
            mods = JSON.parse(item.modifiersJson || "[]");
          } catch {
            mods = [];
          }
          const ageMin = item.sentAt
            ? Math.floor((Date.now() - new Date(item.sentAt).getTime()) / 60000)
            : 0;
          return (
            <article
              key={item.id}
              className="rounded-xl border border-black/10 bg-white/85 p-4"
              style={{
                borderLeftWidth: 6,
                borderLeftColor: ageMin >= 15 ? "#9F1239" : ageMin >= 8 ? "#B45309" : "#2F6F4E",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-[var(--brand-muted)]">
                    桌 {item.order.table?.number ?? "-"} · {item.order.table?.name ?? ""}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                    {item.quantity}× {item.name}
                  </h2>
                  {mods.length ? (
                    <p className="mt-1 text-sm">{mods.map((m) => m.name).join("、")}</p>
                  ) : null}
                  {item.note ? <p className="text-sm text-red-700">备注：{item.note}</p> : null}
                </div>
                <span className="text-sm font-medium">{ageMin} 分</span>
              </div>
              <button
                type="button"
                className="mt-4 min-h-12 w-full rounded-lg bg-[var(--brand-primary)] font-semibold text-white"
                onClick={() => markReady(item.id)}
              >
                制作完成
              </button>
            </article>
          );
        })}
      </div>
      {!items.length ? (
        <p className="mt-10 text-center text-[var(--brand-muted)]">暂无待制作菜品</p>
      ) : null}
    </AppShell>
  );
}
