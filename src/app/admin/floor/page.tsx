"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FloorCanvas, toEditable, type EditableTable } from "@/components/FloorCanvas";
import type { TableShape } from "@prisma/client";

export default function AdminFloorPage() {
  const [tables, setTables] = useState<EditableTable[]>([]);
  const [aspect, setAspect] = useState({ w: 16, h: 10 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<EditableTable[][]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

  function pushHistory(next: EditableTable[]) {
    setHistory((h) => [...h.slice(-20), tables]);
    setTables(next);
  }

  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setTables(prev);
      return h.slice(0, -1);
    });
  }

  function addTable(shape: TableShape) {
    const n = tables.length + 1;
    const t: EditableTable = {
      clientId: `new-${Date.now()}`,
      name: `桌${n}`,
      number: String(n),
      xPct: 10 + (n % 5) * 12,
      yPct: 15 + Math.floor(n / 5) * 18,
      wPct: shape === "round" ? 9 : 11,
      hPct: shape === "round" ? 14 : 16,
      shape,
      seats: shape === "round" ? 2 : 4,
      status: "available",
    };
    pushHistory([...tables, t]);
    setSelectedId(t.clientId);
  }

  function updateSelected(patch: Partial<EditableTable>) {
    if (!selectedId) return;
    pushHistory(
      tables.map((t) => (t.clientId === selectedId ? { ...t, ...patch } : t)),
    );
  }

  function removeSelected() {
    if (!selectedId) return;
    pushHistory(tables.filter((t) => t.clientId !== selectedId));
    setSelectedId(null);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/floor-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aspectW: aspect.w,
        aspectH: aspect.h,
        tables: tables.map((t) => ({
          id: t.id,
          name: t.name,
          number: t.number,
          xPct: t.xPct,
          yPct: t.yPct,
          wPct: t.wPct,
          hPct: t.hPct,
          shape: t.shape,
          seats: t.seats,
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || data.error) {
      setMessage(data.error || "保存失败");
      return;
    }
    setMessage("已保存");
    setTables(toEditable(data.floorPlan.tables));
  }

  const selected = tables.find((t) => t.clientId === selectedId) ?? null;

  return (
    <AppShell title="桌台布局 CMS">
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-white"
          onClick={() => addTable("round")}
        >
          添加圆桌
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-white"
          onClick={() => addTable("square")}
        >
          添加方桌
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-black/5 px-4 disabled:opacity-40"
          onClick={undo}
          disabled={!history.length}
        >
          撤销
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg px-4 font-semibold text-white"
          style={{ background: "var(--brand-accent)", color: "#1a1a1a" }}
          onClick={save}
          disabled={saving}
        >
          {saving ? "保存中…" : "保存布局"}
        </button>
        {message ? <span className="self-center text-sm">{message}</span> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <FloorCanvas
          aspectW={aspect.w}
          aspectH={aspect.h}
          tables={tables}
          mode="edit"
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={(next) => {
            setHistory((h) => [...h.slice(-20), tables]);
            setTables(next);
          }}
        />
        <aside className="rounded-xl border border-black/10 bg-white/70 p-4">
          {selected ? (
            <div className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl">编辑桌台</h2>
              <label className="block text-sm">编号</label>
              <input
                className="min-h-11 w-full rounded-lg border border-black/15 px-3"
                value={selected.number}
                onChange={(e) => updateSelected({ number: e.target.value })}
              />
              <label className="block text-sm">名称</label>
              <input
                className="min-h-11 w-full rounded-lg border border-black/15 px-3"
                value={selected.name}
                onChange={(e) => updateSelected({ name: e.target.value })}
              />
              <label className="block text-sm">座位数</label>
              <input
                type="number"
                className="min-h-11 w-full rounded-lg border border-black/15 px-3"
                value={selected.seats}
                onChange={(e) =>
                  updateSelected({ seats: Number(e.target.value) || 1 })
                }
              />
              <label className="block text-sm">形状</label>
              <select
                className="min-h-11 w-full rounded-lg border border-black/15 px-3"
                value={selected.shape}
                onChange={(e) =>
                  updateSelected({ shape: e.target.value as TableShape })
                }
              >
                <option value="round">圆桌</option>
                <option value="square">方桌</option>
              </select>
              <p className="text-xs text-[var(--brand-muted)]">
                位置 {selected.xPct.toFixed(1)}%, {selected.yPct.toFixed(1)}% ·
                尺寸 {selected.wPct.toFixed(1)}% × {selected.hPct.toFixed(1)}%
              </p>
              <button
                type="button"
                className="min-h-11 w-full rounded-lg bg-red-800/90 text-white"
                onClick={removeSelected}
              >
                删除桌台
              </button>
            </div>
          ) : (
            <p className="text-[var(--brand-muted)]">
              添加桌台后可拖到任意位置，右下角拖动手柄可调整大小。
            </p>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
