"use client";

import type { TableShape, TableStatus } from "@prisma/client";
import { formatDuration, isOverSoftLimit } from "@/lib/duration";
import { tableStatusColor, tableStatusLabel } from "@/lib/table-status";

export type EditableTable = {
  id?: string;
  clientId: string;
  name: string;
  number: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  shape: TableShape;
  seats: number;
  status?: TableStatus;
  /** Active order opened-at ISO string */
  seatedAt?: string | null;
  serverName?: string | null;
};

type FloorTableRow = {
  id: string;
  name: string;
  number: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  shape: TableShape;
  seats: number;
  status: TableStatus;
  orders?: {
    createdAt: string | Date;
    staff?: { name: string } | null;
  }[];
};

type Props = {
  aspectW: number;
  aspectH: number;
  tables: EditableTable[];
  mode: "edit" | "ops";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onChange?: (tables: EditableTable[]) => void;
  onOpenTable?: (table: EditableTable) => void;
  /** Live clock for dining timers in ops mode */
  nowMs?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function FloorCanvas({
  aspectW,
  aspectH,
  tables,
  mode,
  selectedId,
  onSelect,
  onChange,
  onOpenTable,
  nowMs = Date.now(),
}: Props) {
  function updateTable(clientId: string, patch: Partial<EditableTable>) {
    if (!onChange) return;
    onChange(
      tables.map((t) => (t.clientId === clientId ? { ...t, ...patch } : t)),
    );
  }

  function onPointerDown(
    e: React.PointerEvent,
    table: EditableTable,
    kind: "move" | "resize",
  ) {
    if (mode !== "edit") return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(table.clientId);
    const canvas = (e.currentTarget as HTMLElement).closest(
      "[data-floor-canvas]",
    ) as HTMLElement | null;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...table };

    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      if (kind === "move") {
        updateTable(table.clientId, {
          xPct: clamp(orig.xPct + dx, 0, 100 - orig.wPct),
          yPct: clamp(orig.yPct + dy, 0, 100 - orig.hPct),
        });
      } else {
        updateTable(table.clientId, {
          wPct: clamp(orig.wPct + dx, 5, 40),
          hPct: clamp(orig.hPct + dy, 8, 45),
        });
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      data-floor-canvas
      className="relative w-full overflow-hidden rounded-xl border border-black/10 bg-[linear-gradient(135deg,#ebe4d6_0%,#f7f3ea_45%,#e2d8c4_100%)] shadow-inner"
      style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.06) 1px, transparent 1px)",
          backgroundSize: "5% 5%",
        }}
      />
      {tables.map((t) => {
        const selected = selectedId === t.clientId;
        const status = t.status ?? "available";
        const color = tableStatusColor[status];
        const elapsed =
          t.seatedAt && status === "occupied"
            ? nowMs - new Date(t.seatedAt).getTime()
            : null;
        const overLimit = elapsed != null && isOverSoftLimit(elapsed);

        return (
          <button
            key={t.clientId}
            type="button"
            className={`absolute flex touch-none flex-col items-center justify-center border-2 px-1 text-white shadow-md ${
              t.shape === "round" ? "rounded-full" : "rounded-lg"
            } ${selected ? "ring-4 ring-[var(--brand-accent)]" : ""} ${
              overLimit ? "ring-2 ring-red-300" : ""
            }`}
            style={{
              left: `${t.xPct}%`,
              top: `${t.yPct}%`,
              width: `${t.wPct}%`,
              height: `${t.hPct}%`,
              background: color,
              borderColor: "rgba(255,255,255,.35)",
              minWidth: 56,
              minHeight: 56,
            }}
            onPointerDown={(e) => {
              if (mode === "edit") onPointerDown(e, t, "move");
            }}
            onClick={() => {
              if (mode === "ops") onOpenTable?.(t);
              else onSelect?.(t.clientId);
            }}
          >
            <span className="text-base font-bold leading-none md:text-lg">
              {t.number}
            </span>
            <span className="mt-0.5 max-w-[95%] truncate text-[9px] opacity-90 md:text-[11px]">
              {t.name}
            </span>
            {mode === "ops" ? (
              <>
                {elapsed != null ? (
                  <span
                    className={`mt-0.5 font-mono text-[10px] font-semibold tabular-nums md:text-xs ${
                      overLimit ? "text-yellow-200" : "text-white"
                    }`}
                  >
                    {formatDuration(elapsed)}
                  </span>
                ) : (
                  <span className="mt-0.5 text-[9px] opacity-85 md:text-[10px]">
                    {tableStatusLabel[status]}
                  </span>
                )}
                {t.serverName ? (
                  <span className="mt-0.5 max-w-[95%] truncate text-[9px] opacity-90 md:text-[10px]">
                    {t.serverName}
                  </span>
                ) : null}
              </>
            ) : null}
            {mode === "edit" && selected ? (
              <span
                className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize rounded-sm bg-white/90"
                onPointerDown={(e) => onPointerDown(e, t, "resize")}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function toEditable(tables: FloorTableRow[]): EditableTable[] {
  return tables.map((t) => {
    const active = t.orders?.[0];
    return {
      id: t.id,
      clientId: t.id,
      name: t.name,
      number: t.number,
      xPct: t.xPct,
      yPct: t.yPct,
      wPct: t.wPct,
      hPct: t.hPct,
      shape: t.shape,
      seats: t.seats,
      status: t.status,
      seatedAt: active?.createdAt
        ? typeof active.createdAt === "string"
          ? active.createdAt
          : active.createdAt.toISOString()
        : null,
      serverName: active?.staff?.name ?? null,
    };
  });
}
