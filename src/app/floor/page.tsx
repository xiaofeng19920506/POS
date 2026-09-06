"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FloorCanvas, toEditable, type EditableTable } from "@/components/FloorCanvas";
import { usePosEvents } from "@/hooks/use-pos-events";
import { DINING_SOFT_LIMIT_MS } from "@/lib/duration";
import { tableStatusLabel } from "@/lib/table-status";
import type { TableStatus } from "@prisma/client";

export default function FloorPage() {
  const router = useRouter();
  const [tables, setTables] = useState<EditableTable[]>([]);
  const [aspect, setAspect] = useState({ w: 16, h: 10 });
  const [query, setQuery] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const load = useCallback(async () => {
    const res = await fetch("/api/floor-plan");
    const data = await res.json();
    if (data.floorPlan) {
      setAspect({ w: data.floorPlan.aspectW, h: data.floorPlan.aspectH });
      setTables(toEditable(data.floorPlan.tables));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  usePosEvents((type) => {
    if (type === "tables" || type === "orders") load();
  });

  const filtered = query
    ? tables.filter(
        (t) => t.number.includes(query) || t.name.includes(query) || (t.serverName ?? "").includes(query),
      )
    : tables;

  function openTable(t: EditableTable) {
    if (t.id) router.push(`/floor/${t.id}/order`);
  }

  const softHours = Math.round(DINING_SOFT_LIMIT_MS / 3600000);

  return (
    <AppShell title="营业桌台图">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(
          [
            ["available", tableStatusLabel.available],
            ["occupied", tableStatusLabel.occupied],
            ["dirty", tableStatusLabel.dirty],
            ["billing", tableStatusLabel.billing],
          ] as [TableStatus, string][]
        ).map(([k, label]) => (
          <span
            key={k}
            className="rounded px-2 py-1 text-xs text-white md:text-sm"
            style={{
              background:
                k === "available"
                  ? "#2F6F4E"
                  : k === "occupied"
                    ? "#B45309"
                    : k === "dirty"
                      ? "#6B7280"
                      : "#9F1239",
            }}
          >
            {label}
          </span>
        ))}
        <span className="text-xs text-[var(--brand-muted)] md:text-sm">
          用餐计时仅展示；超过 {softHours} 小时会高亮提醒
        </span>
        <input
          className="ml-auto min-h-11 min-w-[140px] rounded-lg border border-black/15 bg-white px-3"
          placeholder="搜索桌号 / 服务员"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <FloorCanvas
        aspectW={aspect.w}
        aspectH={aspect.h}
        tables={filtered}
        mode="ops"
        nowMs={nowMs}
        onOpenTable={openTable}
      />
      <p className="mt-3 text-sm text-[var(--brand-muted)]">
        点击桌台直接进入点餐。状态由系统自动维护：开台→用餐中，结账→待清台。
      </p>
    </AppShell>
  );
}
